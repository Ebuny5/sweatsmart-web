/**
 * Sweat Risk Calculator for Hyperhidrosis
 * 
 * Based on medical research for hyperhidrosis trigger conditions:
 * - Primary hyperhidrosis typically triggers at 28-30°C ambient temperature
 * - High humidity (70%+) at warm temps significantly increases sweat risk
 * - Heat index (combined temp+humidity effect) is the key metric
 * 
 * References:
 * - Hyperhidrosis Disease Severity Scale (HDSS)
 * - International Hyperhidrosis Society clinical guidelines
 */

export type SweatRiskLevel = 'safe' | 'low' | 'moderate' | 'high' | 'extreme';

export interface SweatRiskResult {
  level: SweatRiskLevel;
  message: string;
  description: string;
  color: string;
  triggers: string[];
}

/**
 * Calculate heat index (feels-like temperature) based on temperature and humidity
 * Using simplified Rothfusz regression formula
 */
function calculateHeatIndex(tempC: number, humidity: number): number {
  // Convert to Fahrenheit for the formula
  const tempF = (tempC * 9/5) + 32;
  
  if (tempF < 80) {
    // Simple formula for lower temps
    const hiF = 0.5 * (tempF + 61.0 + ((tempF - 68.0) * 1.2) + (humidity * 0.094));
    return (hiF - 32) * 5/9; // Convert back to Celsius
  }
  
  // Rothfusz regression equation
  let hiF = -42.379 + 2.04901523 * tempF + 10.14333127 * humidity
    - 0.22475541 * tempF * humidity - 0.00683783 * tempF * tempF
    - 0.05481717 * humidity * humidity + 0.00122874 * tempF * tempF * humidity
    + 0.00085282 * tempF * humidity * humidity - 0.00000199 * tempF * tempF * humidity * humidity;
  
  // Adjustments
  if (humidity < 13 && tempF >= 80 && tempF <= 112) {
    hiF -= ((13 - humidity) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
  } else if (humidity > 85 && tempF >= 80 && tempF <= 87) {
    hiF += ((humidity - 85) / 10) * ((87 - tempF) / 5);
  }
  
  return (hiF - 32) * 5/9; // Convert back to Celsius
}

/**
 * Calculate sweat risk based on temperature, humidity, and UV index
 * 
 * Temperature Risk Levels (based on hyperhidrosis research):
 * - Below 24°C: Safe - Comfortable conditions
 * - 24-27°C: Low Risk - Mild conditions
 * - 28-31°C: Moderate Risk - Sweating may increase
 * - 32-35°C: High Risk - Significant sweating likely
 * - Above 35°C: Extreme Risk - Severe sweating expected
 * 
 * Humidity Modifiers:
 * - High humidity (70%+) at 28°C+ increases risk level
 * - Low humidity (<50%) provides some relief
 */
export function calculateSweatRisk(
  temperature: number,
  humidity: number,
  uvIndex: number,
  edaValue?: number
): SweatRiskResult {
  const triggers: string[] = [];
  const heatIndex = calculateHeatIndex(temperature, humidity);
  
  // Use heat index for more accurate risk assessment
  const effectiveTemp = Math.max(temperature, heatIndex);
  
  // EDA (Electrodermal Activity) - physiological indicator
  const isHighEDA = edaValue !== undefined && edaValue > 5.0;
  if (isHighEDA) {
    triggers.push(`High EDA: ${edaValue?.toFixed(1)} µS`);
  }
  
  // UV Index risk (high UV contributes to sweating)
  const isHighUV = uvIndex >= 8;
  if (isHighUV) {
    triggers.push(`High UV: ${uvIndex.toFixed(1)}`);
  }
  
  // SAFE: Below 24°C - comfortable for hyperhidrosis management
  if (effectiveTemp < 24) {
    return {
      level: 'safe',
      message: 'Conditions Optimal',
      description: 'Comfortable conditions for hyperhidrosis management.',
      color: 'text-green-400',
      triggers,
    };
  }
  
  // LOW RISK: 24-27°C - mild warmth
  if (effectiveTemp >= 24 && effectiveTemp < 28) {
    triggers.push(`Temp: ${temperature.toFixed(1)}°C`);
    
    // High humidity at low temps = slightly increased risk
    if (humidity >= 75) {
      triggers.push(`High humidity: ${humidity.toFixed(0)}%`);
      return {
        level: 'low',
        message: 'Low Risk',
        description: 'Mild conditions with high humidity - stay hydrated and monitor.',
        color: 'text-yellow-300',
        triggers,
      };
    }
    
    return {
      level: 'low',
      message: 'Low Risk',
      description: 'Mild warmth - consider light clothing and stay hydrated.',
      color: 'text-yellow-300',
      triggers,
    };
  }
  
  // MODERATE RISK: 28-31°C - sweating may increase
  if (effectiveTemp >= 28 && effectiveTemp < 32) {
    triggers.push(`Temp: ${temperature.toFixed(1)}°C`);
    
    // High humidity at moderate temps = elevated to high risk
    if (humidity >= 70) {
      triggers.push(`High humidity: ${humidity.toFixed(0)}%`);
      
      // Combined with EDA or UV = HIGH
      if (isHighEDA || isHighUV) {
        return {
          level: 'high',
          message: 'High Risk',
          description: 'High sweat conditions detected - use cooling aids and consider staying indoors.',
          color: 'text-red-400',
          triggers,
        };
      }
      
      return {
        level: 'moderate',
        message: 'Moderate Risk',
        description: 'Sweating likely - prepare cooling aids and antiperspirant.',
        color: 'text-yellow-400',
        triggers,
      };
    }
    
    // Moderate temp but lower humidity
    return {
      level: isHighEDA ? 'moderate' : 'low',
      message: isHighEDA ? 'Moderate Risk' : 'Low Risk',
      description: 'Warm conditions - monitor symptoms and stay cool.',
      color: isHighEDA ? 'text-yellow-400' : 'text-yellow-300',
      triggers,
    };
  }
  
  // HIGH RISK: 32-35°C - significant sweating likely
  if (effectiveTemp >= 32 && effectiveTemp < 35) {
    triggers.push(`High temp: ${temperature.toFixed(1)}°C`);
    if (humidity >= 60) {
      triggers.push(`Humidity: ${humidity.toFixed(0)}%`);
    }
    
    return {
      level: 'high',
      message: 'High Risk',
      description: 'High sweat risk - use cooling devices, stay in AC, consider iontophoresis.',
      color: 'text-red-400',
      triggers,
    };
  }
  
  // EXTREME RISK: Above 35°C - severe sweating expected
  triggers.push(`Extreme temp: ${temperature.toFixed(1)}°C`);
  if (humidity >= 50) {
    triggers.push(`Humidity: ${humidity.toFixed(0)}%`);
  }
  
  return {
    level: 'extreme',
    message: 'Extreme Risk',
    description: 'Extreme heat - stay indoors with AC, avoid outdoor activities if possible.',
    color: 'text-red-500',
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
 * Check if current conditions should trigger an alert based on user thresholds
 * Used for background/cron-based notifications
 */
export function shouldTriggerAlert(
  temperature: number,
  humidity: number,
  uvIndex: number,
  thresholds: {
    temperature: number;
    humidity: number;
    uvIndex: number;
  }
): { shouldAlert: boolean; triggers: string[] } {
  const triggers: string[] = [];
  
  // Use smart risk calculation first
  const risk = calculateSweatRisk(temperature, humidity, uvIndex);
  
  // Only alert if risk is moderate or higher
  if (risk.level === 'safe' || risk.level === 'low') {
    return { shouldAlert: false, triggers: [] };
  }
  
  // Check against user thresholds (for customizable alerts)
  if (temperature >= thresholds.temperature) {
    triggers.push(`🌡️ Temperature: ${temperature.toFixed(1)}°C (threshold: ${thresholds.temperature}°C)`);
  }
  if (humidity >= thresholds.humidity) {
    triggers.push(`💧 Humidity: ${humidity.toFixed(0)}% (threshold: ${thresholds.humidity}%)`);
  }
  if (uvIndex >= thresholds.uvIndex) {
    triggers.push(`☀️ UV Index: ${uvIndex.toFixed(1)} (threshold: ${thresholds.uvIndex})`);
  }
  
  return {
    shouldAlert: triggers.length > 0,
    triggers: triggers.length > 0 ? triggers : risk.triggers,
  };
}
