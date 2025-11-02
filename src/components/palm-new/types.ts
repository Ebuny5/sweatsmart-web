export type SimulationMode = 'Resting' | 'Active' | 'Trigger';

export type PalmScanResult = 'Moisture detected.' | 'No significant moisture.' | 'Not Scanned';
export type FusedStatus = 'Stable' | 'Early Alert' | 'Episode Likely';

export interface SensorReading {
  user_id: string;
  timestamp: string;
  sim_mode: SimulationMode;
  EDA_uS: number;
  HR_bpm: number;
  EDA_baseline_uS: number;
  HR_baseline_bpm: number;
  notes: string;
}

export interface FusedAnalysis {
  status: FusedStatus;
  explanation: string;
}
