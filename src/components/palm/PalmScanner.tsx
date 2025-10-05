import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Activity, Droplet, AlertCircle, Info, Sparkles } from "lucide-react";

// Updated analysis result interface matching the new repo
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
  detectedTriggers: string[];
  treatmentRecommendations: {
    primary: string;
    alternative: string[];
  };
  analysisNotes: string;
}

type SensorStatus = 'disconnected' | 'connecting' | 'connected';
type SimulationScenario = 'Resting' | 'Exercise' | 'Normal';

export function PalmScanner() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Sensor state for Xiaomi Band simulation
  const [hrStatus, setHrStatus] = useState<SensorStatus>('disconnected');
  const [gsrStatus, setGsrStatus] = useState<SensorStatus>('disconnected');
  const [hrData, setHrData] = useState<number | null>(null);
  const [gsrData, setGsrData] = useState<number | null>(null);
  const [simulationScenario, setSimulationScenario] = useState<SimulationScenario>('Normal');

  // Random value generator for sensor simulation
  const getRandomValue = (min: number, max: number, decimalPlaces: number = 0) => {
    const rand = Math.random() * (max - min) + min;
    return parseFloat(rand.toFixed(decimalPlaces));
  };

  // Handle sensor connection/disconnection
  const handleConnect = () => {
    if (hrStatus === 'connected' || gsrStatus === 'connected') {
      setHrStatus('disconnected');
      setGsrStatus('disconnected');
      setHrData(null);
      setGsrData(null);
    } else {
      setHrStatus('connecting');
      setGsrStatus('connecting');
      
      setTimeout(() => {
        setHrStatus('connected');
        setGsrStatus('connected');
        
        // Start simulated sensor readings
        const interval = setInterval(() => {
          let hrMin = 70, hrMax = 85, gsrMin = 0.5, gsrMax = 1.5;
          
          if (simulationScenario === 'Exercise') {
            hrMin = 120; hrMax = 160;
            gsrMin = 2.0; gsrMax = 4.0;
          } else if (simulationScenario === 'Resting') {
            hrMin = 55; hrMax = 65;
            gsrMin = 0.2; gsrMax = 0.6;
          }
          
          setHrData(getRandomValue(hrMin, hrMax, 0));
          setGsrData(getRandomValue(gsrMin, gsrMax, 2));
        }, 1000);
        
        return () => clearInterval(interval);
      }, 1500);
    }
  };

  const onPickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImageDataUrl(dataUrl);
        setResult(null);
      };
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Could not read image file.",
        });
      };
      reader.readAsDataURL(file);
    },
    [toast]
  );

  const analyze = useCallback(async () => {
    if (!imageDataUrl) {
      toast({ title: "No image", description: "Please upload an image first." });
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-hyperhidrosis",
        { body: { imageData: imageDataUrl } }
      );

      if (error) {
        throw error;
      }

      // Edge function returns { result: AnalysisResult }
      const parsed: AnalysisResult = (data?.result as AnalysisResult) || (data as any);
      setResult(parsed);
      toast({ title: "Analysis complete", description: "Palm scan analyzed successfully." });
    } catch (err: any) {
      console.error("Analyze error", err);
      toast({
        title: "Analysis failed",
        description:
          err?.message || "We couldn't analyze this image. Please try another.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageDataUrl, toast]);

  const getSeverityClass = (assessment: string) => {
    switch (assessment.toLowerCase()) {
      case 'very severe': return 'bg-destructive text-destructive-foreground';
      case 'severe': return 'bg-destructive/80 text-destructive-foreground';
      case 'moderate': return 'bg-primary/60 text-primary-foreground';
      case 'mild': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusClasses = (status: SensorStatus) => {
    switch (status) {
      case 'connected':
        return { dot: 'bg-green-500', text: 'text-green-700', label: 'Connected' };
      case 'connecting':
        return { dot: 'bg-yellow-500 animate-pulse', text: 'text-yellow-700', label: 'Connecting...' };
      default:
        return { dot: 'bg-destructive', text: 'text-destructive', label: 'Disconnected' };
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      {/* Sensor Dashboard */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Xiaomi Band Sensor Simulation
        </h2>
        
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Heart Rate Sensor */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-bold">Heart Rate Monitor</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${getStatusClasses(hrStatus).dot}`}></span>
                    <span className={`text-sm font-medium ${getStatusClasses(hrStatus).text}`}>
                      {getStatusClasses(hrStatus).label}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-lg font-mono">{hrData !== null ? `${hrData} bpm` : '--'}</p>
            </div>

            {/* GSR Sensor */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Droplet className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-bold">Galvanic Skin Response</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${getStatusClasses(gsrStatus).dot}`}></span>
                    <span className={`text-sm font-medium ${getStatusClasses(gsrStatus).text}`}>
                      {getStatusClasses(gsrStatus).label}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-lg font-mono">{gsrData !== null ? `${gsrData} µS` : '--'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleConnect}
              variant={hrStatus === 'connected' ? 'destructive' : 'default'}
            >
              {hrStatus === 'connected' ? 'Disconnect Sensors' : 'Connect Sensors'}
            </Button>
            
            <select
              value={simulationScenario}
              onChange={(e) => setSimulationScenario(e.target.value as SimulationScenario)}
              className="px-3 py-2 border rounded-md bg-background"
              disabled={hrStatus !== 'connected'}
            >
              <option value="Resting">Resting</option>
              <option value="Normal">Normal</option>
              <option value="Exercise">Exercise</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Palm Scanner */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Palm Scanner with AI Analysis</h2>
        
        <div className="space-y-4">
          {/* Image preview */}
          <div className="w-full">
            {imageDataUrl ? (
              <img
                src={imageDataUrl}
                alt="Uploaded palm for hyperhidrosis scan"
                className="mx-auto aspect-video w-full max-w-xl rounded-md object-contain border"
                loading="lazy"
              />
            ) : (
              <div className="mx-auto flex aspect-video w-full max-w-xl items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No image selected
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            <Button variant="secondary" onClick={onPickFile} disabled={isAnalyzing}>
              Upload Image
            </Button>
            <Button onClick={analyze} disabled={!imageDataUrl || isAnalyzing}>
              {isAnalyzing ? "Analyzing..." : "Analyze Palm"}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-4 space-y-4">
              {/* Header with Severity Badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Analysis Results
                </h3>
                <Badge className={getSeverityClass(result.severity.assessment)}>
                  {result.severity.assessment}
                </Badge>
              </div>

              {/* Confidence & Metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span className="font-medium">Confidence</span>
                  </div>
                  <p className="text-2xl font-bold">{Math.round(result.confidence)}%</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="h-4 w-4 text-primary" />
                    <span className="font-medium">Sweat Gland Activity</span>
                  </div>
                  <p className="text-2xl font-bold">{result.sweatGlandActivity.level}%</p>
                  <p className="text-sm text-muted-foreground">{result.sweatGlandActivity.assessment}</p>
                </div>
              </div>

              {/* Moisture Source */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <span className="font-medium">Moisture Source</span>
                </div>
                <p className="text-lg">{result.moistureSource}</p>
              </div>

              {/* Triggers */}
              {result.detectedTriggers.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Detected Triggers</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedTriggers.map((trigger, i) => (
                      <Badge key={i} variant="outline">{trigger}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatment Recommendations */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2">Treatment Recommendations</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-primary">Primary:</span>
                    <p className="text-sm">{result.treatmentRecommendations.primary}</p>
                  </div>
                  {result.treatmentRecommendations.alternative.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-primary">Alternatives:</span>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {result.treatmentRecommendations.alternative.map((alt, i) => (
                          <li key={i}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Notes */}
              {result.analysisNotes && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Analysis Notes</h4>
                  <p className="text-sm text-muted-foreground">{result.analysisNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

export default PalmScanner;
