import { useMemo } from "react";
import { ProcessedEpisode } from "@/types";
import { getWarriorInsight } from "@/utils/warriorLogic";

interface WarriorStatusBannerProps {
  episodes: ProcessedEpisode[];
  firstName: string;
}

// ── Component ───────────────────────────────────────────────────────────────

const WarriorStatusBanner = ({ episodes, firstName }: WarriorStatusBannerProps) => {
  const { message, variant } = useMemo(() => getWarriorInsight(episodes), [episodes]);

  const variantStyles = {
    success: "border-emerald-300/30 from-emerald-500/10 to-teal-500/5",
    nudge: "border-violet-300/30 from-violet-500/10 to-fuchsia-500/5 animate-pulse-slow",
    achievement: "border-amber-300/30 from-amber-500/10 to-yellow-500/5",
    progress: "border-purple-300/30 from-purple-500/10 to-fuchsia-500/5",
  };

  const iconMap = {
    success: "✅",
    nudge: "💡",
    achievement: "🏆",
    progress: "📈",
  };

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${variantStyles[variant]}
        backdrop-blur-md border rounded-2xl
        px-4 py-3.5 mx-4 -mt-4 mb-3
        shadow-sm
      `}
    >
      {/* Decorative glow */}
      {variant === "nudge" && (
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-violet-400/20 rounded-full blur-xl" />
      )}
      {variant === "achievement" && (
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-400/20 rounded-full blur-xl" />
      )}

      <div className="flex items-start gap-3 relative z-10">
        <span className="text-xl mt-0.5 shrink-0">{iconMap[variant]}</span>
        <p className="text-sm leading-relaxed text-[#22c55e] font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default WarriorStatusBanner;
