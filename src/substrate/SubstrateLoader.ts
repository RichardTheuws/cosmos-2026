/**
 * SubstrateLoader — Wave 21 entry point.
 *
 *   1. Parses the URL request via ResolveURL.
 *   2. Loads the universe manifests + optional behavior module.
 *   3. Constructs UniverseHost; calls applyUniverseDefaults + enterAreaRoom.
 *   4. Runs the arrival animation.
 *   5. Exposes a per-frame `tick(dt, u)` that fans into UniverseHost.
 *
 * The SubstrateLoader does NOT own Cosmo. CosmoStage + CosmoAgent + CosmoAI
 * are constructed in main.ts and INJECTED into the loader via SubstrateBootCtx.
 * This keeps Cosmo's identity stable across both the legacy and substrate
 * paths during phase A coexistence.
 */
import type * as THREE from 'three';
import type { GlobalUniforms } from '../core/globalUniforms';
import type { MotionController } from '../core/motionController';
import type { AudioFFTBridge } from '../audio/audioFFTBridge';
import type { CosmoAgent } from '../phaser/entities/CosmoAgent';
import type { CosmoStage } from '../three/cosmoStage';
import type { BiomeManager } from '../three/biomeManager';
import type { ParallaxScene } from '../three/parallaxScene';

import {
  validateAreasManifest,
} from './contracts/AreasSchema';
import {
  validateManifest,
} from './contracts/ManifestSchema';
import { validateRoomsManifest } from './contracts/RoomsSchema';
import type {
  AreasManifest,
  InteractableHandle,
  Manifest,
  RoomsManifest,
  SubstrateCtx,
  UniverseBehavior,
} from './contracts/BehaviorContract';
import { DEFAULT_UNIVERSE, parseURLRequest, resolveURLRequest, syncURL } from './ResolveURL';
import type { ResolvedURL } from './ResolveURL';
import { UniverseHost } from './UniverseHost';
import { appendTraversal, loadState, saveState, type CosmosPersistedState } from './StatePersistence';
import { PreloadManager } from './PreloadManager';
import { WayMoteOverlay } from './drivers/WayMoteOverlay';
import { RoomOnwardOverlay } from './drivers/RoomOnwardOverlay';

/** The reserved open-map universe the "Look up." way-mote returns to. */
const CHART_UNIVERSE_ID = '_chart';

export interface SubstrateBootCtx {
  /** Element the parallax + cosmo renderers paint to. */
  canvas: HTMLCanvasElement;
  /** Three.js renderer (shared across parallax + cosmoStage). */
  renderer: THREE.WebGLRenderer;
  /** Cosmo stage scene + camera; substrate writes into stage.scene's userData
   *  for compatibility with forest/behavior.ts's resolveCanvas heuristic. */
  cosmoStage: CosmoStage;
  /** Long-lived agent (constructed once in main.ts). */
  cosmoAgent: CosmoAgent;
  /** Audio bridge — drives mouth-pillar audio-clock + universe-bed playback. */
  audioBridge: AudioFFTBridge;
  /** Motion controller — drives parallax pan + cosmo head-track. */
  motion: MotionController;
  /** Shared global uniforms. */
  globalUniforms: GlobalUniforms;
  /** Biome manager — reused for BiomeBlendTransition crossfades. */
  biomeMgr: BiomeManager;
  /** Shared parallax instance. The substrate uses it via DefaultBackground;
   *  legacy code-paths that still write to it remain compatible. */
  parallax: ParallaxScene;
}

export class SubstrateLoader {
  private host: UniverseHost | null = null;
  private state: CosmosPersistedState;
  private universeRel = '';
  private booted = false;
  private wayMote: WayMoteOverlay | null = null;
  /** Wave 25.5 — the "follow Cosmo onward" room-to-room affordance. Mounted per
   *  room when it declares an exit; torn down on every switch. */
  private roomOnward: RoomOnwardOverlay | null = null;
  /** The universe id that actually loaded (post-resolution). Read by main.ts to
   *  gate legacy forest-only furniture (trampoline) to the forest universe. */
  resolvedUniverse: string | null = null;

  constructor(private bootCtx: SubstrateBootCtx) {
    this.state = loadState();
  }

  /** Boot — resolves URL, loads manifests, runs arrival. Must be awaited. */
  async boot(): Promise<void> {
    if (this.booted) return;

    const { known, reserved } = await this.discoverUniverses();
    const req = parseURLRequest(window.location.search);
    const resolved = await resolveURLRequest(req, {
      knownUniverses: known,
      reservedUniverses: reserved,
      loadUniverseManifests: (id) => this.loadManifestsFor(id),
    });

    if (resolved.changed) syncURL(resolved);
    await this.enterUniverse(resolved);

    // One-time: flush persisted state when the tab is hidden/closed.
    window.addEventListener('pagehide', () => saveState(this.state), { once: false });
    this.booted = true;
  }

  /**
   * In-app navigation (Wave 25) — dispose the current host hierarchy and
   * reconstruct it for a new universe/area/room WITHOUT a page reload. Cosmo,
   * the renderer, the shared ParallaxScene and the AudioFFTBridge are long-lived
   * (injected via bootCtx) and survive the swap untouched. The URL is updated
   * via pushState so the browser Back button returns to the prior world.
   *
   * `area`/`room` are optional: omit them to let the resolver pick the target
   * universe's defaults (e.g. the "Look up." return to the chart).
   *
   * NOTE: this is the spine of fluid travel. The transition/arrival ceremony
   * (the 3-beat depart→between→arrive) layers ON TOP of this in Phase 2 — for
   * now the swap is instantaneous (still no reload).
   */
  async switchTo(universeId: string, areaId?: string, roomId?: string): Promise<void> {
    if (!this.booted) {
      await this.boot();
      return;
    }
    const { known, reserved } = await this.discoverUniverses();
    const resolved = await resolveURLRequest(
      { universe: universeId, area: areaId, room: roomId },
      {
        knownUniverses: known,
        reservedUniverses: reserved,
        loadUniverseManifests: (id) => this.loadManifestsFor(id),
      },
    );

    // Tear down the outgoing world (each driver's exit/dispose fires here).
    this.wayMote?.dispose();
    this.wayMote = null;
    this.roomOnward?.dispose();
    this.roomOnward = null;
    this.host?.dispose();
    this.host = null;

    await this.enterUniverse(resolved);

    // Reflect the new location without reloading; Back returns to the prior world.
    const sp = new URLSearchParams(window.location.search);
    sp.set('universe', resolved.universe);
    sp.set('area', resolved.area);
    sp.set('room', resolved.room);
    window.history.pushState(
      {},
      '',
      `${window.location.pathname}?${sp.toString()}${window.location.hash}`,
    );
  }

  /**
   * Construct (or reconstruct) the host hierarchy for a resolved triple. Shared
   * by boot() and switchTo(). Assumes any previous host has already been
   * disposed by the caller. Does NOT touch the URL or the `booted` flag.
   */
  private async enterUniverse(resolved: ResolvedURL): Promise<void> {
    this.resolvedUniverse = resolved.universe;

    const manifests = await this.loadManifestsFor(resolved.universe);
    if (!manifests) {
      throw new Error(`[substrate] manifests for '${resolved.universe}' could not be loaded`);
    }

    this.universeRel = baseRelative(`universes/${resolved.universe}`);
    const behavior = manifests.manifest.behaviorModule
      ? await this.loadBehaviorFor(resolved.universe)
      : null;

    // Eager preload (architect §7.1 / 8.4 option A).
    const preload = await PreloadManager.preloadEager(manifests.manifest.assets, this.universeRel);
    if (preload.warnings.length && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[substrate/preload]', preload);
    }

    // Build the SubstrateCtx — punch-list #6 fields included.
    const ctx: SubstrateCtx = {
      scene: this.bootCtx.cosmoStage.scene,
      camera: this.bootCtx.cosmoStage.camera,
      globalUniforms: this.bootCtx.globalUniforms,
      assetPath: (rel) => PreloadManager.resolveAssetUrl(rel, this.universeRel),
      universe: {
        id: resolved.universe,
        name: manifests.manifest.name,
        displayName: manifests.manifest.displayName,
      },
      // Filled by UniverseHost.enterAreaRoom — placeholders here so the type
      // is satisfied before the first room is entered. Driver code should
      // never call into ctx.area/.room before enter completes.
      area: { id: resolved.area, displayName: '', mood: { ambient: '', primary: '', post: { bloom: 1, kaleido: 1, fluid: 1, chroma: 1 } } },
      room: { id: resolved.room, displayName: '', anchor: { x: 0, y: 0, z: 0 } },
      canvas: this.bootCtx.canvas,
      audioBridge: this.bootCtx.audioBridge,
      motion: this.bootCtx.motion,
      renderer: this.bootCtx.renderer,
      // Wave 22 (D4) — expose the single shared ParallaxScene so a Universe's
      // background driver configures it rather than constructing a second one.
      parallax: this.bootCtx.parallax,
    };

    // Wire renderer onto scene.userData so the forest-builder's resolveCanvas
    // heuristic finds the canvas without explicit ctx threading. Belt + braces.
    (this.bootCtx.cosmoStage.scene.userData as { renderer?: THREE.WebGLRenderer }).renderer =
      this.bootCtx.renderer;

    this.host = new UniverseHost(ctx, {
      manifest: manifests.manifest,
      areas: manifests.areas,
      rooms: manifests.rooms,
      behavior,
      universeRel: this.universeRel,
      parallax: this.bootCtx.parallax,
    });
    // Drop the legacy `slow-bloom` preload (main.ts) before the universe paints
    // its own background — otherwise it bleeds through any universe whose
    // behavior.background() paints custom content instead of calling loadBiome
    // (the chart's mushroom-bleed bug). DefaultBackground universes reload their
    // biome immediately after, so this is harmless for them. On an in-app switch
    // this also clears the outgoing universe's biome from the shared parallax.
    this.bootCtx.parallax.unloadBiome();
    this.host.applyUniverseDefaults();
    this.host.enterAreaRoom(resolved.area, resolved.room);

    // Apply room camera bounds.
    const room = this.host.getCurrentRoom();
    if (room?.cameraBounds) {
      this.bootCtx.cosmoStage.setCameraBounds(room.cameraBounds);
    }
    // Place Cosmo at the room anchor.
    // NOTE (Wave 27): CosmoAgent re-writes root.position from worldX/Z every
    // frame, and every author positions content in absolute stage space (the
    // forest inhabitants, the chart blooms), so "home" is the stage origin —
    // NOT the manifest anchor. Anchors stay meaningful as room metadata only.
    if (room) {
      this.bootCtx.cosmoAgent.setHome(0, 0);
    }

    // Wave 24 (S1) — mount the FREE "Look up." way-mote so no universe can trap
    // the player. Skip it on the reserved chart itself (you are already home).
    if (!resolved.universe.startsWith('_')) {
      // The way-mote dispatches a `cosmos-navigate` event; main.ts runs the
      // travel ceremony around switchTo (Wave 25). No page reload.
      this.wayMote = new WayMoteOverlay({ reservedUniverseId: CHART_UNIVERSE_ID });
    }

    // Wave 25.5 — the room-to-room layer ("Cosmo neemt je mee"). If this room
    // declares an exit, surface the "follow Cosmo onward" affordance to the
    // first exit's destination; tapping it travels there (same ceremony). Not on
    // the chart (its blooms ARE the navigation).
    if (!resolved.universe.startsWith('_') && room && room.exits && room.exits.length > 0) {
      const destId = room.exits[0].to;
      const dest = manifests.rooms.rooms.find((r) => r.id === destId);
      if (dest && dest.id !== room.id) {
        const destArea =
          dest.area ??
          manifests.areas.areas.find((ar) => ar.rooms.includes(dest.id))?.id ??
          resolved.area;
        this.roomOnward = new RoomOnwardOverlay({
          universe: resolved.universe,
          area: destArea,
          room: dest.id,
          label: dest.displayNameEn ?? dest.displayName,
        });
      }
    }

    // Persist + append traversal.
    appendTraversal(this.state, resolved.universe, resolved.area, resolved.room);
    saveState(this.state);
  }

  /** Per-frame tick — fans into UniverseHost. Called from main.ts CanvasManager.register. */
  /** Wave 27 — live handles of the current room (InteractionDirector reads
   *  these every tick, so a room switch never strands a stale handle). */
  getInteractables(): readonly InteractableHandle[] {
    return this.host?.getInteractables() ?? [];
  }

  tick(dt: number, u: GlobalUniforms): void {
    this.host?.tick(dt, u);
  }

  dispose(): void {
    this.wayMote?.dispose();
    this.wayMote = null;
    this.roomOnward?.dispose();
    this.roomOnward = null;
    this.host?.dispose();
    this.host = null;
    this.booted = false;
  }

  /** Persisted state — exposed for the loader's own debugging. */
  getState(): CosmosPersistedState {
    return this.state;
  }

  /* ── private ─────────────────────────────────────────────────────────── */

  private async discoverUniverses(): Promise<{
    known: ReadonlySet<string>;
    reserved: ReadonlySet<string>;
  }> {
    // Wave 24: dynamic discovery. Every `universes/<id>/manifest.json` Vite can
    // see at build time becomes a known universe — author a conformant folder
    // and you are discovered, with no registry, opt-in flag, or gatekeeper.
    // (Same static-glob mechanism already used for behavior.ts below.) This is
    // the single source of truth shared with the open-map's universe list.
    //
    // Folders whose id starts with `_` are RESERVED: skipped from `known` (e.g.
    // the open-map's `_chart` pseudo-universe), so the chart never enumerates
    // itself as a destination — but collected into `reserved` so they remain
    // loadable when requested explicitly (the "Look up." return target). The
    // resolver allowlists `reserved` (ResolveCtx.reservedUniverses) so a
    // `?universe=_chart` request resolves instead of bouncing to the forest.
    const mods = import.meta.glob('/universes/*/manifest.json');
    const known = new Set<string>();
    const reserved = new Set<string>();
    for (const key of Object.keys(mods)) {
      const m = key.match(/\/universes\/([^/]+)\/manifest\.json$/);
      if (!m) continue;
      if (m[1].startsWith('_')) reserved.add(m[1]);
      else known.add(m[1]);
    }
    // Safety net: the default universe is always known even if the glob misses
    // it (e.g. an unexpected build layout) so boot can never end up empty.
    known.add(DEFAULT_UNIVERSE);
    return { known, reserved };
  }

  private async loadManifestsFor(universeId: string): Promise<{
    manifest: Manifest;
    areas: AreasManifest;
    rooms: RoomsManifest;
  } | null> {
    const lenient = import.meta.env.DEV;
    const baseRel = baseRelative(`universes/${universeId}`);

    try {
      const [mRaw, aRaw, rRaw] = await Promise.all([
        fetchJSON(`${baseRel}/manifest.json`),
        fetchJSON(`${baseRel}/areas.json`),
        fetchJSON(`${baseRel}/rooms.json`),
      ]);
      if (!mRaw || !aRaw || !rRaw) return null;

      const manifest = validateManifest(mRaw, { lenient, source: `${universeId}/manifest.json` });
      const areas = validateAreasManifest(aRaw, { lenient, source: `${universeId}/areas.json` });
      const rooms = validateRoomsManifest(rRaw, {
        lenient,
        source: `${universeId}/rooms.json`,
        defaultArea: manifest.defaultArea,
      });
      return { manifest, areas, rooms };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[substrate] manifest load failed for '${universeId}'`, err);
      return null;
    }
  }

  private async loadBehaviorFor(universeId: string): Promise<UniverseBehavior | null> {
    try {
      // Vite handles the dynamic import; the universes/<id>/behavior.ts file
      // is bundled per-universe. The path is intentionally a string literal
      // template that Vite resolves statically (`/universes/${id}/behavior.ts`
      // would not — we use a glob fallback instead).
      const mods = import.meta.glob('/universes/*/behavior.ts');
      const key = Object.keys(mods).find((k) => k.includes(`/universes/${universeId}/`));
      if (!key) return null;
      const mod = (await mods[key]()) as { default?: UniverseBehavior };
      return mod.default ?? null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[substrate] behavior load failed for '${universeId}'`, err);
      return null;
    }
  }
}

async function fetchJSON(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

/** Resolve a project-root-relative path under Vite's BASE_URL. In dev `base`
 *  is `/`, in prod it's `/games/cosmos-2026/`. */
function baseRelative(rel: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/$/, '') + '/' + rel.replace(/^\/+/, '');
}
