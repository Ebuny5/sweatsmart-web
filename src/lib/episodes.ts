// src/lib/episodes.ts
export function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function normalizeEpisodeDates<T extends Record<string, any>>(episodes: T[]) {
  return episodes.map(ep => ({ ...ep, datetime: toDate(ep.datetime ?? ep.date) }));
}
