/**
 * pickOnScreen — Wave 27. Pure helper for the InteractionDirector.
 *
 * Interactables don't own pickable meshes (some own no mesh at all — the
 * portal-greeting reads another inhabitant's plane), so tap-picking works in
 * screen space: every anchor is projected to NDC and the nearest one inside
 * `radiusNdc` wins. Pure over plain numbers so it's unit-testable without a
 * renderer; the director supplies the projection.
 */
export interface ScreenPoint {
  id: string;
  /** NDC x/y of the projected anchor (−1..1). */
  x: number;
  y: number;
  /** Projected depth (NDC z). Points behind the camera (z > 1) never pick. */
  z: number;
}

export interface PickResult {
  id: string;
  /** NDC distance to the tap. */
  dist: number;
}

/** Default tap radius: ~12% of the shorter viewport axis. Fingers are wide. */
export const DEFAULT_PICK_RADIUS_NDC = 0.24;

export function pickOnScreen(
  points: readonly ScreenPoint[],
  tapX: number,
  tapY: number,
  radiusNdc: number = DEFAULT_PICK_RADIUS_NDC,
  aspect: number = 1,
): PickResult | null {
  let best: PickResult | null = null;
  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    if (p.z > 1 || p.z < -1) continue; // outside the clip volume
    // Compare in a square-ish space: scale x by aspect so a circle on screen
    // is a circle in NDC regardless of viewport shape.
    const dx = (p.x - tapX) * aspect;
    const dy = p.y - tapY;
    const dist = Math.hypot(dx, dy);
    if (dist > radiusNdc) continue;
    if (!best || dist < best.dist) best = { id: p.id, dist };
  }
  return best;
}

/**
 * Curiosity choice: a random interactable, avoiding the last one used when
 * there is more than one, so Cosmo's wandering never repeats back-to-back.
 * `rand` injectable for tests.
 */
export function chooseCuriosityTarget(
  ids: readonly string[],
  lastId: string | null,
  rand: () => number = Math.random,
): string | null {
  if (ids.length === 0) return null;
  const pool = ids.length > 1 ? ids.filter((id) => id !== lastId) : ids;
  return pool[Math.floor(rand() * pool.length) % pool.length] ?? null;
}
