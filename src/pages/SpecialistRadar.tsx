import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  name: string;
  clinicName?: string | null;
  specialty: string;
  address: string;
  city: string;
  country: string;
  distance?: string | null;
  distanceMeters?: number | null;
  isTelehealth: boolean;
  treatments?: string[];
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  source: string;
  tier?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}

type Scope = 'city' | 'country' | 'global';

const SCOPE_RADII: Record<Scope, number> = { city: 50000, country: 500000, global: 0 };

const MapPinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356-2A8.001 8.001 0 004 12c0 2.127.766 4.047 2.031 5.488M16 20v-5h.582m-15.356 2A8.001 8.001 0 0020 12c0-2.127-.766-4.047-2.031-5.488" />
  </svg>
);

const LAST_LOCATION_KEY = 'last_location';

export default function SpecialistRadar() {
  const navigate = useNavigate();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState<Scope>('city');
  const [meta, setMeta] = useState<any>(null);
  const isFetchingRef = useRef(false);

  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setLocationError('Geolocation not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        setLocationError('');
        try { localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng })); } catch {}
      },
      () => { setLocationError('Unable to access location. Please enable location permissions.'); },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  }, []);

  // Seed from localStorage on mount, then request fresh location
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_LOCATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lat && parsed.lng) setLocation(parsed);
      }
    } catch {}
    requestLocation();
  }, [requestLocation]);

  const fetchDoctors = useCallback(async () => {
    if (!location) { requestLocation(); return; }
    if (isFetchingRef.current) return;
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
        body: JSON.stringify({ lat: location.lat, lng: location.lng, radius: SCOPE_RADII[scope] }),
      });
      if (!res.ok) throw new Error('Search failed');
      const payload = await res.json();
      const results: Doctor[] = payload.doctors || [];
      setDoctors(results);
      setMeta(payload.meta || null);
    } catch (e) {
      console.error('Specialist search error:', e);
      toast.error('Could not find specialists — check your connection');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [location, scope, requestLocation]);

  // Fetch on location or scope change
  useEffect(() => {
    if (location) fetchDoctors();
  }, [location, scope, fetchDoctors]);

  const scopes: { key: Scope; label: string }[] = [
    { key: 'city', label: 'My City' },
    { key: 'country', label: 'My Country' },
    { key: 'global', label: 'Global' },
  ];

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 md:p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Specialist Radar</h1>
            <p className="text-white/80 text-sm mt-1">Find hyperhidrosis specialists near you</p>
          </div>
          <Button onClick={() => { requestLocation(); }} disabled={isLoading} className="bg-cyan-600 text-white hover:bg-cyan-500">
            <RefreshIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Scanning...' : 'Refresh'}
          </Button>
        </div>

        {locationError && (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg text-center">
            <p className="text-red-200 text-sm">{locationError}</p>
            <Button onClick={requestLocation} className="mt-2 bg-gray-200 text-black hover:bg-white text-sm">
              <RefreshIcon className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </div>
        )}

        {/* Scope tabs */}
        <div className="flex gap-2">
          {scopes.map(s => (
            <button key={s.key} onClick={() => setScope(s.key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${scope === s.key ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {meta && (
          <div className="text-white/70 text-xs">
            {meta.total ?? doctors.length} specialists found
            {meta.curatedCount ? ` (${meta.curatedCount} verified)` : ''}
          </div>
        )}

        {isLoading && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-white font-semibold animate-pulse">Scanning for specialists...</p>
          </div>
        )}

        {!isLoading && doctors.length === 0 && location && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-gray-300">No specialists found in this area. Try expanding your search scope.</p>
          </div>
        )}

        <div className="space-y-3">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{doc.name}</h3>
                  {doc.clinicName && <p className="text-cyan-300 text-sm">{doc.clinicName}</p>}
                  <p className="text-gray-400 text-xs">{doc.specialty}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {doc.isTelehealth ? (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/50">📹 Telehealth</span>
                  ) : doc.distance ? (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/50">📍 {doc.distance}</span>
                  ) : null}
                </div>
              </div>
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <MapPinIcon className="w-3 h-3" /> {doc.address}, {doc.city}, {doc.country}
              </p>
              {doc.treatments && doc.treatments.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {doc.treatments.map(t => (
                    <span key={t} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
              {doc.tier && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${doc.tier === 'gold' ? 'bg-yellow-500/20 text-yellow-400' : doc.tier === 'silver' ? 'bg-gray-400/20 text-gray-300' : 'bg-orange-500/20 text-orange-400'}`}>
                  {doc.tier === 'gold' ? '⭐ Verified Expert' : doc.tier === 'silver' ? '✅ Verified' : `Source: ${doc.source}`}
                </span>
              )}
              <div className="flex gap-2 pt-1">
                {doc.phone && <a href={`tel:${doc.phone}`} className="text-xs text-cyan-400 hover:underline">📞 Call</a>}
                {doc.email && <a href={`mailto:${doc.email}`} className="text-xs text-cyan-400 hover:underline">✉️ Email</a>}
                {doc.website && <a href={doc.website} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">🌐 Website</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
