import { PalmScanner as PalmScannerComponent } from '@/components/palm/PalmScanner';

export default function PalmScanner() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Palm Scanner</h1>
        <p className="text-muted-foreground">
          Use your camera to analyze palm moisture levels
        </p>
      </div>
      
      <PalmScannerComponent />
      
      <div className="mt-8 text-sm text-muted-foreground text-center max-w-md mx-auto">
        <p>
          Position your palm in the camera frame and tap capture. 
          The AI will analyze moisture levels based on skin brightness and texture.
        </p>
      </div>
    </div>
  );
}