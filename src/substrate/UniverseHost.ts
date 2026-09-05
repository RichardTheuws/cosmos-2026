/**
 * UniverseHost — owns universe-scope lifecycle per architect §3.1.
 *
 *   Owns: shared assets via PreloadManager, the post-FX preset write, AreaHost
 *   lifecycle. Cosmo (CosmoStage + CosmoAgent + CosmoAI) is INJECTED — the
 *   substrate uses references; it does not construct them. They are
 *   long-lived (survive area + room hops), constructed once in main.ts.
 */
import type { GlobalUniforms } from '../core/globalUniforms';
import type { ParallaxScene } from '../three/parallaxScene';
import type {
  AreasManifest,
  InteractableHandle,
  Manifest,
  ResolvedMood,
  RoomsManifest,
  RoomSpec,
  SubstrateCtx,
  UniverseBehavior,
} from './contracts/BehaviorContract';
import { resolveMood } from './ResolveMood';
import { AreaHost } from './AreaHost';

export interface UniverseHostBootCtx {
  manifest: Manifest;
  areas: AreasManifest;
  rooms: RoomsManifest;
  behavior: UniverseBehavior | null;
  universeRel: string;
  parallax: ParallaxScene;
}

export class UniverseHost {
  private areaHost: AreaHost | null = null;
  private currentAreaId: string | null = null;

  constructor(
    private ctx: SubstrateCtx,
    private boot: UniverseHostBootCtx,
  ) {}

  /** Apply universe-scope side effects: post-FX preset onto globalUniforms.
   *  No-op if the preset is the substrate default. */
  applyUniverseDefaults(): void {
    const intensity = this.boot.manifest.post.intensityCurve;
    if (intensity) {
      const bi = this.ctx.globalUniforms.biomeIntensity;
      bi.bloom = intensity.bloom;
      bi.kaleido = intensity.kaleido;
      bi.fluid = intensity.fluid;
      bi.chroma = intensity.chroma;
    }
  }

  /** Enter a specific area + room. Tears down current AreaHost if a different
   *  area is being entered. */
  enterAreaRoom(areaId: string, roomId: string): void {
    const areaSpec = this.boot.areas.areas.find((a) => a.id === areaId);
    if (!areaSpec) {
      throw new Error(`[substrate/universe] area '${areaId}' not in manifest`);
    }
    const roomSpec = this.boot.rooms.rooms.find((r) => r.id === roomId);
    if (!roomSpec) {
      throw new Error(`[substrate/universe] room '${roomId}' not in manifest`);
    }

    if (this.currentAreaId !== areaId) {
      // Different area → swap AreaHost.
      if (this.areaHost) {
        this.areaHost.dispose();
        this.areaHost = null;
      }
      const mood = resolveMood(this.boot.manifest, areaSpec);
      this.ctx.area = {
        id: areaSpec.id,
        displayName: areaSpec.displayName,
        mood,
      };
      this.areaHost = new AreaHost(this.ctx, {
        manifest: this.boot.manifest,
        area: areaSpec,
        rooms: this.boot.rooms,
        behavior: this.boot.behavior,
        universeRel: this.boot.universeRel,
        assets: this.boot.manifest.assets,
        parallax: this.boot.parallax,
      });
      this.currentAreaId = areaId;
    }

    this.areaHost?.enterRoom(roomSpec);
  }

  tick(dt: number, u: GlobalUniforms): void {
    this.areaHost?.tick(dt, u);
  }

  /** Wave 27 — live handles of the current room (InteractionDirector). */
  getInteractables(): readonly InteractableHandle[] {
    return this.areaHost?.getCurrentRoomHost()?.getInteractables() ?? [];
  }

  getCurrentArea(): string | null {
    return this.currentAreaId;
  }

  getCurrentRoom(): RoomSpec | null {
    return this.areaHost?.getCurrentRoom() ?? null;
  }

  getCurrentMood(): ResolvedMood | null {
    return this.areaHost?.getMood() ?? null;
  }

  dispose(): void {
    this.areaHost?.dispose();
    this.areaHost = null;
    this.currentAreaId = null;
  }
}
