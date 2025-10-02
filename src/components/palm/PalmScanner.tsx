import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Activity, AlertTriangle, Stethoscope, Info, Sparkles, Camera as CameraIcon, Upload as UploadIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleAIAnalysisResult {
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

async function analyzeWithGoogleAI(imageDataUrl: string): Promise<GoogleAIAnalysisResult> {
  const isDebug = typeof window !== 'undefined' && localStorage.getItem('sweatsmart_debug_mode') === 'true';
  const projectRef = 'ujbcolxawpzfjkjviwqw';
  const endpointUrl = `https://${projectRef}.supabase.co/functions/v1/analyze-hyperhidrosis`;

  try {
    if (isDebug) {
      console.log('=== GOOGLE VISION/AI DEBUG START ===');
      console.log('Using Supabase Edge Function (server-side key)');
      console.log('API Endpoint URL:', endpointUrl);
      console.log('Base64 length:', imageDataUrl ? imageDataUrl.length : 'NO BASE64');
      console.log('Request payload structure:', JSON.stringify({ imageData: `[base64 length: ${imageDataUrl?.length}]` }, null, 2));
    }

    const { data, error } = await supabase.functions.invoke('analyze-hyperhidrosis', {
      body: { imageData: imageDataUrl }
    });

    if (error) {
      if (isDebug) {
        console.error('Supabase function error:', error);
        console.error('Supabase error status:', (error as any)?.status);
        console.error('Supabase error name:', (error as any)?.name);
        console.error('Supabase error message:', (error as any)?.message);
      }
      const status = (error as any)?.status ?? (error as any)?.context?.status ?? 'Unknown';
      const message = (error as any)?.message ?? 'Unknown error';
      throw new Error(`Failed to analyze image with Google AI: ${message} (status: ${status})`);
    }

    if (isDebug) {
      console.log('Function response data:', data);
    }

    return data as GoogleAIAnalysisResult;
  } catch (error: any) {
    if (isDebug) {
      console.error('=== GOOGLE VISION/AI ERROR DETAILS ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('=== END ERROR DETAILS ===');
    }
    throw error;
  }
}

export function PalmScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GoogleAIAnalysisResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access the camera. Please check permissions and try again.");
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        if (base64Image) {
          analyzeImage(base64Image);
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        analyzeImage(dataUrl);

        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };

  const analyzeImage = async (base64ImageDataUrl: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setImagePreview(base64ImageDataUrl);

    try {
      console.log('Analysis started');
      const analysis = await analyzeWithGoogleAI(base64ImageDataUrl);
      setResult(analysis);
      
      toast({
        title: "SweatSmart Analysis Complete",
        description: `Analysis complete with ${Math.round(analysis.confidence)}% confidence`,
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Scan Error",
        description: `Failed to analyze: ${errorMessage}`,
        variant: "destructive",
      });
      setImagePreview(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setImagePreview(null);
    startCamera();
  };

  const getSeverityColor = (level: number) => {
    if (level <= 2) return 'bg-success';
    if (level <= 4) return 'bg-warning';
    if (level <= 6) return 'bg-orange-500';
    if (level <= 8) return 'bg-destructive';
    return 'bg-red-700';
  };

  // Show results if available
  if (result && imagePreview) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl">Analysis Results</CardTitle>
              <Badge variant="outline" className="text-base">{result.confidence}% Confidence</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Preview */}
            <div className="rounded-lg overflow-hidden border">
              <img src={imagePreview} alt="Analyzed" className="w-full h-auto object-cover max-h-64" />
            </div>

            {/* AI Analysis Notes with Moisture Source */}
            {result.analysisNotes && (
              <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">AI Analysis Note</h3>
                    <p className="text-sm text-muted-foreground">{result.analysisNotes}</p>
                  </div>
                </div>
                {result.moistureSource && (
                  <div className="pt-3 border-t flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-sm">Suspected Moisture Source:</span>
                    <Badge 
                      variant={result.moistureSource === 'Hyperhidrosis' ? 'default' : result.moistureSource === 'External Moisture' ? 'destructive' : 'secondary'}
                      className="text-sm"
                    >
                      {result.moistureSource}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Severity Assessment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Severity Assessment</h3>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Level {result.severity.level}/10</span>
                <Badge className={getSeverityColor(result.severity.level)}>
                  {result.severity.assessment}
                </Badge>
              </div>
              <Progress value={result.severity.level * 10} className="h-2" />
            </div>

            {/* Sweat Gland Activity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Sweat Gland Activity</h3>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{result.sweatGlandActivity.level}% Active</span>
                <Badge variant="secondary">{result.sweatGlandActivity.assessment}</Badge>
              </div>
              <Progress value={result.sweatGlandActivity.level} className="h-2" />
            </div>

            {/* Detected Triggers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Detected Triggers</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.detectedTriggers.map((trigger, index) => (
                  <Badge key={index} variant="outline">
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Treatment Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Treatment Recommendations</h3>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="font-semibold text-primary mb-1">Primary Treatment</p>
                  <p className="text-sm">{result.treatmentRecommendations.primary}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Alternative Options:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.treatmentRecommendations.alternative.map((treatment, index) => (
                      <Badge key={index} variant="secondary">
                        {treatment}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-r-lg">
              <p className="text-sm">
                ⚠️ This analysis works for palms, hands, feet, and soles. Results are for informational purposes only. 
                Consult with a healthcare professional for proper diagnosis and treatment of hyperhidrosis.
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition"
            >
              Analyze Another Image
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isAnalyzing) {
    const loadingMessages = [
      "Calibrating hyperhidrosis detectors...",
      "Analyzing image for moisture signatures...",
      "Distinguishing between sweat and external sources...",
      "Cross-referencing with dermatological patterns...",
      "Assessing pore-level activity...",
      "Identifying potential triggers...",
      "Compiling personalized recommendations...",
      "Finalizing your detailed report...",
    ];
    const [messageIndex, setMessageIndex] = useState(0);
    
    useEffect(() => {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex justify-center items-center mb-6">
              <Activity className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">Analyzing...</h2>
            <p className="text-muted-foreground transition-opacity duration-500">
              {loadingMessages[messageIndex]}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show camera error
  if (cameraError) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Camera Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{cameraError}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={startCamera}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition"
              >
                Retry Camera
              </button>
              <button
                onClick={handleUploadClick}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg shadow hover:bg-secondary/90 transition"
              >
                <UploadIcon className="h-5 w-5 mr-2" />
                Upload an Image
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show camera capture interface
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            HyperScanner
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use your camera for a live scan or upload an existing image
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Preview */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!stream && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className="text-white animate-pulse">Starting camera...</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCapture}
              disabled={!stream}
              className="flex-1 inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <CameraIcon className="h-6 w-6 mr-2" />
              Scan with Camera
            </button>
            <button
              onClick={handleUploadClick}
              className="flex-1 inline-flex items-center justify-center px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg shadow hover:bg-secondary/90 transition"
            >
              <UploadIcon className="h-6 w-6 mr-2" />
              Upload Image
            </button>
          </div>

          {/* Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              This analysis is for informational purposes only. Consult with a healthcare professional for a medical diagnosis.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}