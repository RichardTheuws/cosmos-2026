/**
 * universes/forest/behavior.ts — Wave 21 reference implementation.
 *
 * This is the canonical teaching example for the Cosmos-2026 Universe contract.
 * It implements all five optional exports of `UniverseBehavior` so that any
 * Claude-paired contributor copying `universes/forest/` as their starting
 * point sees how each tier wires together.
 *
 * Brand contract — NORTH-STAR.md §3:
 *   Hayao×Moebius watercolor + cosmic-luminous palette + saturated pop-accents
 *   (≤5%). No emojis. No placeholders. The world breathes, doesn't shake.
 *
 * Wave 21 — locked decisions live in
 *   `.claude/brainstorm/wave21/00-substrate-completion-plan.md` §2 and the
 *   architect's full contract in `01-substrate-architecture.md` §1.4 (the
 *   `UniverseBehavior` TypeScript interface this file satisfies).
 *
 * The reference forest's quality bar IS the substrate's bar. A contributor
 * who runs `cp -r universes/forest universes/their-name` and edits a
 * handful of strings (manifest.name, areas[].id, rooms[].id) lands a
 * working — if mood-shifted — Universe.
 */

import * as THREE from 'three';
import { ParallaxScene } from '../../src/three/parallaxScene';
import { BIOMES } from '../../src/data/biomePresets';
import { assetPath } from '../../src/core/assetPath';
import { COSMO_COO_POOL } from '../../src/audio/sfxBus';
import type { GlobalUniforms } from '../../src/core/globalUniforms';
import type { CosmoV2Rig } from '../../src/three/cosmoV2';
import type { UseApi } from '../../src/substrate/contracts/BehaviorContract';
import { DEFAULT_TRAMPOLINE_SPOTS } from '../../src/phaser/entities/TrampolineSpots';

/* ── Local copies of the substrate contract ──────────────────────────────────
 *
 * NOTE for runtime-wirer (phase 3): when `src/substrate/contracts/BehaviorContract.ts`
 * lands, this file should `import type` from there instead of redeclaring the
 * shapes inline. Until then, we duplicate the architect-doc §1.4 interfaces
 * here so this file type-checks against `npx tsc --noEmit` at the wave-21
 * sub-agent boundary (no substrate code yet exists for us to import from).
 *
 * Discrepancy flagged: architect §1.4 imports `CosmoState` from
 * `'../../src/three/cosmoV2'`, but `CosmoState` actually lives in
 * `'../../src/phaser/entities/CosmoAgent'`. Resolved: runtime-wirer should
 * either re-export from cosmoV2.ts or update the contract to import from
 * the correct location. We import from the actual location below.
 */

interface ResolvedMood {
  ambient: string;
  primary: string;
  post: { bloom: number; kaleido: number; fluid: number; chroma: number };
}

interface SubstrateCtx {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  globalUniforms: GlobalUniforms;
  assetPath: (rel: string) => string;
  universe: { id: string; name: string; displayName: string };
  area: { id: string; displayName: string; mood: ResolvedMood };
  room: { id: string; displayName: string; anchor: { x: number; y: number; z: number } };
}

interface BackgroundHandle {
  update(dt: number, u: GlobalUniforms): void;
  dispose(): void;
}

type ArrivalAnimation =
  | { kind: 'portal'; duration: number; hue?: number }
  | { kind: 'fade'; duration: number; color?: string }
  | { kind: 'drift'; from: { x: number; z: number }; duration: number }
  | { kind: 'custom'; run: (dt: number) => boolean };

interface ArrivalCtx extends SubstrateCtx {
  cosmo: CosmoV2Rig;
  // CosmoState comes from src/phaser/entities/CosmoAgent — see discrepancy note above.
  state: string;
}

interface InhabitantHandle {
  id: string;
  update(dt: number, u: GlobalUniforms): void;
  dispose(): void;
}

interface InteractableHandle {
  id: string;
  anchor: { x: number; y: number; z: number };
  range: number;
  arrival?: 'use' | 'bounce';
  update(dt: number, u: GlobalUniforms): void;
  onUse(cosmo: CosmoV2Rig, api?: UseApi): void;
  dispose(): void;
}

interface AudioHandle {
  enter(): void;
  exit(fadeMs: number): void;
  update(dt: number): void;
  dispose(): void;
}

interface TransitionDriver {
  run(dt: number): Promise<void>;
  dispose(): void;
}

interface TransitionCtx extends SubstrateCtx {
  fromMood: ResolvedMood;
  toMood: ResolvedMood;
}

interface UniverseBehavior {
  background?: (ctx: SubstrateCtx) => BackgroundHandle;
  arrival?: (ctx: ArrivalCtx) => ArrivalAnimation;
  inhabitants?: (ctx: SubstrateCtx) => InhabitantHandle[];
  interactables?: (ctx: SubstrateCtx) => InteractableHandle[];
  audio?: (ctx: SubstrateCtx) => AudioHandle;
  transitions?: {
    roomToRoom?: (ctx: TransitionCtx, fromRoomId: string, toRoomId: string) => TransitionDriver;
    areaToArea?: (ctx: TransitionCtx, fromAreaId: string, toAreaId: string) => TransitionDriver;
    universeToUniverse?: (
      ctx: TransitionCtx,
      fromUniverseId: string,
      toUniverseId: string,
    ) => TransitionDriver;
  };
}

/* ── background ───────────────────────────────────────────────────────────────
 *
 * Wave 22 (D4, 2026-05-30): the forest no longer ships a `background` override.
 *
 * History: Wave 21.2.1 made it a no-op because an earlier ForestBackground
 * constructed its OWN ParallaxScene against main.ts's canvas — two scenes, two
 * ticks, stacked decoration artifacts (the v2.2.4 scar). The fix back then was
 * "do nothing and let main.ts paint."
 *
 * D4 closes that properly. `SubstrateCtx` now exposes the single shared
 * `parallax` instance, and the substrate's DefaultBackground drives it per-room
 * from `room.biomeKey`. main.ts ticks parallax ONLY on the legacy path; on the
 * substrate path the background driver is the sole ticker (exactly once/frame).
 * So the forest simply OMITS `background` and inherits DefaultBackground — the
 * correct biome-based world paint, with no double-tick possible by construction.
 *
 * A Universe that wants a custom (non-biome) world ADDS a `background(ctx)` and
 * configures `ctx.parallax` directly. That is the override seam Ink-Ocean uses.
 */

/** Heuristic — resolve a canvas from the substrate context. The architect's
 *  SubstrateCtx (§1.4) does not include the canvas element directly; this
 *  helper finds it via the THREE.WebGLRenderer's domElement if a renderer
 *  has been parked on `scene.userData.renderer`. Runtime-wirer should
 *  formalise this into the context type. */
function resolveCanvas(ctx: SubstrateCtx): HTMLCanvasElement | null {
  const userDataRenderer = (ctx.scene.userData as { renderer?: THREE.WebGLRenderer })?.renderer;
  if (userDataRenderer && userDataRenderer.domElement instanceof HTMLCanvasElement) {
    return userDataRenderer.domElement;
  }
  // Fallback: look up by id (main.ts uses #scene-canvas).
  const el = (typeof document !== 'undefined' && document.getElementById('scene-canvas')) || null;
  return el instanceof HTMLCanvasElement ? el : null;
}

/* ── arrival ──────────────────────────────────────────────────────────────────
 *
 * Matches the current onboarding NebulaPortal exactly: saffron→ink-aubergine,
 * faded-rose-tinted nebula. Hue 0.62 = the calm-baseline preset.
 */
function forestArrival(_ctx: ArrivalCtx): ArrivalAnimation {
  return { kind: 'portal', duration: 1.4, hue: 0.62 };
}

/* ── inhabitants ──────────────────────────────────────────────────────────────
 *
 * Four weirdo decorations, ported from `src/phaser/entities/weirdoObstacleFactory.ts`.
 * Each is anchored at sensible Room-relative positions so a contributor can see
 * how to spread inhabitants across multiple Rooms inside an Area.
 *
 *   eyeball-sentry  → clearing       (looks down at the trampoline)
 *   mouth-pillar    → the-hollow     (breathes with the music underground)
 *   breathing-portal → deep-grove    (sits at the far edge per rooms.json)
 *   floating-star   → clearing       (mid-air sparkle near the trampoline)
 *
 * Each handle owns its own THREE.Group with billboarded textured plane.
 * Update animates a per-inhabitant idle-bob + special-case (mouth-pillar
 * frame-cycle, breathing-portal subtle scale-pulse).
 */
interface InhabitantSpec {
  id: string;
  /** Which room this inhabitant lives in. Substrate spawns only the inhabitants
   *  whose room matches the active room — preventing all 4 from stacking in the
   *  same scene at once (Wave 21.2 finish). */
  room: 'clearing' | 'deep-grove' | 'the-hollow';
  textureRel: string;
  width: number;
  height: number;
  anchor: { x: number; y: number; z: number };
  yOffset: number;
  bobAmplitude: number;
  bobFreq: number;
}

const FOREST_INHABITANTS: readonly InhabitantSpec[] = [
  // The Clearing — eyeball-sentry watches the trampoline + floating-star sparkles overhead.
  {
    id: 'eyeball-sentry',
    room: 'clearing',
    textureRel: 'assets/objects/eyeball-sentry.webp',
    width: 0.7,
    height: 0.7,
    anchor: { x: 1.6, y: 0.6, z: -3.2 },
    yOffset: 1.1,
    bobAmplitude: 0.02,
    bobFreq: 0.6,
  },
  {
    id: 'floating-star',
    room: 'clearing',
    textureRel: 'assets/objects/floating-star.webp',
    width: 0.5,
    height: 0.5,
    anchor: { x: 0.2, y: 0.9, z: -1.4 },
    yOffset: 0.6,
    bobAmplitude: 0.06,
    bobFreq: 1.1,
  },
  // Deep Grove — breathing-portal at the far edge.
  {
    id: 'breathing-portal',
    room: 'deep-grove',
    textureRel: 'assets/objects/breathing-portal.webp',
    width: 1.0,
    height: 1.0,
    anchor: { x: -1.4, y: 0.6, z: -3.0 },
    yOffset: 0.7,
    bobAmplitude: 0.04,
    bobFreq: 0.4,
  },
  // Wave 21.2.4 (2026-05-05): mouth-pillar inhabitant retired. Sprint 15C
  // built mouth-pillar-sheet.png as 4 separately-painted frames composited
  // horizontally. Even with clean BiRefNet alpha (Wave 21.2.3), cycling
  // through them produces a flickering stack of non-coherent rectangles —
  // the four frames are different illustrations, not animation-coherent
  // poses of one character. Per NORTH-STAR §4: stop patching, retire. The
  // hollow is intentionally quiet for now (Cosmo + parallax). A single-pose
  // mouth-pillar painting can land in a future wave when there's budget for
  // a coherent regen.
];

class ForestInhabitant implements InhabitantHandle {
  readonly id: string;
  private group: THREE.Group;
  private mesh: THREE.Mesh;
  private texture: THREE.Texture;
  private baseY: number;
  private phase: number;
  private mouthFrameCycle: ((u: GlobalUniforms) => void) | null = null;
  private timeS = 0;

  constructor(
    private scene: THREE.Scene,
    private spec: InhabitantSpec,
  ) {
    this.id = spec.id;
    this.phase = Math.random() * Math.PI * 2;
    this.baseY = spec.anchor.y + spec.yOffset;

    const loader = new THREE.TextureLoader();
    this.texture = loader.load(assetPath(spec.textureRel));
    this.texture.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(spec.width, spec.height);
    let mat: THREE.MeshBasicMaterial;

    if (spec.id === 'mouth-pillar') {
      // 4-frame horizontal sprite-sheet — set up texture repeat/offset.
      const frames = 4;
      const inv = 1 / frames;
      this.texture.wrapS = THREE.ClampToEdgeWrapping;
      this.texture.wrapT = THREE.ClampToEdgeWrapping;
      this.texture.repeat.set(inv, 1);
      this.texture.offset.set(0, 0);
      mat = new THREE.MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        // Wave 21.2 finish — same bump as the non-mouth-pillar branch.
        alphaTest: 0.5,
      });
      // Frame-cycler — driven by globalUniforms FFT energy (rough proxy for
      // audio-clock; the original weirdoObstacleFactory uses the audio bridge
      // directly, but ctx doesn't expose that). Energy → frame index.
      const tex = this.texture;
      this.mouthFrameCycle = (u: GlobalUniforms) => {
        // Take a 4-bin slice of FFT energy (low end) → ping-pong frame.
        const energy =
          (u.audioFFT[0] || 0) + (u.audioFFT[1] || 0) + (u.audioFFT[2] || 0) + (u.audioFFT[3] || 0);
        // Energy clamps to ~4 max; we push it into 6 ping-pong steps.
        const step = Math.floor((energy + this.timeS * 1.4) % (frames * 2 - 2));
        const frame = step < frames ? step : frames * 2 - 2 - step;
        tex.offset.x = frame * inv;
      };
    } else {
      mat = new THREE.MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        // Wave 21.2 finish — bumped from 0.05 → 0.5 so half-transparent
        // dark borders of Sprint 15C inhabitant assets get culled out
        // entirely (live UAT 2026-05-05 showed visible dark rectangles).
        alphaTest: 0.5,
      });
    }

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.y = spec.yOffset;

    this.group = new THREE.Group();
    this.group.position.set(spec.anchor.x, spec.anchor.y, spec.anchor.z);
    this.group.add(this.mesh);

    this.scene.add(this.group);
  }

  update(dt: number, u: GlobalUniforms): void {
    this.timeS += dt;
    if (this.spec.bobAmplitude > 0) {
      const bob = Math.sin((this.timeS + this.phase) * this.spec.bobFreq) * this.spec.bobAmplitude;
      this.mesh.position.y = this.spec.yOffset + bob;
    }
    if (this.mouthFrameCycle) {
      this.mouthFrameCycle(u);
    }
    // breathing-portal — subtle scale pulse so it reads as alive without shaking.
    if (this.spec.id === 'breathing-portal') {
      const pulse = 1 + 0.04 * Math.sin(this.timeS * 0.9);
      this.mesh.scale.setScalar(pulse);
    }
    void this.baseY; // reserved for future world-space bob; suppress unused-locals
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
    this.texture.dispose();
  }
}

function forestInhabitants(ctx: SubstrateCtx): InhabitantHandle[] {
  // Wave 21.2 finish — only spawn inhabitants for the active room. Without
  // this filter all 4 spawned in every room and stacked visually (live UAT
  // 2026-05-05 showed this as 4 painted-rectangle planes overlapping Cosmo).
  const activeRoom = ctx.room.id;
  return FOREST_INHABITANTS.filter((spec) => spec.room === activeRoom).map(
    (spec) => new ForestInhabitant(ctx.scene, spec),
  );
}

/* ── interactables ────────────────────────────────────────────────────────────
 *
 * The trampoline. Per NORTH-STAR §3 it is the canonical delight-loop. Anchored
 * at the Clearing's center (rooms.json: "The trampoline lives here").
 *
 * Ported from `src/phaser/entities/TrampolineSpots.ts` but simplified: a single
 * hand-authored spot at the room anchor, range 2.0 world-units, onUse triggers
 * a jump-arc on Cosmo's root.
 */
class ForestTrampoline implements InteractableHandle {
  readonly id = 'trampoline';
  readonly anchor: { x: number; y: number; z: number };
  readonly range = 2.0;
  /** Wave 27 — arrival runs CosmoAgent's bounce-combo (the Wave-22 "go wild"
   *  loop), not a plain use. */
  readonly arrival = 'bounce' as const;

  constructor() {
    // Wave 27 — main.ts already renders the hero trampoline in the forest
    // (`TrampolineSpots`, gated to this universe). This handle owns NO second
    // mesh (the pre-27 code built a duplicate at the same spot); it only
    // declares the anchor so the InteractionDirector can pick + route it.
    const spot = DEFAULT_TRAMPOLINE_SPOTS[0];
    this.anchor = { x: spot.x, y: spot.y, z: spot.z };
  }

  update(_dt: number, _u: GlobalUniforms): void {
    /* mesh + hover-bob live on main.ts's TrampolineSpots */
  }

  /** Arrival = bounce-combo (see `arrival`). We only add the sound. */
  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    api?.sfx('jump');
  }

  dispose(): void {
    /* owns nothing */
  }
}

/* ── SunbeamPatch (NEW, Wave 24) ───────────────────────────────────────────────
 *
 * Clearing's second, *slower* delight-loop (vs. the trampoline's energy). A
 * painted shaft of warm light spilling through a canopy gap onto the moss — a
 * mushroom-cream/saffron-glow watercolor pool on the ground with faint drifting
 * dust-motes. Calm baseline = the beam's intensity breathes ±4% on a ~9s sine
 * (matching the breathing-portal cadence — the world breathes). Event-peak =
 * Cosmo walks in and `stretch`es (waking/limbering in the warmth), settling to
 * `idle` inside the beam; a re-use makes him `look` up at the canopy gap.
 *
 * Rendered as additive glow planes over the SHARED parallax world — no second
 * ParallaxScene (the v2.2.4 double-tick scar). A flat ground-decal plane (the
 * pool) + a soft vertical shaft plane, both AdditiveBlending so they read as
 * light, not as a sticker.
 *
 * onUse drives a NAMED clip (`stretch`, then `look` on re-use). The CosmoV2Rig
 * does not yet expose a clip scheduler (CosmoAnimDirector lands later — see the
 * trampoline's onUse note), so we drive the procedural channels the rig DOES
 * expose (a gentle vertical lift + a soft rollZ "limber" sway) as the bridge,
 * and record the clip intent here. ANIMATION-REQUEST: none new — `stretch` +
 * `look` are shipped clips; this only needs the director to honor a named-clip
 * request from onUse.
 */
class SunbeamPatch implements InteractableHandle {
  readonly id = 'sunbeam-patch';
  readonly anchor: { x: number; y: number; z: number };
  readonly range = 1.6;

  private group: THREE.Group;
  private poolMesh: THREE.Mesh;
  private shaftMesh: THREE.Mesh;
  private poolTex: THREE.Texture;
  private timeS = 0;
  private useCount = 0;

  constructor(
    private scene: THREE.Scene,
    room: SubstrateCtx['room'],
  ) {
    // ~x+2.5 of the room anchor, on the ground, mid-depth near the trampoline.
    // Absolute stage space (Wave 27 — like every inhabitant; room.anchor is
    // metadata, Cosmo's home is the stage origin).
    // Phone-portrait first (Wave 27 measurement, FOV 35 / cam z=6): at
    // z=−3 only |x| ≤ 1.3 is on screen. Left-back of the trampoline.
    this.anchor = { x: -1.0, y: 0, z: -3.1 };
    void room;

    const loader = new THREE.TextureLoader();
    this.poolTex = loader.load(assetPath('assets/objects/sunbeam-patch.webp'));
    this.poolTex.colorSpace = THREE.SRGBColorSpace;

    // Ground pool — lies flat on the moss, additive so it reads as warm light.
    const poolGeo = new THREE.PlaneGeometry(2.2, 1.4);
    const poolMat = new THREE.MeshBasicMaterial({
      map: this.poolTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    });
    this.poolMesh = new THREE.Mesh(poolGeo, poolMat);
    this.poolMesh.rotation.x = -Math.PI / 2; // lay flat on the ground
    this.poolMesh.position.y = 0.01;

    // Soft vertical shaft — a faint saffron column from the canopy gap. Reuses
    // the same painted texture, stretched up, very low opacity so it's a hint.
    const shaftGeo = new THREE.PlaneGeometry(1.4, 3.4);
    const shaftMat = new THREE.MeshBasicMaterial({
      map: this.poolTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      opacity: 0.22,
    });
    this.shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    this.shaftMesh.position.set(0, 1.7, -0.2);

    this.group = new THREE.Group();
    this.group.position.set(this.anchor.x, this.anchor.y, this.anchor.z);
    this.group.add(this.poolMesh);
    this.group.add(this.shaftMesh);
    this.scene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    // Calm baseline: the beam's intensity breathes ±4% on a ~9s sine — the
    // world breathes, it does not shake. Both planes share one slow phase.
    const breathe = 1 + 0.04 * Math.sin((this.timeS * Math.PI * 2) / 9);
    const poolMat = this.poolMesh.material as THREE.MeshBasicMaterial;
    const shaftMat = this.shaftMesh.material as THREE.MeshBasicMaterial;
    poolMat.opacity = 0.85 * breathe;
    shaftMat.opacity = 0.22 * breathe;
  }

  /**
   * Event-peak. Intended clip: first use → `stretch` (settle to `idle` in-beam);
   * re-use → `look` (up at the canopy gap). CosmoAnimDirector will own the named
   * clip drive; until then we bridge through the rig's procedural channels.
   */
  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    this.useCount += 1;
    if (this.useCount % 2 === 1) {
      // Wave 27 — the real clip: limber up in the warmth, settle to idle in-beam.
      api?.playClip('stretch', { holdS: 4.2 });
      api?.sfx(COSMO_COO_POOL[Math.floor(Math.random() * COSMO_COO_POOL.length)]);
    } else {
      // Re-use: look up at the canopy gap.
      api?.playClip('look', { holdS: 3.4 });
    }
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.poolMesh.geometry.dispose();
    this.shaftMesh.geometry.dispose();
    (this.poolMesh.material as THREE.Material).dispose();
    (this.shaftMesh.material as THREE.Material).dispose();
    this.poolTex.dispose();
    void this.scene;
  }
}

/* ── EchoCap (NEW, Wave 24) ─────────────────────────────────────────────────────
 *
 * Deep Grove's delight-loop — the contemplative trampoline-analog. A cluster of
 * painted glow-cap mushrooms (moss-sage caps, luminous undersides). Calm
 * baseline = each cap pulses its underglow on a slow offset sine (the breathing
 * world). Event-peak = Cosmo `duck`s to press a hand-disc to the nearest cap's
 * underside (suction-cup DNA), then `look`s up as the light blooms: the touched
 * cap flares pop-cyan and a soft cascade lights its neighbours in sequence,
 * settling over ~3s. Repeatable; each touch re-lights. Never scored, never a
 * combo — a gentle call-and-response.
 *
 * This handle owns the additive glow-cap planes itself (Option A underglow — see
 * the design doc: the Deep Grove's cool dim is authored in room CONTENT over the
 * shared `slow-bloom` background, NOT a new biome). It paints on the SHARED
 * scene — no second ParallaxScene.
 *
 * ANIMATION-REQUEST: none new — `duck` + `look` cover the crouch-and-touch.
 */
interface GlowCap {
  mesh: THREE.Mesh;
  basePhase: number; // slow-pulse phase offset
  flare: number; // 0..1 cascade-lit flare, decays over ~3s
}

class EchoCap implements InteractableHandle {
  readonly id = 'echo-cap';
  readonly anchor: { x: number; y: number; z: number };
  readonly range = 1.8;

  private group: THREE.Group;
  private tex: THREE.Texture;
  private caps: GlowCap[] = [];
  private timeS = 0;

  constructor(
    private scene: THREE.Scene,
    room: SubstrateCtx['room'],
  ) {
    // ~x-1.0 relative to room anchor (in front of the breathing-portal at x-1.4).
    // Absolute stage space (Wave 27 bug fix: room.anchor.x is −12 for the
    // deep grove, which used to put the caps off-screen at x ≈ −13).
    this.anchor = { x: -1.0, y: 0, z: -1.5 };
    void room;

    const loader = new THREE.TextureLoader();
    this.tex = loader.load(assetPath('assets/objects/glow-cap-cluster.webp'));
    this.tex.colorSpace = THREE.SRGBColorSpace;

    this.group = new THREE.Group();
    this.group.position.set(this.anchor.x, this.anchor.y, this.anchor.z);

    // A short row of caps fanning left of the touch-cap; the nearest (index 0)
    // is what Cosmo presses, the rest answer in cascade. Additive so they read
    // as light blooming from the ground up — the Option-A underglow source.
    const layout: ReadonlyArray<{ x: number; z: number; s: number }> = [
      { x: 0.0, z: 0.0, s: 0.9 },
      { x: -0.8, z: -0.3, s: 0.7 },
      { x: -1.5, z: -0.1, s: 0.6 },
      { x: -2.2, z: -0.4, s: 0.5 },
    ];
    for (let i = 0; i < layout.length; i++) {
      const l = layout[i];
      const geo = new THREE.PlaneGeometry(0.9 * l.s, 0.9 * l.s);
      const mat = new THREE.MeshBasicMaterial({
        map: this.tex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(l.x, 0.25 * l.s, l.z);
      this.group.add(mesh);
      this.caps.push({ mesh, basePhase: i * 0.9, flare: 0 });
    }

    this.scene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    for (const cap of this.caps) {
      // Calm-baseline slow pulse — offset per cap so the cluster breathes
      // out of phase (no single throb). ~7s period.
      const pulse = 0.45 + 0.12 * Math.sin((this.timeS * Math.PI * 2) / 7 + cap.basePhase);
      // Event-peak flare decays toward 0 over ~3s; adds pop-cyan-hot brightness.
      if (cap.flare > 0) cap.flare = Math.max(0, cap.flare - dt / 3);
      const mat = cap.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(1, pulse + cap.flare * 0.6);
      const flareScale = 1 + cap.flare * 0.12;
      cap.mesh.scale.setScalar(flareScale);
    }
  }

  /**
   * Event-peak. Intended clip: `duck` (crouch + hand-disc press) → `look` (up as
   * the light blooms). The touched cap flares, then neighbours cascade. The
   * CosmoV2Rig clip scheduler lands later (see trampoline note); bridge through
   * the procedural channels for now.
   */
  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    // Wave 27 — crouch + press the hand-disc to the cap (real `duck` clip),
    // the caps answer in cascade, a soft cling rings.
    api?.playClip('duck', { holdS: 3.6 });
    api?.sfx('cling');
    // Light the touched cap hard, then cascade down the line with a staggered
    // ramp so the neighbours answer in sequence (settles via update's decay).
    for (let i = 0; i < this.caps.length; i++) {
      this.caps[i].flare = Math.max(this.caps[i].flare, 1 - i * 0.18);
    }
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    for (const cap of this.caps) {
      cap.mesh.geometry.dispose();
      (cap.mesh.material as THREE.Material).dispose();
    }
    this.tex.dispose();
    void this.scene;
  }
}

/* ── BreathingPortalGreeting (NEW, Wave 24) ─────────────────────────────────────
 *
 * The LIVE `breathing-portal` inhabitant promoted to a *gentle* interactable.
 * onUse → Cosmo walks over and `wave`s (the "hello to an inhabitant" reading);
 * the portal's inhale-apex syncs to his wave and glints pop-cyan once. NO
 * traversal — this is a greeting, not a door (the real Universe↔Universe portal
 * is the ceremonial nebula-portal; this in-world portal is decor that
 * ACKNOWLEDGES you).
 *
 * Critical (v2.2.4 double-tick scar): this handle does NOT construct a second
 * portal plane. It READS the existing inhabitant's breathing cadence by
 * recomputing the SAME pulse phase the `breathing-portal` ForestInhabitant uses
 * (`1 + 0.04 * sin(t * 0.9)`) from a shared clock, so the greeting can fire its
 * cyan glint on the inhale-apex without owning a mesh. It carries no geometry of
 * its own beyond a tiny transient glint sprite that it adds/removes around the
 * wave; calm-baseline owns nothing.
 *
 * ANIMATION-REQUEST: none — `wave` is shipped.
 */
class BreathingPortalGreeting implements InteractableHandle {
  readonly id = 'breathing-portal-greeting';
  readonly anchor: { x: number; y: number; z: number };
  readonly range = 1.6;

  // The breathing-portal inhabitant lives at this room-relative anchor
  // (FOREST_INHABITANTS 'breathing-portal'). We walk Cosmo to just in front of
  // it. We do NOT add a plane here.
  private static readonly PORTAL_ANCHOR = { x: -1.4, y: 0.6, z: -3.0 };

  private timeS = 0;
  private greetActiveFor = 0; // seconds remaining on an active greeting glint

  constructor(private scene: THREE.Scene) {
    // Stand a touch in front of the portal (toward the camera at +z).
    this.anchor = {
      x: BreathingPortalGreeting.PORTAL_ANCHOR.x,
      y: BreathingPortalGreeting.PORTAL_ANCHOR.y - 0.6,
      z: BreathingPortalGreeting.PORTAL_ANCHOR.z + 1.4,
    };
    void this.scene;
  }

  /** Read the SAME pulse the breathing-portal inhabitant uses (1 + 0.04*sin(t*0.9))
   *  so the greeting can detect the inhale-apex without owning the mesh. */
  private portalAtApex(): boolean {
    // Apex when the sine derivative crosses zero going positive→max, i.e. near
    // sin(t*0.9) ≈ 1. Cheap proxy: value within the top 5% of the cycle.
    return Math.sin(this.timeS * 0.9) > 0.95;
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    if (this.greetActiveFor > 0) {
      this.greetActiveFor = Math.max(0, this.greetActiveFor - dt);
      // The cyan glint is sympathy-fired on the next inhale-apex while a greeting
      // is active — a single soft pop-cyan flash synced to the portal's breath.
      // (The visible glint is layered by the CosmoAnimDirector / portal handle
      // when wired; here we only gate the timing read off the shared pulse.)
      void this.portalAtApex();
    }
  }

  /**
   * Event-peak. Intended clip: `wave`. The portal's inhale-apex syncs a single
   * pop-cyan glint (gated in update via the shared-pulse read). No traversal.
   */
  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    // Wave 27 — the real `wave` clip + a coo; the portal answers on its apex.
    api?.playClip('wave', { holdS: 3.0 });
    api?.sfx(COSMO_COO_POOL[Math.floor(Math.random() * COSMO_COO_POOL.length)]);
    this.greetActiveFor = 1.4; // hold the greeting window for ~one breath
  }

  dispose(): void {
    /* Owns no mesh — the breathing-portal inhabitant owns the plane. Nothing to
     *  free (the v2.2.4 scar: never a second plane, never a second tick). */
  }
}

/* ── SporePuddle (NEW, Wave 27 — Chapter 1) ────────────────────────────────────
 *
 * A shallow pool of luminous spore-water on the clearing's moss, left of the
 * trampoline. Calm baseline = a slow shimmer (opacity sine, ~6s) and a lazy
 * drift of the painted surface (texture offset). Event-peak = Cosmo steps in
 * and `dance`s — the spores lift with him: the pool brightens and a ring of
 * small spore-motes (additive sprites) rises and fades over ~3s. No score, no
 * combo — a puddle you can't not splash in.
 */
class SporePuddle implements InteractableHandle {
  readonly id = 'spore-puddle';
  readonly anchor = { x: -0.55, y: 0, z: -1.1 }; // front-left; stays in frame through the ±1.6 camera pan
  readonly range = 1.6;

  private group = new THREE.Group();
  private tex: THREE.Texture;
  private pool: THREE.Mesh;
  private motes: THREE.Sprite[] = [];
  private moteTex: THREE.Texture;
  private timeS = 0;
  private splash = 0; // 0..1 event-peak, decays over ~3s

  constructor(private scene: THREE.Scene) {
    const loader = new THREE.TextureLoader();
    this.tex = loader.load(assetPath('assets/objects/spore-puddle.webp'));
    this.tex.colorSpace = THREE.SRGBColorSpace;

    // Additive-on-black like the sunbeam (BiRefNet blanks soft glows — the
    // Wave-24 matte lesson): black reads transparent under additive blend.
    const geo = new THREE.PlaneGeometry(1.8, 0.9); // 2:1 painted crop
    const mat = new THREE.MeshBasicMaterial({
      map: this.tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      opacity: 0.92,
    });
    this.pool = new THREE.Mesh(geo, mat);
    // Tilted ~35° toward the camera (cam sits at y=1.4 looking down the z
    // axis): dead-flat it foreshortens to a glowing sliver; tilted it reads
    // as a pool, and the painted moss ring sells the "seen from above" angle.
    this.pool.rotation.x = -Math.PI / 2 + 0.6;
    this.pool.position.set(0, 0.2, 0);
    this.group.add(this.pool);

    // Spore-motes: a small radial-gradient sprite (canvas-drawn, no emoji, no
    // placeholder) reused 10×, hidden until a splash.
    this.moteTex = SporePuddle.makeMoteTexture();
    for (let i = 0; i < 10; i++) {
      const sm = new THREE.SpriteMaterial({
        map: this.moteTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
        color: 0xf4d58d, // saffron-glow
      });
      const sp = new THREE.Sprite(sm);
      sp.scale.setScalar(0.18);
      sp.visible = false;
      this.group.add(sp);
      this.motes.push(sp);
    }

    this.group.position.set(this.anchor.x, this.anchor.y, this.anchor.z);
    this.scene.add(this.group);
  }

  private static makeMoteTexture(): THREE.Texture {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,240,200,0.8)');
    grad.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    const mat = this.pool.material as THREE.MeshBasicMaterial;
    // Calm baseline: shimmer ±5% on ~6s, surface drifts very slowly.
    const shimmer = 1 + 0.05 * Math.sin((this.timeS * Math.PI * 2) / 6);
    mat.opacity = Math.min(1, 0.92 * shimmer + this.splash * 0.1);
    this.tex.offset.x = 0.01 * Math.sin(this.timeS * 0.25);
    this.tex.offset.y = 0.01 * Math.cos(this.timeS * 0.2);

    if (this.splash > 0) {
      this.splash = Math.max(0, this.splash - dt / 3);
      const lift = 1 - this.splash; // 0 → 1 over the decay
      for (let i = 0; i < this.motes.length; i++) {
        const sp = this.motes[i];
        const a = (i / this.motes.length) * Math.PI * 2 + this.timeS * 0.4;
        const r = 0.35 + lift * 0.6;
        sp.position.set(Math.cos(a) * r, 0.1 + lift * 1.4 + Math.sin(this.timeS * 3 + i) * 0.05, Math.sin(a) * r * 0.5);
        (sp.material as THREE.SpriteMaterial).opacity = Math.sin(lift * Math.PI) * 0.9;
        sp.visible = true;
      }
    } else {
      for (const sp of this.motes) sp.visible = false;
    }
  }

  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    api?.playClip('dance', { loop: true, holdS: 4.6 });
    api?.sfx('cosmo-coo-2');
    this.splash = 1;
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.pool.geometry.dispose();
    (this.pool.material as THREE.Material).dispose();
    for (const sp of this.motes) (sp.material as THREE.Material).dispose();
    this.tex.dispose();
    this.moteTex.dispose();
  }
}

/* ── NapCap (NEW, Wave 27 — Chapter 1) ─────────────────────────────────────────
 *
 * An oversized, soft mushroom cap on a short stalk at the clearing's right
 * edge, its underside a warm mushroom-cream glow. Calm baseline = the cap
 * breathes (scale ±2% on ~8s) like everything else here. Event-peak = Cosmo
 * `duck`s under it and rests in `petted` (curled, cozy — the shipped clip that
 * reads as contentment) for a few breaths; the underglow warms while he rests.
 * The slowest thing in the room — the pocket-escape's own resting place.
 */
class NapCap implements InteractableHandle {
  readonly id = 'nap-cap';
  readonly anchor = { x: 1.05, y: 0, z: -3.3 }; // right-back, on a phone too
  readonly range = 1.5;

  private group = new THREE.Group();
  private tex: THREE.Texture;
  private cap: THREE.Mesh;
  private glow: THREE.Mesh;
  private timeS = 0;
  private resting = 0; // seconds of rest remaining (drives the underglow)

  constructor(private scene: THREE.Scene) {
    const loader = new THREE.TextureLoader();
    this.tex = loader.load(assetPath('assets/objects/nap-cap.webp'));
    this.tex.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(2.0, 2.0);
    const mat = new THREE.MeshBasicMaterial({
      map: this.tex,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.cap = new THREE.Mesh(geo, mat);
    this.cap.position.set(0, 1.0, -0.4);
    this.cap.renderOrder = 5;
    this.group.add(this.cap);

    // Underglow — a flat warm pool where Cosmo curls up (additive, breathes).
    const glowGeo = new THREE.PlaneGeometry(1.8, 1.0);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xf4d58d,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.12,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.position.y = 0.011;
    this.group.add(this.glow);

    this.group.position.set(this.anchor.x, this.anchor.y, this.anchor.z);
    this.scene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    const breathe = 1 + 0.02 * Math.sin((this.timeS * Math.PI * 2) / 8);
    this.cap.scale.set(breathe, breathe, 1);
    if (this.resting > 0) this.resting = Math.max(0, this.resting - dt);
    const warm = this.resting > 0 ? 0.32 : 0.12;
    const gm = this.glow.material as THREE.MeshBasicMaterial;
    gm.opacity += (warm - gm.opacity) * Math.min(1, dt * 1.5);
  }

  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    // Duck under, then curl up. The `petted` clip is the cozy loop; the hold
    // is the longest in the room on purpose.
    api?.playClip('petted', { loop: true, holdS: 6.5 });
    api?.sfx('cosmo-coo-3');
    this.resting = 6.5;
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.cap.geometry.dispose();
    this.glow.geometry.dispose();
    (this.cap.material as THREE.Material).dispose();
    (this.glow.material as THREE.Material).dispose();
    this.tex.dispose();
  }
}

function forestInteractables(ctx: SubstrateCtx): InteractableHandle[] {
  // Spawn-gated by room anchor, mirroring how the trampoline is gated to the
  // Clearing. Each room returns only the interactables that live there; other
  // rooms fall through to the substrate's default (none).
  switch (ctx.room.id) {
    case 'clearing':
      // Chapter 1 (Wave 27): four things to do, from wild to slow —
      // trampoline (bounce) · spore-puddle (dance) · sunbeam (stretch/look) · nap-cap (rest).
      return [
        new ForestTrampoline(),
        new SporePuddle(ctx.scene),
        new SunbeamPatch(ctx.scene, ctx.room),
        new NapCap(ctx.scene),
      ];
    case 'deep-grove':
      return [new EchoCap(ctx.scene, ctx.room), new BreathingPortalGreeting(ctx.scene)];
    default:
      return [];
  }
}

/* ── transitions ──────────────────────────────────────────────────────────────
 *
 * Custom mushroom-path Room↔Room transition. The area's pathExperience.kind
 * declares "mushroom-path" — the architect contract maps unknown kinds to the
 * default biome-blend. We override the default with a 2.0s biome-blend +
 * spore-mote drifting overlay (cosmetic).
 *
 * For Wave 21 we ship the biome-blend portion; the spore-mote layer is a
 * documented TODO for Wave 22 (a small spore-mote particle system needs to
 * cohabit with the post-FX composer's render order, which is non-trivial
 * and out of reference-forest scope).
 */
class MushroomPathTransition implements TransitionDriver {
  private elapsed = 0;
  private readonly durationS = 2.0;

  constructor(
    private _ctx: TransitionCtx,
    private _from: string,
    private _to: string,
  ) {
    void this._ctx;
    void this._from;
    void this._to;
  }

  // The architect's TransitionDriver.run() returns Promise<void> and is awaited
  // by the substrate; the host advances `tick(dt)` separately. Our run() resolves
  // when elapsed >= durationS — the substrate is expected to pump tick during
  // the await via a parallel ticker (architect §3.2 step 4).
  run(_dt: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (): void => {
        const now = performance.now();
        this.elapsed = (now - start) / 1000;
        // TODO (wave22): paint spore-mote drift overlay here. The mushroom-path
        // ambient (#F5EDD8) tint should briefly multiply against the post-FX
        // output via a single fullscreen quad while motes drift hip-height.
        // Today: pure biome-blend (BiomeBlendTransition equivalent) — visually
        // identical to the substrate default.
        if (this.elapsed >= this.durationS) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  dispose(): void {
    /* MushroomPathTransition is fire-and-forget; the rAF chain unwinds itself
     *  once the promise resolves. No GPU resources to free. */
  }
}

function forestRoomToRoom(
  ctx: TransitionCtx,
  fromRoomId: string,
  toRoomId: string,
): TransitionDriver {
  return new MushroomPathTransition(ctx, fromRoomId, toRoomId);
}

/* ── audio — INTENTIONALLY OMITTED (mirrors `background`) ──────────────────────
 *
 * The per-room ambient bed (clearing → clearing-bloom-loop, deep-grove →
 * deep-grove-loop) is declared in rooms.json (`audioBed`) and swapped on
 * room-enter by the substrate's DefaultAudio driver (architect §7.6, at 0.45
 * volume through the AudioFFTBridge). We do NOT export an `audio` handle: per
 * the §1.4 detection rule, providing `audio` REPLACES DefaultAudio rather than
 * delegating to it, so a no-op handle silently kills the bed swap — exactly the
 * regression found in live UAT (2026-06-07): every substrate universe fell back
 * to the title theme because forest's no-op stub was copied everywhere.
 *
 * The correct teaching shape is the SAME as `background` above: omit the key to
 * inherit the default driver; only export `audio` when you genuinely replace
 * the bed logic (and then YOU must call ctx.audioBridge.setMusicTrack). Event
 * SFX belong on the SFX-emit hook, not on a music driver that shadows the bed.
 */

/* ── default export ──────────────────────────────────────────────────────────
 *
 * The substrate dynamically imports `behavior.ts` and tests `typeof mod[key]`
 * for each optional export (architect §1.4 detection rule). Missing keys fall
 * back to substrate defaults. We ship every export so the forest is the
 * complete teaching example.
 */
const forestBehavior: UniverseBehavior = {
  // background — INTENTIONALLY OMITTED. The forest is biome-based, so it falls
  // through to the substrate's DefaultBackground, which drives the single shared
  // ParallaxScene (ctx.parallax) from each room's `biomeKey`. A Universe that
  // needs a custom, non-biome world paints it by ADDING a `background(ctx)` that
  // configures `ctx.parallax` (Wave 22 D4 contract extension) — see the note
  // above. Never construct a second ParallaxScene (the v2.2.4 double-tick scar).
  arrival: forestArrival,
  inhabitants: forestInhabitants,
  interactables: forestInteractables,
  // audio — INTENTIONALLY OMITTED (see note above): DefaultAudio swaps each
  // room's `audioBed`. A custom audio driver replaces it, not augments it.
  transitions: {
    roomToRoom: forestRoomToRoom,
    // areaToArea + universeToUniverse omitted — substrate uses defaults
    // (gradient-cut + portal respectively, per architect §4.2 / §4.3).
  },
};

export default forestBehavior;
export type {
  UniverseBehavior,
  SubstrateCtx,
  BackgroundHandle,
  ArrivalAnimation,
  ArrivalCtx,
  InhabitantHandle,
  InteractableHandle,
  AudioHandle,
  TransitionDriver,
  TransitionCtx,
  ResolvedMood,
};
