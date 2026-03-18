/* --- begin SpecialistRadar.tsx (edited) --- */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import de from 'date-fns/locale/de';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { reverseGeocode } from '../utils/geocode';
import Map from '../components/Map';
import DoctorCard from '../components/DoctorCard';
import { SCOPE_RADII } from '../constants';
/* ... other imports remain unchanged ... */

export default function SpecialistRadar(props) {
  // existing hooks/state/refs remain as they were
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState<'city'|'country'|'global'>('city');
  const mapInst = useRef<any>(null);
  const userPin = useRef<any>(null);
  const LAST_LOCATION_KEY = 'last_location';

  // --- Added: movement/debounce/in-flight helpers to reduce GPS jitter and repeated fetches ---
  const lastLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const isFetchingRef = useRef(false);
  const fetchDebounceRef = useRef<number | null>(null);

  // Haversine distance (meters)
  const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  // --- end added ---

  // existing helpers and effects (unchanged)...
  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setLocationError('Geolocation not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        try { localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng })); } catch {}
        reverseGeocode(lat, lng).then(() => {}).catch(() => {});
      },
      err => {
        setLocationError('Unable to access location');
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    // register a watcher to update location; edits here gate tiny moves and debounce fetches
    if (!navigator?.geolocation) return;
    const watcherId = navigator.geolocation.watchPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;

        // ignore tiny GPS jitter — require 250m movement before triggering fetches and recenter
        const last = lastLocRef.current;
        const moved = last ? haversineMeters(last.lat, last.lng, lat, lng) : Infinity;
        if (moved < 250) {
          // update stored last-known but don't trigger fetch/map recenter
          try { localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng })); } catch {}
          return;
        }

        lastLocRef.current = { lat, lng };
        setLocation({ lat, lng });
        setLocationError('');
        try { localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng })); } catch {}
        // reverse geocode but don't block UI
        reverseGeocode(lat, lng).catch(() => {});

        // debounce fetchDoctors to coalesce rapid updates
        if (fetchDebounceRef.current) window.clearTimeout(fetchDebounceRef.current);
        fetchDebounceRef.current = window.setTimeout(() => {
          if (!isFetchingRef.current) {
            fetchDoctors().catch(() => {});
          }
        }, 800);
      },
      (err) => {
        console.warn('watchPosition error', err);
        setLocationError('Unable to access location');
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );

    return () => {
      if (watcherId) navigator.geolocation.clearWatch(watcherId);
      if (fetchDebounceRef.current) window.clearTimeout(fetchDebounceRef.current);
    };
  }, [fetchDoctors, reverseGeocode]);

  // --- fetchDoctors: updated to use in-flight lock and stable telehealth sort ---
  const fetchDoctors = useCallback(async () => {
    if (!location) { requestLocation(); return; }

    if (isFetchingRef.current) return; // bail if already running
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const RADAR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/specialist-radar`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(RADAR_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lat: location.lat, lng: location.lng,
          radius: SCOPE_RADII[scope],
          // preserve other expected params if present
        }),
      });
      if (!res.ok) throw new Error('Search failed');
      const payload = await res.json();
      const results = payload.doctors || [];
      const resMeta = payload.meta || null;

      // stable sort telehealth entries by name to avoid visible shuffling between calls
      const stable = results.slice();
      stable.sort((a: any, b: any) => {
        if (a.isTelehealth && b.isTelehealth) return (a.name || '').localeCompare(b.name || '');
        return 0;
      });

      setDoctors(stable);
      setMeta(resMeta);
    } catch (e) {
      console.error('Specialist search error:', e);
      toast.error('Could not find specialists — check your connection');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [location, scope, requestLocation]);

  // Example map recenter usage elsewhere in file: replaced to avoid jittery recentering
  useEffect(() => {
    if (!mapInst.current) return;
    if (location) {
      if (userPin.current) userPin.current.remove();
      // create a new pin (existing behavior kept)
      // ... existing pin creation code ...
      const last = lastLocRef.current;
      const moveDistance = last ? haversineMeters(last.lat, last.lng, location.lat, location.lng) : Infinity;
      // Only recenter if moved more than 200m (reduces jitter)
      if (moveDistance > 200) {
        mapInst.current.setView([location.lat, location.lng], scope === 'city' ? 13 : scope === 'country' ? 7 : 4);
      }
    }
  }, [location, scope]);

  // rest of the file remains unchanged (render, handlers, UI)
  return (
    <div className="specialist-radar-root">
      <Map ref={mapInst} />
      <div className="radar-ui">
        {/* existing UI code unchanged */}
        {isLoading ? <div className="scanning">Scanning…</div> : null}
        <div className="doctors-list">
          {doctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} />)}
        </div>
      </div>
    </div>
  );
}
/* --- end SpecialistRadar.tsx (edited) --- */
