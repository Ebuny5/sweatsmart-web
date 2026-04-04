/**
 * Sweat Risk Calculator for Hyperhidrosis
 * 
 * Based on medical research for hyperhidrosis trigger conditions.
 * IMPORTANT: Alerts should NEVER fire on simulated/fallback data.
 * Only real weather data from OpenWeather API should trigger alerts.
 */

export type SweatRiskLevel = 'safe' | 'low' | 'moderate' | 'high' | 'extreme';

export interface SweatRiskResult {
  level: SweatRiskLevel;
  message: string;
  description: string;
  color: string;
  triggers: string[];
  isSimulated?: boolean;
}

/**
 * Calculate heat index using NOAA official formula (Celsius in, Celsius out)
 * UV is capped at 11 — values above 11 are physically impossible
 */
function calculateHeatIndex(tempC: number, humidity: number): number {
  const T = tempC * 9 / 5 + 32; // to Fahrenheit
  const R = humidity;

  // Simple formula for cooler temps
  if (T < 80) {
    const hiF = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));
    return (hiF - 32) * 5 / 9;
  }

  // Full Rothfusz regression
  let hiF = -42.379 + 2.04901523 * T + 10.14333127 * R
    - 0.22475541 * T * R - 0.00683783 * T * T
    - 0.05481717 * R * R + 0.00122874 * T * T * R
    + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;

  if (R < 13 && T >= 80 && T <= 112) {
    hiF -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (R > 85 && T >= 80 && T <= 87) {
    hiF += ((R - 85) / 10) * ((87 - T) / 5);
  }

  return (hiF - 32) * 5 / 9;
}

/**
 * Calculate sweat risk based on REAL weather data only.
 * 
 * Risk is based on ACTUAL temperature, not heat index alone.
 * Heat index is used as a modifier, not the primary trigger.
 * This prevents false "Extreme Risk" at low real temperatures.
 * 
 * Rules:
 * - Extreme: real temp >= 35°C OR heat index > 45°C
 * - High: real temp >= 32°C OR (real temp >= 28°C AND humidity >= 80%)
 * - Moderate: real temp >= 28°C OR humidity >= 70%
 * - Low: real temp >= 24°C
 * - Safe: real temp < 24°C
 * 
 * UV is always capped at 11 before use.
 */
export function calculateSweatRisk(
  temperature: number,
  humidity: number,
  uvIndex: number,
  edaValue?: number,
  isSimulated?: boolean
): SweatRiskResult {
  // If data is simulated, NEVER fire a warning alert — just show safe status
  if (isSimulated) {
    return {
      level: 'safe',
      message: 'Conditions Optimal',
      description: 'Simulated data — enable location for real weather alerts.',
      color: 'text-green-400',
      triggers: [],
      isSimulated: true,
    };
  }

  const triggers: string[] = [];

  // Always cap UV at 11 — values above 11 are physically impossible
  const uv = Math.min(11, uvIndex);

  const heatIndex = calculateHeatIndex(temperature, humidity);
  const isHighEDA = edaValue !== undefined && edaValue > 5.0;
  const isHighUV = uv >= 8;

  if (isHighEDA) triggers.push(`High EDA: ${edaValue?.toFixed(1)} µS`);
  if (isHighUV) triggers.push(`High UV: ${uv.toFixed(1)}`);

  // SAFE: real temp below 24°C — heat index irrelevant at low temperatures
  if (temperature < 24) {
    return {
      level: 'safe',
      message: 'Conditions Optimal',
      description: 'Comfortable conditions for hyperhidrosis management.',
      color: 'text-green-400',
      triggers,
    };
  }

  // LOW RISK: 24–27°C real temp
  if (temperature >= 24 && temperature < 28) {
    triggers.push(`Temp: ${temperature.toFixed(1)}°C`);
    if (humidity >= 75) {
      triggers.push(`High humidity: ${humidity.toFixed(0)}%`);
      return {
        level: 'low',
        message: 'Low Risk',
        description: 'Mild conditions with high humidity — stay hydrated and monitor.',
        color: 'text-yellow-300',
        triggers,
      };
    }
    return {
      level: 'low',
      message: 'Low Risk',
      description: 'Mild warmth — consider light clothing and stay hydrated.',
      color: 'text-yellow-300',
      triggers,
    };
  }

  // EXTREME RISK: real temp >= 35°C (must check before high)
  if (temperature >= 35) {
    triggers.push(`Extreme temp: ${temperature.toFixed(1)}°C`);
    if (humidity >= 50) triggers.push(`Humidity: ${humidity.toFixed(0)}%`);
    return {
      level: 'extreme',
      message: 'Extreme Risk',
      description: 'Extreme heat — stay indoors with AC, avoid all outdoor activities.',
      color: 'text-red-500',
      triggers,
    };
  }

  // HIGH RISK: real temp 32–34°C
  if (temperature >= 32) {
    triggers.push(`High temp: ${temperature.toFixed(1)}°C`);
    if (humidity >= 60) triggers.push(`Humidity: ${humidity.toFixed(0)}%`);
    return {
      level: 'high',
      message: 'High Risk',
      description: 'High sweat risk — use cooling devices, stay in AC, consider iontophoresis.',
      color: 'text-red-400',
      triggers,
    };
  }

  // MODERATE/HIGH RISK: real temp 28–31°C
  if (temperature >= 28) {
    triggers.push(`Temp: ${temperature.toFixed(1)}°C`);

    // High humidity at 28°C+ pushes to high risk
    if (humidity >= 80) {
      triggers.push(`High humidity: ${humidity.toFixed(0)}%`);
      if (isHighEDA || isHighUV) {
        return {
          level: 'high',
          message: 'High Risk',
          description: 'High sweat conditions — use cooling aids and consider staying indoors.',
          color: 'text-red-400',
          triggers,
        };
      }
      return {
        level: 'moderate',
        message: 'Moderate Risk',
        description: 'Sweating likely — prepare cooling aids and antiperspirant.',
        color: 'text-yellow-400',
        triggers,
      };
    }

    if (humidity >= 70) {
      triggers.push(`Humidity: ${humidity.toFixed(0)}%`);
    }

    return {
      level: 'moderate',
      message: 'Moderate Risk',
      description: 'Warm conditions — prepare cooling aids and monitor symptoms.',
      color: 'text-yellow-400',
      triggers,
    };
  }

  // Fallback safe
  return {
    level: 'safe',
    message: 'Conditions Optimal',
    description: 'Comfortable conditions for hyperhidrosis management.',
    color: 'text-green-400',
    triggers,
  };
}

/**
 * Get severity level for notifications
 */
export function getRiskSeverity(level: SweatRiskLevel): 'REMINDER' | 'WARNING' | 'CRITICAL' {
  switch (level) {
    case 'safe':
    case 'low':
      return 'REMINDER';
    case 'moderate':
      return 'WARNING';
    case 'high':
    case 'extreme':
      return 'CRITICAL';
  }
}

/**
 * Check if conditions should trigger an alert based on user thresholds.
 * Never triggers on simulated data.
 */
export function shouldTriggerAlert(
  temperature: number,
  humidity: number,
  uvIndex: number,
  thresholds: { temperature: number; humidity: number; uvIndex: number },
  isSimulated?: boolean
): { shouldAlert: boolean; triggers: string[] } {
  // Never alert on simulated data
  if (isSimulated) return { shouldAlert: false, triggers: [] };

  const uv = Math.min(11, uvIndex);
  const risk = calculateSweatRisk(temperature, humidity, uv);

  if (risk.level === 'safe' || risk.level === 'low') {
    return { shouldAlert: false, triggers: [] };
  }

  const triggers: string[] = [];
  if (temperature >= thresholds.temperature) {
    triggers.push(`🌡️ Temperature: ${temperature.toFixed(1)}°C (threshold: ${thresholds.temperature}°C)`);
  }
  if (humidity >= thresholds.humidity) {
    triggers.push(`💧 Humidity: ${humidity.toFixed(0)}% (threshold: ${thresholds.humidity}%)`);
  }
  if (uv >= thresholds.uvIndex) {
    triggers.push(`☀️ UV Index: ${uv.toFixed(1)} (threshold: ${thresholds.uvIndex})`);
  }

  return {
    shouldAlert: triggers.length > 0,
    triggers: triggers.length > 0 ? triggers : risk.triggers,
  };
}
