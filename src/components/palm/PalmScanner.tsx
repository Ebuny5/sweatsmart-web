import { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import * as tf from '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

async function analyzePalm(imageDataUrl: string): Promise<string> {
  const img = new Image();
  img.src = imageDataUrl;
  
  await img.decode(); // Wait until image loads
  
  // Convert to tensor (numeric data)
  const tensor = tf.browser.fromPixels(img)
                           .resizeBilinear([224, 224])   // standard size
                           .toFloat()
                           .expandDims();

  // 🔍 Simple rule: high pixel values → shiny/wet skin?
  const meanBrightness = tf.mean(tensor).dataSync()[0];

  if (meanBrightness > 180) {    
    return 'Wet';
  } else if (meanBrightness > 150) {    
    return 'Damp';
  } else {    
    return 'Dry';
  }
}

export function PalmScanner() {
  const camera = useRef<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTakePhoto = async () => {
    if (camera.current) {
      try {
        setIsAnalyzing(true);
        const photo = camera.current.takePhoto();
        console.log('Palm photo:', photo); // Data URL string
        
        // Analyze the palm
        const analysis = await analyzePalm(photo);
        setResult(analysis);
        
        toast({
          title: "Palm Analysis Complete",
          description: `Your palm appears to be: ${analysis}`,
        });
      } catch (error) {
        console.error('Error analyzing palm:', error);
        toast({
          title: "Analysis Error",
          description: "Failed to analyze palm. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Palm Scanner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="scanner relative rounded-lg overflow-hidden">
          <Camera 
            ref={camera} 
            aspectRatio={3/4}
            facingMode="environment" // or "user" if palm on front cam
            errorMessages={{
              noCameraAccessible: 'No camera accessible.',
              permissionDenied: 'Camera access denied. Please allow camera permissions.',
            }}
          />
        </div>
        
        <Button 
          onClick={handleTakePhoto} 
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? 'Analyzing...' : 'Capture Palm'}
        </Button>
        
        {result && (
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Analysis Result:</p>
            <p className="text-lg font-semibold">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}