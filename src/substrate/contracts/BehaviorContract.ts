/**
 * BehaviorContract — Wave 21 substrate.
 *
 * The TypeScript contract every Universe `behavior.ts` is type-checked against.
 * Mirrors `.claude/brainstorm/wave21/01-substrate-architecture.md` §1.4 with
 * runtime-wirer extensions identified during phase-2 review:
 *
 *   - SubstrateCtx exposes canvas, audioBridge, motion, renderer (punch-list #6).
 *     The architect's pure-THREE context worked for the doc but reference-forest
 *     surfaced that ParallaxScene needs the canvas, AudioFFTBridge powers the
 *     mouth-pillar audio-clock, MotionController feeds parallax pan, and
 *     drivers may want a renderer reference for off-screen passes.
 *   - InhabitantHandle gains an OPTIONAL `anchor` field (punch-list #2). The
 *     substrate may use it for proximity-AI or transition-ordering hints; if
 *     absent everything falls back to the previous behavior. Backwards-compat.
 *   - CosmoState (punch-list #5) is re-exported from CosmoAgent here so authors
 *     can `import type { CosmoState } from '...'` without reaching into Phaser.
 */
import type * as THREE from 'three';
import type { GlobalUniforms } from '../../core/globalUniforms';
import type { CosmoV2Rig } from '../../three/cosmoV2';
import type { AudioFFTBridge } from '../../audio/audioFFTBridge';
import type { MotionController } from '../../core/motionController';
import type { ParallaxScene } from '../../three/parallaxScene';

export type { CosmoState } from '../../phaser/entities/CosmoAgent';

/* ── Shared context ─────────────────────────────────────────────────────── */

export interface SubstrateCtx {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  globalUniforms: GlobalUniforms;
  /** Resolves a path relative to this universe's folder. Sandboxed —
   *  attempts to escape (`../`) are normalized away (with the explicit
   *  `../../public/...` allowlist for the legacy reference forest, see
   *  PreloadManager). */
  assetPath: (rel: string) => string;
  /** Universe metadata, parsed from manifest.json. */
  universe: { id: string; name: string; displayName: string };
  /** Active Area metadata (post mood-override merge). */
  area: { id: string; displayName: string; mood: ResolvedMood };
  /** Active Room metadata. */
  room: { id: string; displayName: string; anchor: { x: number; y: number; z: number } };
  /** The canvas the parallax renderer paints to. Drivers needing a canvas
   *  reference (ParallaxScene constructor) read it from here. Punch-list #6. */
  canvas: HTMLCanvasElement;
  /** Audio FFT bridge — drives mouth-pillar sprite-sheet cycling and any
   *  audio-reactive inhabitant. `audioBridge.audioFFT` is the read surface
   *  (mirrored into `globalUniforms.audioFFT` per frame). Punch-list #6/#8. */
  audioBridge: AudioFFTBridge;
  /** Motion source for camera-pan derivation + head-track focus. Drivers
   *  consume it to compute parallax shift or proximity-AI cues. */
  motion: MotionController;
  /** Three.js renderer the universe shares with the parallax stack. Drivers
   *  performing custom render-target work read it from here. */
  renderer: THREE.WebGLRenderer;
  /** The single shared ParallaxScene that paints the world. Wave 22 (D4)
   *  contract extension: a Universe's `behavior.background(ctx)` configures
   *  THIS instance (e.g. `ctx.parallax.loadBiome(...)`) instead of constructing
   *  its own — the one-renderer-per-canvas invariant that the v2.2.4
   *  double-ParallaxScene scar enforces. Omitting `behavior.background`
   *  altogether falls through to DefaultBackground, which drives this instance
   *  from the room's `biomeKey`. */
  parallax: ParallaxScene;
}

export interface ResolvedMood {
  ambient: string;
  primary: string;
  post: { bloom: number; kaleido: number; fluid: number; chroma: number };
}

/* ── Driver interfaces ──────────────────────────────────────────────────── */

export interface BackgroundHandle {
  update(dt: number, u: GlobalUniforms): void;
  dispose(): void;
}

export type ArrivalAnimation =
  | { kind: 'portal'; duration: number; hue?: number }
  | { kind: 'fade'; duration: number; color?: string }
  | { kind: 'drift'; from: { x: number; z: number }; duration: number }
  | { kind: 'custom'; run: (dt: number) => boolean };

export interface ArrivalCtx extends SubstrateCtx {
  cosmo: CosmoV2Rig;
  state: import('../../phaser/entities/CosmoAgent').CosmoState;
}

export interface InhabitantHandle {
  id: string;
  /** OPTIONAL world-space anchor. The substrate may use it for proximity-AI
   *  hints or culling; absent values disable those features. Punch-list #2. */
  anchor?: { x: number; y: number; z: number };
  update(dt: number, u: GlobalUniforms): void;
  dispose(): void;
}

/**
 * Wave 27 — what an interactable may ask of Cosmo when he arrives. Handed to
 * `onUse` by the substrate's InteractionDirector. Authors never reach into
 * CosmoAgent; they name a painted clip and a sound, the substrate does the rest.
 */
export interface UseApi {
  /** Play a named painted-frames clip (idle/walk/bounce/jump/duck/dance/wave/
   *  wink/stretch/fall/petted/look). Cosmo stays at the interactable for
   *  `holdS` seconds (default 2.4), then walks home. Missing clips degrade to
   *  the static hero — never throws. */
  playClip(name: string, opts?: { loop?: boolean; holdS?: number }): void;
  /** Fire a one-shot from the shared SFX bus (`public/assets/audio/sfx/<name>.mp3`). */
  sfx(name: string): void;
}

export interface InteractableHandle {
  id: string;
  /** World-space position Cosmo can walk to. */
  anchor: { x: number; y: number; z: number };
  /** Range in world-units within which Cosmo's AI may target this. */
  range: number;
  /** Wave 27 — what happens when Cosmo reaches the anchor. `use` (default)
   *  calls `onUse`; `bounce` runs the trampoline bounce-combo instead (the
   *  handle's `onUse` is still called at arrival for its own visuals). */
  arrival?: 'use' | 'bounce';
  update(dt: number, u: GlobalUniforms): void;
  /** Called by the InteractionDirector when Cosmo reaches the anchor. The
   *  second argument (Wave 27) lets the handle drive a named clip + a sound. */
  onUse(cosmo: CosmoV2Rig, api?: UseApi): void;
  dispose(): void;
}

export interface AudioHandle {
  enter(): void;
  exit(fadeMs: number): void;
  update(dt: number): void;
  dispose(): void;
}

export interface TransitionDriver {
  run(dt: number): Promise<void>;
  dispose(): void;
}

export interface TransitionCtx extends SubstrateCtx {
  fromMood: ResolvedMood;
  toMood: ResolvedMood;
}

/* ── Optional exports (each independently optional) ─────────────────────── */

export interface UniverseBehavior {
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

/* ── Manifest / schema runtime types ────────────────────────────────────── */

export interface PostFXIntensity {
  bloom: number;
  kaleido: number;
  fluid: number;
  chroma: number;
}

export type PostPreset = 'calm-baseline' | 'deep-trip' | 'neutral';

export interface AssetEntry {
  type: 'image' | 'audio' | 'shader' | string;
  path: string;
  preload: boolean;
}

export interface Manifest {
  version: string;
  name: string;
  displayName: string;
  displayNameEn?: string;
  summaryEn?: string;
  author: string;
  license: string;
  behaviorModule?: boolean;
  defaultArea: string;
  brandDeviation: string | null;
  assets: AssetEntry[];
  post: { preset: PostPreset; intensityCurve?: PostFXIntensity };
}

export interface PathExperience {
  kind: 'mushroom-path' | 'burrow-down' | 'drift' | 'fade' | string;
  duration: number;
  ambient: string;
  description?: string;
}

export interface AreaMoodOverrides {
  ambient?: string;
  primary?: string;
  post?: Partial<PostFXIntensity>;
}

export interface AreaSpec {
  id: string;
  displayName: string;
  displayNameEn?: string;
  description?: string;
  moodOverrides: AreaMoodOverrides | null;
  pathExperience: PathExperience;
  rooms: string[];
}

export interface AreasManifest {
  version: string;
  entryArea: string;
  areas: AreaSpec[];
}

export interface RoomExit {
  to: string;
  via: string;
  distance: number;
}

export interface RoomSpec {
  id: string;
  area?: string;
  displayName: string;
  displayNameEn?: string;
  description?: string;
  anchor: { x: number; y: number; z: number };
  cameraBounds?: { panRangeX: number; panRangeY: number };
  biomeKey?: string | null;
  /** Wave 24 — per-room ambient music bed, a universe-relative asset path
   *  (resolved like every other asset). DefaultAudio swaps to it on room-enter.
   *  Omit to inherit the manifest's first preload:true audio (legacy behavior). */
  audioBed?: string;
  exits?: RoomExit[];
}

export interface RoomsManifest {
  version: string;
  entryRoom: string;
  rooms: RoomSpec[];
}
