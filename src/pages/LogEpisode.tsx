                    import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import SeveritySelector from "@/components/episode/SeveritySelector";
import BodyAreaSelector from "@/components/episode/BodyAreaSelector";
import TriggerSelector from "@/components/episode/TriggerSelector";
import AIGeneratedInsights from "@/components/episode/AIGeneratedInsights";
import { SeverityLevel, BodyArea, Trigger } from "@/types";
import { CalendarIcon, Clock, Loader2, CheckCircle2, LayoutDashboard, History, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateFallbackInsights } from "@/services/EpisodeInsightGenerator";

// ── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-5 pt-5 pb-3 border-b border-gray-50">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <div>
          <h2 className="text-base font-bold text-gray-800 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
    <div className="px-5 py-5">{children}</div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const LogEpisode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const isNow = searchParams.get("now") === "true";

  // ── All original state — untouched ─────────────────────────────────────────
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>(format(new Date(), "HH:mm"));
  const [severity, setSeverity] = useState<SeverityLevel>(3);
  const [bodyAreas, setBodyAreas] = useState<BodyArea[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);

  useEffect(() => {
    if (isNow) {
      setDate(new Date());
      setTime(format(new Date(), "HH:mm"));
    }
  }, [isNow]);

  // ── All original logic — untouched ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to save episodes.", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!date) {
      toast({ title: "Date required", description: "Please select a date for the episode.", variant: "destructive" });
      return;
    }
    if (bodyAreas.length === 0) {
      toast({ title: "Body areas required", description: "Please select at least one affected body area.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const [hours, minutes] = time.split(":").map(Number);
    const datetime = new Date(date);
    datetime.setHours(hours, minutes);

    try {
      const triggerStrings = triggers.map((trigger) =>
        JSON.stringify({ type: trigger.type, value: trigger.value, label: trigger.label })
      );

      const { error } = await supabase.from("episodes").insert({
        user_id: user.id,
        severity: severity,
        body_areas: bodyAreas,
        triggers: triggerStrings,
        notes: notes || null,
        date: datetime.toISOString(),
      });

      if (error) throw error;

      toast({ title: "Episode logged successfully", description: "Generating personalized insights..." });

      setIsLoadingInsights(true);
      try {
        const triggerData = triggers.map((t) => ({ type: t.type, value: t.value, label: t.label }));
        const { data: insightsData, error: insightsError } = await supabase.functions.invoke(
          "generate-episode-insights",
          { body: { severity, bodyAreas, triggers: triggerData, notes } }
        );

        if (insightsError || !insightsData?.insights) {
          const fallbackInsights = generateFallbackInsights(severity, bodyAreas, triggerData, notes);
          setAiInsights(fallbackInsights);
          toast({ title: "Insights generated", description: "Your personalized insights are ready." });
        } else {
          setAiInsights(insightsData.insights);
        }
      } catch (insightError) {
        const triggerData = triggers.map((t) => ({ type: t.type, value: t.value, label: t.label }));
        const fallbackInsights = generateFallbackInsights(severity, bodyAreas, triggerData, notes);
        setAiInsights(fallbackInsights);
        toast({ title: "Insights generated", description: "Your personalized insights are ready." });
      } finally {
        setIsLoadingInsights(false);
        setShowInsights(true);
      }
    } catch (error) {
      toast({ title: "Failed to log episode", description: "An error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success / Insights screen ──────────────────────────────────────────────
  if (showInsights) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto pb-10">
          {/* Success hero */}
          <div className="bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 px-6 pt-10 pb-12 rounded-b-[2.5rem] shadow-lg shadow-green-100 text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-white text-2xl font-black tracking-tight">Episode Logged! 🎉</h1>
            <p className="text-green-100 text-sm mt-1">Your data helps build a better understanding of your triggers</p>
          </div>

          <div className="px-4 space-y-4">
            {isLoadingInsights ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">Generating your insights…</p>
                  <p className="text-sm text-gray-400 mt-1">Analysing triggers & patterns. This takes a moment.</p>
                </div>
              </div>
            ) : aiInsights ? (
              <AIGeneratedInsights insights={aiInsights} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <p className="text-gray-500 text-sm">Episode saved. Insights couldn't be generated — check your history for the logged episode.</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={() => navigate("/home")}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all shadow-md shadow-blue-100"
              >
                <LayoutDashboard className="h-4 w-4" />
                Back to Dashboard
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setDate(new Date());
                    setTime(format(new Date(), "HH:mm"));
                    setSeverity(3);
                    setBodyAreas([]);
                    setTriggers([]);
                    setNotes("");
                    setShowInsights(false);
                    setAiInsights(null);
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-all text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Log Another
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm"
                >
                  <History className="h-4 w-4" />
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Main log form ──────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto pb-10">

        {/* ── GRADIENT HERO HEADER ──────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 px-6 pt-8 pb-8 rounded-b-[2.5rem] shadow-lg shadow-blue-200 mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">
                SweatSmart
              </p>
              <h1 className="text-white text-2xl font-black tracking-tight leading-tight">
                Log Sweating<br />Episode 💧
              </h1>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{format(new Date(), "EEE, MMM d")}</p>
              <p className="text-blue-100 text-xs">{format(new Date(), "yyyy")}</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-3 leading-snug">
            Track your episode in detail — every log builds your personal trigger profile.
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-5">
            {["Date & Time", "Symptoms", "Triggers"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <span className="text-blue-100 text-[11px] font-medium hidden sm:block">{step}</span>
                </div>
                {i < 2 && <div className="w-4 h-px bg-white/30" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── FORM ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-4">

            {/* Date & Time */}
            <Section emoji="📅" title="Date & Time" subtitle="When did this episode occur?">
              <div className="space-y-4">
                {/* Date picker */}
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-700">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        id="date"
                        type="button"
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-all text-left min-h-[48px]",
                          !date && "text-gray-400"
                        )}
                      >
                        <CalendarIcon className="h-5 w-5 text-blue-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-800">
                          {date ? format(date, "EEEE, MMMM do, yyyy") : "Select date"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto rounded-2xl shadow-xl border border-gray-100">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(d) => d > new Date()}
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time picker */}
                <div className="space-y-1.5">
                  <Label htmlFor="time" className="text-sm font-semibold text-gray-700">Time</Label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 hover:border-blue-300 focus-within:border-blue-400 focus-within:bg-blue-50 transition-all min-h-[48px]">
                    <Clock className="h-5 w-5 text-blue-400 shrink-0" />
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="border-0 bg-transparent p-0 h-auto text-sm font-medium text-gray-800 focus-visible:ring-0 focus-visible:ring-offset-0 w-auto"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Symptom Details */}
            <Section emoji="🩺" title="Symptom Details" subtitle="How would you describe this episode?">
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">Episode Severity</p>
                  <SeveritySelector value={severity} onChange={setSeverity} />
                </div>

                <div className="border-t border-gray-50 pt-5">
                  <p className="text-sm font-bold text-gray-700 mb-3">Affected Body Areas</p>
                  <BodyAreaSelector selectedAreas={bodyAreas} onChange={setBodyAreas} />
                </div>

                <div className="border-t border-gray-50 pt-5 space-y-1.5">
                  <Label htmlFor="notes" className="text-sm font-bold text-gray-700">
                    Additional Notes
                    <span className="ml-1 text-xs font-normal text-gray-400">— Optional</span>
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any extra context about this episode… what were you doing, how did you feel afterwards?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl border-gray-200 min-h-[90px] text-sm resize-none focus:border-blue-400 focus:ring-blue-100"
                  />
                </div>
              </div>
            </Section>

            {/* Triggers */}
            <Section emoji="🔍" title="Potential Triggers" subtitle="What may have caused or contributed to this episode?">
              <TriggerSelector triggers={triggers} onTriggersChange={setTriggers} />
            </Section>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2 pb-6">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold transition-all shadow-md shadow-blue-100 text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    💾 Save Episode
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default LogEpisode;
