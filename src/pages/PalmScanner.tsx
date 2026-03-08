import AppLayout from '@/components/layout/AppLayout';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { edaManager } from '@/utils/edaManager';
import { Camera, Upload, Heart, Zap } from 'lucide-react';
import PalmScannerModal from '@/components/palm-new/PalmScannerModal';

type SimulationMode = 'Resting' | 'Active' | 'Trigger';
type FusedStatus = 'Stable' | 'Early Alert' | 'Episode Likely';
type PalmScanResult = 'Moisture detected.' | 'No significant moisture.' | 'Not Scanned';

interface SensorReading {
  user_id: string;
  timestamp: string;
  sim_mode: SimulationMode;
  EDA_uS: number;
  HR_bpm: number;
  EDA_baseline_uS: number;
  HR_baseline_bpm: number;
  notes: string;
}

interface FusedAnalysis {
  status: FusedStatus;
  explanation: string;
}

const MODE_INFO: Record<SimulationMode, { label: string; edaRange: string; hrRange: string; glowColor: 'teal' | 'blue' | 'red' }> = {
  Resting: { label: 'Resting (Hyperhidrosis)', edaRange: '2.0–5.0 μS', hrRange: '60–72 bpm', glowColor: 'teal' },
  Active: { label: 'Active', edaRange: '5.0–9.0 μS', hrRange: '72–85 bpm', glowColor: 'blue' },
  Trigger: { label: 'Trigger', edaRange: '10.0–15.0 μS', hrRange: '85–105 bpm', glowColor: 'red' },
};

const STATUS_COLORS: Record<FusedStatus, { bg: string; text: string; ring: string }> = {
  'Stable': { bg: 'bg-calm-teal', text: 'text-calm-teal', ring: 'ring-calm-teal/30' },
  'Early Alert': { bg: 'bg-warning-amber', text: 'text-warning-amber', ring: 'ring-warning-amber/30' },
  'Episode Likely': { bg: 'bg-destructive', text: 'text-destructive', ring: 'ring-destructive/30' },
};

export default function PalmScanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const initialMode = (searchParams.get('mode') as SimulationMode) || 'Resting';
  const { toast } = useToast();

  // Sensor state
  const [sensorData, setSensorData] = useState<SensorReading | null>(null);
  const [loadingMode, setLoadingMode] = useState<SimulationMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [palmScanResult, setPalmScanResult] = useState<PalmScanResult>('Not Scanned');
  const [fusedAnalysis, setFusedAnalysis] = useState<FusedAnalysis | null>(null);

  // Fetch sensor data from edge function
  const fetchSensorData = useCallback(async (mode: SimulationMode) => {
    setLoadingMode(mode);
    setError(null);
    setFusedAnalysis(null);
    setPalmScanResult('Not Scanned');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-sensor-reading', {
        body: { mode }
      });
      if (fnError) throw fnError;
      setSensorData(data);
      edaManager.saveEDA(data.EDA_uS, 'palm-scanner');
      sonnerToast.success(`${mode} simulation generated`);

      if (returnTo) {
        setTimeout(() => {
          sonnerToast.info('Returning to Climate Alert...');
          navigate(returnTo);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate sensor data');
      setSensorData(null);
      sonnerToast.error('Simulation failed');
    } finally {
      setLoadingMode(null);
    }
  }, [navigate, returnTo]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchSensorData(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle camera capture for affected area scan
  const handleCapture = useCallback(async (base64ImageData: string) => {
    setIsScanning(false);
    if (!sensorData) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const { data: palmData, error: palmError } = await supabase.functions.invoke('analyze-palm-image', {
        body: { base64ImageData }
      });
      if (palmError) throw palmError;
      setPalmScanResult(palmData.result);

      const { data: fusedData, error: fusedError } = await supabase.functions.invoke('get-fused-status', {
        body: { eda: sensorData.EDA_uS, palmResult: palmData.result }
      });
      if (fusedError) throw fusedError;
      setFusedAnalysis(fusedData);

      setSensorData(prev => prev ? {
        ...prev,
        notes: `Scan result: ${palmData.result} | Status: ${fusedData.status} — ${fusedData.explanation}`
      } : prev);

      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      sonnerToast.success('Analysis complete');
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      setPalmScanResult('Not Scanned');
      setFusedAnalysis(null);
      sonnerToast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [sensorData]);

  const currentMode: SimulationMode = sensorData?.sim_mode || initialMode;
  const modeInfo = MODE_INFO[currentMode];
  const statusColors = fusedAnalysis?.status ? STATUS_COLORS[fusedAnalysis.status] : null;

  const getOverallGlow = (): 'teal' | 'amber' | 'blue' | 'red' => {
    if (fusedAnalysis?.status === 'Episode Likely') return 'red';
    if (fusedAnalysis?.status === 'Early Alert') return 'amber';
    if (sensorData) return modeInfo.glowColor;
    return 'blue';
  };

  return (
    <AppLayout>
      {isScanning && <PalmScannerModal onCapture={handleCapture} onClose={() => setIsScanning(false)} />}

      <div className="min-h-full bg-french-porcelain p-4 sm:p-6 pb-48 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-umbra">Scanner</h1>
          <p className="text-umbra/60 text-sm">Wearable sensor simulation & affected area analysis</p>
        </div>

        {/* Simulation Parameters */}
        <LiquidGlassCard className="p-4" glowColor="blue">
          <h2 className="text-sm font-bold text-umbra/70 mb-3 uppercase tracking-wide">Simulation Parameters</h2>
          <div className="space-y-2">
            {(Object.keys(MODE_INFO) as SimulationMode[]).map((mode) => {
              const info = MODE_INFO[mode];
              return (
                <div key={mode} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      mode === 'Resting' ? 'bg-calm-teal' : mode === 'Active' ? 'bg-clinical-blue' : 'bg-destructive'
                    }`} />
                    <span className={`text-sm font-semibold ${
                      mode === 'Resting' ? 'text-calm-teal' : mode === 'Active' ? 'text-clinical-blue' : 'text-destructive'
                    }`}>{mode}</span>
                  </div>
                  <div className="text-xs text-umbra/50 text-right">
                    <div>EDA: {info.edaRange}</div>
                    <div>HR: {info.hrRange}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </LiquidGlassCard>

        {/* Fused Status Display */}
        <LiquidGlassCard
          className="p-5"
          glowColor={getOverallGlow()}
          pulse={fusedAnalysis?.status === 'Episode Likely' || isAnalyzing}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Status Circle */}
            <div className="flex-shrink-0">
              {fusedAnalysis?.status ? (
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${statusColors?.bg} ring-4 ${statusColors?.ring}`}>
                  <span className="text-white font-bold text-xs text-center leading-tight px-1">
                    {fusedAnalysis.status}
                  </span>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-surgical-steel/30 ring-4 ring-surgical-steel/20">
                  <span className="text-umbra/40 text-xs">Awaiting</span>
                </div>
              )}
            </div>

            {/* Status Text */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-umbra mb-1">
                {fusedAnalysis ? `Status: ${fusedAnalysis.status}` : 'Combined Analysis'}
              </h2>
              <p className="text-umbra/70 text-sm mb-3">
                {fusedAnalysis?.explanation || 'Generate sensor data, then scan your affected area for a comprehensive analysis.'}
              </p>
              <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                {sensorData && (
                  <span className="px-3 py-1 bg-white/10 border border-white/10 text-umbra/80 rounded-full text-xs font-medium">
                    EDA: {sensorData.EDA_uS.toFixed(2)} μS
                  </span>
                )}
                {palmScanResult !== 'Not Scanned' && (
                  <span className="px-3 py-1 bg-white/10 border border-white/10 text-umbra/80 rounded-full text-xs font-medium">
                    Scan: {palmScanResult}
                  </span>
                )}
              </div>
            </div>

            {/* Scan Area Button */}
            <button
              onClick={() => setIsScanning(true)}
              disabled={isAnalyzing || !sensorData}
              className="flex-shrink-0 h-14 px-6 rounded-xl bg-clinical-blue text-white font-bold hover:bg-clinical-blue/90 disabled:bg-surgical-steel disabled:text-umbra/40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2 min-h-[56px] min-w-[56px]"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Scan Area
                </>
              )}
            </button>
          </div>
        </LiquidGlassCard>

        {/* Sensor Data Cards */}
        {loadingMode && !sensorData ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-clinical-blue mx-auto" />
            <p className="mt-3 text-umbra/50 text-sm">Initializing {loadingMode} simulation...</p>
          </div>
        ) : sensorData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Heart Rate */}
            <LiquidGlassCard className="p-6 text-center" glowColor={modeInfo.glowColor}>
              <Heart className={`w-8 h-8 mx-auto mb-2 ${
                currentMode === 'Resting' ? 'text-calm-teal' : currentMode === 'Active' ? 'text-clinical-blue' : 'text-destructive'
              }`} />
              <p className="text-umbra/50 text-xs mb-1">Heart Rate</p>
              <p className="text-3xl font-bold text-umbra">
                {sensorData.HR_bpm.toFixed(0)}
                <span className="text-base text-umbra/50 ml-1">bpm</span>
              </p>
            </LiquidGlassCard>

            {/* EDA */}
            <LiquidGlassCard className="p-6 text-center" glowColor={modeInfo.glowColor}>
              <Zap className={`w-8 h-8 mx-auto mb-2 ${
                currentMode === 'Resting' ? 'text-calm-teal' : currentMode === 'Active' ? 'text-clinical-blue' : 'text-destructive'
              }`} />
              <p className="text-umbra/50 text-xs mb-1">Electrodermal Activity</p>
              <p className="text-3xl font-bold text-umbra">
                {sensorData.EDA_uS.toFixed(2)}
                <span className="text-base text-umbra/50 ml-1">μS</span>
              </p>
            </LiquidGlassCard>
          </div>
        ) : null}

        {error && (
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-r-xl">
            <p className="text-sm text-umbra/80">{error}</p>
          </div>
        )}

        {/* AI Interpretation (after fused analysis) */}
        {fusedAnalysis && !isAnalyzing && (
          <LiquidGlassCard className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-clinical-blue/20 flex items-center justify-center flex-shrink-0">
                <span className="text-clinical-blue font-bold text-sm">AI</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-umbra/50 mb-1">Hyper Clinical Interpretation</div>
                <p className="text-umbra/90 text-sm leading-relaxed mb-2">
                  {fusedAnalysis.explanation}
                </p>
                {sensorData && (
                  <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                    <p className="text-umbra/70 text-xs">
                      <strong>Baseline:</strong> EDA {sensorData.EDA_baseline_uS.toFixed(2)} μS · HR {sensorData.HR_baseline_bpm} bpm
                    </p>
                    <p className="text-umbra/70 text-xs mt-1">
                      <strong>Current:</strong> EDA {sensorData.EDA_uS.toFixed(2)} μS · HR {sensorData.HR_bpm.toFixed(0)} bpm
                    </p>
                  </div>
                )}
              </div>
            </div>
          </LiquidGlassCard>
        )}

        {/* Understanding Your Reading */}
        <LiquidGlassCard className="p-5">
          <h3 className="text-base font-bold text-umbra mb-3">Understanding Your Reading</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-calm-teal font-bold mt-0.5">✓</span>
              <div>
                <strong className="text-umbra">Baseline (&lt;5 μS):</strong>
                <p className="text-umbra/60">Normal resting state — sympathetic nervous system is calm</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-warning-amber font-bold mt-0.5">⚡</span>
              <div>
                <strong className="text-umbra">Elevated (5–9 μS):</strong>
                <p className="text-umbra/60">Mild activation — often stress or environmental response</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-destructive font-bold mt-0.5">●</span>
              <div>
                <strong className="text-umbra">Trigger (&gt;10 μS):</strong>
                <p className="text-umbra/60">Active episode — significant sympathetic activation</p>
              </div>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Disclaimer */}
        <div className="p-4 bg-warning-amber/10 border-l-4 border-warning-amber rounded-r-xl">
          <p className="text-xs text-umbra/70">
            ⚠️ This analysis works for palms, hands, feet, and soles. Results are for informational purposes only.
            Consult a healthcare professional for proper diagnosis and treatment of hyperhidrosis.
          </p>
        </div>

        {/* Fixed Bottom Action Buttons */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-french-porcelain via-french-porcelain/95 to-transparent z-20">
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(MODE_INFO) as SimulationMode[]).map((mode) => {
              const isLoading = loadingMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => fetchSensorData(mode)}
                  disabled={!!loadingMode || isAnalyzing}
                  className={`h-14 rounded-xl font-bold text-white transition-all duration-200 active:scale-95 min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    mode === 'Resting' ? 'bg-calm-teal hover:bg-calm-teal/90' :
                    mode === 'Active' ? 'bg-clinical-blue hover:bg-clinical-blue/90' :
                    'bg-destructive hover:bg-destructive/90'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Simulating...
                    </>
                  ) : (
                    `Simulate ${mode}`
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
