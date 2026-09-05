/**
 * CosmoAgent — Wave 21.2 (2026-05-05) — billboard-Cosmo cutover
 *
 * Wraps the CosmoV2 billboard rig (a single textured plane carrying
 * `cosmo-hero-lora.png`, see `../../three/cosmoV2.ts`) inside the same state-
 * machine. The PUBLIC API is unchanged — `update()`, `applyMotion()`,
 * `applyAI()`, `attachAI()`, `tickAnimDirector()` all keep their signatures.
 *
 * What changed in 21.2:
 *  - The rig has no bones. headBone / antennaBone / spineBone fields are gone;
 *    applyMotion and applyAI become near-no-ops on the rig (they still update
 *    internal smoothed-yaw state for the API contract, but nothing applies it
 *    to the painted plane — no surface to apply it to).
 *  - `setFaceState()` is gone (no face-decal compositing).
 *  - The pet-affect saffron blush is gone (no MeshStandardMaterial).
 *  - `tickAnimDirector(dt, motion, camera)` now takes a camera so the director
 *    can call rig.update(camera) for the billboard lookAt at the end of its
 *    tick.
 *
 * Wave 20a deliverable: visible Cosmo, 360° rotation wired to motion,
 * scale wired to root.scale (driven externally for trip-scale).
 * Wave 20b deliverable: CosmoAnimDirector for procedural idle-breath /
 * blink / walk / jump-arc / climb. Until then, Cosmo is a still being
 * who turns his head.
 *
 * The original docstring (Sprint 15B + 17B) is preserved below for
 * historical reference. The `playClip` / mixer references in it apply
 * to the v1 GLB rig; in v2 they're no-ops and lip-sync happens via
 * `v2Rig.setFaceState()`.
 *
 * ──────────────────────────────────────────────────────────────────
 * CosmoAgent — Sprint 15B + Sprint 17B refactor (historical)
 *
 * Wraps the 3D Cosmo (cosmo.glb from Sprint 15A) inside a state-machine with
 * RANDOM AGENCY. This is the WEIRDO-brief enforcer: Cosmo is not a remote-
 * controlled puppet. Player gestures suggest actions; Cosmo decides whether
 * to comply (RNG-gated). On top of that, his idle tick rolls a small random
 * chance for self-initiated weirdness (knipoog, walk-backward, eigen-jump,
 * antenne-bloem-petal-spew). The "voorspelbare modus" is by design impossible.
 *
 * Sprint 17B — runner-mechanic OFF
 *   The auto-runner X-progression is stripped. Cosmo no longer auto-walks the
 *   world from left to right; he stays anchored at biome-centre (worldX=0).
 *   The camera does the moving (driven by MotionController, see CosmoStage.
 *   panCamera). State-machine still ticks (jumping/ducking/dancing remain
 *   useful for response-feel), but `walking` and `walking-backward` only
 *   change facing + animation-clip — no X-translation.
 *
 *   `applyMotion(motion)` per-frame nudges the head-bone yaw/pitch so Cosmo
 *   visibly reacts to the player's gyro/cursor. Falls back gracefully when
 *   no head-bone is found (2D fallback, or GLB without skeleton).
 *
 * State machine
 * ─────────────
 *   walking         — default. Auto-runner; X advances at WALK_SPEED.
 *   walking-backward — random self-event, lasts ~3s, X regresses.
 *   idle            — pre-spawn (looks at camera 1.2s) and post-respawn.
 *   jumping         — apex-then-fall; clip 'jump'.
 *   falling         — losing platform; into nevel-portal fade.
 *   ducking         — under low obstacle; clip 'duck'.
 *   dancing         — DeepTripMode 5s.
 *   looking         — micro-event: stop, look at camera, knipoog, resume.
 *
 * Agency RNG (PRD 15B brief)
 *   - random-event tick: 0.5% per frame at 60fps (≈ once every 3.3s avg).
 *     When fired, picks one of: knipoog, walk-backward, eigen-jump, petal-spew.
 *   - action-RNG: when player swipes/taps, the input is queued with a logged
 *     spawn-time. After ACTION_DECISION_DELAY_MS (~120-280ms random) Cosmo
 *     ROLLS to either commit (~80%) or ignore (~20%) — looks at the spawned
 *     trampoline/mushroom/obstacle and walks past with a deliberate "nope".
 *   - tap on obstacle: 50/50 jump-vs-duck regardless of obstacle type.
 *
 * FFT-driven mixer blends
 *   We don't have explicit FFT-attenuation tracks in the GLB; we instead
 *   modulate the AnimationMixer time-scale and a per-bone subtle pulse on
 *   the body root via THREE.Object3D.scale. This is intentionally subtle —
 *   the agency-events do the heavy character work; the FFT stays cosmetic.
 *
 * Graceful 2D fallback
 *   If `cosmo.glb` is missing/404, we substitute a Sprite-style billboard
 *   plane textured with `cosmo-hero-4k.png` (already in repo). The state
 *   machine still runs (jumping = vertical translate, ducking = scale-Y,
 *   walking = no anim-clip needed). Asset-files NEVER required at boot.
 */
import * as THREE from 'three';
import type { GlobalUniforms } from '../../core/globalUniforms';
import type { MotionController } from '../../core/motionController';
import type { CosmoAI, AIDirective } from './CosmoAI';
// Wave 21.2 — CosmoV2 billboard rig. Single textured plane carrying the hero PNG.
import { buildCosmoV2, type CosmoV2Rig } from '../../three/cosmoV2';
// Wave 23 — painted-frames player. Revives playClip() to animate the billboard
// texture (per-state frame atlases) instead of the dead AnimationMixer.
import { CosmoFramePlayer } from '../../three/cosmoFramePlayer';
// Wave 21.2 — anim director, billboard variant. 4 surviving anims:
// idle-breath / walk-sway / jump-arc / climb. Calls rig.update(camera) at end.
import { CosmoAnimDirector, type AnimCtx } from '../../three/cosmoAnimDirector';

// ─── Sprint 17B head-track tunables ──────────────────────────────────────────
/** Max head-yaw sweep (rad). Maps motion.panX in [-1..1] → [-MAX..MAX]. */
const HEAD_YAW_MAX = 0.4;
/** Max head-pitch sweep (rad). Maps motion.panY in [-1..1] → [-MAX..MAX]. */
const HEAD_PITCH_MAX = 0.2;
/** Lerp factor — head smoothing on top of MotionController smoothing. */
const HEAD_LERP = 0.18;
/** Common bone-name patterns we treat as the head for head-track. */

// ─── Tunables ────────────────────────────────────────────────────────────────
/** World-units / second. Tuned so 60s of idle walking covers ~12 obstacles. */
export const WALK_SPEED = 0.85;
/** Per-frame chance of random agency-event firing (at 60fps). */
const RANDOM_EVENT_CHANCE_PER_FRAME = 0.005;
/** Cooldown so an event-burst doesn't smash 3 events in 0.5s. */
const RANDOM_EVENT_COOLDOWN_S = 4.5;
/** Action-RNG: probability that Cosmo commits to a swipe-spawned platform. */
const ACTION_COMMIT_CHANCE_TRAMPOLINE = 0.8;
const ACTION_COMMIT_CHANCE_MUSHROOM = 0.8;
/** Tap-on-obstacle is 50/50 jump-or-duck regardless of obstacle hint. */
const ACTION_TAP_JUMP_CHANCE = 0.5;
/** Delay between gesture and Cosmo's reaction. */
const ACTION_DECISION_DELAY_MIN_MS = 120;
const ACTION_DECISION_DELAY_MAX_MS = 280;
const JUMP_DURATION_S = 0.85;
const JUMP_HEIGHT = 1.4;
const DUCK_DURATION_S = 0.6;
const LOOKING_DURATION_S = 1.2;
const WALK_BACKWARD_DURATION_S = 3.0;
const DANCE_DURATION_S = 5.0;
const PETAL_SPEW_DURATION_S = 2.0;
const FALL_FADE_DURATION_S = 1.2;
const RESPAWN_DELAY_S = 1.5;

// ─── Sprint 17D — trampoline / pet tunables ─────────────────────────────────
/** Walk-to navigation duration (s). Brief: ~1.5s ease-in/out toward target. */
const WALK_TO_DURATION_S = 1.5;
/** Trampoline-bounce duration — sin-wave 0 → BOUNCE_HEIGHT → 0. */
const BOUNCE_DURATION_S = 0.8;
/** Bounce apex (world-units). Brief: 0 → 0.6 → 0. */
const BOUNCE_HEIGHT = 0.6;
/** Wave 22 — extra auto-rebounces after Cosmo arrives on a trampoline, so he
 *  "gaat helemaal los" (Richard 2026-05-30) instead of a single hop. */
const BOUNCE_COMBO_EXTRA = 3;
/** Pet-affect total duration — saffron blush + heart-emote tilt + petal-spew. */
const PET_AFFECT_DURATION_S = 0.8;
/** Heart-emote: peak antenne yaw deviation during pet (rad ≈ ±20°). */
const PET_ANTENNA_TILT_RAD = 0.35;
/** Bone-name patterns we treat as "antenne" for the pet heart-emote. */
/** Probability of a hallucination-overlay firing on a successful trampoline-bounce. */
const BOUNCE_HALLUCINATION_CHANCE = 0.3;
/** Kaleido-trigger spike applied on every bounce. */
const BOUNCE_KALEIDO_SPIKE = 0.6;
/** Saffron tint applied to the body material during pet-affect (emissive). */
const PET_BLUSH_COLOR = 0xf4a261;
const PET_BLUSH_INTENSITY = 0.3;

// ─── Types ───────────────────────────────────────────────────────────────────
export type CosmoState =
  | 'idle'
  | 'walking'
  | 'walking-backward'
  | 'walking-to'
  | 'jumping'
  | 'falling'
  | 'ducking'
  | 'dancing'
  | 'looking'
  | 'bouncing'
  | 'petted'
  | 'using';

export type ActionKind = 'jump' | 'duck' | 'ignore';

interface PendingAction {
  /** When (in ms-monotonic) the action should resolve. */
  fireAt: number;
  /** What to do once the delay elapses. Set after RNG roll at queue-time. */
  resolved: ActionKind;
}

export interface CosmoAgentEvents {
  /** Cosmo started a self-initiated weirdo event. UI may telegraph (none). */
  onRandomEvent?: (kind: 'wink' | 'walk-backward' | 'eigen-jump' | 'petal-spew') => void;
  /** Cosmo entered the falling state — InteractionManager may trigger nevel-portal. */
  onFalling?: () => void;
  /** Cosmo respawned at a new X. */
  onRespawn?: (newX: number) => void;
  /** Petal-spew is firing — particle system can hook here. */
  onPetalSpew?: () => void;
  /** Sprint 17D — Cosmo just bounced off a trampoline. Fires at apex
   *  (peak of the parabola). Hosts can hook kaleido-spike + maybe-hallucination. */
  onBounce?: (info: { rollHallucination: boolean }) => void;
  /** Sprint 17D — Player long-held on Cosmo → pet-affect engaged. Hosts hook
   *  particle-spew + audio cue. */
  onPet?: () => void;
}

// ─── Implementation ──────────────────────────────────────────────────────────
export class CosmoAgent {
  private parentGroup: THREE.Group;
  private events: CosmoAgentEvents;

  /** Root Object3D for Cosmo (either the GLB scene root or fallback plane). */
  root: THREE.Object3D;
  private mixer: THREE.AnimationMixer | null = null;
  private clips: Map<string, THREE.AnimationClip> = new Map();

  /** Wave 23 — painted-frames player. When ready it owns Cosmo's motion
   *  (the frames carry breath/walk/squash); the anim director then only
   *  billboards the plane toward the camera. Null until the manifest loads;
   *  CosmoAgent gracefully shows the static hero meanwhile. */
  private framePlayer: CosmoFramePlayer | null = null;
  private framesOwnMotion = false;
  private currentClipName: string | null = null;
  private fallback2D = false;
  /** When true, the asset is still loading; act like fallback until it lands. */
  private loading = true;

  // ── World position ────────────────────────────────────────────────────────
  /** World-space X, advances on WALK_SPEED * dt. */
  worldX = 0;
  /** World-space Y, 0 = ground level. */
  worldY = 0;
  /** Initial-Y baseline (recomputed on respawn). */
  private groundY = 0;
  private facing: 1 | -1 = 1;

  // ── State machine ─────────────────────────────────────────────────────────
  state: CosmoState = 'idle';
  private stateUntil = 0;
  /** Time accumulator (seconds, monotonic). */
  private t = 0;
  private lastRandomEventT = -Infinity;
  /** Pending action queue — gestures are RNG-resolved with a delay. */
  private pendingActions: PendingAction[] = [];

  // ── Falling / respawn ──────────────────────────────────────────────────────
  private respawnAt = 0;
  /** Opacity 0..1 for the nevel-portal fade. Falls 1→0 during fall, 0→1 on respawn. */
  opacity = 1;

  // ── Magic-moment intro: looks at camera 1.2s before walking ───────────────
  private introCompleteAt = 0;
  private introFinished = false;

  // ── Sprint 15D — onboarding gate ──────────────────────────────────────────
  /** While true, update() short-circuits — keeps Cosmo in a frozen idle
   *  during AWAIT_TOUCH / PORTAL_OPENING / COSMO_ARRIVING / BONDING. The
   *  OnboardingDirector flips this to false at WALKING_FIRST_HINT. */
  paused = false;

  // ── Sprint 17B — head-track ───────────────────────────────────────────────
  /** Cached reference to the head-bone (or fallback Object3D). Resolved once
   *  after the GLB loads; null if no match is found. */
  private headBone: THREE.Object3D | null = null;
  /** Smoothed head-yaw (rad). Lerped per-frame in applyMotion(). */
  private headYaw = 0;
  private headPitch = 0;
  /** Resting rotation captured the first time we touch the head-bone, so
   *  applying yaw/pitch is additive rather than overwriting clip animation. */
  private headRestQuat: THREE.Quaternion | null = null;

  // ── Sprint 17D — trampoline navigation + pet-affect ──────────────────────
  /** When the active walking-to interpolation should land. */
  private walkToUntil = 0;
  /** Start (worldX, worldZ) for the walking-to interpolation. */
  private walkFromX = 0;
  private walkFromZ = 0;
  /** Target for the walking-to interpolation. */
  private walkTargetX = 0;
  private walkTargetZ = 0;
  /** What to do once we arrive. 'bounce' = trigger bounce. 'idle' = settle.
   *  'use' (Wave 27) = hold position and hand over to `walkArrivalCallback`. */
  private walkArrivalAction: 'bounce' | 'idle' | 'use' = 'idle';
  /** Wave 27 — fired once on arrival for 'use' (and 'bounce') walks. */
  private walkArrivalCallback: (() => void) | null = null;
  /** Wave 27 — end of the current `using` hold; then Cosmo walks home. */
  private usingUntil = 0;
  /** Wave 27 — where "home" is: the spot the substrate parks Cosmo at when he
   *  is not visiting an interactable (the room's stage origin). */
  private homeX = 0;
  private homeZ = 0;
  /** Wave 28 — walk-speed multiplier set by the InteractionDirector from
   *  Cosmo's inner life (1 = normal). */
  walkPace = 1;
  /** World-Z (depth) — separate from worldY which is jump-height. Defaults 0. */
  worldZ = 0;
  /** True while a bounce is in progress. */
  private bouncingUntil = 0;
  /** Wave 22 — remaining auto-rebounces queued for the trampoline combo. */
  private bounceCombo = 0;
  /** Antenne-bone reference for the heart-emote during pet-affect. */
  private antennaBone: THREE.Object3D | null = null;
  private antennaRestQuat: THREE.Quaternion | null = null;
  /** Pet-affect end-time. */
  private pettingUntil = 0;
  /** Body material refs cached at GLB-load time so the saffron-blush tint can
   *  be applied/restored cheaply without traversing on every frame. */
  private bodyMaterials: THREE.MeshStandardMaterial[] = [];

  // ── Sprint 17E — companion-mode AI bridge ────────────────────────────────
  /** Optional CosmoAI handle — exposed read-only for diagnostics + tests.
   *  Per-frame the host calls cosmoAgent.applyAI(cosmoAI) directly; this
   *  field is just a back-reference set by attachAI(). */
  ai: CosmoAI | null = null;
  /** Cached spine-bone for AI's spineBendHint (sniff state). */
  private spineBone: THREE.Object3D | null = null;
  private spineRestQuat: THREE.Quaternion | null = null;
  /** Smoothed AI head-yaw (rad). Lerped per-frame in applyAI(). */
  private aiHeadYaw = 0;
  private aiSpineBend = 0;
  /** Sprint 17G — AI's contribution to mixer.timeScale (slow-breath = sleep).
   *  Lerped here in applyAI(), then multiplied by the FFT-driven factor in
   *  update(). Prior to 17G this field didn't exist and applyAI wrote
   *  mixer.timeScale directly; the next update() then overwrote it from
   *  raw FFT, killing slow-breath sleep entirely. */
  private aiTimeScaleBase = 1;
  /** Lerp factor for AI-driven worldX/Z chase. */
  private static readonly AI_POS_LERP = 0.04;
  /** Lerp factor for AI-driven head-yaw / spine-bend. */
  private static readonly AI_BONE_LERP = 0.08;

  // ── Wave 19 — eye-melt fix fallback path ─────────────────────────────────
  /** When true, fixSkinWeights() decided NOT to reparent the eye-bones (IBM
   *  caveat). Each frame we copy bone_head's quaternion onto bone_eye_l/_r
   *  inside applyAIBoneHints() so they yaw/pitch with the head. Default OFF —
   *  reparent is the cleaner path; this is only a fallback. */
  private eyeFrameCopyEnabled = false;
  private eyeBoneL: THREE.Object3D | null = null;
  private eyeBoneR: THREE.Object3D | null = null;

  /** Wave 20a — CosmoV2 hybrid rig (primitive skeleton + painted decals).
   *  Built synchronously in the constructor; replaces the async GLB-loader
   *  path of Sprint 15A. Always non-null after construction. */
  private v2Rig: CosmoV2Rig;

  /** Wave 21 — procedural anim director. Ticks after applyMotion + applyAI
   *  each frame so its 7 life-sign animations layer on top of state-machine
   *  output. Constructed alongside v2Rig.
   *  See `src/three/cosmoAnimDirector.ts` for the full animation set. */
  private animDirector: CosmoAnimDirector;
  /** Cached scratch vector for the director's velocity ctx — avoids per-frame
   *  allocation. */
  private animVelocity = new THREE.Vector3();
  /** Last-frame world position for finite-difference velocity estimation. */
  private lastWorldX = 0;
  private lastWorldY = 0;
  private lastWorldZ = 0;
  /** Cached scratch vector for focusPoint (mouse/gyro projection result). */
  private animFocusPoint = new THREE.Vector3();
  /** True while director should treat Cosmo as climbing — Wave 21 plumbing
   *  for the eventual climb state. Default false. */
  private animClimbing = false;

  constructor(parentGroup: THREE.Group, events: CosmoAgentEvents = {}) {
    this.parentGroup = parentGroup;
    this.events = events;

    // Wave 21.2 — synchronous build of the billboard rig. The plane materials
    // are constructed immediately; the hero texture loads async but the plane
    // is already in the scene-graph by the time the first frame renders.
    this.v2Rig = buildCosmoV2({ scale: 1.1 });
    this.root = this.v2Rig.root;
    this.parentGroup.add(this.root);
    this.root.position.set(this.worldX, this.worldY, this.worldZ);

    // 21.2 — bone-handles are gone. headBone / antennaBone / spineBone stay as
    // null on the agent; applyMotion / applyAI smooth their internal yaw state
    // for the API contract but the billboard plane has nothing to rotate.
    this.headBone = null;
    this.headRestQuat = null;
    this.antennaBone = null;
    this.antennaRestQuat = null;
    this.spineBone = null;
    this.spineRestQuat = null;

    // Magic moment: 1.2s of looking before he starts walking.
    this.state = 'idle';
    this.introCompleteAt = LOOKING_DURATION_S;
    this.fallback2D = false;
    this.loading = false;

    // Wave 21.2 — anim director with reduced anim-set (idle-breath / walk-
    // sway / jump-arc / climb). Director calls rig.update(camera) at end of
    // each tick to billboard the plane.
    this.animDirector = new CosmoAnimDirector(this.v2Rig);

    // Wave 23 — kick off the painted-frames manifest load. When it resolves,
    // frames take over motion and we start the idle loop. Failure is silent:
    // playClip stays a no-op and the static hero remains (graceful degrade).
    this.framePlayer = new CosmoFramePlayer(
      this.v2Rig.plane.material as THREE.MeshBasicMaterial,
    );
    void this.framePlayer.load().then((ok) => {
      if (!ok) { this.framePlayer = null; return; }
      this.framesOwnMotion = true;
      this.framePlayer!.play('idle', true);
    });

    this.lastWorldX = this.worldX;
    this.lastWorldY = this.worldY;
    this.lastWorldZ = this.worldZ;
  }

  /** Per-frame tick. */
  update(uniforms: GlobalUniforms, dt: number): void {
    if (this.paused) {
      // Sprint 15D — keep Cosmo idle-rendered while onboarding is running.
      // We still apply position/scale so the portal-arrival tween (driven
      // externally via cosmoArrivalScale on the parent group) renders,
      // and we still update opacity (post-fall fade-in). But the state-
      // machine, RNG agency, and pendingActions all freeze.
      this.root.position.set(this.worldX, this.worldY, this.worldZ);
      this.applyOpacity();
      return;
    }
    this.t += dt;

    // Intro magic-moment: stay looking for 1.2s, then transition to walking.
    if (!this.introFinished) {
      if (this.t >= this.introCompleteAt) {
        this.introFinished = true;
        this.setState('walking');
      }
    }

    // Resolve pending actions whose decision-delay has elapsed.
    this.resolvePendingActions();

    // Random agency-events.
    this.tickRandomAgency();

    // State-driven motion.
    this.advanceState(dt);

    // FFT cosmetic blend on the body — sub-band slight pulse.
    const sub = uniforms.audioFFT[0] ?? 0;
    const pulse = 1 + sub * 0.04;
    this.root.scale.y = (this.fallback2D ? 1 : 1.1) * pulse * this.duckScaleY();

    // Mixer drives loaded GLB animations.
    if (this.mixer) {
      // High-mid band makes the animation a touch snappier — gives Cosmo
      // a very subtle "feeling the music" without ruining clip phrasing.
      // Sprint 17G — multiply (instead of overwrite) so AI's sleep-state
      // slow-breath time-scale (lerp toward 0.4 in applyAI) is preserved
      // across the FFT-driven adjust. Prior to 17G, applyAI's slow-breath
      // was clobbered every frame the next CosmoAgent.update() ran.
      const air = uniforms.audioFFT[5] ?? 0;
      const fftFactor = 1 + air * 0.1;
      this.mixer.timeScale = this.aiTimeScaleBase * fftFactor;
      this.mixer.update(dt);
    }

    // Wave 23 — advance the painted-frames clip (the live motion source).
    this.framePlayer?.tick(dt);

    // Apply position to root.
    this.root.position.set(this.worldX, this.worldY, this.worldZ);
    this.root.scale.x = (this.fallback2D ? 1 : 1.1) * this.facing;

    // Fade for nevel-portal.
    this.applyOpacity();

    // Update uniforms so post-FX / Phaser HUD know where Cosmo is.
    uniforms.cosmoFacing = this.facing;
    uniforms.cosmoState = this.state === 'jumping'
      ? 'jump'
      : this.state === 'falling'
      ? 'fall'
      : this.state === 'walking' || this.state === 'walking-backward'
      ? 'run'
      : 'idle';
  }

  // ── Public API consumed by InteractionManager ────────────────────────────

  /** Player wants Cosmo to react to a swipe-up trampoline. RNG-gated. */
  queueTrampolineDecision(): void {
    if (!this.canQueueAction()) return;
    const commit = Math.random() < ACTION_COMMIT_CHANCE_TRAMPOLINE;
    this.queueAction(commit ? 'jump' : 'ignore');
  }

  /** Player wants Cosmo to duck under a swipe-down mushroom. RNG-gated. */
  queueMushroomDecision(): void {
    if (!this.canQueueAction()) return;
    const commit = Math.random() < ACTION_COMMIT_CHANCE_MUSHROOM;
    this.queueAction(commit ? 'duck' : 'ignore');
  }

  /** Tap on visible obstacle — 50/50 jump-or-duck. */
  queueTapDecision(): void {
    if (!this.canQueueAction()) return;
    const action: ActionKind = Math.random() < ACTION_TAP_JUMP_CHANCE ? 'jump' : 'duck';
    this.queueAction(action);
  }

  /** Long-hold center 3s → wave + vibe boost. Resolves immediately. */
  triggerWave(): void {
    if (this.state === 'falling' || this.state === 'dancing') return;
    this.setState('looking');
    this.stateUntil = this.t + LOOKING_DURATION_S;
    this.playClip('wave', false);
    this.events.onRandomEvent?.('wink');
  }

  /** Engage DeepTripMode dance for DANCE_DURATION_S. */
  enterDance(): void {
    if (this.state === 'falling') return;
    this.setState('dancing');
    this.stateUntil = this.t + DANCE_DURATION_S;
    this.playClip('dance', true);
  }

  /** Force-fall via missed platform — InteractionManager triggers this. */
  forceFall(): void {
    if (this.state === 'falling') return;
    this.setState('falling');
    this.stateUntil = this.t + FALL_FADE_DURATION_S;
    this.playClip('fall', false);
    this.events.onFalling?.();
  }

  // ── Sprint 17D — trampoline navigation + bounce + pet-affect ────────────

  /**
   * Sprint 17D — interpolate Cosmo's worldX/Z toward (targetX, targetZ) over
   * ~1.5s ease-in/out. On arrival the agent triggers `bounce()` so the player
   * sees one continuous "walk → spring" motion. While walking, the 'walk'
   * clip plays (or 'idle' fallback if the rig has no walk clip).
   *
   * Safe to call repeatedly — re-target supersedes the previous walk-to.
   * Cosmo refuses new walk-to calls during 'falling' / 'dancing' / 'petted'
   * so onboarding/dance/pet state stays uninterrupted.
   */
  walkTo(
    targetX: number,
    targetZ: number,
    action: 'bounce' | 'idle' | 'use' = 'bounce',
    onArrive?: () => void,
  ): void {
    if (this.state === 'falling' || this.state === 'dancing' || this.state === 'petted') return;
    this.walkFromX = this.worldX;
    this.walkFromZ = this.worldZ;
    this.walkTargetX = targetX;
    this.walkTargetZ = targetZ;
    // Wave 27 — walk time scales with distance (min 0.6s) so a short hop
    // doesn't crawl and a cross-room walk doesn't teleport.
    const dist = Math.hypot(targetX - this.worldX, targetZ - this.worldZ);
    // Wave 28 — pace: tired Cosmo trudges (0.55), eager Cosmo hurries (1.15).
    this.walkToUntil = this.t + Math.max(0.6, Math.min(WALK_TO_DURATION_S * 1.6, dist * 0.55)) / this.walkPace;
    this.walkArrivalAction = action;
    this.walkArrivalCallback = onArrive ?? null;
    this.setState('walking-to');
    // Prefer 'walk' clip when available (Wave 23 frame-player or the legacy
    // mixer); fall back to looping 'idle'.
    if (this.framePlayer?.has('walk') || this.clips.has('walk')) this.playClip('walk', true);
    else this.playClip('idle', true);
  }

  /**
   * Sprint 17D — trigger a one-shot trampoline-bounce in place. Plays the
   * 'stretch' clip as the spring-up animation (per Sprint 17A rig spec) and
   * runs a sin-arc 0 → 0.6 → 0 in worldY over BOUNCE_DURATION_S. The bounce
   * fires the `onBounce` event with a pre-rolled `rollHallucination` flag
   * (30% chance per the brief) so the host can decide to start a hallucination
   * overlay-track in parallel with the kaleido-spike.
   *
   * Public so tests/scripts can poke it; gameplay reaches it via walkTo's
   * arrival callback.
   */
  bounce(): void {
    this.startBounce();
  }

  /** Wave 22 — true while a special state owns Cosmo. The autonomous
   *  trampoline demo (main.ts) checks this so it never interrupts a walk,
   *  an active bounce-combo, a pet, or a fall. */
  get isBusy(): boolean {
    return (
      this.state === 'walking-to' ||
      this.state === 'bouncing' ||
      this.state === 'petted' ||
      this.state === 'falling' ||
      this.state === 'dancing' ||
      this.state === 'using'
    );
  }

  // ── Wave 27 — interactable use (InteractionDirector API) ─────────────────

  /** The billboard rig, for `InteractableHandle.onUse(cosmo)`. */
  get rig(): CosmoV2Rig {
    return this.v2Rig;
  }

  /**
   * Play a named painted clip while Cosmo stays where he is (state `using`),
   * for `holdS` seconds; then he walks home. Called from an interactable's
   * `onUse` via the UseApi. Safe outside `using` too: it enters the state in
   * place (curiosity + tests). Missing clips degrade to the static hero.
   */
  useClip(name: string, opts: { loop?: boolean; holdS?: number } = {}): void {
    if (this.state === 'falling' || this.state === 'dancing' || this.state === 'petted') return;
    if (this.state === 'bouncing') return; // the trampoline owns this window
    const holdS = opts.holdS ?? 2.4;
    this.setState('using');
    this.usingUntil = this.t + holdS;
    this.playClip(name, opts.loop ?? false);
  }

  /** Where Cosmo returns to after a visit. The substrate sets this per room. */
  setHome(x: number, z: number): void {
    this.homeX = x;
    this.homeZ = z;
  }

  /**
   * Sprint 17D — engage the pet-affect for PET_AFFECT_DURATION_S. Fires:
   *   - rose-petal spew (via `onPet` event so the host scene can hook
   *     particle-systems with their own canvas-drawn primitives).
   *   - heart-emote: antenne-bone yaws ±PET_ANTENNA_TILT_RAD over a
   *     half-sine on top of clip animation.
   *   - blush-tint: saffron emissive flush across the body materials.
   *   - on release: 'wave' clip plays + state returns to walking.
   *
   * Refuses while bouncing/falling/dancing — those windows take priority.
   */
  petAffect(): void {
    if (
      this.state === 'falling' ||
      this.state === 'dancing' ||
      this.state === 'bouncing'
    ) {
      return;
    }
    this.setState('petted');
    this.pettingUntil = this.t + PET_AFFECT_DURATION_S;
    this.playClip('petted', true);
    this.events.onPet?.();
    // Apply blush tint immediately; per-frame `applyPetAffect()` keeps it
    // alive + wiggles the antenne for the duration.
    this.beginPetAffect();
  }

  /** Internal: start a bounce in place. Called by walkTo's arrival action and
   *  by the public `bounce()`. Idempotent during an active bounce. */
  private startBounce(): void {
    if (this.state === 'bouncing') return;
    if (this.state === 'falling' || this.state === 'dancing') return;
    this.setState('bouncing');
    this.bouncingUntil = this.t + BOUNCE_DURATION_S;
    this.playClip('stretch', false);
    const rollHallucination = Math.random() < BOUNCE_HALLUCINATION_CHANCE;
    this.events.onBounce?.({ rollHallucination });
  }

  /** Total kaleido-spike per bounce — host applies on event. */
  static readonly BOUNCE_KALEIDO_SPIKE = BOUNCE_KALEIDO_SPIKE;

  // ── Screen-projection helpers used by HUD ────────────────────────────────

  worldPositionVec(): THREE.Vector3 {
    // Aim for the middle of Cosmo's body (~0.75 above feet).
    return new THREE.Vector3(this.worldX, this.worldY + 0.75, this.worldZ);
  }

  // ── State machine internals ──────────────────────────────────────────────

  private setState(s: CosmoState): void {
    if (this.state === s) return;
    this.state = s;
  }

  private canQueueAction(): boolean {
    if (this.state === 'falling' || this.state === 'dancing') return false;
    return this.pendingActions.length < 2;
  }

  private queueAction(kind: ActionKind): void {
    const delayMs =
      ACTION_DECISION_DELAY_MIN_MS +
      Math.random() * (ACTION_DECISION_DELAY_MAX_MS - ACTION_DECISION_DELAY_MIN_MS);
    const fireAt = this.t + delayMs / 1000;
    this.pendingActions.push({ fireAt, resolved: kind });
  }

  private resolvePendingActions(): void {
    if (!this.pendingActions.length) return;
    const ready: PendingAction[] = [];
    const remaining: PendingAction[] = [];
    for (const a of this.pendingActions) {
      if (this.t >= a.fireAt) ready.push(a);
      else remaining.push(a);
    }
    this.pendingActions = remaining;
    for (const a of ready) {
      if (a.resolved === 'jump') this.startJump();
      else if (a.resolved === 'duck') this.startDuck();
      // 'ignore' → do nothing. Cosmo deliberate-walks past the spawned platform.
    }
  }

  private startJump(): void {
    if (this.state === 'falling') return;
    this.setState('jumping');
    this.stateUntil = this.t + JUMP_DURATION_S;
    this.playClip('jump', false);
  }

  private startDuck(): void {
    if (this.state === 'falling') return;
    this.setState('ducking');
    this.stateUntil = this.t + DUCK_DURATION_S;
    this.playClip('duck', false);
  }

  /** Random self-initiated weirdo events. */
  private tickRandomAgency(): void {
    if (this.state !== 'walking') return; // only roll while plain walking
    if (this.t - this.lastRandomEventT < RANDOM_EVENT_COOLDOWN_S) return;
    if (Math.random() > RANDOM_EVENT_CHANCE_PER_FRAME) return;

    this.lastRandomEventT = this.t;
    const roll = Math.random();
    if (roll < 0.25) {
      // Knipoog
      this.setState('looking');
      this.stateUntil = this.t + 0.6;
      this.playClip('wink', false);
      this.events.onRandomEvent?.('wink');
    } else if (roll < 0.55) {
      // Walk-backward 3s
      this.setState('walking-backward');
      this.stateUntil = this.t + WALK_BACKWARD_DURATION_S;
      this.facing = -1;
      this.events.onRandomEvent?.('walk-backward');
    } else if (roll < 0.85) {
      // Eigen-jump (no platform requested)
      this.startJump();
      this.events.onRandomEvent?.('eigen-jump');
    } else {
      // Antenne-bloem petal-spew
      this.events.onPetalSpew?.();
      this.events.onRandomEvent?.('petal-spew');
      // Brief look-up so the player notices.
      this.setState('looking');
      this.stateUntil = this.t + PETAL_SPEW_DURATION_S;
      this.playClip('look', false);
    }
  }

  private advanceState(dt: number): void {
    // Sprint 17B — runner-mechanic disabled. worldX is locked at the biome
    // centre (initial 0); state-machine only drives Y, animation-clip, and
    // facing. The previous WALK_SPEED * dt translations are removed; each
    // case below sets worldX = 0 (anchored). The camera (CosmoStage.panCamera)
    // and head-bone (applyMotion) supply ALL on-screen motion.
    switch (this.state) {
      case 'idle':
        this.worldY = this.groundY;
        break;
      case 'walking':
        // Anchored — only the walk animation-clip and facing register here.
        this.worldY = this.groundY;
        if (this.facing !== 1) this.facing = 1;
        void dt;
        break;
      case 'walking-backward':
        // Cosmo "moonwalks" in place during the random walk-backward event.
        this.worldY = this.groundY;
        if (this.t >= this.stateUntil) {
          this.facing = 1;
          this.setState('walking');
        }
        break;
      case 'jumping': {
        // Parabolic arc — Y only, anchored X.
        const phase = 1 - Math.max(0, (this.stateUntil - this.t) / JUMP_DURATION_S);
        this.worldY = this.groundY + Math.sin(phase * Math.PI) * JUMP_HEIGHT;
        if (this.t >= this.stateUntil) {
          this.worldY = this.groundY;
          this.setState('walking');
        }
        break;
      }
      case 'ducking':
        this.worldY = this.groundY;
        if (this.t >= this.stateUntil) this.setState('walking');
        break;
      case 'dancing':
        this.worldY = this.groundY + Math.sin(this.t * 6) * 0.18;
        if (this.t >= this.stateUntil) this.setState('walking');
        break;
      case 'looking':
        this.worldY = this.groundY;
        if (this.t >= this.stateUntil) this.setState('walking');
        break;
      case 'falling':
        // Drift down only (no sideways translation now that the world is fixed).
        this.worldY -= 0.6 * dt;
        if (this.t >= this.stateUntil) {
          // Schedule respawn.
          this.respawnAt = this.t + RESPAWN_DELAY_S;
          this.setState('idle');
          this.opacity = 0;
        }
        break;
      case 'walking-to': {
        // Sprint 17D — interpolate worldX/Z toward (walkTargetX, walkTargetZ).
        // Ease-in-out cubic for a natural step-toward feeling. On arrival,
        // either trigger bounce or settle to idle/walking depending on
        // walkArrivalAction.
        const remaining = this.walkToUntil - this.t;
        const dur = WALK_TO_DURATION_S;
        const phase = remaining <= 0 ? 1 : 1 - Math.max(0, Math.min(1, remaining / dur));
        const eased = phase < 0.5
          ? 4 * phase * phase * phase
          : 1 - Math.pow(-2 * phase + 2, 3) / 2;
        this.worldX = this.walkFromX + (this.walkTargetX - this.walkFromX) * eased;
        this.worldZ = this.walkFromZ + (this.walkTargetZ - this.walkFromZ) * eased;
        this.worldY = this.groundY;
        // Face the direction of travel.
        const dx = this.walkTargetX - this.walkFromX;
        if (Math.abs(dx) > 0.01) this.facing = dx >= 0 ? 1 : -1;
        if (phase >= 1) {
          this.worldX = this.walkTargetX;
          this.worldZ = this.walkTargetZ;
          const cb = this.walkArrivalCallback;
          this.walkArrivalCallback = null;
          if (this.walkArrivalAction === 'bounce') {
            this.bounceCombo = BOUNCE_COMBO_EXTRA; // Wave 22 — go wild
            this.startBounce();
            cb?.();
          } else if (this.walkArrivalAction === 'use') {
            // Wave 27 — hold here; the callback (InteractionDirector →
            // handle.onUse → useClip) sets the clip + hold. If it doesn't,
            // a short idle beat keeps him from snapping home.
            this.setState('using');
            this.usingUntil = this.t + 0.8;
            this.playClip('idle', true);
            cb?.();
          } else {
            this.setState('walking');
          }
        }
        break;
      }
      case 'using':
        // Wave 27 — Cosmo stays at the interactable for the clip's hold, then
        // walks home. worldX/Z are NOT reset (see the anchored-X block below).
        this.worldY = this.groundY;
        if (this.t >= this.usingUntil) {
          if (Math.hypot(this.worldX - this.homeX, this.worldZ - this.homeZ) > 0.05) {
            this.walkTo(this.homeX, this.homeZ, 'idle');
          } else {
            this.setState('walking');
          }
        }
        break;
      case 'bouncing': {
        // Sprint 17D — sin-arc parabola 0 → BOUNCE_HEIGHT → 0 over BOUNCE_DURATION_S.
        // worldX / worldZ stay locked at the trampoline-spot during the bounce.
        const remaining = this.bouncingUntil - this.t;
        const dur = BOUNCE_DURATION_S;
        const phase = remaining <= 0 ? 1 : 1 - Math.max(0, Math.min(1, remaining / dur));
        this.worldY = this.groundY + Math.sin(phase * Math.PI) * BOUNCE_HEIGHT;
        if (phase >= 1) {
          if (this.bounceCombo > 0) {
            // Wave 22 — keep going: re-arm the bounce in place. We stay in the
            // 'bouncing' state so worldX/worldZ remain locked at the trampoline
            // (the anchored-reset below skips 'bouncing'); onBounce flexes the
            // mat + spikes kaleido again each rebounce.
            this.bounceCombo--;
            this.bouncingUntil = this.t + BOUNCE_DURATION_S;
            this.worldY = this.groundY;
            const rollHallucination = Math.random() < BOUNCE_HALLUCINATION_CHANCE;
            this.events.onBounce?.({ rollHallucination });
          } else {
            this.worldY = this.groundY;
            this.setState('walking');
          }
        }
        break;
      }
      case 'petted': {
        // Sprint 17D — pet-affect plays a saffron-blush tint + antenne tilt
        // for PET_AFFECT_DURATION_S, then crossfades to 'wave' clip on release
        // and returns to walking. The tint/tilt application happens in
        // applyPetAffect() which is called every frame regardless of state.
        this.worldY = this.groundY;
        this.worldX = 0;
        this.worldZ = 0;
        if (this.t >= this.pettingUntil) {
          // Crossfade into the wave clip on release per the brief.
          this.playClip('wave', false);
          this.clearPetAffect();
          this.setState('walking');
        }
        break;
      }
    }

    // Sprint 17D — pet-affect tint+tilt is driven each frame from the pet
    // window even outside the 'petted' branch above (so the antenna keeps
    // wiggling smoothly into the wave-clip transition).
    this.applyPetAffect();

    // Anchored worldX (only the new walking-to / bouncing / petted states
    // override this above). All other states keep Cosmo at biome-centre.
    if (
      this.state !== 'walking-to' &&
      this.state !== 'bouncing' &&
      this.state !== 'petted' &&
      this.state !== 'using'
    ) {
      this.worldX = this.homeX;
      this.worldZ = this.homeZ;
    }

    // Respawn after fall delay.
    if (this.opacity === 0 && this.t >= this.respawnAt && this.respawnAt > 0) {
      this.respawn();
    }
  }

  private respawn(): void {
    // Sprint 17B — Cosmo respawns at the biome centre (worldX=0). The earlier
    // "drift ahead by random offset" only made sense for the auto-runner; in
    // the companion-mode pivot we just fade Cosmo back in at his anchor.
    this.worldX = 0;
    this.worldY = this.groundY;
    this.opacity = 0;
    this.respawnAt = 0;
    this.setState('idle');
    this.stateUntil = this.t + 0.6;
    this.events.onRespawn?.(0);
    // Fade back in over 0.6s; applyOpacity handles the lerp.
  }

  private applyOpacity(): void {
    let target = 1;
    if (this.state === 'falling') {
      const phase = (this.stateUntil - this.t) / FALL_FADE_DURATION_S;
      target = Math.max(0, phase);
    } else if (this.opacity < 1) {
      // Respawn fade-in.
      target = Math.min(1, this.opacity + 0.04);
    }
    this.opacity = target;
    this.root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.Material | undefined;
      if (mat && 'opacity' in mat) {
        (mat as THREE.MeshBasicMaterial).transparent = true;
        (mat as THREE.MeshBasicMaterial).opacity = target;
      }
    });
  }

  /** Squash-and-stretch from ducking, returns Y-multiplier. */
  private duckScaleY(): number {
    if (this.state !== 'ducking') return 1;
    return 0.65;
  }

  /** Play a named animation clip. Wave 23: drives the painted-frames player
   *  when loaded; falls back to the (currently dead) GLB mixer otherwise. */
  private playClip(name: string, loop: boolean): void {
    if (this.framePlayer?.isReady) {
      this.framePlayer.play(name.toLowerCase(), loop);
      return;
    }
    if (!this.mixer) return;
    const clip = this.clips.get(name.toLowerCase());
    if (!clip) return;
    if (this.currentClipName === name) return;
    // Crossfade out previous, fade in new.
    if (this.currentClipName) {
      const prev = this.clips.get(this.currentClipName.toLowerCase());
      if (prev) {
        const prevAction = this.mixer.existingAction(prev);
        if (prevAction) prevAction.fadeOut(0.18);
      }
    }
    const action = this.mixer.clipAction(clip);
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;
    action.fadeIn(0.18).play();
    this.currentClipName = name;
  }

  // ── Wave 20a — head/antenna/spine bones are now direct refs to v2Rig
  //    nodes (set at construction). The v1 GLB resolve* helpers are removed
  //    because their traversal was specific to the old hand-rigged GLB; v2's
  //    skeleton has named handles available immediately. Pet-affect's body-
  //    material tinting uses v2Rig's shared skinMaterial directly (Wave 20b).

  /** Stash original emissive colour/intensity per material so clearPetAffect
   *  can restore them. Stored on the material itself via userData so we don't
   *  need a parallel map. */
  private beginPetAffect(): void {
    for (const mat of this.bodyMaterials) {
      if (mat.userData.cosmoPetOrigEmissiveSet) continue;
      mat.userData.cosmoPetOrigEmissiveSet = true;
      mat.userData.cosmoPetOrigEmissive = mat.emissive.clone();
      mat.userData.cosmoPetOrigEmissiveIntensity = mat.emissiveIntensity ?? 1;
    }
  }

  /** Per-frame: apply blush tint + antenne tilt while pet-affect is active.
   *  Outside the window this is a no-op (and clears stale tint if needed). */
  private applyPetAffect(): void {
    const remaining = this.pettingUntil - this.t;
    if (remaining <= 0) return;
    // Phase 0..1 across PET_AFFECT_DURATION_S.
    const phase = 1 - Math.max(0, Math.min(1, remaining / PET_AFFECT_DURATION_S));
    // Sine-bell intensity profile so blush fades in + out gracefully.
    const bell = Math.sin(phase * Math.PI);

    // Blush: lerp emissive toward saffron + scale intensity by bell.
    for (const mat of this.bodyMaterials) {
      const origCol = mat.userData.cosmoPetOrigEmissive as THREE.Color | undefined;
      const origInt = (mat.userData.cosmoPetOrigEmissiveIntensity as number | undefined) ?? 1;
      if (!origCol) continue;
      mat.emissive.copy(origCol).lerp(new THREE.Color(PET_BLUSH_COLOR), bell);
      mat.emissiveIntensity = origInt + PET_BLUSH_INTENSITY * bell;
    }

    // Antenne tilt: ±PET_ANTENNA_TILT_RAD oscillating 2× per pet-window so the
    // emote reads as a "happy nod". 2 cycles = sin(2*PI*phase).
    if (this.antennaBone && this.antennaRestQuat) {
      const tilt = Math.sin(phase * Math.PI * 2) * PET_ANTENNA_TILT_RAD;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
      this.antennaBone.quaternion.copy(this.antennaRestQuat).multiply(q);
    }
  }

  /** Restore body-material emissive + antenne rest-pose at end-of-pet. */
  private clearPetAffect(): void {
    for (const mat of this.bodyMaterials) {
      const origCol = mat.userData.cosmoPetOrigEmissive as THREE.Color | undefined;
      const origInt = (mat.userData.cosmoPetOrigEmissiveIntensity as number | undefined) ?? 1;
      if (origCol) {
        mat.emissive.copy(origCol);
        mat.emissiveIntensity = origInt;
      }
      mat.userData.cosmoPetOrigEmissiveSet = false;
    }
    if (this.antennaBone && this.antennaRestQuat) {
      this.antennaBone.quaternion.copy(this.antennaRestQuat);
    }
  }

  /** Apply MotionController-driven head-yaw/pitch on top of the current clip
   *  rotation. Called per-frame from main.ts. Safe to call when paused or
   *  when no head-bone was found — both branches are no-ops. */
  applyMotion(motion: MotionController): void {
    if (this.paused) return;
    const targetYaw = motion.getPanX() * HEAD_YAW_MAX;
    const targetPitch = -motion.getPanY() * HEAD_PITCH_MAX;
    this.headYaw += (targetYaw - this.headYaw) * HEAD_LERP;
    this.headPitch += (targetPitch - this.headPitch) * HEAD_LERP;

    if (this.headBone && this.headRestQuat) {
      // Compose: rest-quat * yaw(Y) * pitch(X). Mixer has already written
      // its clip-driven rotation into headBone before this call (mixer.update
      // happens earlier in update()), so we replace it with rest-derived
      // base. The clip-pose is acceptable to lose for the head specifically
      // because most idle clips barely animate the head.
      const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.headYaw);
      const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.headPitch);
      this.headBone.quaternion.copy(this.headRestQuat).multiply(yawQ).multiply(pitchQ);
    } else if (this.fallback2D) {
      // 2D fallback — rotate the entire root very subtly so the player still
      // gets a "Cosmo is looking at me" cue. Half magnitude so it doesn't
      // look like he's spinning.
      this.root.rotation.y = this.headYaw * 0.5;
      this.root.rotation.x = this.headPitch * 0.5;
    }
  }

  // ── Sprint 17E — AI bridge ──────────────────────────────────────────────

  /** Wire a CosmoAI to this agent. The AI ticks externally; CosmoAgent reads
   *  its directive each frame via applyAI(). Pass `null` to detach. */
  attachAI(ai: CosmoAI | null): void {
    this.ai = ai;
  }

  /** Per-frame AI consumer. Called from main.ts AFTER cosmoAgent.update() so
   *  the AI's directive lerps Cosmo's worldX/Z toward the goal smoothly,
   *  on top of the state-machine's own pose work. The AI never overrides
   *  Sprint 17D's special states (walking-to / bouncing / petted) or
   *  Sprint 15B's falling state — those own Cosmo exclusively.
   *
   *  The `ai` argument is optional — when omitted we read from the AI
   *  attached via `attachAI()`. The argument-form is preserved for tests
   *  that stub a fake AI. */
  applyAI(ai?: CosmoAI): void {
    if (this.paused) return;
    const source = ai ?? this.ai;
    if (!source) return;
    const d: AIDirective = source.getDirective();
    if (!d.active) {
      // Decay AI bone hints back toward 0 so we don't leave a stale tilt
      // when the user comes back.
      this.aiHeadYaw += (0 - this.aiHeadYaw) * CosmoAgent.AI_BONE_LERP;
      this.aiSpineBend += (0 - this.aiSpineBend) * CosmoAgent.AI_BONE_LERP;
      // Sprint 17G — also decay the slow-breath base back to 1 so the mixer
      // returns to normal speed when the user comes back from sleep.
      this.aiTimeScaleBase += (1 - this.aiTimeScaleBase) * 0.05;
      this.applyAIBoneHints();
      return;
    }

    // Bail out of AI-driven position chase if a Sprint 17D / 15B special
    // state owns the agent — those own X/Z exclusively.
    const ownedByOtherSprint =
      this.state === 'walking-to' ||
      this.state === 'bouncing' ||
      this.state === 'petted' ||
      this.state === 'falling' ||
      this.state === 'jumping' ||
      this.state === 'ducking' ||
      this.state === 'dancing' ||
      this.state === 'using'; // Wave 28 — a visit owns him; the AI must not drag him off

    if (!ownedByOtherSprint) {
      // Lerp worldX/Z toward AI target (anchored Y; jumping is owned elsewhere).
      const dx = d.targetX - this.worldX;
      const dz = d.targetZ - this.worldZ;
      this.worldX += dx * CosmoAgent.AI_POS_LERP;
      this.worldZ += dz * CosmoAgent.AI_POS_LERP;
      // Face direction of travel so the walk-cycle reads correctly.
      if (Math.abs(dx) > 0.005) this.facing = dx >= 0 ? 1 : -1;
      // Crossfade to AI's clip suggestion. playClip is a no-op if the
      // requested clip is already current.
      this.playClip(d.clip, d.clip === 'idle' || d.clip === 'sit');
      // Slow-breath = sleep state — quarter-speed the mixer. We write to
      // aiTimeScaleBase (not mixer.timeScale) so update()'s FFT factor can
      // multiply on top without overwriting the AI contribution next frame.
      const targetTimeScale = d.slowBreath ? 0.4 : 1;
      this.aiTimeScaleBase += (targetTimeScale - this.aiTimeScaleBase) * 0.05;
    }

    // Smooth AI head-yaw + spine-bend on top of the bone rest-quaternion.
    this.aiHeadYaw += (d.headYawHint - this.aiHeadYaw) * CosmoAgent.AI_BONE_LERP;
    this.aiSpineBend += (d.spineBendHint - this.aiSpineBend) * CosmoAgent.AI_BONE_LERP;
    this.applyAIBoneHints();
  }

  /** Apply the smoothed AI head-yaw + spine-bend on top of clip animation.
   *  Called from applyAI() — head-bone may have already been touched by
   *  applyMotion() this frame, so we additively compose: rest * motionYaw *
   *  aiYaw. To avoid double-application, we read off the current quaternion
   *  produced by applyMotion (rest * motionYaw * motionPitch) and multiply
   *  the AI yaw on top of it. */
  private applyAIBoneHints(): void {
    if (Math.abs(this.aiHeadYaw) > 1e-4 && this.headBone) {
      // Multiplicative additive yaw on top of whatever applyMotion wrote.
      const yawQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.aiHeadYaw,
      );
      this.headBone.quaternion.multiply(yawQ);
    }
    if (this.spineBone && this.spineRestQuat && Math.abs(this.aiSpineBend) > 1e-4) {
      const bendQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        this.aiSpineBend,
      );
      // Spine writes from rest each frame because clips barely animate the
      // spine in idle/sit/wave/stretch — losing clip-spine-pose is acceptable.
      this.spineBone.quaternion.copy(this.spineRestQuat).multiply(bendQ);
    }

    // Wave 19 fallback path — only active when fixSkinWeights() opted out of
    // the reparent (IBM problem). Mirrors bone_head's world-space rotation
    // onto bone_eye_l/_r so the eyes follow head yaw/pitch even though they
    // remained siblings under cosmo_armature.
    if (this.eyeFrameCopyEnabled && this.headBone && this.eyeBoneL && this.eyeBoneR) {
      this.eyeBoneL.quaternion.copy(this.headBone.quaternion);
      this.eyeBoneR.quaternion.copy(this.headBone.quaternion);
    }
  }

  // (Wave 20a — resolveSpineBone removed. v2Rig.body is the spine-equivalent,
  //  set in the constructor.)

  /**
   * Wave 21.2 — tick the procedural CosmoAnimDirector (billboard variant).
   *
   * Called from main.ts AFTER applyMotion + applyAI so the director's anims
   * (idle-breath / walk-sway / jump-arc / climb) layer on top of the
   * state-machine + motion/AI-driven world-position writes for this frame.
   * The director also calls `rig.update(camera)` at the end of its tick so
   * the billboard plane faces the camera with the just-written transforms.
   *
   * Inputs:
   *  - `dt` is in seconds (same delta as update()).
   *  - `motion` is the MotionController. Used for legacy focusPoint
   *    derivation; the billboard director ignores focusPoint, but the
   *    AnimCtx field stays for API stability and future re-introduction
   *    of UV-parallax head-track.
   *  - `camera` is the Three.js camera the rig should billboard toward.
   *    Forwarded into AnimCtx and consumed by `rig.update(camera)`.
   *
   * Velocity is finite-differenced from worldX/Y/Z this-frame vs last-frame
   * (drives walk-sway gating + jump-arc context).
   */
  tickAnimDirector(dt: number, motion: MotionController, camera: THREE.Camera): void {
    if (this.paused) return;
    // Finite-difference velocity from worldX/Y/Z deltas this frame.
    const inv = dt > 1e-6 ? 1 / dt : 0;
    this.animVelocity.set(
      (this.worldX - this.lastWorldX) * inv,
      (this.worldY - this.lastWorldY) * inv,
      (this.worldZ - this.lastWorldZ) * inv,
    );
    this.lastWorldX = this.worldX;
    this.lastWorldY = this.worldY;
    this.lastWorldZ = this.worldZ;

    // 21.2 — focusPoint is preserved in the ctx but the billboard director
    // ignores it. Keep the derivation for callers that read AnimCtx in tests
    // or for the eventual UV-parallax head-track re-introduction.
    const source = motion.getSource();
    const hasFocus = source !== 'none';
    let focusPoint: THREE.Vector3 | null = null;
    if (hasFocus) {
      const px = motion.getPanX();
      const py = motion.getPanY();
      this.animFocusPoint.set(
        this.worldX + px * 1.5,
        this.worldY + 1.0 - py * 0.6,
        this.worldZ + 4,
      );
      focusPoint = this.animFocusPoint;
    }

    const ctx: AnimCtx = {
      velocity: this.animVelocity,
      focusPoint,
      isJumping: this.state === 'jumping',
      // Wave 22 — trampoline bounce (state 'bouncing') drives the same 0.8s
      // squash→stretch→settle arc as a jump (BOUNCE_DURATION_S === JUMP_TOTAL_S).
      isBouncing: this.state === 'bouncing',
      isClimbing: this.animClimbing,
      camera,
      // Wave 23 — when frames drive motion, the director only billboards the
      // plane (the painted frames carry breath/walk/squash themselves).
      framesOwnMotion: this.framesOwnMotion,
    };
    this.animDirector.tick(dt, ctx);
  }

  /** Wave 21 — flag setter for climb mode (no state-machine entry yet).
   *  When true the director runs the climb pose (90° body rotation + disc
   *  hand-walk). Wave 22+ will tie this to a real wall-cling state. */
  setClimbing(climbing: boolean): void {
    this.animClimbing = climbing;
  }

  destroy(): void {
    if (this.root.parent) this.root.parent.remove(this.root);
    this.animDirector.dispose();
    this.v2Rig.dispose();
    this.mixer = null;
    this.clips.clear();
    this.pendingActions = [];
    this.headBone = null;
    this.headRestQuat = null;
    this.antennaBone = null;
    this.antennaRestQuat = null;
    this.bodyMaterials = [];
    this.spineBone = null;
    this.spineRestQuat = null;
    this.ai = null;
  }

  // Loading helper for tests
  isLoaded(): boolean {
    return !this.loading;
  }
}
