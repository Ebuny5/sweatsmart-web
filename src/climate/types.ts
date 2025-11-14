
export interface WeatherData {
  temperature: number; // in Celsius
  humidity: number; // in %
  uvIndex: number;
}

export interface PhysiologicalData {
  eda: number; // in µS (microsiemens)
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
