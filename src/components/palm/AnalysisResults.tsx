import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Activity, 
  Droplets, 
  Stethoscope, 
  Info, 
  Sparkles,
  Heart,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface AnalysisResult {
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
  hyperhidrosisType?: string;
  detectedTriggers: string[];
  treatmentRecommendations: {
    primary: string;
    alternative: string[];
  };
  analysisNotes: string;
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
  imagePreview: string | null;
  hrData?: number | null;
  gsrData?: number | null;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ 
  result, 
  onReset, 
  imagePreview,
  hrData,
  gsrData 
}) => {
  // Dynamic severity color
  const getSeverityColor = (level: number) => {
    if (level === 0) return 'text-green-600 bg-green-50 border-green-200';
    if (level <= 2) return 'text-green-600 bg-green-50 border-green-200';
    if (level <= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (level <= 6) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (level <= 8) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  const getSeverityIcon = (level: number) => {
    if (level === 0) return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    if (level <= 4) return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    return <XCircle className="h-6 w-6 text-red-600" />;
  };

  const getProgressColor = (level: number) => {
    if (level === 0) return 'bg-green-500';
    if (level <= 2) return 'bg-green-500';
    if (level <= 4) return 'bg-yellow-500';
    if (level <= 6) return 'bg-orange-500';
    if (level <= 8) return 'bg-red-500';
    return 'bg-red-700';
  };

  const getMoistureSourceBadgeColor = (source: string) => {
    if (source === 'None') return 'bg-green-100 text-green-800 border-green-300';
    if (source === 'Hyperhidrosis') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (source === 'External Moisture') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getHyperhidrosisTypeBadge = (type?: string) => {
    if (!type || type === 'Not Applicable') return null;
    const isPrimary = type === 'Primary';
    return (
      <Badge 
        variant="outline" 
        className={`text-sm font-semibold ${
          isPrimary 
            ? 'bg-purple-100 text-purple-800 border-purple-300' 
            : 'bg-orange-100 text-orange-800 border-orange-300'
        }`}
      >
        {type} Hyperhidrosis
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Card */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
                Analysis Complete
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered hyperhidrosis assessment
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-base px-3 py-1">
                {result.confidence}% Confidence
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Image Preview */}
      {imagePreview && (
        <Card className="overflow-hidden border-2">
          <CardContent className="p-0">
            <img 
              src={imagePreview} 
              alt="Analyzed palm" 
              className="w-full h-auto object-cover max-h-80"
            />
          </CardContent>
        </Card>
      )}

      {/* Severity Assessment - Hero Section */}
      <Card className={`border-2 ${getSeverityColor(result.severity.level)}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="mt-1">
              {getSeverityIcon(result.severity.level)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Severity Assessment</h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-3xl font-bold">
                    Level {result.severity.level}/10
                  </span>
                  <Badge className="ml-3 text-sm font-semibold">
                    {result.severity.assessment}
                  </Badge>
                </div>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(result.severity.level)} transition-all duration-500 ease-out`}
                  style={{ width: `${result.severity.level * 10}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moisture Source & Hyperhidrosis Type */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Moisture Source Analysis
                </h3>
                <Badge 
                  variant="outline"
                  className={`text-base font-semibold px-4 py-1 ${getMoistureSourceBadgeColor(result.moistureSource)}`}
                >
                  {result.moistureSource}
                </Badge>
              </div>
              
              {result.hyperhidrosisType && result.hyperhidrosisType !== 'Not Applicable' && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                    Classification
                  </h3>
                  {getHyperhidrosisTypeBadge(result.hyperhidrosisType)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensor Data Display */}
      {(hrData || gsrData) && (
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Sensor Data Validation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hrData && (
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-3">
                    <Heart className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Heart Rate</p>
                      <p className="text-2xl font-bold text-red-600">{hrData} bpm</p>
                    </div>
                  </div>
                </div>
              )}
              {gsrData && (
                <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <Activity className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">GSR (Skin Response)</p>
                      <p className="text-2xl font-bold text-purple-600">{gsrData} µS</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Notes */}
      {result.analysisNotes && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-blue-900">AI Analysis Notes</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {result.analysisNotes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sweat Gland Activity */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Sweat Gland Activity</h3>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold">{result.sweatGlandActivity.level}% Active</span>
            <Badge variant="secondary" className="text-sm">
              {result.sweatGlandActivity.assessment}
            </Badge>
          </div>
          <Progress value={result.sweatGlandActivity.level} className="h-2" />
        </CardContent>
      </Card>

      {/* Detected Triggers */}
      {result.detectedTriggers.length > 0 && result.detectedTriggers[0] !== 'None' && (
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Droplets className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Detected Triggers</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.detectedTriggers.map((trigger, index) => (
                <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                  {trigger}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment Recommendations */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="h-5 w-5 text-green-700" />
            <h3 className="font-semibold text-green-900">Treatment Recommendations</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <p className="font-semibold text-green-800 mb-2">Primary Treatment</p>
              <p className="text-sm text-green-900">{result.treatmentRecommendations.primary}</p>
            </div>
            
            {result.treatmentRecommendations.alternative.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3 text-green-900">Alternative Options:</p>
                <div className="flex flex-wrap gap-2">
                  {result.treatmentRecommendations.alternative.map((treatment, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="bg-white text-green-800 border-green-300 text-sm px-3 py-1"
                    >
                      {treatment}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical Disclaimer */}
      <Card className="border-2 border-yellow-300 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-700 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-900">
              <strong>Medical Disclaimer:</strong> This analysis is for informational purposes only. 
              Results should not replace professional medical advice. Consult with a healthcare 
              professional for proper diagnosis and treatment of hyperhidrosis.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <button
        onClick={onReset}
        className="w-full px-6 py-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Analyze Another Image
      </button>
    </div>
  );
};

export default AnalysisResults;
