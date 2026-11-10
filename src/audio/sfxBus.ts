/**
 * Howler-backed SFX bus. Pre-loads short one-shots; play-by-name. Music tracks
 * are managed separately by `musicDirector.ts` (S5+).
 *
 * Files are streamed lazily — first call to `play()` for a name triggers load.
 * Subsequent plays reuse the cached Howl instance. Missing files don't throw —
 * they emit a console warn and silently no-op so the gameplay loop never breaks.
 */
import { Howl } from 'howler';
import { assetPath } from '../core/assetPath';

const SFX_BASE = assetPath('assets/audio/sfx');

const SFX_MANIFEST: Record<string, { src: string; volume?: number }> = {
  cling: { src: `${SFX_BASE}/cosmo-cling.mp3`, volume: 0.6 },
  jump: { src: `${SFX_BASE}/cosmo-jump.mp3`, volume: 0.5 },
  stomp: { src: `${SFX_BASE}/cosmo-stomp.mp3`, volume: 0.7 },
  hurt: { src: `${SFX_BASE}/cosmo-hurt.mp3`, volume: 0.7 },
  starPickup: { src: `${SFX_BASE}/pickup-star.mp3`, volume: 0.5 },
  bonus: { src: `${SFX_BASE}/pickup-bonus.mp3`, volume: 0.6 },
  globe: { src: `${SFX_BASE}/globe-trigger.mp3`, volume: 0.5 },
  warp: { src: `${SFX_BASE}/bonus-warp.mp3`, volume: 0.7 },
  // Sprint 7D — bomb SFX (ElevenLabs sound-generation, dry one-shots).
  'bomb-throw': { src: `${SFX_BASE}/bomb-throw.mp3`, volume: 0.55 },
  'bomb-boom': { src: `${SFX_BASE}/bomb-boom.mp3`, volume: 0.85 },
  // Sprint 16D — Cosmo gibberish-coo (ElevenLabs sound-generation, NOT voice).
  // 3 variants picked at random in CosmoScene.playGibberishCoo() so the
  // BONDING-state stinger never fatigues. Replaces the Sprint 15D mistake
  // of routing the hint-orb Dutch voice (`globe-l1-1`) into the bonding
  // moment — see scripts/sprint16d/generate_cosmo_coo.py.
  'cosmo-coo-1': { src: `${SFX_BASE}/cosmo-coo-1.mp3`, volume: 0.85 },
  'cosmo-coo-2': { src: `${SFX_BASE}/cosmo-coo-2.mp3`, volume: 0.85 },
  'cosmo-coo-3': { src: `${SFX_BASE}/cosmo-coo-3.mp3`, volume: 0.85 },
};

/** Pool of Cosmo coo variants; pick at random per BONDING fire. */
export const COSMO_COO_POOL: readonly string[] = ['cosmo-coo-1', 'cosmo-coo-2', 'cosmo-coo-3'];

const VOICE_BASE = assetPath('assets/audio/voices');

class SfxBus {
  private cache = new Map<string, Howl>();
  private muted = false;

  play(name: keyof typeof SFX_MANIFEST | string): void {
    if (this.muted) return;
    let howl = this.cache.get(name);
    if (!howl) {
      const entry = SFX_MANIFEST[name as keyof typeof SFX_MANIFEST];
      const src = entry?.src ?? `${SFX_BASE}/${name}.mp3`;
      howl = new Howl({
        src: [src],
        volume: entry?.volume ?? 0.6,
        preload: true,
        onloaderror: () => {
          // Silent — file may not exist yet, gameplay continues.
        },
      });
      this.cache.set(name, howl);
    }
    howl.play();
  }

  /** Voice-line by id — looked up in /public/assets/audio/voices/<id>.mp3. */
  voice(id: string): void {
    if (this.muted) return;
    const cacheKey = `voice:${id}`;
    let howl = this.cache.get(cacheKey);
    if (!howl) {
      howl = new Howl({
        src: [`${VOICE_BASE}/${id}.mp3`],
        volume: 0.85,
        preload: true,
        onloaderror: () => {
          /* missing voice file — silent */
        },
      });
      this.cache.set(cacheKey, howl);
    }
    howl.play();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }
}

export const sfx = new SfxBus();
