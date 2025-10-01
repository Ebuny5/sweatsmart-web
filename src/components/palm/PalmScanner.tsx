import { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets, Activity, AlertTriangle, Stethoscope, Info, Upload, Camera as CameraIcon } from 'lucide-react';
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
  const camera = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GoogleAIAnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const isDebugMode = () => typeof window !== 'undefined' && localStorage.getItem('sweatsmart_debug_mode') === 'true';

  const validateImage = (file: File) => {
    const debug = isDebugMode();
    if (debug) {
      console.log('=== IMAGE VALIDATION ===');
      console.log('File exists:', !!file);
      console.log('File size:', file?.size, 'bytes');
      console.log('File type:', file?.type);
      console.log('Is valid image type:', ['image/jpeg', 'image/png', 'image/jpg'].includes(file?.type));
      console.log('Size under 4MB:', file?.size < 4 * 1024 * 1024);
    }

    if (!file) throw new Error('No file provided');
    if (file.size > 4 * 1024 * 1024) throw new Error(`File too large: ${file.size} bytes (max: 4MB)`);
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) throw new Error(`Invalid file type: ${file.type}`);
  };

  const scanFromCamera = async () => {
    if (camera.current) {
      try {
        setIsAnalyzing(true);
        
        const photo = camera.current.takePhoto();
        console.log('Camera scan initiated');
        
        const analysis = await analyzeWithGoogleAI(photo);
        setResult(analysis);
        
        toast({
          title: "SweatSmart Analysis Complete",
          description: `Analysis complete with ${Math.round(analysis.confidence)}% confidence`,
        });
      } catch (error) {
        console.error('Error analyzing from camera:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: "Scan Error",
          description: `Failed to analyze: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const scanFromFile = async () => {
    if (selectedFile) {
      try {
        setIsAnalyzing(true);

        // Validate and log file details
        validateImage(selectedFile);
        const debug = isDebugMode();
        if (debug) {
          console.log('Selected file name:', selectedFile.name);
          console.log('Selected file size:', selectedFile.size);
          console.log('Selected file type:', selectedFile.type);
        }

        const base64Data = await convertFileToBase64(selectedFile);
        if (debug) {
          console.log('Base64 length before API:', base64Data.length);
        }
        console.log('File scan initiated');
        
        const analysis = await analyzeWithGoogleAI(base64Data);
        setResult(analysis);
        
        toast({
          title: "SweatSmart Analysis Complete",
          description: `Analysis complete with ${Math.round(analysis.confidence)}% confidence`,
        });
      } catch (error) {
        console.error('Error analyzing from file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: "Scan Error", 
          description: `Failed to analyze: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const getSeverityColor = (level: number) => {
    if (level <= 2) return 'bg-success';
    if (level <= 4) return 'bg-warning';
    if (level <= 6) return 'bg-orange-500';
    if (level <= 8) return 'bg-destructive';
    return 'bg-red-700';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            HyperScanner
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analyze hyperhidrosis in palms, hands, feet, and soles
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <CameraIcon className="h-4 w-4" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="camera" className="space-y-4">
              <div className="scanner relative rounded-lg overflow-hidden border-2 border-primary/20">
                <Camera 
                  ref={camera} 
                  aspectRatio={4/3}
                  facingMode="environment"
                  errorMessages={{
                    noCameraAccessible: 'No camera accessible. Please check permissions.',
                    permissionDenied: 'Camera access denied. Please allow camera permissions.',
                  }}
                />
              </div>
              
              <Button 
                onClick={scanFromCamera} 
                disabled={isAnalyzing}
                className="w-full h-12"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Hyperhidrosis...
                  </>
                ) : (
                  <>
                    <CameraIcon className="mr-2 h-4 w-4" />
                    Capture & Analyze
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Selected image" 
                      className="max-w-full max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      Select an image of palms, hands, feet, or soles
                    </p>
                  </div>
                )}
                
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-4"
                />
              </div>
              
              <Button 
                onClick={scanFromFile} 
                disabled={isAnalyzing || !selectedFile}
                className="w-full h-12"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Hyperhidrosis...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analysis Results</span>
              <Badge variant="outline">{result.confidence}% Confidence</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Severity Assessment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Severity Assessment</h3>
              </div>
              <div className="flex items-center justify-between">
                <span>Level {result.severity.level}/10</span>
                <Badge className={getSeverityColor(result.severity.level)}>
                  {result.severity.assessment}
                </Badge>
              </div>
              <Progress value={result.severity.level * 10} className="h-2" />
            </div>

            {/* Sweat Gland Activity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Sweat Gland Activity</h3>
              </div>
              <div className="flex items-center justify-between">
                <span>Level {result.sweatGlandActivity.level}/10</span>
                <Badge variant="secondary">{result.sweatGlandActivity.assessment}</Badge>
              </div>
              <Progress value={result.sweatGlandActivity.level * 10} className="h-2" />
            </div>

            {/* Moisture Source */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Moisture Source</h3>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={result.moistureSource === 'Hyperhidrosis' ? 'default' : result.moistureSource === 'External Moisture' ? 'destructive' : 'secondary'} className="text-base px-4 py-1">
                  {result.moistureSource}
                </Badge>
              </div>
            </div>

            {/* Detected Triggers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
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
                <Stethoscope className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Treatment Recommendations</h3>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="font-medium text-primary">Primary Treatment</p>
                  <p className="text-sm text-muted-foreground">{result.treatmentRecommendations.primary}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Alternative Options:</p>
                  {result.treatmentRecommendations.alternative.map((treatment, index) => (
                    <Badge key={index} variant="secondary" className="mr-2">
                      {treatment}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Analysis Notes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">AI Analysis Notes</h3>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{result.analysisNotes}</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                ⚠️ This analysis works for palms, hands, feet, and soles. Results are for informational purposes only. 
                Consult with a healthcare professional for proper diagnosis and treatment of hyperhidrosis.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}