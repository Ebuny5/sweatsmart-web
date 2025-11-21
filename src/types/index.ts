// Climate types
export interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
}

export interface PhysiologicalData {
  eda: number;
}

export interface Thresholds {
  temperature: number;
  humidity: number;
  uvIndex: number;
}

export type HDSSLevel = 1 | 2 | 3 | 4;

export interface LogEntry {
  id: string;
  timestamp: number;
  hdssLevel: HDSSLevel;
  weather: WeatherData;
  physiologicalData: PhysiologicalData;
}

// Episode types
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type BodyArea = 
  | 'palms'
  | 'soles'
  | 'underarms'
  | 'face'
  | 'scalp'
  | 'back'
  | 'chest'
  | 'groin';

export interface BodyAreaDetail {
  area: BodyArea;
  name: BodyArea;
  label: string;
  icon: string;
}

export interface Trigger {
  id: string;
  name: string;
  label: string;
  value: string;
  type: 'environmental' | 'emotional' | 'physical' | 'dietary' | 'medical' | 'situational';
  category: 'environmental' | 'emotional' | 'physical' | 'dietary' | 'medical' | 'situational';
  icon: string;
}

export interface ProcessedEpisode {
  id: string;
  date: string;
  datetime: Date;
  severity: SeverityLevel;
  severityLevel: SeverityLevel;
  body_areas: BodyArea[];
  bodyAreas: BodyArea[];
  triggers: Trigger[];
  notes?: string;
  created_at: string;
  createdAt: Date;
  updated_at: string;
  userId: string;
}

export interface TriggerFrequency {
  name: string;
  count: number;
  category: string;
}

export interface BodyAreaFrequency {
  area: BodyArea;
  count: number;
  percentage: number;
  averageSeverity?: number;
}

export interface TrendData {
  date: string;
  severity: number;
  count: number;
}

// Profile types
export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}
