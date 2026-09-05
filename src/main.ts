/**
 * main.ts — Sprint 15B rebuild. Boots the dual-canvas (Three.js parallax + post-FX
 * underneath, Phaser 4 CosmoScene HUD on top) and wires the FFT bridge, gesture-bus,
 * progression, BiomeManager, and the new weirdo auto-runner gameplay stack:
 *   ParallaxScene (background, post-FX) → CosmoStage (3D Cosmo + obstacles, no
 *   post-FX, on top) → Phaser HUD (vibe ring + altitude).
 *
 * Compared to v1.0.x (rhythm-tap):
 *   - BeatScene → CosmoScene (Phaser is HUD-only now)
 *   - CosmoRig (2D sprite) → CosmoAgent (3D GLB w/ 2D fallback) on CosmoStage
 *   - BeatTarget pool → ObstacleManager pool (in 3D scene)
 *   - AutoVJ (idle-detector) → CosmoAgent.tickRandomAgency (per-frame RNG events)
 *   - Combo counter → VibeMeter (ring around projected Cosmo) + DeepTripMode
 *
 * Audio bridge / parallax / post-FX / globalUniforms / BiomeManager are
 * untouched per sprint-15B brief.
 */
import Phaser from 'phaser';
import * as THREE from 'three';
import { createGlobalUniforms } from './core/globalUniforms';
import { CanvasManager } from './core/canvasManager';
import { InputController } from './core/inputController';
import { MotionController } from './core/motionController';
import { ParallaxScene } from './three/parallaxScene';
import { CosmoStage } from './three/cosmoStage';
import { BIOMES } from './data/biomePresets';
import { TrippyEventDirector } from './three/postFX/trippyEventDirector';
import { AudioFFTBridge, HALLUCINATION_PEAKS } from './audio/audioFFTBridge';
import { CosmoScene } from './phaser/scenes/CosmoScene';
import { CosmoAgent } from './phaser/entities/CosmoAgent';
import { CosmoAI } from './phaser/entities/CosmoAI';
import { ObstacleManager } from './phaser/entities/ObstacleManager';
import { createWeirdoObstacleFactory } from './phaser/entities/weirdoObstacleFactory';
import {
  TrampolineSpots,
  DEFAULT_TRAMPOLINE_SPOTS,
  type TrampolineSpotDef,
} from './phaser/entities/TrampolineSpots';
import { Progression } from './core/progression';
import { isTouchDevice } from './core/deviceDetect';
import { BiomeManager } from './three/biomeManager';
import { announceVisit } from './share/dailyStreak';
import { sfx } from './audio/sfxBus';
import { InteractionDirector } from './substrate/InteractionDirector';
import { SubstrateLoader } from './substrate/SubstrateLoader';
import { TravelVeil, type CosmosNavigateDetail } from './substrate/drivers/TravelVeil';

const VERSION = '2.10.1';

/** Wave 26 — substrate is now the DEFAULT `/play/` experience (the cutover).
 *  The Universe→Area→Room contract boots unless `?legacy=1` is present, which
 *  keeps the old ParallaxScene-direct beat-game reachable as a transitional
 *  rollback hatch. `?substrate=v2` still works (it's just the default now).
 *  Legacy demolition ("slopen") is a separate follow-up wave. */
const useSubstrate =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('legacy') !== '1';

async function boot(): Promise<void> {
  const sceneCanvas = document.getElementById('scene-canvas') as HTMLCanvasElement | null;
  const gameMount = document.getElementById('game-canvas') as HTMLDivElement | null;
  if (!sceneCanvas || !gameMount) {
    throw new Error('main: missing #scene-canvas or #game-canvas');
  }

  const uniforms = createGlobalUniforms();
  const manager = new CanvasManager(uniforms);
  const input = new InputController();
  input.attach();

  // Sprint 17B — DeviceOrientation gyro + pointermove fallback + companion-drift.
  // Drives camera-pan inside CosmoStage and Cosmo's head-bone rotation. Attaches
  // pointermove + watchdog listeners immediately; gyro listener is deferred
  // until the first user-gesture (where iOS 13+ permission can be requested).
  const motion = new MotionController();
  motion.attach();
  // First user-gesture → request gyro permission (iOS 13+) or attach gyro
  // directly on Android. Single-shot — once we've prompted we won't re-ask.
  let permissionRequested = false;
  const requestMotionPermission = (): void => {
    if (permissionRequested) return;
    permissionRequested = true;
    void motion.requestPermission();
  };
  window.addEventListener('touchstart', requestMotionPermission, { once: true, passive: true });
  window.addEventListener('click', requestMotionPermission, { once: true, passive: true });

  // Sprint 17F — audio-bridge + biome-manager need to be constructed BEFORE
  // ParallaxScene because the scene's hooks read from them at every tick
  // (mouth-pillar frame-cycle from audioNow, BPM from active biome). The
  // BiomeManager itself is `start()`-ed later once parallax + the onChange
  // callback are wired.
  const eventDirector = new TrippyEventDirector();
  const audioBridge = new AudioFFTBridge(uniforms);
  audioBridge.init();

  // Forward-reference holder for biomeMgr. Declared here as a `let` so the
  // ParallaxScene hooks below can read its value at tick-time (lazy-resolved
  // through the closure), even though biomeMgr itself is constructed after
  // parallax exists. Initialised to null; flipped to the live manager
  // immediately after construction.
  let biomeMgr: BiomeManager | null = null;

  // Sprint 17F — multi-layer composition + decoration rendering. Hooks let
  // the scene tick mouth-pillar sprite-sheets against the live audio clock
  // and reveal the secret-crystal once kaleidoTrigger crosses the threshold.
  // BPM comes from the active biome via the biomeMgr forward-ref.
  const parallax = new ParallaxScene(sceneCanvas, {
    audioNow: () => audioBridge.musicCurrentTime(),
    getKaleidoTrigger: () => uniforms.kaleidoTrigger,
    getBpm: () => biomeMgr?.current()?.bpm ?? 92,
  });
  // Initial paint with spec-driven multi-layer load. In substrate mode the
  // SubstrateLoader.boot() will swap to the room's biome (typically the same
  // slow-bloom for the reference forest), so the initial paint is harmless.
  // Falls back to the 14B single-plane bgUrl if the spec fetch fails.
  await parallax.loadBiome(BIOMES['slow-bloom']);

  // Sprint 15B — Three.js sub-renderer for 3D Cosmo + obstacles. Renders ON
  // TOP of the parallax composer (autoClear=false + clearDepth) so post-FX
  // hits the world but not Cosmo.
  const cosmoStage = new CosmoStage(parallax.renderer);

  const phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameMount,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 'rgba(0,0,0,0)',
    transparent: true,
    // No arcade physics — CosmoScene is a HUD overlay, all motion is in
    // CosmoStage's THREE.Scene.
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    fps: { target: 60, forceSetTimeOut: false },
    scene: [CosmoScene],
  });

  const progression = new Progression();
  progression.load();

  // Sprint 15B — gameplay stack lives outside the Phaser scene so its
  // lifetime tracks main.ts (Phaser scene swaps don't tear down the agent).
  // VibeMeter / InteractionManager / DeepTripMode need a Phaser.Scene
  // (VibeMeter draws Graphics) — they're constructed inside CosmoScene's
  // create() using the agent/obstacles/audio passed in here.
  // Sprint 17D — wire onBounce + onPet so the host can fire the kaleido
  // spike + 30%-chance hallucination overlay-track. Forwarded to the
  // InteractionManager (constructed later inside CosmoScene) via a small
  // event-shim — we capture the deferred reference and fan-out from one
  // place. `agentEventShim` is mutated AFTER InteractionManager exists.
  const agentEventShim: {
    onBounce?: (info: { rollHallucination: boolean }) => void;
    onPet?: () => void;
    onTap?: (ndcX: number, ndcY: number) => boolean;
  } = {};
  const cosmoAgent = new CosmoAgent(cosmoStage.group, {
    onBounce: (info) => {
      uniforms.kaleidoTrigger = Math.min(1, uniforms.kaleidoTrigger + 0.6);
      if (info.rollHallucination) {
        audioBridge.startHallucination(HALLUCINATION_PEAKS);
      }
      // Wave 22 — flex the trampoline mat under Cosmo at the moment of bounce
      // (onBounce fires at bounce-start, so the doek gives as he pushes off).
      trampolineSpots.impactNearest(cosmoAgent.worldX, cosmoAgent.worldZ, 1);
      agentEventShim.onBounce?.(info);
    },
    onPet: () => {
      agentEventShim.onPet?.();
      interactionDirector?.notePet(); // Wave 28 — affection
    },
  });
  const obstacles = new ObstacleManager(cosmoStage.scene, {
    audioNow: () => audioBridge.musicCurrentTime(),
  });
  // Sprint 15E — swap default canvas-primitives for the 8 fal.ai weirdo objects
  // (Sprint 15C deliverable). Each ObstacleKind picks a weighted-random pool
  // member per spawn so the playthrough never feels repetitive.
  // Sprint 16E — pass a kaleidoTrigger reader so the secret-crystal stays
  // hidden until DeepTripMode/power-ups push the trigger above 0.8.
  obstacles.setObstacleFactory(
    createWeirdoObstacleFactory({
      getKaleidoTrigger: () => uniforms.kaleidoTrigger,
    }),
  );

  // Sprint 17D — fixed trampoline-spots in the biome scene. Each biome's
  // composition-spec.json may add an `interactionSpots.trampolines` array;
  // we lazy-load the active biome's spec on first paint, falling back to
  // DEFAULT_TRAMPOLINE_SPOTS until the fetch resolves.
  const trampolineSpots = new TrampolineSpots(DEFAULT_TRAMPOLINE_SPOTS);
  trampolineSpots.attach(cosmoStage.scene);
  /** Fetch a biome's composition-spec, extract `interactionSpots.trampolines`,
   *  and update the active spot list. Silent failure → keep current spots. */
  const loadTrampolineSpotsForBiome = async (biomeId: string): Promise<void> => {
    try {
      const url = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/assets/backgrounds/biome-${biomeId}/composition-spec.json`;
      const res = await fetch(url);
      if (!res.ok) return;
      const spec: { interactionSpots?: { trampolines?: TrampolineSpotDef[] } } = await res.json();
      const defs = spec.interactionSpots?.trampolines;
      if (defs && Array.isArray(defs) && defs.length > 0) {
        trampolineSpots.setSpots(defs);
      } else {
        trampolineSpots.setSpots(DEFAULT_TRAMPOLINE_SPOTS);
      }
    } catch {
      // Network / JSON parse error → keep whatever spots we already have.
    }
  };
  void loadTrampolineSpotsForBiome('slow-bloom');

  // Sprint 17E — companion-mode passive vibe + idle-roam AI. Wakes after 8s
  // of no-input, drives Cosmo through 6 idle states (idle/roam/curious/sit/
  // look-around/sniff) and finally /sleep at 90s. Soft-coupled to:
  //   - Sprint 17D's TrampolineSpot list (consumed if/when present)
  //   - Sprint 17F's composition-spec layers (consumed if/when present)
  // Both providers fall back gracefully to procedural waypoints + bounds.
  const cosmoAI = new CosmoAI(
    cosmoStage.group,
    {
      motion,
      eventDirector,
      uniforms,
      // 17D — live TrampolineSpot positions feed the 'curious' state target.
      // We project world-space Vector3 to {x, z} since AI ignores Y (Cosmo
      // always lands on the ground). Hover-bob stays on the spot meshes;
      // AI just walks to their centre.
      interactionSpots: () =>
        trampolineSpots.positions().map((p) => ({ x: p.x, z: p.z })),
      // 17F composition-layers wire here when the sprint lands; until then
      // we return [] and CosmoAI's sniff state falls back to a random waypoint.
      compositionLayers: () => [],
    },
    {
      onRandomEvent: (kind) => {
        // Mirror random-event hook into uniforms for diagnostics — no UI/DOM.
        if (kind === 'wave-uncanny') {
          uniforms.kaleidoTrigger = Math.max(uniforms.kaleidoTrigger, 0.3);
        }
      },
      onCompanionModeChange: (active) => {
        // Subtle bloom-pulse celebration on companion-mode entry. We bump
        // damagePulse just briefly via the kaleido channel — no DOM.
        if (active) {
          uniforms.kaleidoTrigger = Math.max(uniforms.kaleidoTrigger, 0.18);
        }
      },
      onSleepEnter: () => {
        // Host-side throttle: a true DeepTripMode auto-trigger lives in the
        // CosmoScene once the VibeMeter exists. Here we just nudge the
        // kaleido channel for the bloom-pulse celebration.
        uniforms.kaleidoTrigger = Math.max(uniforms.kaleidoTrigger, 0.45);
      },
    },
  );
  cosmoAgent.attachAI(cosmoAI);

  phaserGame.scene.start('CosmoScene', {
    input,
    uniforms,
    audioBridge,
    progression,
    cosmoAgent,
    cosmoStage,
    obstacles,
    trampolineSpots,
    agentEventShim,
    version: VERSION,
  });

  // Browser autoplay policy — first user gesture unlocks the AudioContext.
  const unlockAudio = (): void => {
    audioBridge.ensureRunning();
  };
  window.addEventListener('click', unlockAudio, { once: false, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: false, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: false, passive: true });
  // v2.6.1 — coming back to the tab / unlocking the phone: try to resume the
  // bed right away (a blessed element may resume without a gesture; if the
  // browser refuses, the next tap's unlockAudio does it).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') audioBridge.ensureRunning();
  });
  window.addEventListener('pageshow', unlockAudio);
  window.addEventListener('focus', unlockAudio);

  // Debug + control hotkeys: M = toggle music mute, F = log FFT snapshot.
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'KeyM') {
      const muted = audioBridge.toggleMute();
      // eslint-disable-next-line no-console
      console.log(`[cosmos] music ${muted ? 'muted' : 'unmuted'}`);
    } else if (e.code === 'KeyF') {
      // eslint-disable-next-line no-console
      console.log('[cosmos] FFT snapshot', audioBridge.snapshot());
    }
  });

  biomeMgr = new BiomeManager(uniforms, {
    onTrackSwap: (nextUrl) => audioBridge.setMusicTrack(nextUrl),
  });
  biomeMgr.onChange((biome) => {
    void parallax.loadBiome(biome);
    // Sprint 17D — biome-swap reloads the trampoline-spot list from the new
    // composition-spec (or falls back to defaults).
    void loadTrampolineSpotsForBiome(biome.id);
  });
  // Wave 21 — only start the auto-cycling biome manager on the legacy path.
  // The substrate owns biome selection per Room and uses BiomeManager only
  // for `startMoodCrossfade` during transitions.
  if (!useSubstrate) {
    biomeMgr.start();
  }

  // Wave 21 — substrate boot. Executed only with `?substrate=v2`. Loads the
  // resolved Universe + Area + Room via the new contract, then drives the
  // parallax through DefaultBackground (the same shared instance the legacy
  // path uses, so we keep one renderer per canvas).
  let substrateLoader: SubstrateLoader | null = null;
  if (useSubstrate) {
    substrateLoader = new SubstrateLoader({
      canvas: sceneCanvas,
      renderer: parallax.renderer,
      cosmoStage,
      cosmoAgent,
      audioBridge,
      motion,
      globalUniforms: uniforms,
      biomeMgr,
      parallax,
    });
    try {
      await substrateLoader.boot();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[substrate] boot failed — falling back to legacy biome cycle', err);
      // Recover: start the legacy biome manager so the user still sees Cosmo
      // in a working scene rather than a blank canvas.
      biomeMgr.start();
      substrateLoader = null;
    }
  }

  // Wave 24 — the trampoline (+ its "show, don't tell" demo loop) is legacy
  // forest furniture. In substrate mode it must not leak into the other
  // universes: gate it to the forest universe. dispose() removes the trampoline
  // group from the scene AND empties the spot list (so the demo loop's
  // `positions()[0]` is undefined → walk-to no-op). NOTE: setSpots([]) does NOT
  // work here — buildSpots() ignores its argument and always rebuilds one
  // trampoline, so it would re-add the very mesh we want gone.
  if (substrateLoader && substrateLoader.resolvedUniverse !== 'forest') {
    trampolineSpots.dispose();
  }

  // Wave 25 — fluid travel. A `cosmos-navigate` event (dispatched by the
  // way-mote return + chart-bloom taps) runs the 3-beat travel ceremony around
  // the loader's in-app switch: fade the veil in (depart), swap the world hidden
  // behind it, a held breath (between), fade the veil out (arrive). No page
  // reload; Cosmo, the renderer, the parallax + audio survive the swap. A
  // `traveling` latch drops re-entrant taps so the veil can't stack.
  if (substrateLoader) {
    const loader = substrateLoader;
    const veil = new TravelVeil();
    let traveling = false;
    window.addEventListener('cosmos-navigate', (ev) => {
      const detail = (ev as CustomEvent<CosmosNavigateDetail>).detail;
      if (!detail || traveling) return;
      traveling = true;
      void (async () => {
        try {
          await veil.fadeIn();
          await loader.switchTo(detail.universe, detail.area, detail.room);
          await veil.hold();
          await veil.fadeOut();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[substrate] travel failed', err);
          await veil.fadeOut();
        } finally {
          traveling = false;
        }
      })();
    });
  }

  // Wave 27 — Chapter 1. The InteractionDirector closes the loop the Wave-21
  // contract left open: taps (and Cosmo's own curiosity) walk him to a room's
  // interactables and call their onUse with a UseApi (named painted clip +
  // SFX). It claims taps ahead of the legacy trampoline raycast via the shim.
  let interactionDirector: InteractionDirector | null = null;
  if (substrateLoader) {
    const loader = substrateLoader;
    interactionDirector = new InteractionDirector({
      cosmoAgent,
      camera: cosmoStage.camera,
      interactables: () => loader.getInteractables(),
      playSfx: (name) => sfx.play(name),
      viewportW: () => window.innerWidth,
      viewportH: () => window.innerHeight,
      onPicked: () => {
        uniforms.kaleidoTrigger = Math.min(1, uniforms.kaleidoTrigger + 0.1);
      },
    });
    const director = interactionDirector;
    agentEventShim.onTap = (x, y) => director.onTap(x, y);
    // UAT hook (scripts/uat): drive visits without guessing screen positions.
    (window as unknown as { __cosmosDirector?: InteractionDirector }).__cosmosDirector = director;
    (window as unknown as { __cosmosUniforms?: typeof uniforms }).__cosmosUniforms = uniforms;
    window.addEventListener('pointerdown', () => director.noteInput(), { passive: true });
  }

  // Per-frame ticks. Order matters: audio first (so FFT is fresh for the
  // event-director and Cosmo's mixer), then post-FX-driving systems, then
  // gameplay (CosmoAgent), then renderers.
  manager.register(() => audioBridge.update());
  manager.register((u) => eventDirector.update(u));
  // Sprint 17F — motion advances first (so the smoothed pan-vector is fresh
  // before parallax + cosmoStage read it), then parallax (multi-layer +
  // decorations + post-FX composer), then the gameplay tick which renders
  // CosmoStage on top of the parallax pass.
  manager.register((u) => {
    motion.tick(u.delta);
  });
  // Wave 22 (D4) — exactly ONE parallax tick per frame, owned by whoever owns
  // biome selection:
  //  - substrate path: the per-room background driver (DefaultBackground or an
  //    author override) is the sole ticker, invoked via loader.tick →
  //    RoomHost.tick → background.update. main.ts must NOT also tick parallax
  //    or it double-paints (the v2.2.4 stacked-decoration scar).
  //  - legacy path / boot-failure recovery (substrateLoader === null):
  //    main.ts owns the single tick, since no background driver exists.
  if (substrateLoader) {
    const loader = substrateLoader;
    manager.register((u) => loader.tick(u.delta, u));
  } else {
    manager.register((u) => parallax.update(u, motion));
  }
  manager.register((u) => {
    const dt = u.delta;
    // Sprint 17E — AI ticks BEFORE the agent so its directive is fresh by
    // the time applyAI() reads it.
    cosmoAI.tick(dt);
    // Wave 27 — curiosity clock (walks Cosmo to interactables when quiet).
    interactionDirector?.tick(dt);
    cosmoAgent.update(u, dt);
    // Sprint 17D — fixed trampoline-spots hover-bob (no spawn-loop).
    trampolineSpots.update(dt);
    obstacles.update(dt, u.time, cosmoAgent.worldX);
    // Replaces the old followCamera(cosmoX, cosmoY, dt) runner-mechanic.
    // World stays anchored; camera pans on motion within biome bounds.
    cosmoStage.panCamera(motion, dt);
    // Subtle head-track on top of clip animation — Cosmo "looks at" the player.
    cosmoAgent.applyMotion(motion);
    // Sprint 17E — apply AI directive on top of clip-driven pose. No-op when
    // the user is active (companion-mode inactive); decays cleanly otherwise.
    cosmoAgent.applyAI(cosmoAI);
    // Wave 21 — procedural anim director (idle-breath/blink/head-track/
    // antenna-bob/walk/jump-arc/climb). Layers ON TOP of motion + AI pose
    // outputs. Always runs (even when companion-mode active — it reads the
    // motion source through the controller and chooses focusPoint accordingly).
    cosmoAgent.tickAnimDirector(dt, motion, cosmoStage.camera);
    cosmoStage.render();
  });
  manager.register((_u) => biomeMgr?.update(1 / 60));

  // Wave 22 — "show, don't tell" (Richard 2026-05-30): Cosmo demonstrates the
  // trampoline himself so a new visitor immediately sees the delight loop,
  // instead of having to guess the controls. applyAI yields position during
  // 'walking-to'/'bouncing' (CosmoAgent.applyAI ownedByOtherSprint), so this
  // never fights companion-mode. First demo ~3s after the user wakes Cosmo
  // (so it isn't hidden behind the boot overlay); repeats every ~16s while idle.
  // Wave 27 — on the substrate path the InteractionDirector's curiosity owns
  // this beat (it knows every interactable, not just the trampoline).
  let awoke = false;
  window.addEventListener('pointerdown', () => { awoke = true; }, { once: true });
  let nextTrampolineDemoAt = Infinity;
  manager.register((u) => {
    if (interactionDirector) return;
    if (!awoke) return;
    if (nextTrampolineDemoAt === Infinity) nextTrampolineDemoAt = u.time + 3;
    if (u.time < nextTrampolineDemoAt) return;
    if (cosmoAgent.isBusy) {
      nextTrampolineDemoAt = u.time + 2; // wait until he's free
      return;
    }
    const spot = trampolineSpots.positions()[0];
    if (spot) {
      cosmoAgent.walkTo(spot.x, spot.z, 'bounce');
      nextTrampolineDemoAt = u.time + 16;
    }
  });

  manager.start();

  // Track viewport for the CosmoStage camera.
  window.addEventListener(
    'resize',
    () => cosmoStage.resize(window.innerWidth, window.innerHeight),
    { passive: true },
  );
  cosmoStage.resize(window.innerWidth, window.innerHeight);

  // Sprint 10C — wire trippy event director into audio bridge so kaleidoscope
  // peaks occasionally drag a hallucination-track over the base music.
  eventDirector.setOnSpikeFire(() => audioBridge.startHallucination(HALLUCINATION_PEAKS));

  // Sprint 13E — daily-streak pill on visit (auto-show 4s, dismissible).
  announceVisit();

  // Wave 25.5 — the legacy "Tap Cosmo on the beat / Hold for the shockwave"
  // disclaimer pill is RETIRED entirely (Richard: "helemaal weg"). It described
  // beat-game mechanics the dweller experience doesn't have, and was the stray
  // start-message on the chart. No replacement here — the dweller's first read
  // is the chart's soft wenk (the hub guidance).

  // Expose for console-debug.
  if (import.meta.env.DEV) {
    (window as unknown as { cosmos: object }).cosmos = {
      uniforms,
      parallax,
      cosmoStage,
      cosmoAgent,
      cosmoAI,
      obstacles,
      phaserGame,
      input,
      eventDirector,
      audioBridge,
      progression,
      motion,
      isTouchDevice: isTouchDevice(),
      version: VERSION,
      THREE,
    };
    // eslint-disable-next-line no-console
    console.log('[cosmos] CosmoScene ready. version', VERSION);
  }
}

void boot();
