import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import de from 'date-fns/locale/de';
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
  const [scope, setScope] = useState<'city' | 'country' | 'global'>('city');
  const mapInst = useRef<any>(null);
  const userPin = useRef<any>(null);
  const LAST_LOCATION_KEY = 'last_location';

  const lastLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const isFetchingRef = useRef(false);
  const fetchDebounceRef = useRef<number | null>(null);

  const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setLocationError('Geolocation not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        try {
          localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng }));
        } catch {}
        reverseGeocode(lat, lng).catch(() => {});
      },
      () => {
        setLocationError('Unable to access location');
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  }, []);

  const fetchDoctors = useCallback(async () => {
    if (!location) {
      requestLocation();
      return;
    }

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
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          radius: SCOPE_RADII[scope],
        }),
      });

      if (!res.ok) throw new Error('Search failed');

      const payload = await res.json();
      const results = payload.doctors || [];
      const resMeta = payload.meta || null;

      const stable = results.slice();
      stable.sort((a: any, b: any) => {
        if (a.isTelehealth && b.isTelehealth) return (a.name || '').localeCompare(b.name || '');
        return 0;
      });

      setDoctors(stable);
      setMeta(resMeta);
    } catch (e) {
      console.error('Specialist search error:', e);
      setLocationError('Could not find specialists — check your connection');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [location, scope, requestLocation]);

  useEffect(() => {
    if (!navigator?.geolocation) return;

    const watcherId = navigator.geolocation.watchPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;

        const last = lastLocRef.current;
        const moved = last ? haversineMeters(last.lat, last.lng, lat, lng) : Infinity;
        if (moved < 250) {
          try {
            localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng }));
          } catch {}
          return;
        }

        lastLocRef.current = { lat, lng };
        setLocation({ lat, lng });
        setLocationError('');
        try {
          localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng }));
        } catch {}

        reverseGeocode(lat, lng).catch(() => {});

        if (fetchDebounceRef.current) window.clearTimeout(fetchDebounceRef.current);
        fetchDebounceRef.current = window.setTimeout(() => {
          if (!isFetchingRef.current) {
            fetchDoctors().catch(() => {});
          }
        }, 800);
      },
      err => {
        console.warn('watchPosition error', err);
        setLocationError('Unable to access location');
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );

    return () => {
      if (watcherId) navigator.geolocation.clearWatch(watcherId);
      if (fetchDebounceRef.current) window.clearTimeout(fetchDebounceRef.current);
    };
  }, [fetchDoctors]);

  useEffect(() => {
    if (!mapInst.current) return;
    if (location) {
      if (userPin.current) userPin.current.remove();

      const last = lastLocRef.current;
      const moveDistance = last ? haversineMeters(last.lat, last.lng, location.lat, location.lng) : Infinity;

      if (moveDistance > 200) {
        mapInst.current.setView(
          [location.lat, location.lng],
          scope === 'city' ? 13 : scope === 'country' ? 7 : 4
        );
      }
    }
  }, [location, scope]);

  return (
    <div className="specialist-radar-root">
      <Map ref={mapInst} />
      <div className="radar-ui">
        {isLoading ? <div className="scanning">Scanning…</div> : null}
        <div className="doctors-list">
          {doctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </div>
    </div>
  );
}
