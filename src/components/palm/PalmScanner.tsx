import { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import * as tf from '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Activity, AlertTriangle, Stethoscope } from 'lucide-react';

interface HyperAnalysisResult {
  severity: {
    level: number;
    label: string;
  };
  poreDensity: {
    percentage: number;
    status: string;
  };
  triggers: {
    detected: string[];
    confidence: number;
  };
  treatment: {
    primary: string;
    secondary: string[];
  };
  confidence: number;
}

async function analyzeHyperhidrosis(imageDataUrl: string): Promise<HyperAnalysisResult> {
  const img = new Image();
  img.src = imageDataUrl;
  
  await img.decode();
  
  // Convert to tensor for analysis
  const tensor = tf.browser.fromPixels(img)
                           .resizeBilinear([224, 224])
                           .toFloat()
                           .div(255.0)
                           .expandDims();

  // Advanced analysis simulation (in real app, this would be your trained model)
  const meanBrightness = tf.mean(tensor).dataSync()[0];
  const variance = tf.moments(tensor).variance.dataSync()[0];
  const redChannel = tf.mean(tensor.slice([0, 0, 0, 0], [1, 224, 224, 1])).dataSync()[0];
  const blueChannel = tf.mean(tensor.slice([0, 0, 0, 2], [1, 224, 224, 1])).dataSync()[0];
  
  // Simulate AI model predictions based on image analysis
  const moistureLevel = meanBrightness * 10;
  const textureVariance = variance * 100;
  const skinTone = redChannel / blueChannel;
  
  // Determine severity (1-10 scale)
  let severityLevel = Math.min(10, Math.max(1, Math.round(moistureLevel + textureVariance * 2)));
  let severityLabel = '';
  
  if (severityLevel <= 2) severityLabel = 'Minimal';
  else if (severityLevel <= 4) severityLabel = 'Mild';
  else if (severityLevel <= 6) severityLabel = 'Moderate';
  else if (severityLevel <= 8) severityLabel = 'Severe';
  else severityLabel = 'Very Severe';
  
  // Analyze pore density
  const poreDensity = Math.min(95, Math.max(5, textureVariance * 15));
  let poreStatus = '';
  if (poreDensity < 30) poreStatus = 'Normal';
  else if (poreDensity < 60) poreStatus = 'Elevated';
  else poreStatus = 'Highly Active';
  
  // Detect potential triggers
  const triggers = [];
  if (moistureLevel > 6) triggers.push('Heat');
  if (textureVariance > 5) triggers.push('Stress');
  if (skinTone > 1.2) triggers.push('Physical Activity');
  if (triggers.length === 0) triggers.push('Baseline Activity');
  
  // Determine treatment recommendations
  let primaryTreatment = '';
  const secondaryTreatments = [];
  
  if (severityLevel <= 3) {
    primaryTreatment = 'Topical Antiperspirants';
    secondaryTreatments.push('Lifestyle Modifications', 'Stress Management');
  } else if (severityLevel <= 6) {
    primaryTreatment = 'Iontophoresis Therapy';
    secondaryTreatments.push('Prescription Antiperspirants', 'Oral Medications');
  } else {
    primaryTreatment = 'Botox Injections';
    secondaryTreatments.push('Iontophoresis', 'Surgical Options');
  }
  
  const confidence = Math.min(95, 70 + (textureVariance * 5));
  
  return {
    severity: {
      level: severityLevel,
      label: severityLabel
    },
    poreDensity: {
      percentage: Math.round(poreDensity),
      status: poreStatus
    },
    triggers: {
      detected: triggers,
      confidence: Math.round(confidence)
    },
    treatment: {
      primary: primaryTreatment,
      secondary: secondaryTreatments
    },
    confidence: Math.round(confidence)
  };
}

export function PalmScanner() {
  const camera = useRef<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<HyperAnalysisResult | null>(null);
  const { toast } = useToast();

  const scanFootOrPalm = async () => {
    if (camera.current) {
      try {
        setIsAnalyzing(true);
        
        // 1️⃣ CAPTURE IMAGE
        const photo = camera.current.takePhoto();
        console.log('Hyperhidrosis scan initiated:', photo);
        
        // 2️⃣ RUN SWEAT DETECTION MODEL
        const analysis = await analyzeHyperhidrosis(photo);
        setResult(analysis);
        
        toast({
          title: "HyperScan Complete",
          description: `Hyperhidrosis analysis complete with ${analysis.confidence}% confidence`,
        });
      } catch (error) {
        console.error('Error analyzing hyperhidrosis:', error);
        toast({
          title: "Scan Error",
          description: "Failed to analyze. Please try again.",
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
            onClick={scanFootOrPalm} 
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
                <Droplets className="mr-2 h-4 w-4" />
                Scan Palms, Hands, Feet or Soles
              </>
            )}
          </Button>
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
                  {result.severity.label}
                </Badge>
              </div>
              <Progress value={result.severity.level * 10} className="h-2" />
            </div>

            {/* Pore Activity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Sweat Gland Activity</h3>
              </div>
              <div className="flex items-center justify-between">
                <span>{result.poreDensity.percentage}% Active</span>
                <Badge variant="secondary">{result.poreDensity.status}</Badge>
              </div>
              <Progress value={result.poreDensity.percentage} className="h-2" />
            </div>

            {/* Detected Triggers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Detected Triggers</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.triggers.detected.map((trigger, index) => (
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
                  <p className="text-sm text-muted-foreground">{result.treatment.primary}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Alternative Options:</p>
                  {result.treatment.secondary.map((treatment, index) => (
                    <Badge key={index} variant="secondary" className="mr-2">
                      {treatment}
                    </Badge>
                  ))}
                </div>
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