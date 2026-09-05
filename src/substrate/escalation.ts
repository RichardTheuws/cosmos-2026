/**
 * escalation — Wave 28, system 1 ("the world answers in layers").
 *
 * Pure tier logic for room responses. An interactable reports its use-count
 * (1-based, per session for now — system 3 persists it) and gets back which
 * tier fires THIS use. Thresholds are authored per interactable; `every`
 * makes tier 3 repeat (e.g. every 5th bounce-visit).
 */
export interface TierSpec {
  /** Use-count at which tier 2 fires (once). 0 = never. */
  tier2At: number;
  /** Use-count at which tier 3 first fires. 0 = never. */
  tier3At: number;
  /** After tier3At, fire tier 3 again every N uses (0 = only once). */
  every?: number;
}

export type Tier = 1 | 2 | 3;

export function tierFor(count: number, spec: TierSpec): Tier {
  if (count < 1) return 1;
  if (spec.tier3At > 0 && count >= spec.tier3At) {
    if (count === spec.tier3At) return 3;
    if (spec.every && spec.every > 0 && (count - spec.tier3At) % spec.every === 0) return 3;
  }
  if (spec.tier2At > 0 && count === spec.tier2At) return 2;
  return 1;
}

/** Linear envelope helper: 0→1 over `inS`, hold, then 1→0 over `outS`.
 *  Returns the envelope value for elapsed time `t` of total `total`. */
export function envelope(t: number, total: number, inS: number, outS: number): number {
  if (t <= 0 || t >= total) return 0;
  if (t < inS) return t / inS;
  if (t > total - outS) return (total - t) / outS;
  return 1;
}
