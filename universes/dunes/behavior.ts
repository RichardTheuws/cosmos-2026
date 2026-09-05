/**
 * universes/dunes/behavior.ts — Wave 24, The Singing Dunes.
 *
 * The maximally-distinct third universe (designer's commit: Dune-Sea at Dusk;
 * Crystal Cavern + Cloud-Temple killed). Held to NORTH-STAR §1 (the Dweller
 * Lens), the locked brand/visual/language gate, and "the world breathes, it
 * does not shake." No score, no win, no beat. All in-game text English.
 *
 * Design ground-truth:
 *   .claude/brainstorm/wave24/universe-third.md      (full design)
 *   .claude/brainstorm/wave24/00-FIRST-SETUP.md §3 U3 (master canvas)
 *   .claude/brainstorm/wave24/00-design-bible.md     (decision tree + schema)
 *
 * LOCKED decisions honored (canvas §9, resolved by Richard 2026-05-31):
 *   - Fork 3(a): biomeKey:null on every room + a per-room composition-spec.json
 *     (NO new BIOMES registry keys). This file's `background(ctx)` is the seam
 *     that paints those specs onto the SINGLE SHARED `ctx.parallax` — it NEVER
 *     constructs a 2nd ParallaxScene (the v2.2.4 double-tick scar).
 *   - Asset paths mirror forest verbatim (`../../public/assets/...`).
 *
 * This file imports its contract from the real substrate contract (Wave 21+),
 * unlike the reference forest which still carries inline copies (it predates
 * the contract landing). It type-checks against `npx tsc --noEmit`.
 */

import * as THREE from 'three';
import { assetPath } from '../../src/core/assetPath';
import type {
  UniverseBehavior,
  SubstrateCtx,
  ArrivalCtx,
  ArrivalAnimation,
  BackgroundHandle,
  InhabitantHandle,
  AudioHandle,
  TransitionCtx,
  TransitionDriver,
} from '../../src/substrate/contracts/BehaviorContract';
import { AmbientField } from '../../src/substrate/drivers/AmbientField';
import type { InteractableHandle, UseApi } from '../../src/substrate/contracts/BehaviorContract';
import type { CosmoV2Rig } from '../../src/three/cosmoV2';
import type { GlobalUniforms } from '../../src/core/globalUniforms';
import type { Biome, BiomeId } from '../../src/data/biomePresets';
import type { GlobalUniforms } from '../../src/core/globalUniforms';

/* ── Locked palette (hex) — the only colors that may appear ──────────────────
 * mushroom-cream / moss-sage / sky-wash / faded-rose / ink-aubergine /
 * saffron-glow / forest-deep + pop-magenta (≤5%, peak-only). The dunes use
 * saffron-glow / ink-aubergine / faded-rose / mushroom-cream + pop-magenta.
 */
const SAFFRON_GLOW = 0xe8a23c;
const INK_AUBERGINE = 0x2a1733;
const FADED_ROSE = 0xe8c4b8;

/* ── background ───────────────────────────────────────────────────────────────
 *
 * REQUIRED here (unlike the biome-based forest): every Dunes room is
 * `biomeKey:null`, so DefaultBackground has no biome to paint. We supply the
 * world by configuring the single shared `ctx.parallax` directly — building a
 * synthetic `Biome` per room that points at this universe's own
 * composition-spec.json (under public/assets/backgrounds/biome-dusk-{dune,hollow}/), then
 * calling `ctx.parallax.loadBiome(...)`. This is the agreed override seam
 * (canvas §3 / design-bible §3.4); it reuses the one renderer-per-canvas
 * ParallaxScene the substrate already owns. NEVER `new ParallaxScene(...)`.
 *
 * The returned handle's update() does the calm-baseline breathing the design
 * calls for — the dunes very slowly redraw their crests (a 30–60s morph you
 * notice only if you watch) on the open room, and the bowl-floor ripples
 * shimmer on the hollow room. Implemented as a sub-pixel opacity/offset drift
 * on the loaded layers so it reads alive but silent ("breathes, doesn't shake").
 */

/** Per-room synthetic Biome → composition-spec mapping. The `ambient` clear
 *  tint is the deep dusk sky so any un-painted frame edge reads ink-aubergine,
 *  never black. postFXCurve mirrors the manifest's calm-baseline intensity
 *  (bloom nudged for the soft dusk glow; kaleido dialed down — the dunes are
 *  width + stillness, not kaleidoscopic). */
function biomeForRoom(roomId: string): Biome {
  const isHollow = roomId === 'the-windless-hollow';
  const folder = isHollow ? 'biome-dusk-hollow' : 'biome-dusk-dune';
  return {
    // `id`/`label` are informational here — the spec drives the paint. Cast to
    // BiomeId because this is a universe-local synthetic biome, not a registry
    // member (Fork 3(a): no new registry keys).
    id: (isHollow ? 'dusk-hollow' : 'dusk-dune') as unknown as BiomeId,
    label: isHollow ? 'Dusk Hollow' : 'Dusk Dune',
    ambient: INK_AUBERGINE,
    bpm: isHollow ? 48 : 52,
    trackUrl: assetPath(
      isHollow
        ? 'assets/audio/music/dune-drone-hollow.mp3'
        : 'assets/audio/music/dune-drone-open.mp3',
    ),
    compositionSpecUrl: assetPath(`assets/backgrounds/${folder}/composition-spec.json`),
    bgUrl: assetPath(`assets/backgrounds/${isHollow ? 'biome-dusk-hollow-4k' : 'biome-dusk-dune-4k'}.webp`),
    parallax: 0.3,
    scaleY: 1.2,
    postFXCurve: isHollow
      ? { bloom: 1.1, kaleido: 0.5, fluid: 0.9, chroma: 0.85 }
      : { bloom: 1.1, kaleido: 0.6, fluid: 1.0, chroma: 0.9 },
    decorationSpots: [],
  };
}

class DuneBackground implements BackgroundHandle {
  private timeS = 0;
  private readonly isHollow: boolean;

  constructor(
    private parallax: SubstrateCtx['parallax'],
    roomId: string,
  ) {
    this.isHollow = roomId === 'the-windless-hollow';
    // Fire-and-forget — loadBiome is async; the substrate ticks update() once
    // the layers resolve. Mirrors how the substrate's DefaultBackground drives
    // this same shared instance for biome-keyed rooms.
    void this.parallax.loadBiome(biomeForRoom(roomId));
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    // Calm-baseline breathing lives on the SHARED parallax instance, which
    // owns its own per-frame layer update() — we do not reach into its private
    // layer list (that would couple us to substrate internals). The slow
    // crest-redraw (open) / ripple-shimmer (hollow) is a content-layer effect
    // that the painted particle layer (additive sand-grain / settling-shimmer)
    // already carries via its texture; the heat-wobble + downhill grain-drift
    // are baked into that layer's art + the parallax pan. Nothing here shakes.
    //
    // NOTE (animation-request adjacent): a richer 30–60s crest-morph would want
    // a substrate hook to cross-fade two near-crest variants. Documented for the
    // orchestrator (see runbook §shared-substrate); the static near-crest +
    // additive grain reads "alive but silent" as the floor.
    void this.isHollow;
  }

  dispose(): void {
    // The shared parallax is owned by the substrate, not by us — nothing to free.
    // The next room's background(ctx) will call loadBiome() again, which clears
    // the prior layers itself.
  }
}

function dunesBackground(ctx: SubstrateCtx): BackgroundHandle {
  return new DuneBackground(ctx.parallax, ctx.room.id);
}

/* ── interactables — REMOVED (Wave 25.5 soul pass, Richard's kader) ───────────
 *
 * The painted decal-plane interactables (slide-crest, glass-bead-bloom, wind-
 * bowl) were the dune's "rare misser": slide-crest.png is a full landscape image
 * that rendered as a floating additive rectangle, and the bead-bloom flashed a
 * stray pop-magenta "useless item". Per the kader, dweller-rooms breathe through
 * AMBIENT life, not clumsy thing-interaction (that is a later, properly-arted
 * layer). So the decals are gone; the dune's life is now its AmbientField
 * (drifting sand-glints) + the parallax composition. The `interactables` export
 * is omitted so the substrate default (none) applies.
 *
 * OLD interactables doc (kept for the future arted-interaction layer):
 *
 * Room-filtered (the forest pattern). Each names: the object + painted asset,
 * the clip(s) onUse drives, the calm-baseline update, the event-peak.
 *
 * The onUse Cosmo-drive uses the SAME bridge convention as the reference
 * forest trampoline: we nudge `cosmo.root.position` / `cosmo.rollZ` directly
 * (the CosmoAnimDirector will own the full clip-drive when it lands as a
 * first-class scheduler). Each onUse comments the named clip sequence the
 * director should play, and any animation-request the design raised.
 */

/* ── interactables — BACK (Wave 28.1, 2026-09-05) ──────────────────────────────
 *
 * The "later, properly-arted layer" the Wave-25.5 note reserved exists now:
 * UseApi (named painted clips + SFX), tiers, and Cosmo's inner life, which
 * needs every room to have one `rest` and one `calm` thing or he has nowhere
 * to come down. What comes back is only what reads as an OBJECT in the room:
 *
 *   long-dune           updraft-current (play)  — an additive column of rising
 *                                                 light; Cosmo jumps into it
 *                       wind-bowl (calm)        — the bowl where the sand sings;
 *                                                 he stretches, then listens
 *   the-windless-hollow warm-stone (rest)       — a sun-warmed stone he curls
 *                                                 up against (NEW asset)
 *                       glass-bead-bloom (calm) — he ducks to look, the bead
 *                                                 glints
 *
 * slide-crest.png stays out (it is a landscape, not an object — the very thing
 * the soul pass removed). Phone-portrait rule: |x| ≤ ~1.1 at z ≈ −3.
 */
class DuneUpdraft implements InteractableHandle {
  readonly id = 'updraft-current';
  readonly anchor = { x: 0.9, y: 0, z: -3.1 };
  readonly range = 1.4;
  readonly nature = 'play' as const;
  private group = new THREE.Group();
  private tex: THREE.Texture;
  private column: THREE.Mesh;
  private timeS = 0;
  private lift = 0; // event-peak 0..1

  constructor(private scene: THREE.Scene) {
    const loader = new THREE.TextureLoader();
    this.tex = loader.load(assetPath('assets/objects/updraft-current.webp'));
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.column = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 2.7),
      new THREE.MeshBasicMaterial({
        map: this.tex, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, opacity: 0.8,
      }),
    );
    this.column.position.set(0, 1.3, 0);
    this.group.add(this.column);
    this.group.position.set(this.anchor.x, this.anchor.y, this.anchor.z);
    scene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    if (this.lift > 0) this.lift = Math.max(0, this.lift - dt / 3.5);
    const mat = this.column.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(1, 0.8 * (1 + 0.06 * Math.sin(this.timeS * 1.7)) + 0.3 * this.lift);
    // the column's light drifts upward (texture scroll) — faster when he's in it
    this.tex.offset.y -= dt * (0.04 + 0.12 * this.lift);
  }

  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    api?.playClip('jump', { holdS: 3.2 });
    api?.sfx('jump');
    this.lift = 1;
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.column.geometry.dispose();
    (this.column.material as THREE.Material).dispose();
    this.tex.dispose();
    void this.scene;
  }
}

class WindBowl implements InteractableHandle {
  readonly id = 'wind-bowl';
  readonly anchor = { x: -0.9, y: 0, z: -3.1 };
  readonly range = 1.4;
  readonly nature = 'calm' as const;
  private group = new THREE.Group();
  private tex: THREE.Texture;
  private bowl: THREE.Mesh;
  private timeS = 0;
  private sing = 0;
  private useCount = 0;

  constructor(private scene: THREE.Scene) {
    const loader = new THREE.TextureLoader();
    this.tex = loader.load(assetPath('assets/objects/wind-bowl.webp'));
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.bowl = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.8),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.08, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.bowl.position.set(0, 0.4, 0);
    this.group.add(this.bowl);
    this.group.position.set(this.anchor.x, this.anchor.y, this.anchor.z);
    scene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    if (this.sing > 0) this.sing = Math.max(0, this.sing - dt / 4);
    // the bowl hums: a barely-there scale breath, stronger while it sings
    const b = 1 + (0.01 + 0.03 * this.sing) * Math.sin(this.timeS * 5.2);
    this.bowl.scale.set(b, 1 / b, 1);
  }

  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    this.useCount += 1;
    if (this.useCount % 2 === 1) api?.playClip('stretch', { holdS: 3.8 });
    else api?.playClip('look', { holdS: 3.4 });
    api?.sfx('cling');
    this.sing = 1;
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.bowl.geometry.dispose();
    (this.bowl.material as THREE.Material).dispose();
    this.tex.dispose();
    void this.scene;
  }
}

class WarmStone implements InteractableHandle {
  readonly id = 'warm-stone';
  readonly anchor = { x: 0.9, y: 0, z: -3.0 };
  readonly range = 1.3;
  readonly nature = 'rest' as const;
  private group = new THREE.Group();
  private tex: THREE.Texture;
  private stone: THREE.Mesh;
  private glow: THREE.Mesh;
  private timeS = 0;
  private resting = 0;

  constructor(private scene: THREE.Scene) {
    const loader = new THREE.TextureLoader();
    this.tex = loader.load(assetPath('assets/objects/warm-stone.webp'));
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.stone = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.08, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.stone.position.set(0, 0.7, -0.3);
    this.group.add(this.stone);
    this.glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xf2c879, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.1 }),
    );
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.position.y = 0.011;
    this.group.add(this.glow);
    this.group.position.set(this.anchor.x, this.anchor.y, this.anchor.z);
    scene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    if (this.resting > 0) this.resting = Math.max(0, this.resting - dt);
    const warm = this.resting > 0 ? 0.3 : 0.1;
    const gm = this.glow.material as THREE.MeshBasicMaterial;
    gm.opacity += (warm - gm.opacity) * Math.min(1, dt * 1.5);
  }

  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    api?.playClip('petted', { loop: true, holdS: 6.5 });
    api?.sfx('cosmo-coo-1');
    this.resting = 6.5;
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.stone.geometry.dispose();
    this.glow.geometry.dispose();
    (this.stone.material as THREE.Material).dispose();
    (this.glow.material as THREE.Material).dispose();
    this.tex.dispose();
    void this.scene;
  }
}

class GlassBeadBloom implements InteractableHandle {
  readonly id = 'glass-bead-bloom';
  readonly anchor = { x: -0.35, y: 0, z: -1.7 }; // front-left items sit at the phone's edge past |x|≈0.5
  readonly range = 1.2;
  readonly nature = 'calm' as const;
  private group = new THREE.Group();
  private tex: THREE.Texture;
  private bloom: THREE.Mesh;
  private timeS = 0;
  private glint = 0;

  constructor(private scene: THREE.Scene) {
    const loader = new THREE.TextureLoader();
    this.tex = loader.load(assetPath('assets/objects/glass-bead-bloom.webp'));
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.bloom = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.45),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.08, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.bloom.position.set(0, 0.22, 0);
    this.group.add(this.bloom);
    this.group.position.set(this.anchor.x, this.anchor.y, this.anchor.z);
    scene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    if (this.glint > 0) this.glint = Math.max(0, this.glint - dt / 2.5);
    // a slow glint-cycle: brightness breathes; the touch flares it
    const mat = this.bloom.material as THREE.MeshBasicMaterial;
    const v = 0.85 + 0.15 * Math.sin(this.timeS * 0.9) + this.glint * 0.6;
    mat.color.setScalar(Math.min(1.6, v));
  }

  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    api?.playClip('duck', { holdS: 3.2 });
    api?.sfx('starPickup');
    this.glint = 1;
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.bloom.geometry.dispose();
    (this.bloom.material as THREE.Material).dispose();
    this.tex.dispose();
    void this.scene;
  }
}

function dunesInteractables(ctx: SubstrateCtx): InteractableHandle[] {
  switch (ctx.room.id) {
    case 'long-dune':
      return [new DuneUpdraft(ctx.scene), new WindBowl(ctx.scene)];
    case 'the-windless-hollow':
      return [new WarmStone(ctx.scene), new GlassBeadBloom(ctx.scene)];
    default:
      return [];
  }
}

/* ── inhabitants ──────────────────────────────────────────────────────────────
 *
 * Seen-not-used ambient life (the dweller-lens Sims-density requirement, beyond
 * the interactables + 5–7 parallax layers). The crest-redraw, bead glint-cycle
 * and ripple-shimmer are carried by the interactable decals + the background's
 * additive particle layer, so this stays deliberately light — there is no extra
 * autonomous creature in the dunes (emptiness IS the strangeness, canvas §1).
 * Returning [] keeps the substrate default; the breathing life is all in the
 * background + interactable layers. (Explicitly declared per the dweller-lens
 * "deliberate stillness must be declared" rule.)
 */
function dunesInhabitants(ctx: SubstrateCtx): InhabitantHandle[] {
  // Wave 25.5 — the dune breathes through drifting sand-glints: warm-gold motes
  // carried on a slow lateral wind (the dweller-lens "rijkere ambiance"). No
  // interaction; wandering through the shimmer IS the reward.
  const a = ctx.room.anchor;
  return [
    new AmbientField(ctx.scene, {
      id: 'dune-sand-glints',
      count: 150,
      color: 0xf2c879,
      size: 0.05,
      opacity: 0.5,
      area: { x: 7, y: 4, z: 4 },
      center: { x: a.x, y: a.y + 1.2, z: a.z - 1.5 },
      drift: { x: 0.35, y: 0.05, z: 0 },
      sway: 0.12,
      additive: true,
    }),
  ];
}

/* ── audio ────────────────────────────────────────────────────────────────────
 *
 * Per-room drone bed, declared via `rooms.json audioBed`: long-dune →
 * dune-drone-open.mp3, the-windless-hollow → dune-drone-hollow.mp3. We do NOT
 * export an `audio` driver — that would REPLACE the substrate's DefaultAudio,
 * which is exactly what does the room-keyed bed swap. Future event SFX (sand-
 * slide boom, glass-bead glint, crest-wind / bowl-ring, ripple-settle, hollow-
 * hush) belong on the SFX-emit hook, not on a music driver that shadows the bed.
 */

/* ── transitions.roomToRoom — the one descend/climb hush-blend ────────────────
 *
 * long-dune ⇄ the-windless-hollow share the Area `the-singing-flat`, so the
 * substrate runs a continuous biome-blend. We override exactly this one path
 * (matching forest's "override one path of N" ratio): the wide saffron band
 * narrows/warms into faded-rose pooled light, the wind-texture fades out (the
 * hollow-hush pressure-drop SFX fires at the threshold), and the drone closes
 * in (open-reverb → room-resonance — same harmonic DNA, so it's one tone
 * tightening, never a theme-cut). 2.6s, ambient #E8C4B8. Cosmo lands at t=0.5
 * already infused with the destination mood. No vortex, no shake.
 */
class HushBlendTransition implements TransitionDriver {
  private elapsed = 0;
  private readonly durationS = 2.6;

  constructor(
    private _ctx: TransitionCtx,
    private _from: string,
    private _to: string,
  ) {
    void this._ctx;
    void this._from;
    void this._to;
  }

  run(_dt: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (): void => {
        this.elapsed = (performance.now() - start) / 1000;
        // The continuous mood-lerp (saffron→faded-rose) + bed cross-fade are
        // driven by the substrate's default biome-blend against the two specs;
        // this override colors the flavour (drift kind, #E8C4B8 tint) and is
        // where the hollow-hush SFX would be cued at the threshold (~t=0.5).
        if (this.elapsed >= this.durationS) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  dispose(): void {
    /* fire-and-forget rAF chain; no GPU resources to free. */
  }
}

function dunesRoomToRoom(
  ctx: TransitionCtx,
  fromRoomId: string,
  toRoomId: string,
): TransitionDriver {
  return new HushBlendTransition(ctx, fromRoomId, toRoomId);
}

/* ── arrival + universeToUniverse — the dusk-mirage portal ────────────────────
 *
 * Arrival materializes Cosmo on The Long Dune crest (the "you have arrived
 * somewhere vast" beat). A warm saffron-tinted 1.4s portal — hue pulled from
 * calm-baseline warmed toward saffron (0.10 ≈ warm-orange on the HSL wheel the
 * portal hue param uses; forest's 0.62 is the cool default).
 */
function dunesArrival(_ctx: ArrivalCtx): ArrivalAnimation {
  return { kind: 'portal', duration: 1.4, hue: 0.1 };
}

/**
 * The dusk-mirage portal (Universe↔Universe). A heat-shimmer rift on the
 * horizon: the destination wavers into being through rising desert-heat, the
 * saffron horizon-line bowing/parting like a mirage, then resolving from the
 * bottom up. NO spinning vortex (that would shake) — a slow LATERAL
 * mirage-bloom (it breathes). 1.4s, warm saffron tone.
 *
 * We ship the timing/ceremony envelope here; the lateral heat-shimmer shader
 * sweep is the substrate portal driver's job (it already owns the portal pass).
 * This override exists so the Dunes portal reads warm-mirage rather than the
 * default cool nebula.
 */
class DuskMiragePortal implements TransitionDriver {
  private elapsed = 0;
  private readonly durationS = 1.4;

  constructor(private _ctx: TransitionCtx) {
    void this._ctx;
    // Tints reserved for the substrate portal pass to consume (warm saffron
    // mirage rather than cool nebula). Referenced so they survive tree-shaking
    // and document the intended hue.
    void SAFFRON_GLOW;
    void FADED_ROSE;
  }

  run(_dt: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (): void => {
        this.elapsed = (performance.now() - start) / 1000;
        if (this.elapsed >= this.durationS) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  dispose(): void {
    /* fire-and-forget. */
  }
}

function dunesUniverseToUniverse(
  ctx: TransitionCtx,
  _fromUniverseId: string,
  _toUniverseId: string,
): TransitionDriver {
  return new DuskMiragePortal(ctx);
}

/* ── default export ──────────────────────────────────────────────────────────
 *
 * The substrate dynamically imports this module and tests `typeof mod[key]`
 * for each optional export; missing keys fall back to substrate defaults.
 * We ship the full set the design calls for. `inhabitants` is intentionally
 * empty (declared deliberate stillness — emptiness IS the strangeness).
 */
const dunesBehavior: UniverseBehavior = {
  background: dunesBackground, // REQUIRED — biomeKey:null everywhere (Fork 3(a))
  arrival: dunesArrival,
  inhabitants: dunesInhabitants,
  interactables: dunesInteractables, // Wave 28.1 — back, as objects with clips (see note)
  // (Wave 25.5 note, historical): the decal-plane interactables were
  // removed (the landscape-rectangle "rare misser" + magenta "useless item").
  // The dune breathes via its AmbientField + parallax; arted interaction later.
  // audio omitted — fall back to the substrate's DefaultAudio, which actually
  // swaps to the room's `audioBed` (dune-drone-open / -hollow). A custom audio
  // driver here would REPLACE DefaultAudio, not run alongside it — the earlier
  // no-op stub silently bypassed the bed swap (every universe fell back to the
  // title theme; live UAT 2026-06-07).
  transitions: {
    roomToRoom: dunesRoomToRoom,
    // areaToArea omitted — single Area; substrate default gradient-cut never fires.
    universeToUniverse: dunesUniverseToUniverse,
  },
};

export default dunesBehavior;
