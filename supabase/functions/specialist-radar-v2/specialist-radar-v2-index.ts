import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Haversine distance in meters ──────────────────────────────────────────
const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R  = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (m: number) => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;

// ── Check if a Google result is likely a dermatologist (not a GP/pharmacy) ─
const isDermatologist = (types: string[], name: string): boolean => {
  const combined = [...types, name].join(' ').toLowerCase();
  const skinKeywords = ['dermat', 'skin', 'sweat', 'hyperhidros', 'aesthetic', 'cosmet', 'hair', 'nail', 'laser'];
  const excludeKeywords = ['pharmacy', 'chemist', 'optical', 'dental', 'dentist', 'eye', 'obstetric', 'orthop', 'pediatric', 'paediatric'];
  const hasSkin    = skinKeywords.some(k => combined.includes(k));
  const isExcluded = excludeKeywords.some(k => combined.includes(k));
  return hasSkin && !isExcluded;
};

// ── Infer treatments from Google Places types/name ────────────────────────
const inferTreatments = (types: string[], name: string): string[] => {
  const combined = [...types, name].join(' ').toLowerCase();
  const tx: string[] = [];
  if (combined.includes('iontoph'))                                    tx.push('iontophoresis');
  if (combined.includes('botox') || combined.includes('botulinum'))    tx.push('botox');
  if (combined.includes('miradry') || combined.includes('mira dry'))   tx.push('miradry');
  tx.push('topical'); // all dermatologists can prescribe topical
  return [...new Set(tx)];
};

// ── Normalise a Supabase specialist row → unified Doctor shape ────────────
const normaliseCurated = (row: any, userLat: number, userLng: number) => {
  const dist = row.is_telehealth ? null : haversine(userLat, userLng, row.lat, row.lng);
  return {
    id:               row.id,
    name:             row.name,
    clinicName:       row.clinic_name || null,
    specialty:        row.specialty,
    address:          row.address,
    city:             row.city,
    country:          row.country,
    lat:              row.lat,
    lng:              row.lng,
    phone:            row.phone || null,
    email:            row.email || null,
    website:          row.website || null,
    treatments:       row.treatments || [],
    isIhsVerified:    row.is_ihs_verified,
    isNdsMember:      row.is_nds_member,
    isTelehealth:     row.is_telehealth,
    distance:         dist !== null ? formatDistance(dist) : null,
    distanceMeters:   dist,
    tier:             'curated' as const,
    source:           row.source,
    rating:           null,
    reviewCount:      null,
    openNow:          null,
    languages:        row.languages || ['English'],
  };
};

// ── Normalise a Google Places result → unified Doctor shape ───────────────
const normaliseGoogle = (place: any, detail: any, userLat: number, userLng: number) => {
  const lat  = detail?.geometry?.location?.lat ?? place.geometry?.location?.lat;
  const lng  = detail?.geometry?.location?.lng ?? place.geometry?.location?.lng;
  const dist = haversine(userLat, userLng, lat, lng);
  return {
    id:               place.place_id,
    name:             detail?.name || place.name,
    clinicName:       null,
    specialty:        'Dermatologist',
    address:          detail?.formatted_address || place.vicinity || '',
    city:             '',
    country:          '',
    lat,
    lng,
    phone:            detail?.formatted_phone_number || null,
    email:            null,
    website:          detail?.website || null,
    treatments:       inferTreatments(detail?.types || place.types || [], detail?.name || place.name),
    isIhsVerified:    false,
    isNdsMember:      false,
    isTelehealth:     false,
    distance:         formatDistance(dist),
    distanceMeters:   dist,
    tier:             'google' as const,
    source:           'google_places',
    rating:           detail?.rating ?? place.rating ?? null,
    reviewCount:      detail?.user_ratings_total ?? place.user_ratings_total ?? null,
    openNow:          detail?.opening_hours?.open_now ?? place.opening_hours?.open_now ?? null,
    languages:        ['English'],
  };
};

// ── MAIN ──────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ───────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    // ── Parse request ─────────────────────────────────────────────────
    const {
      lat, lng,
      radius = 10000,
      city        = '',
      state       = '',
      country     = '',
      countryCode = '',
      continent   = '',
      scope       = 'city',
    } = await req.json();

    if (!lat || !lng) return new Response(JSON.stringify({ error: 'lat and lng required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const doctors: any[]  = [];
    const seenIds = new Set<string>();

    // ════════════════════════════════════════════════════════════════
    // TIER 1 — Curated Supabase database
    // Smart tiered queries: city → state → country → continent → global
    // ════════════════════════════════════════════════════════════════
    console.log(`TIER 1: scope=${scope} city="${city}" state="${state}" country="${country}" countryCode="${countryCode}" continent="${continent}"`);

    // Helper — fetch curated non-telehealth specialists by location fields
    const queryCurated = async (filters: Record<string, string>) => {
      let q = supabase.from('specialists').select('*').eq('is_telehealth', false);
      for (const [col, val] of Object.entries(filters)) {
        if (val) q = q.ilike(col, `%${val}%`);
      }
      const { data } = await q;
      return data || [];
    };

    // Step 1: Match by city (most precise)
    if (city && (scope === 'city' || scope === 'country' || scope === 'continent')) {
      const cityResults = await queryCurated({ city });
      for (const row of cityResults) {
        if (!seenIds.has(row.id)) {
          doctors.push(normaliseCurated(row, lat, lng));
          seenIds.add(row.id);
        }
      }
      console.log(`  → city match "${city}": ${doctors.length} results`);
    }

    // Step 2: Widen to state if < 3 and scope allows
    if (doctors.length < 3 && state && (scope === 'country' || scope === 'continent')) {
      const stateResults = await queryCurated({ state });
      for (const row of stateResults) {
        if (!seenIds.has(row.id)) {
          doctors.push(normaliseCurated(row, lat, lng));
          seenIds.add(row.id);
        }
      }
      console.log(`  → state match "${state}": ${doctors.length} results`);
    }

    // Step 3: Widen to country
    if (doctors.length < 3 && countryCode && (scope === 'country' || scope === 'continent')) {
      const { data: countryResults } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_telehealth', false)
        .eq('country_code', countryCode);
      for (const row of (countryResults || [])) {
        if (!seenIds.has(row.id)) {
          doctors.push(normaliseCurated(row, lat, lng));
          seenIds.add(row.id);
        }
      }
      console.log(`  → country match "${countryCode}": ${doctors.length} results`);
    }

    // Step 4: Widen to continent
    if (doctors.length < 3 && continent && scope === 'continent') {
      const { data: continentResults } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_telehealth', false)
        .eq('continent', continent);
      for (const row of (continentResults || [])) {
        if (!seenIds.has(row.id)) {
          doctors.push(normaliseCurated(row, lat, lng));
          seenIds.add(row.id);
        }
      }
      console.log(`  → continent match "${continent}": ${doctors.length} results`);
    }

    // Step 5: Final fallback — haversine within radius (catches anything not yet in city/state/country columns)
    if (doctors.length < 3) {
      const { data: allCurated } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_telehealth', false);
      for (const row of (allCurated || [])) {
        if (seenIds.has(row.id)) continue;
        const dist = haversine(lat, lng, row.lat, row.lng);
        if (dist <= radius) {
          doctors.push(normaliseCurated(row, lat, lng));
          seenIds.add(row.id);
        }
      }
      console.log(`  → haversine fallback: ${doctors.length} results`);
    }

    console.log(`TIER 1 final: ${doctors.length} curated specialists`);

    // ════════════════════════════════════════════════════════════════
    // TIER 2 — Google Places fallback (if curated < 3)
    // ════════════════════════════════════════════════════════════════
    const GOOGLE_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (doctors.length < 3 && GOOGLE_KEY) {
      console.log('TIER 2: Falling back to Google Places...');

      // Location-aware queries — include city/country name for more precise results
      const locationLabel = city || country || '';
      const queries = [
        'dermatologist',
        'dermatology clinic',
        'consultant dermatologist',
        'skin specialist clinic',
        'skin and hair clinic',
        ...(locationLabel ? [
          `dermatologist ${locationLabel}`,
          `skin doctor ${locationLabel}`,
        ] : []),
      ];
      const googlePlaces: any[] = [];
      const googleIds = new Set<string>();

      for (const keyword of queries) {
        const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('radius', String(Math.min(radius, 50000)));
        url.searchParams.set('keyword', keyword);
        url.searchParams.set('type', 'health');  // broader than 'doctor' — catches more dermatology clinics
        url.searchParams.set('key', GOOGLE_KEY);

        const res  = await fetch(url.toString());
        const data = await res.json();
        if (data.results) {
          for (const p of data.results) {
            if (!googleIds.has(p.place_id) && !seenIds.has(p.place_id)) {
              googleIds.add(p.place_id);
              googlePlaces.push(p);
            }
          }
        }
      }

      const toEnrich = googlePlaces
        .filter(p => isDermatologist(p.types || [], p.name || ''))  // skin-only filter
        .slice(0, 10);
      for (const place of toEnrich) {
        let detail = null;
        try {
          const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
          detailUrl.searchParams.set('place_id', place.place_id);
          detailUrl.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,geometry,types');
          detailUrl.searchParams.set('key', GOOGLE_KEY);
          const dRes = await fetch(detailUrl.toString());
          const dData = await dRes.json();
          detail = dData.result;
        } catch (e) { console.error('Place detail error:', e); }

        doctors.push(normaliseGoogle(place, detail, lat, lng));
        seenIds.add(place.place_id);
      }

      console.log(`TIER 2 added ${toEnrich.length} Google specialists`);
    } else if (doctors.length < 3 && !GOOGLE_KEY) {
      console.warn('TIER 2 skipped — GOOGLE_PLACES_API_KEY not configured');
    }

    // ════════════════════════════════════════════════════════════════
    // TIER 3 — Telehealth bridge (always appended at end)
    // ════════════════════════════════════════════════════════════════
    console.log('TIER 3: Adding telehealth specialists...');

    const { data: telehealth } = await supabase
      .from('specialists')
      .select('*')
      .eq('is_telehealth', true)
      .eq('tier', 'telehealth');

    const telehealthDoctors = (telehealth || []).map(row => ({
      ...normaliseCurated(row, lat, lng),
      isTelehealth: true,
      tier: 'telehealth' as const,
    }));

    // ── Sort: curated by distance, then google by distance, telehealth last
    const curated = doctors.filter(d => d.tier === 'curated').sort((a, b) => (a.distanceMeters ?? 99999) - (b.distanceMeters ?? 99999));
    const google  = doctors.filter(d => d.tier === 'google').sort((a, b) => (a.distanceMeters ?? 99999) - (b.distanceMeters ?? 99999));

    const allDoctors = [...curated, ...google, ...telehealthDoctors];

    // ── Care gap logging (anonymous — for African data project)
    const physicalCount = curated.length + google.length;
    if (physicalCount === 0) {
      console.log(`CARE GAP: No physical specialists found near lat=${lat.toFixed(2)},lng=${lng.toFixed(2)} country=${countryCode}`);
      // TODO: Insert into care_gaps table for petition analytics
    }

    return new Response(JSON.stringify({
      doctors: allDoctors,
      meta: {
        total:         allDoctors.length,
        curatedCount:  curated.length,
        googleCount:   google.length,
        telehealthCount: telehealthDoctors.length,
        careGap:       physicalCount === 0,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Specialist radar error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
