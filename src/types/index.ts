
// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  createdAt: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  daily_reminders: boolean;
  reminder_time: string;
  trigger_alerts: boolean;
  data_sharing: boolean;
  created_at: string;
  updated_at: string;
}

// Symptom logging types
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type BodyArea = 
  | 'palms'
  | 'soles'
  | 'face'
  | 'armpits'
  | 'head'
  | 'back'
  | 'groin'
  | 'entireBody'
  | 'other';

export interface BodyAreaDetail {
  area: BodyArea;
  label: string;
}

// Trigger categories
export type EnvironmentalTrigger = 
  | 'hotTemperature'
  | 'coldTemperature'
  | 'highHumidity'
  | 'lowHumidity'
  | 'sunny'
  | 'rainy'
  | 'other';

export type EmotionalTrigger = 
  | 'stress'
  | 'anxiety'
  | 'excitement'
  | 'anger'
  | 'embarrassment'
  | 'nervousness'
  | 'other';

export type DietaryTrigger = 
  | 'spicyFood'
  | 'caffeine'
  | 'alcohol'
  | 'sugar'
  | 'dairyProducts'
  | 'other';

export type ActivityTrigger = 
  | 'physicalExercise'
  | 'socialEvents'
  | 'publicSpeaking'
  | 'workTasks'
  | 'certainClothing'
  | 'other';

export type TriggerType = 
  | 'environmental'
  | 'emotional'
  | 'dietary'
  | 'activity';

export interface Trigger {
  type: TriggerType;
  value: string;
  label: string;
}

// Episode logging - Database schema type
export interface Episode {
  id: string;
  user_id: string;
  date: string;
  severity: number;
  body_areas: string[];
  triggers: any[] | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Episode logging - Processed/Client type
export interface ProcessedEpisode {
  id: string;
  userId: string;
  datetime: Date;
  severityLevel: SeverityLevel;
  bodyAreas: BodyArea[];
  triggers: Trigger[];
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Dashboard data
export interface TrendData {
  date: string;
  averageSeverity: number;
  episodeCount: number;
}

export interface BodyAreaFrequency {
  area: string;
  count: number;
  averageSeverity: number;
  percentage: number;
}

export interface TriggerFrequency {
  trigger: string | { type: string; label: string; value: string };
  count: number;
  averageSeverity: number;
  percentage: number;
}
