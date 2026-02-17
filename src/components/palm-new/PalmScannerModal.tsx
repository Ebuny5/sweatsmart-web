import React, { useRef, useEffect, useState } from 'react';
import { UploadIcon } from './constants';

interface PalmScannerProps {
  onCapture: (base64ImageData: string) => void;
  onClose: () => void;
}

const PalmScannerModal: React.FC<PalmScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported on this device/browser. Please use the upload option.");
        return;
      }

      // Try different camera configurations
      const cameraConfigs = [
        { video: { facingMode: 'environment' }, audio: false },
        { video: { facingMode: 'user' }, audio: false },
        { video: true, audio: false }, // Basic fallback
      ];

      for (const constraints of cameraConfigs) {
        try {
          console.log('Trying camera with constraints:', constraints);
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          if (isMounted) {
            setStream(mediaStream);
            setError(null);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              // Wait for video to be ready
              await new Promise<void>((resolve) => {
                if (videoRef.current) {
                  videoRef.current.onloadedmetadata = () => resolve();
                } else {
                  resolve();
                }
              });
            }
          }
          console.log('Camera started successfully');
          return; // Success, exit the loop
        } catch (err) {
          console.warn(`Failed with constraints:`, constraints, err);
          // Continue to next configuration
        }
      }

      // All configurations failed
      if (isMounted) {
        console.error("All camera configurations failed");
        setError("Could not access camera. Please check permissions or use the upload option.");
      }
    };

    startCamera();

    // Cleanup function to stop the stream when the component unmounts
    return () => {
      isMounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the image horizontally if it's the front camera to match the preview
        if (stream?.getVideoTracks()[0]?.getSettings().facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64Data = dataUrl.split(',')[1];
        onCapture(base64Data);
      }
    }
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const base64Data = dataUrl.split(',')[1];
          onCapture(base64Data);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the selected file.");
      }
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="palm-scanner-title">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
        <h3 id="palm-scanner-title" className="text-lg font-bold text-center text-slate-200 mb-4">Affected Area Scanner</h3>
        <div className="relative w-full aspect-square bg-slate-900 rounded-md overflow-hidden flex items-center justify-center">
            {error && !stream ? (
              <div className="text-center text-red-400 p-4">{error}</div>
            ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                aria-label="Live camera feed for palm scanning"
              />
              <div className="absolute inset-0 border-[40px] border-black/30 rounded-md pointer-events-none"></div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-4/5 h-4/5 border-2 border-dashed border-sky-400/50 rounded-xl" aria-hidden="true"></div>
              </div>
            </>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        <input type="file" ref={uploadInputRef} onChange={handleFileSelected} accept="image/*" className="hidden" aria-label="Upload palm image from device"/>
        <div className="grid grid-cols-3 gap-4 mt-4">
           <button
            onClick={onClose}
            className="col-span-1 py-3 px-4 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center justify-center"
            aria-label="Cancel palm scan"
          >
            Cancel
          </button>
           <button
            onClick={handleUploadClick}
            className="col-span-1 py-3 px-4 font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
            aria-label="Upload an image"
          >
            <UploadIcon className="w-5 h-5"/>
            Upload
          </button>
          <button
            onClick={handleCapture}
            disabled={!!error || !stream}
            className="col-span-1 py-3 px-4 font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Capture palm image"
          >
            Capture
          </button>
        </div>
        { error && !stream && <p className="text-center text-sm text-slate-400 mt-2">You can still upload an image from your device.</p>}
      </div>
    </div>
  );
};

export default PalmScannerModal;
