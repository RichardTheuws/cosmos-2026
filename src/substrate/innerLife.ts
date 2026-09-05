/**
 * innerLife — Wave 28, system 2 ("Cosmo's inner life").
 *
 * A small, honest model of what Cosmo wants. Pure: no THREE, no DOM, no
 * agent — the InteractionDirector feeds it time and events and asks it what
 * to do. Three quantities, all 0..1:
 *
 *   energy    — spent by wild play, restored by rest and by time. Low energy
 *               makes him reluctant (he still goes, slowly) and eventually
 *               puts him to sleep — at a resting place if the room has one.
 *   zin       — appetite for something new ("zin" is the Dutch word the
 *               design was written in; think curiosity-hunger). Rises while
 *               nothing happens, drops with every visit. High zin = he goes
 *               looking sooner; low zin = he lingers.
 *   affection — how he feels about you. Rises when you send him somewhere
 *               and he liked it, or pet him; settles back to neutral slowly.
 *
 * Per-interactable NOVELTY (0..1) recovers over time, so his own choices don't
 * repeat and a room with four things stays four things.
 *
 * Nothing here is shown as a number. You read him from what he does.
 */
export type InteractableNature = 'wild' | 'play' | 'calm' | 'rest';

export interface InnerState {
  energy: number;
  zin: number;
  affection: number;
  /** id → novelty 0..1 (1 = fresh). */
  novelty: Record<string, number>;
  /** True while he is asleep (director holds him in the rest clip). */
  asleep: boolean;
}

export interface Candidate {
  id: string;
  nature: InteractableNature;
}

/** Energy delta per visit, by nature. Rest is what a nap-cap is. */
export const ENERGY_DELTA: Record<InteractableNature, number> = {
  wild: -0.3,
  play: -0.2,
  calm: +0.1,
  rest: +0.5,
};

export const ZIN_PER_VISIT = -0.25;
export const ZIN_IDLE_PER_S = 0.012;
export const ENERGY_IDLE_PER_S = 0.008;
export const NOVELTY_RECOVER_PER_S = 1 / 90;
export const AFFECTION_SETTLE_PER_S = 0.004;
/** Below this he is reluctant (slow walk); below SLEEP_AT he sleeps. */
export const TIRED_AT = 0.28;
export const SLEEP_AT = 0.14;
/** Idle wait before a self-initiated visit: zin 0 → 26 s, zin 1 → 6 s. */
export const IDLE_WAIT_MAX_S = 26;
export const IDLE_WAIT_MIN_S = 6;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function createInnerState(): InnerState {
  return { energy: 0.85, zin: 0.6, affection: 0.5, novelty: {}, asleep: false };
}

/** Time passes with nothing happening (or while he is busy — `active`). */
export function tickInner(s: InnerState, dt: number, active: boolean): void {
  if (!active) {
    s.energy = clamp01(s.energy + ENERGY_IDLE_PER_S * dt * (s.asleep ? 4 : 1));
    s.zin = clamp01(s.zin + ZIN_IDLE_PER_S * dt);
  }
  for (const id of Object.keys(s.novelty)) {
    s.novelty[id] = clamp01(s.novelty[id] + NOVELTY_RECOVER_PER_S * dt);
  }
  s.affection += (0.5 - s.affection) * Math.min(1, AFFECTION_SETTLE_PER_S * dt);
}

/** He used something. `askedByYou` = a tap sent him (vs his own choice). */
export function onVisit(s: InnerState, id: string, nature: InteractableNature, askedByYou: boolean): void {
  s.energy = clamp01(s.energy + ENERGY_DELTA[nature]);
  s.zin = clamp01(s.zin + ZIN_PER_VISIT);
  s.novelty[id] = 0;
  if (askedByYou) s.affection = clamp01(s.affection + (nature === 'rest' && s.energy < 0.6 ? 0.25 : 0.12));
  if (nature === 'rest') s.asleep = false;
}

export function onPet(s: InnerState): void {
  s.affection = clamp01(s.affection + 0.3);
  s.energy = clamp01(s.energy + 0.05);
}

export function noveltyOf(s: InnerState, id: string): number {
  return s.novelty[id] ?? 1;
}

export function isTired(s: InnerState): boolean {
  return s.energy < TIRED_AT;
}

export function wantsSleep(s: InnerState): boolean {
  return s.energy < SLEEP_AT;
}

/** Walk pace multiplier (1 = normal). Tired = a trudge. */
export function paceFor(s: InnerState): number {
  return isTired(s) ? 0.55 : s.zin > 0.8 && s.energy > 0.6 ? 1.15 : 1;
}

/** Seconds of quiet before he goes looking on his own. */
export function idleWaitFor(s: InnerState): number {
  return IDLE_WAIT_MAX_S + (IDLE_WAIT_MIN_S - IDLE_WAIT_MAX_S) * s.zin;
}

/** How well a nature fits his energy right now (0..~2). */
export function fit(nature: InteractableNature, energy: number): number {
  switch (nature) {
    case 'wild': return energy * energy;
    case 'play': return energy;
    case 'calm': return 1 - 0.5 * energy;
    case 'rest': return (1 - energy) * (1 - energy) * 2;
  }
}

/**
 * His own choice. Sleepy → the resting place if there is one (null = sleep in
 * place). Otherwise weighted by fit × novelty, `rand` injectable for tests.
 */
export function choose(
  s: InnerState,
  candidates: readonly Candidate[],
  rand: () => number = Math.random,
): Candidate | null {
  if (candidates.length === 0) return null;
  if (wantsSleep(s)) {
    return candidates.find((c) => c.nature === 'rest') ?? null;
  }
  const weights = candidates.map((c) => Math.max(0.02, fit(c.nature, s.energy) * (0.15 + noveltyOf(s, c.id))));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
