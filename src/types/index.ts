
// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  createdAt: Date;
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

// Episode logging
export interface Episode {
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
  area: BodyArea;
  count: number;
  averageSeverity: number;
}

export interface TriggerFrequency {
  trigger: Trigger;
  count: number;
  averageSeverity: number;
}
