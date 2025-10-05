import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Minimal analysis result shape based on existing edge function
interface GoogleAIAnalysisResult {
  confidence?: number;
  severity?: "none" | "mild" | "moderate" | "severe";
  sweatGlandActivity?: string;
  moistureSource?: string;
  detectedTriggers?: string[];
  recommendations?: string[];
  notes?: string;
}

export function PalmScanner() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GoogleAIAnalysisResult | null>(null);

  const onPickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImageDataUrl(dataUrl);
        setResult(null);
      };
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Could not read image file.",
        });
      };
      reader.readAsDataURL(file);
    },
    [toast]
  );

  const analyze = useCallback(async () => {
    if (!imageDataUrl) {
      toast({ title: "No image", description: "Please upload an image first." });
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-hyperhidrosis",
        { body: { imageData: imageDataUrl } }
      );

      if (error) {
        throw error;
      }

      // Edge function typically returns { result: GoogleAIAnalysisResult }
      const parsed: GoogleAIAnalysisResult =
        (data?.result as GoogleAIAnalysisResult) || (data as any) || {};
      setResult(parsed);
      toast({ title: "Analysis complete", description: "Results ready." });
    } catch (err: any) {
      console.error("Analyze error", err);
      toast({
        title: "Analysis failed",
        description:
          err?.message || "We couldn't analyze this image. Please try another.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageDataUrl, toast]);

  const severityBadge = useMemo(() => {
    const sev = result?.severity;
    if (!sev) return null;
    const label = sev.charAt(0).toUpperCase() + sev.slice(1);
    const map: Record<string, string> = {
      none: "bg-secondary text-secondary-foreground",
      mild: "bg-accent text-accent-foreground",
      moderate: "bg-primary/20 text-primary",
      severe: "bg-destructive text-destructive-foreground",
    };
    const cls = map[sev] || "bg-muted text-muted-foreground";
    return (
      <span className={`inline-block rounded px-2 py-1 text-xs ${cls}`}>{
        label
      }</span>
    );
  }, [result?.severity]);

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
        {/* Image preview */}
        <div className="w-full">
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt="Uploaded palm for hyperhidrosis scan"
              className="mx-auto aspect-video w-full max-w-xl rounded-md object-contain"
              loading="lazy"
            />
          ) : (
            <div className="mx-auto flex aspect-video w-full max-w-xl items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No image selected
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
          <Button variant="secondary" onClick={onPickFile} disabled={isAnalyzing}>
            Upload Image
          </Button>
          <Button onClick={analyze} disabled={!imageDataUrl || isAnalyzing}>
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-4 w-full rounded-md bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-base font-semibold">AI Result</h3>
              {severityBadge}
            </div>
            <div className="grid gap-2 text-sm">
              {typeof result.confidence === "number" && (
                <p>
                  Confidence: <strong>{Math.round(result.confidence * 100)}%</strong>
                </p>
              )}
              {result.sweatGlandActivity && (
                <p>Sweat gland activity: {result.sweatGlandActivity}</p>
              )}
              {result.moistureSource && <p>Moisture source: {result.moistureSource}</p>}
              {Array.isArray(result.detectedTriggers) && result.detectedTriggers.length > 0 && (
                <p>Triggers: {result.detectedTriggers.join(", ")}</p>
              )}
              {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                <div>
                  <p className="font-medium">Recommendations</p>
                  <ul className="list-inside list-disc text-muted-foreground">
                    {result.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.notes && (
                <p className="text-muted-foreground">Notes: {result.notes}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PalmScanner;
