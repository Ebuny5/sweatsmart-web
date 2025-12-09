import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onImageCapture: (base64ImageDataUrl: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageCapture }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
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
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Could not access camera. Please check permissions or use file upload.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
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
        onImageCapture(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        if (base64Image) {
          onImageCapture(base64Image);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="border-2 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ImageIcon className="h-6 w-6 text-primary" />
          Palm Scanner with AI Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Capture or upload a clear image of your palm, sole, or affected area for AI-powered hyperhidrosis analysis
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Camera View or Placeholder */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-inner border-2 border-gray-700">
          {cameraActive && stream ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              {/* Camera overlay guide */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                  <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                    Position your palm within the frame
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 p-8 text-center">
              <Camera className="h-16 w-16 mb-4 text-white/50" />
              <p className="text-lg font-semibold mb-2">Camera Ready</p>
              <p className="text-sm text-white/50">
                {cameraError || "Click 'Start Camera' to begin live scanning"}
              </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Camera className="h-6 w-6" />
              Start Camera
            </button>
          ) : (
            <button
              onClick={handleCapture}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 animate-pulse"
            >
              <Camera className="h-6 w-6" />
              Capture Image
            </button>
          )}
          
          <button
            onClick={handleUploadClick}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Upload className="h-6 w-6" />
            Upload Image
          </button>
        </div>

        {/* Cancel Camera Button */}
        {cameraActive && (
          <button
            onClick={stopCamera}
            className="w-full px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg border-2 border-red-300 hover:bg-red-200 transition-colors"
          >
            Cancel Camera
          </button>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>📸 Tips for best results:</strong>
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
            <li>Ensure good lighting</li>
            <li>Keep palm flat and centered</li>
            <li>Avoid shadows or glare</li>
            <li>Ensure hands are naturally dry (no recent washing)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
