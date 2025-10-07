import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from './types';
import FileUpload from './FileUpload';
import LoadingState from './LoadingState';
import AnalysisResults from './AnalysisResults';
import SensorDashboard, { SimulationScenario } from './SensorDashboard';

type SensorStatus = 'disconnected' | 'connecting' | 'connected';

export function PalmScanner() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Sensor state
  const [hrStatus, setHrStatus] = useState<SensorStatus>('disconnected');
  const [gsrStatus, setGsrStatus] = useState<SensorStatus>('disconnected');
  const [hrData, setHrData] = useState<number | null>(null);
  const [gsrData, setGsrData] = useState<number | null>(null);

  // Simulation control
  const [simulationScenario, setSimulationScenario] = useState<SimulationScenario>('Resting');

  // Generates a random number in a given range
  const getRandomValue = (min: number, max: number, decimalPlaces: number = 0) => {
    const rand = Math.random() * (max - min) + min;
    return parseFloat(rand.toFixed(decimalPlaces));
  };

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
        let hrValue: number;
        let gsrValue: number;

        switch (simulationScenario) {
          case 'Exercise':
            hrValue = getRandomValue(110, 140);
            gsrValue = getRandomValue(1.5, 3.5, 2);
            break;
          case 'Normal':
            hrValue = getRandomValue(75, 100);
            gsrValue = getRandomValue(3.5, 6.0, 2);
            break;
          case 'Resting':
          default:
            hrValue = getRandomValue(60, 85);
            gsrValue = getRandomValue(6.0, 10.0, 2);
            break;
        }

        setHrData(hrValue);
        setGsrData(gsrValue);
        setHrStatus('connected');
        setGsrStatus('connected');
      }, 1500);
    }
  };

  const handleImageCapture = async (base64ImageDataUrl: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setImagePreview(base64ImageDataUrl);

    try {
      const { data, error: apiError } = await supabase.functions.invoke(
        "analyze-hyperhidrosis",
        { 
          body: { 
            imageData: base64ImageDataUrl,
            hrData,
            gsrData
          } 
        }
      );

      if (apiError) {
        throw apiError;
      }

      const parsed: AnalysisResult = (data?.result as AnalysisResult) || (data as any);
      setAnalysisResult(parsed);
      
      toast({ 
        title: "Analysis complete", 
        description: "Palm scan analyzed successfully." 
      });
    } catch (err: any) {
      const errorMsg = 'Failed to analyze image. Please try again with a clear image of a palm, foot, or sole.';
      setError(errorMsg);
      console.error(err);
      toast({
        title: "Analysis failed",
        description: err?.message || errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setImagePreview(null);
    setError(null);
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      {!analysisResult && !isLoading && !error && (
        <>
          <SensorDashboard
            hrStatus={hrStatus}
            gsrStatus={gsrStatus}
            hrData={hrData}
            gsrData={gsrData}
            onConnect={handleConnect}
            simulationScenario={simulationScenario}
            setSimulationScenario={setSimulationScenario}
          />
          <FileUpload onImageCapture={handleImageCapture} />
        </>
      )}

      {isLoading && <LoadingState />}

      {error && !isLoading && (
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {analysisResult && !isLoading && (
        <AnalysisResults 
          result={analysisResult} 
          onReset={handleReset} 
          imagePreview={imagePreview} 
        />
      )}
    </section>
  );
}

export default PalmScanner;
