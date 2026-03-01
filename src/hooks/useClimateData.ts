/**
 * useClimateData — shared hook for Welcome page & Climate Monitor
 *
 * Uses the SAME Supabase Edge Function (`get-weather-data`) that ClimateMonitor
 * already calls, so there is only one weather source across the entire app.
 *
 * Auto-refreshes every 15 minutes (matching WEATHER_REFRESH_INTERVAL in ClimateMonitor).
 * Returns null weatherData until real data arrives — no fake fallbacks.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateSweatRisk } from "@/utils/sweatRiskCalculator";
import type { WeatherData } from "@/types";

// ── Public shape returned by the hook ────────────────────────────────────────
export interface ClimateSnapshot {
  weather: WeatherData | null;
  sweatRisk: "safe" | "low" | "moderate" | "high" | "extreme" | null;
  riskMessage: string;
  riskDescription: string;
  city: string;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => Promise<void>;
}

// ── Risk → friendly UI label map ──────────────────────────────────────────────
const RISK_LABEL: Record<string, string> = {
  safe:     "Great conditions — a good day to stay dry 💧",
  low:      "Mild conditions — stay mindful of your triggers",
  moderate: "Moderate risk — plan cool-down strategies",
  high:     "High sweat risk — limit outdoor exposure today ⚠️",
  extreme:  "Extreme risk — reschedule outdoor plans if possible 🔴",
};

const WEATHER_REFRESH_MS = 15 * 60 * 1000; // 15 min — same as ClimateMonitor

export function useClimateData(): ClimateSnapshot {
  const [weather, setWeather]           = useState<WeatherData | null>(null);
  const [sweatRisk, setSweatRisk]       = useState<ClimateSnapshot["sweatRisk"]>(null);
  const [riskMessage, setRiskMessage]   = useState("");
  const [riskDescription, setRiskDescription] = useState("");
  const [city, setCity]                 = useState("Your location");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [lastUpdated, setLastUpdated]   = useState<number | null>(null);
  const [coords, setCoords]             = useState<GeolocationCoordinates | null>(null);

  // ── Step 1: get geolocation ───────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords(pos.coords),
      () => {
        setError("Location unavailable — enable location for sweat risk alerts");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ── Step 2: fetch weather via Supabase Edge Function ─────────────────────
  const fetchWeather = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setError(null);

    try {
      // ── Same call ClimateMonitor makes ──────────────────────────────────
      const { data, error: fnError } = await supabase.functions.invoke("get-weather-data", {
        body: { latitude: coords.latitude, longitude: coords.longitude },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.simulated) throw new Error("Weather API unavailable — no real data received.");

      const w: WeatherData = {
        ...data,
        uvIndex: Math.min(11, data.uvIndex ?? data.uvi ?? 0),
        lastUpdated: Date.now(),
      };

      // ── Sweat risk via the shared utility ────────────────────────────────
      const risk = calculateSweatRisk(
        w.temperature,
        w.humidity,
        w.uvIndex,
        2.5, // default EDA — real EDA from edaManager available if needed
        false
      );

      // ── Reverse geocode city name ─────────────────────────────────────────
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
        );
        const geoData = await geoRes.json();
        const cityName =
          geoData?.address?.city ||
          geoData?.address?.town ||
          geoData?.address?.village ||
          geoData?.address?.county ||
          w.location ||
          "Your location";
        setCity(cityName);
      } catch {
        setCity(w.location ?? "Your location");
      }

      setWeather(w);
      setSweatRisk(risk.level);
      setRiskMessage(risk.message);
      setRiskDescription(RISK_LABEL[risk.level] ?? risk.description);
      setLastUpdated(Date.now());
    } catch (err: any) {
      setError(err.message || "Could not fetch weather data");
    } finally {
      setLoading(false);
    }
  }, [coords]);

  // ── Auto-refresh every 15 min once coords are ready ──────────────────────
  useEffect(() => {
    if (!coords) return;
    fetchWeather();
    const interval = setInterval(fetchWeather, WEATHER_REFRESH_MS);
    return () => clearInterval(interval);
  }, [coords, fetchWeather]);

  return {
    weather,
    sweatRisk,
    riskMessage,
    riskDescription,
    city,
    loading,
    error,
    lastUpdated,
    refresh: fetchWeather,
  };
}
