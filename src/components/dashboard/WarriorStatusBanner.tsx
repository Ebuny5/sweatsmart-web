import { useMemo } from "react";
import { ProcessedEpisode } from "@/types";

interface WarriorStatusBannerProps {
  episodes: ProcessedEpisode[];
  firstName: string;
}

// ── Message pools ───────────────────────────────────────────────────────────

const DAILY_LOGGED = [
  "Episode logged. You've added a vital piece to your Personal Trigger Profile today—every entry brings more clarity to your condition.",
  "Great work logging today! Each entry strengthens your Personal Trigger Profile and sharpens the insights your dashboard can reveal.",
  "Today's episode is recorded. You're actively building your Personal Trigger Profile—one entry at a time, clarity follows.",
];

const DAILY_NUDGE = [
  "No entries recorded today. Taking a moment to log any triggers helps build a more accurate Personal Trigger Profile for your journey.",
  "Nothing logged yet today. Even a quick entry helps keep your Personal Trigger Profile current and your insights sharp.",
  "Today's a blank slate! Logging even mild triggers keeps your Personal Trigger Profile up to date for better analytics.",
];

const INACTIVITY = [
  (days: number) =>
    `It's been ${days} days since your last entry! Consistent logging, even for mild triggers, ensures your Personal Trigger Profile stays up to date.`,
  (days: number) =>
    `No logs recorded in the last ${days} days. Keeping your streak alive helps your Analytics Dashboard give you the most accurate insight into your condition.`,
  (days: number) =>
    `Checking in! You haven't logged an episode in ${days} days. Remember, every entry is a step toward turning sweat into strength and mastering your triggers.`,
];

const WEEKLY_NUDGE = [
  "No entries recorded this week. Consistent logging builds your Personal Trigger Profile and gives you better insight into your condition's unique patterns.",
  "No entries recorded this week. Consistent logging builds your Personal Trigger Profile and gives better insight into managing your daily comfort.",
  "No entries recorded this week. Consistent logging builds your Personal Trigger Profile and gives you better insight into your journey of turning sweat into strength.",
];

const WEEKLY_PROGRESS = [
  (count: number) =>
    `You've logged ${count} episodes this week! Each entry adds a new piece to your Personal Trigger Profile, helping you uncover hidden patterns.`,
  (count: number) =>
    `Great progress this week! Your ${count} logs are the foundation for turning sweat into strength—keep tracking to sharpen your insights.`,
  (count: number) =>
    `${count} episodes logged so far. You're building a clearer picture of your triggers, making it easier to manage your daily comfort.`,
];

const MONTHLY_FEW = [
  (count: number) =>
    `${count} episodes logged this month! These entries power your Analytics Dashboard, helping you map out your journey and understand your condition over time.`,
  (count: number) =>
    `Your ${count} monthly logs are in! Even a few entries help build the foundation for your Personal Trigger Profile, making it easier to spot patterns that matter.`,
  (count: number) =>
    `Every log counts toward turning sweat into strength. Your ${count} monthly entries provide vital data for a clearer view of your progress and daily comfort.`,
];

const MONTHLY_10_PLUS = [
  (count: number) =>
    `${count} episodes logged this month! You're building a strong foundation. Every additional entry helps your Analytics Dashboard pinpoint exactly what triggers your condition.`,
  (count: number) =>
    `Great progress! With ${count}+ logs, your Personal Trigger Profile is starting to take shape. Keep going to unlock even deeper insights into your daily comfort.`,
  (count: number) =>
    `${count} logs recorded! You are actively turning your sweat into strength. A few more entries this month will give your dashboard the data it needs to map your journey clearly.`,
];

const MONTHLY_20_PLUS = [
  "You've had an incredible month! Your consistent logging has built a robust Personal Trigger Profile, giving your Analytics Dashboard the power to reveal your most accurate patterns yet.",
  "A full month of turning sweat into strength! By staying dedicated to your logs, you've created a personalized map of your condition that puts the power of management back in your hands.",
  "Monthly Profile Complete! Your dedication this month means your Analytics Dashboard can now provide deeper, more personalized insights into your journey and daily comfort.",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfWeek(d: Date): Date {
  const c = new Date(d);
  const day = c.getDay();
  const diff = c.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  c.setDate(diff);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ── Component ───────────────────────────────────────────────────────────────

const WarriorStatusBanner = ({ episodes, firstName }: WarriorStatusBannerProps) => {
  const { message, variant } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

    const logsToday = episodes.filter(
      (e) => new Date(e.datetime) >= todayStart
    ).length;

    const logsThisWeek = episodes.filter(
      (e) => new Date(e.datetime) >= weekStart
    ).length;

    const logsThisMonth = episodes.filter(
      (e) => new Date(e.datetime) >= monthStart
    ).length;

    // Days since last log
    let daysSinceLastLog = Infinity;
    if (episodes.length > 0) {
      const latest = new Date(
        Math.max(...episodes.map((e) => new Date(e.datetime).getTime()))
      );
      daysSinceLastLog = Math.floor(
        (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Check if end of month (last 3 days)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const isEndOfMonth = now.getDate() >= daysInMonth - 2;

    // Priority 1: Daily acknowledgment
    if (logsToday > 0) {
      return { message: pick(DAILY_LOGGED), variant: "success" as const };
    }

    // Priority 2: Daily nudge (no logs today)
    // But first check higher-priority inactivity states

    // Priority 3: Inactivity (2-6 days)
    if (daysSinceLastLog >= 2 && daysSinceLastLog <= 6) {
      const fn = pick(INACTIVITY);
      return { message: fn(daysSinceLastLog), variant: "nudge" as const };
    }

    // Priority 4: Weekly nudge (Fri/Sat, 0 logs this week)
    if (logsThisWeek === 0 && (dayOfWeek === 5 || dayOfWeek === 6)) {
      return { message: pick(WEEKLY_NUDGE), variant: "nudge" as const };
    }

    // Priority 5: End-of-month achievements
    if (isEndOfMonth) {
      if (logsThisMonth >= 20) {
        return { message: pick(MONTHLY_20_PLUS), variant: "achievement" as const };
      }
      if (logsThisMonth >= 10) {
        const fn = pick(MONTHLY_10_PLUS);
        return { message: fn(logsThisMonth), variant: "achievement" as const };
      }
      if (logsThisMonth > 0) {
        const fn = pick(MONTHLY_FEW);
        return { message: fn(logsThisMonth), variant: "progress" as const };
      }
    }

    // Weekly progress (if they have some logs)
    if (logsThisWeek > 0) {
      const fn = pick(WEEKLY_PROGRESS);
      return { message: fn(logsThisWeek), variant: "progress" as const };
    }

    // Default: daily nudge
    return { message: pick(DAILY_NUDGE), variant: "nudge" as const };
  }, [episodes]);

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
        <p className="text-sm leading-relaxed text-foreground/80 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default WarriorStatusBanner;
