import AppLayout from '@/components/layout/AppLayout';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload } from 'lucide-react';

interface AnalysisResult {
  confidence: number;
  severity: { level: number; assessment: string };
  sweatGlandActivity: { level: number; assessment: string };
  moistureSource: string;
  detectedTriggers: string[];
  treatmentRecommendations: { primary: string; alternative: string[] };
  analysisNotes: string;
}

export default function PalmScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

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
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Simulate scan progress during analysis
  useEffect(() => {
    if (!isAnalyzing) { setScanProgress(0); return; }
    const interval = setInterval(() => {
      setScanProgress(prev => prev >= 95 ? 95 : prev + Math.random() * 5);
    }, 200);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      setCameraError("Could not access the camera. Please check permissions and try again.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { stream?.getTracks().forEach(track => track.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeImage = async (base64: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setImagePreview(base64);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-hyperhidrosis', {
        body: { imageData: base64 }
      });
      if (error) throw new Error((error as any)?.message ?? 'Analysis failed');
      setScanProgress(100);
      setResult(data as AnalysisResult);
      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      toast({ title: "Analysis Complete", description: `${Math.round(data.confidence)}% confidence` });
    } catch (err: any) {
      toast({ title: "Scan Error", description: err.message, variant: "destructive" });
      setImagePreview(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        analyzeImage(dataUrl);
        stream?.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        if (b64) {
          analyzeImage(b64);
          stream?.getTracks().forEach(t => t.stop());
          setStream(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setResult(null);
    setImagePreview(null);
    setScanProgress(0);
    startCamera();
  };

  // Phase info based on analysis result
  const getPhaseInfo = () => {
    if (!result) return { color: 'blue' as const, emoji: '🖐️', title: 'Ready to Scan', message: 'Place your palm on the screen and tap "Start Scan" to measure your sudomotor function.', recommendation: 'Ensure your hand is clean and dry before starting.' };
    
    const severity = result.severity.level;
    if (severity <= 3) return {
      color: 'teal' as const, emoji: '✓', title: 'Baseline State',
      message: `Analysis confidence: ${result.confidence}%. ${result.analysisNotes}`,
      recommendation: result.treatmentRecommendations.primary,
    };
    if (severity <= 6) return {
      color: 'amber' as const, emoji: '⚡', title: 'Elevated Activity',
      message: `Analysis confidence: ${result.confidence}%. ${result.analysisNotes}`,
      recommendation: result.treatmentRecommendations.primary,
    };
    return {
      color: 'red' as const, emoji: '🔴', title: 'Active Episode',
      message: `Analysis confidence: ${result.confidence}%. ${result.analysisNotes}`,
      recommendation: result.treatmentRecommendations.primary,
    };
  };

  const phaseInfo = getPhaseInfo();

  return (
    <AppLayout>
      <div className="min-h-full bg-french-porcelain p-6 pb-32 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-umbra mb-2">Sudomotor Analysis</h1>
          <p className="text-umbra/60">AI-powered palm conductance monitoring</p>
        </div>

        {/* Scanner Card */}
        <LiquidGlassCard
          glowColor={phaseInfo.color}
          pulse={isAnalyzing || (result !== null && result.severity.level > 6)}
          className="p-8"
        >
          {/* Hand Visualization / Camera / Results Image */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            {!result && !isAnalyzing && !cameraError && (
              <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-clinical-blue/30">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {!stream && (
                  <div className="absolute inset-0 bg-umbra/50 flex items-center justify-center">
                    <p className="text-white animate-pulse text-sm">Starting camera...</p>
                  </div>
                )}
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center animate-neural-pulse">
                <div className={`absolute w-full h-full rounded-full bg-clinical-blue/30 blur-2xl`} />
                <div className="relative text-8xl filter drop-shadow-2xl">🖐️</div>
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-clinical-blue to-transparent animate-scan-line" />
                </div>
              </div>
            )}

            {result && imagePreview && (
              <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-calm-teal/50">
                <img src={imagePreview} alt="Analyzed palm" className="w-full h-full object-cover" />
              </div>
            )}

            {cameraError && !isAnalyzing && !result && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-8xl">📷</div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-umbra/60 mb-2">
                <span>{loadingMessages[messageIndex]}</span>
                <span>{Math.round(scanProgress)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-clinical-blue transition-all duration-200 rounded-full" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="text-center mb-4">
            <span className="text-4xl mb-2 inline-block">{phaseInfo.emoji}</span>
            <h3 className="text-xl font-bold text-umbra">{phaseInfo.title}</h3>
          </div>
        </LiquidGlassCard>

        {/* AI Analysis Card */}
        {result && !isAnalyzing && (
          <LiquidGlassCard className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-clinical-blue/20 flex items-center justify-center flex-shrink-0">
                <span className="text-clinical-blue font-bold text-lg">AI</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-umbra/50 mb-1">Hyper Clinical Interpretation</div>
                <h4 className="text-sm font-bold text-umbra mb-2">Severity: {result.severity.assessment} ({result.severity.level}/10)</h4>
                <p className="text-umbra/90 text-sm leading-relaxed mb-3">{phaseInfo.message}</p>

                {result.moistureSource && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-umbra/50">Moisture Source:</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      result.moistureSource === 'Hyperhidrosis' ? 'bg-warning-amber/20 text-warning-amber' : 'bg-calm-teal/20 text-calm-teal'
                    }`}>{result.moistureSource}</span>
                  </div>
                )}

                {result.detectedTriggers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-umbra/50 mb-1">Detected Triggers:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.detectedTriggers.map((t, i) => (
                        <span key={i} className="text-xs bg-white/10 border border-white/10 text-umbra/80 px-2 py-1 rounded-lg">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                  <p className="text-umbra/80 text-xs">
                    <strong>Recommendation:</strong> {phaseInfo.recommendation}
                  </p>
                  {result.treatmentRecommendations.alternative.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.treatmentRecommendations.alternative.map((alt, i) => (
                        <span key={i} className="text-xs bg-clinical-blue/10 text-clinical-blue px-2 py-0.5 rounded">{alt}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </LiquidGlassCard>
        )}

        {/* Medical Context Card */}
        <LiquidGlassCard className="p-6">
          <h3 className="text-lg font-bold text-umbra mb-3">Understanding Your Reading</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-calm-teal font-bold">✓</span>
              <div>
                <strong className="text-umbra">Mild (1-3):</strong>
                <p className="text-umbra/70">Normal resting state — sympathetic nervous system is calm</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-warning-amber font-bold">⚡</span>
              <div>
                <strong className="text-umbra">Moderate (4-6):</strong>
                <p className="text-umbra/70">Elevated activity — often stress or environmental response</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-destructive font-bold">●</span>
              <div>
                <strong className="text-umbra">Severe (7-10):</strong>
                <p className="text-umbra/70">Active episode — significant sympathetic activation</p>
              </div>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Disclaimer */}
        <div className="p-4 bg-warning-amber/10 border-l-4 border-warning-amber rounded-r-xl">
          <p className="text-sm text-umbra/80">
            ⚠️ This analysis works for palms, hands, feet, and soles. Results are for informational purposes only. 
            Consult with a healthcare professional for proper diagnosis and treatment of hyperhidrosis.
          </p>
        </div>

        {/* Action Buttons - Thumb Zone */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-french-porcelain via-french-porcelain to-transparent z-20">
          <div className="max-w-2xl mx-auto space-y-3">
            {!result && !isAnalyzing && (
              <div className="flex gap-3">
                <button
                  onClick={handleCapture}
                  disabled={!stream}
                  className="flex-1 h-14 rounded-xl font-bold text-white bg-clinical-blue hover:bg-clinical-blue/90 active:scale-95 transition-all duration-200 min-h-[56px] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Scan with Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-14 rounded-xl font-bold text-umbra bg-white/20 backdrop-blur-sm hover:bg-white/30 active:scale-95 transition-all duration-200 min-h-[56px] inline-flex items-center justify-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  Upload Image
                </button>
              </div>
            )}

            {isAnalyzing && (
              <button disabled className="w-full h-14 rounded-xl font-bold text-white bg-umbra/40 cursor-not-allowed min-h-[56px]">
                Scanning...
              </button>
            )}

            {result && !isAnalyzing && (
              <>
                <button
                  onClick={handleReset}
                  className="w-full h-14 rounded-xl font-bold text-white bg-clinical-blue hover:bg-clinical-blue/90 active:scale-95 transition-all duration-200 min-h-[56px]"
                >
                  Analyze Another Image
                </button>
                <button className="w-full h-14 rounded-xl font-bold text-umbra bg-white/20 backdrop-blur-sm hover:bg-white/30 active:scale-95 transition-all duration-200 min-h-[56px]">
                  Save to Episode Log
                </button>
              </>
            )}

            {cameraError && !result && !isAnalyzing && (
              <div className="flex gap-3">
                <button onClick={startCamera} className="flex-1 h-14 rounded-xl font-bold text-white bg-clinical-blue hover:bg-clinical-blue/90 active:scale-95 transition-all duration-200 min-h-[56px]">
                  Retry Camera
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 h-14 rounded-xl font-bold text-umbra bg-white/20 backdrop-blur-sm hover:bg-white/30 active:scale-95 transition-all duration-200 min-h-[56px] inline-flex items-center justify-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
