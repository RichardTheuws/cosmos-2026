/**
 * clock — Wave 28, system 3 ("the clearing's clock"). Pure helpers.
 *
 * Real time washes over the room: the local hour gives a dawn / day / dusk /
 * night blend; a calendar day-key lets a room notice "you came back on a new
 * day"; time away restores Cosmo. Everything here is deterministic over its
 * inputs so it can be unit-tested and driven by a `?hour=` override in UAT.
 */
export interface DayPhase {
  /** 0..1 each; they sum to ≤ 1 (day = the remainder). */
  night: number;
  dusk: number;
  dawn: number;
}

/** Smooth 0→1 over [a, b]. */
const ramp = (h: number, a: number, b: number): number => Math.max(0, Math.min(1, (h - a) / (b - a)));

/** Hour may be fractional (7.5 = 07:30). Wraps at 24. */
export function phaseFor(hourIn: number): DayPhase {
  const h = ((hourIn % 24) + 24) % 24;
  // night: full 23–5, fades in 20→23, fades out 5→7
  let night = 0;
  if (h >= 23 || h < 5) night = 1;
  else if (h >= 20) night = ramp(h, 20, 23);
  else if (h < 7) night = 1 - ramp(h, 5, 7);
  // dusk (warm rose): rises 17→19, holds, hands over to night 19→22
  let dusk = 0;
  if (h >= 17 && h < 19) dusk = ramp(h, 17, 19);
  else if (h >= 19 && h < 22) dusk = 1 - ramp(h, 19, 22);
  // dawn (pale): 5→7 up, 7→9 down
  let dawn = 0;
  if (h >= 5 && h < 7) dawn = ramp(h, 5, 7);
  else if (h >= 7 && h < 9) dawn = 1 - ramp(h, 7, 9);
  // keep the sum ≤ 1 (dawn/night overlap at 5–7)
  const sum = night + dusk + dawn;
  if (sum > 1) { night /= sum; dusk /= sum; dawn /= sum; }
  return { night, dusk, dawn };
}

/** Local calendar day key, e.g. "2026-09-05". */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The `?hour=` override, read ONCE at load: the substrate's clean-URL sync
 *  rewrites the query string right after boot, so a live read would lose it. */
const HOUR_OVERRIDE: number | null = (() => {
  if (typeof window === 'undefined') return null;
  const o = new URLSearchParams(window.location.search).get('hour');
  return o !== null && o !== '' && Number.isFinite(Number(o)) ? Number(o) : null;
})();

/** Local hour (fractional) — or the `?hour=` override for UAT / authoring.
 *  `search` is for tests; at runtime the override is the one cached at load. */
export function currentHour(d: Date = new Date(), search?: string): number {
  if (search !== undefined) {
    const o = new URLSearchParams(search).get('hour');
    if (o !== null && o !== '' && Number.isFinite(Number(o))) return Number(o);
    return d.getHours() + d.getMinutes() / 60;
  }
  if (HOUR_OVERRIDE !== null) return HOUR_OVERRIDE;
  return d.getHours() + d.getMinutes() / 60;
}

/** Energy after being away: +0.15 per hour, capped at 1. Never lowers. */
export function restoredEnergy(saved: number, awayMs: number): number {
  const hours = Math.max(0, awayMs) / 3_600_000;
  return Math.min(1, saved + hours * 0.15);
}

/** Zin after being away: appetite comes back, +0.1 per hour. */
export function restoredZin(saved: number, awayMs: number): number {
  const hours = Math.max(0, awayMs) / 3_600_000;
  return Math.min(1, saved + hours * 0.1);
}

/**
 * The garden: one sprout per calendar day you came, capped. Returns the new
 * sprout count and whether something grew today.
 */
export function gardenOnArrival(
  sprouts: number,
  lastDay: string | null,
  today: string,
  cap = 7,
): { sprouts: number; grew: boolean } {
  if (lastDay === today) return { sprouts, grew: false };
  const next = Math.min(cap, sprouts + 1);
  return { sprouts: next, grew: next > sprouts };
}
