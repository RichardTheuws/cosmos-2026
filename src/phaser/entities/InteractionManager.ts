/**
 * InteractionManager — Sprint 17D refactor.
 *
 * Player → Cosmo dialogue is now mediated by THREE.Raycaster against fixed
 * `TrampolineSpots` (the only player-driven interaction in 17D besides pet).
 * The runner-mechanic is gone, so the file no longer:
 *   - Spawns transient trampoline / mushroom platforms (now static spots).
 *   - Decides jump-vs-duck on tap-near-obstacle (no obstacles to dodge).
 *   - Tracks per-frame collision against the obstacle pool (no pool).
 *
 * What it DOES (17D):
 *   - tap → raycast through tap-NDC against TrampolineSpots; closest hit →
 *     CosmoAgent.walkTo(spot, 'bounce'). Miss → no-op (no penalty).
 *   - holdStart → raycast at hold position against Cosmo's worldPosition (a
 *     bounding-sphere check is enough, no need for full-mesh raycast). If the
 *     hold lands on Cosmo we arm a 500ms petAffect timer; if the player
 *     releases before 500ms the timer fires nothing. If the hold extends
 *     beyond 500ms, CosmoAgent.petAffect() runs and the long-hold-3s wave
 *     is suppressed for THIS hold-cycle.
 *   - longHold (3s, gesture-bus) → CosmoAgent.triggerWave (unchanged from
 *     15B), only when the hold-on-Cosmo path didn't fire petAffect first.
 *   - Bounce-counter: 5 bounces inside BOUNCE_COUNTER_WINDOW_S (30s) elevates
 *     the VibeMeter to 1.0, triggering DeepTripMode. Pet-cumulative time of
 *     ≥ 2s does the same.
 *
 * Vibe-meter changes
 *   The combo-counter is gone. Vibe is now driven exclusively by trampoline-
 *   bounces (gain) and pet-affect (gain). Idle decay still runs in VibeMeter.
 *
 * Compat
 *   The constructor still accepts ObstacleManager (now a 17D compat-shim) so
 *   CosmoScene wiring stays untouched. The reference is unused at runtime.
 */
import * as THREE from 'three';
import type { GestureEvent, InputController } from '../../core/inputController';
import type { CosmoAgent } from './CosmoAgent';
import type { ObstacleManager } from './ObstacleManager';
import type { VibeMeter } from './VibeMeter';
import type { TrampolineSpots } from './TrampolineSpots';

/** How close (CSS-pixels) a hold must land to Cosmo's projected position to
 *  count as a pet-target. ~120px = a generous fingertip touch radius. */
const PET_HOLD_RADIUS_PX = 120;
/** Hold duration that counts as "long enough to pet" (per 17D brief: 0.5s). */
const PET_HOLD_THRESHOLD_MS = 500;
/** Vibe gain on each successful trampoline-bounce. */
const BOUNCE_VIBE_GAIN = 0.18;
/** Vibe gain at the START of pet-affect (the pet itself is short, ~800ms,
 *  so we award the gain immediately on engage). */
const PET_VIBE_GAIN = 0.25;
/** Bounce-counter window for DeepTripMode auto-engage. */
const BOUNCE_COUNTER_WINDOW_S = 30;
const BOUNCE_COUNTER_THRESHOLD = 5;
/** Cumulative pet-time for DeepTripMode auto-engage (seconds). */
const PET_DEEPTRIP_THRESHOLD_S = 2.0;

interface BounceTimestamp {
  t: number; // uniforms.time domain
}

interface ProjectFn {
  (world: THREE.Vector3, viewportW: number, viewportH: number): { x: number; y: number };
}

export interface InteractionManagerHooks {
  /** TrampolineSpots in the scene. Required for tap-driven walkTo+bounce. */
  spots: TrampolineSpots;
  /** Active perspective camera — needed to set up the raycaster. */
  camera: THREE.Camera;
  /** Project a world-space Vector3 → CSS-pixel screen-space. CosmoStage owns
   *  this; we just borrow it via a callback to avoid a hard import-cycle. */
  projectToScreen: ProjectFn;
  /** Viewport size accessor (CSS pixels). */
  viewportW: () => number;
  viewportH: () => number;
  /** When set true the host can ignore future longHold→wave events because
   *  petAffect already consumed the gesture. Optional. */
  onPetEngaged?: () => void;
  /** Called when a tap hits a trampoline-spot — host may flash material. */
  onSpotTapped?: (spotIndex: number) => void;
  /** Wave 27 — substrate InteractionDirector gets first claim on every tap
   *  (NDC). Returns true when an interactable took it; we then skip the
   *  legacy trampoline raycast so one tap never fires two walk-tos. */
  tapInterceptor?: (ndcX: number, ndcY: number) => boolean;
}

export class InteractionManager {
  private input: InputController;
  private agent: CosmoAgent;
  /** Compat ref — runner-pool is gone but 17F decoration-placement may
   *  consume it. Kept on the instance so `getObstacles()` accessors stay
   *  available for tests + debug overlays. */
  private obstacles: ObstacleManager;
  private vibe: VibeMeter;
  /** THREE.Scene where we used to add trampolines/mushrooms. Kept for the 17F
   *  decoration hook and so the constructor signature stays compat. */
  private scene: THREE.Scene;
  private hooks: InteractionManagerHooks;

  private offGesture: (() => void) | null = null;
  /** Sprint 17D — when true, all gestures are ignored. The OnboardingDirector
   *  flips this on during AWAIT_TOUCH/PORTAL_OPENING/COSMO_ARRIVING/BONDING so
   *  early taps don't accidentally trigger a walkTo + bounce. */
  paused = false;

  // Hold-on-Cosmo state.
  private petTimer: number | null = null;
  private petArmed = false;
  /** True while petAffect is active OR was armed-and-fired during the current
   *  hold-cycle. Cleared on holdEnd. Suppresses the 3s longHold→wave path. */
  private petConsumedThisHold = false;
  /** Cumulative pet-affect time across the current vibe-window (seconds).
   *  Reset when DeepTripMode auto-engages or when a 30s idle gap elapses. */
  private petCumulativeS = 0;
  private lastPetT = -Infinity;
  /** Ring-buffer of bounce timestamps (uniforms.time) for the 5-in-30s rule. */
  private bounceLog: BounceTimestamp[] = [];

  constructor(
    input: InputController,
    agent: CosmoAgent,
    obstacles: ObstacleManager,
    vibe: VibeMeter,
    scene: THREE.Scene,
    hooks: InteractionManagerHooks,
  ) {
    this.input = input;
    this.agent = agent;
    this.obstacles = obstacles;
    this.vibe = vibe;
    this.scene = scene;
    this.hooks = hooks;
  }

  /** Compat accessor — 17F decorator-placement may want to introspect the
   *  registered ObstacleManager (now a 17D shim). */
  getObstacles(): ObstacleManager {
    return this.obstacles;
  }

  /** Compat accessor — same rationale as getObstacles. */
  getScene(): THREE.Scene {
    return this.scene;
  }

  attach(): void {
    this.offGesture = this.input.onGesture((e) => this.onGesture(e));
  }

  detach(): void {
    this.offGesture?.();
    this.offGesture = null;
    if (this.petTimer !== null) {
      window.clearTimeout(this.petTimer);
      this.petTimer = null;
    }
    this.petArmed = false;
    this.petConsumedThisHold = false;
  }

  /**
   * Per-frame tick. With the runner-pool gone there's no collision to test,
   * but we still:
   *   - prune the bounce-log to the 30s window;
   *   - update petCumulativeS while pet-affect is active;
   *   - check for the 5-bounce / 2s-pet DeepTripMode triggers and gain
   *     vibe accordingly.
   *
   * `uniformsTime` matches CosmoScene.update which passes uniforms.time. The
   * cosmoX / cosmoY arguments are kept for compat — InteractionManager v1
   * used them for collision-tests; 17D doesn't need them but the host scene
   * still passes them. Marked unused locally.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(uniformsTime: number, _cosmoX: number, _cosmoY: number): void {
    // Prune bounce-log to the 30s window.
    const cutoff = uniformsTime - BOUNCE_COUNTER_WINDOW_S;
    while (this.bounceLog.length && this.bounceLog[0].t < cutoff) {
      this.bounceLog.shift();
    }

    // Track pet-affect duration toward the 2s DeepTripMode trigger.
    if (this.agent.state === 'petted') {
      // We approximate dt from frame-spacing; uniforms.time is monotonic so
      // (uniformsTime - lastPetT) gives us a stable per-frame delta.
      if (this.lastPetT >= 0) {
        const dt = Math.max(0, Math.min(0.1, uniformsTime - this.lastPetT));
        this.petCumulativeS += dt;
      }
      this.lastPetT = uniformsTime;
    } else {
      this.lastPetT = uniformsTime;
    }
  }

  // ── Gesture dispatch ─────────────────────────────────────────────────────

  private onGesture(e: GestureEvent): void {
    if (this.paused) return;
    switch (e.name) {
      case 'tap':
        this.handleTap(e.x ?? 0, e.y ?? 0);
        break;
      case 'holdStart':
        this.handleHoldStart(e.x ?? 0, e.y ?? 0);
        break;
      case 'holdEnd':
        this.handleHoldEnd();
        break;
      case 'longHold':
        this.handleLongHold();
        break;
      // swipe / pinch — ignored for 17D. Trampoline-tap is the only spawn
      // surface; vertical-swipes are no-ops. Pinch reserved for biome-zoom (18+).
    }
  }

  /** Tap → raycast to TrampolineSpots; on hit walkTo + bounce. */
  private handleTap(clientX: number, clientY: number): void {
    const ndcX = (clientX / Math.max(1, this.hooks.viewportW())) * 2 - 1;
    const ndcY = -(clientY / Math.max(1, this.hooks.viewportH())) * 2 + 1;
    if (this.hooks.tapInterceptor?.(ndcX, ndcY)) return;
    const pick = this.hooks.spots.pickAtNDC(this.hooks.camera, ndcX, ndcY);
    if (!pick) return; // miss — no penalty per 17D brief
    this.hooks.onSpotTapped?.(pick.index);
    this.agent.walkTo(pick.world.x, pick.world.z, 'bounce');
  }

  private handleHoldStart(clientX: number, clientY: number): void {
    // If the hold lands within PET_HOLD_RADIUS_PX of Cosmo's projected
    // position, arm a 500ms timer that fires petAffect on expiry.
    const cosmoWorld = this.agent.worldPositionVec();
    const cosmoScreen = this.hooks.projectToScreen(
      cosmoWorld,
      this.hooks.viewportW(),
      this.hooks.viewportH(),
    );
    const dx = clientX - cosmoScreen.x;
    const dy = clientY - cosmoScreen.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= PET_HOLD_RADIUS_PX) {
      this.armPetTimer();
    }
  }

  private handleHoldEnd(): void {
    // Cancel the pet-arm timer if hold ended before 500ms.
    if (this.petTimer !== null) {
      window.clearTimeout(this.petTimer);
      this.petTimer = null;
    }
    this.petArmed = false;
    // petConsumedThisHold stays true until the 3s-longHold dispatcher checks
    // it; we clear here so the NEXT hold can fire petAffect again.
    this.petConsumedThisHold = false;
  }

  private handleLongHold(): void {
    // Suppress the legacy wave when this hold-cycle already fired petAffect.
    if (this.petConsumedThisHold) return;
    this.agent.triggerWave();
  }

  // ── Pet timer ────────────────────────────────────────────────────────────

  private armPetTimer(): void {
    if (this.petArmed) return;
    this.petArmed = true;
    this.petTimer = window.setTimeout(() => {
      this.petTimer = null;
      this.petArmed = false;
      // Brief: pet engages on 500ms hold-on-Cosmo.
      this.agent.petAffect();
      this.petConsumedThisHold = true;
      this.vibe.gain(PET_VIBE_GAIN);
      this.hooks.onPetEngaged?.();
      // Pet-cumulative DeepTripMode trigger: full meter on ≥2s pet.
      if (this.petCumulativeS >= PET_DEEPTRIP_THRESHOLD_S) {
        this.vibe.gain(1); // saturates → fullEdge → DeepTripMode auto-engages
        this.petCumulativeS = 0;
      }
    }, PET_HOLD_THRESHOLD_MS);
  }

  // ── Bounce hook (called by host on CosmoAgent.onBounce) ─────────────────

  /**
   * Host-scene calls this from the CosmoAgent `onBounce` event. We log the
   * timestamp, gain vibe, and check for the 5-in-30s DeepTripMode trigger.
   */
  notifyBounce(uniformsTime: number): void {
    this.bounceLog.push({ t: uniformsTime });
    this.vibe.gain(BOUNCE_VIBE_GAIN);
    if (this.bounceLog.length >= BOUNCE_COUNTER_THRESHOLD) {
      // Saturate the vibe-meter so DeepTripMode.update() picks up fullEdge.
      this.vibe.gain(1);
      this.bounceLog = [];
    }
  }
}
