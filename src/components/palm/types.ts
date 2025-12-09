export interface AnalysisResult {
  confidence: number;
  severity: {
    level: number;
    assessment: string;
  };
  sweatGlandActivity: {
    level: number;
    assessment: string;
  };
  moistureSource: string;
  detectedTriggers: string[];
  treatmentRecommendations: {
    primary: string;
    alternative: string[];
  };
  analysisNotes: string;
}
