/**
 * AudioFFTBridge — Sprint 6D
 *
 * Web Audio AnalyserNode sitting on a dedicated music sub-bus, aggregating its
 * 128-bin frequency response into 8 logarithmic bands and writing them per
 * frame into `globalUniforms.audioFFT`. Three.js post-FX shaders read those 8
 * floats to drive bloom (lows), kaleidoscope (mids) and fluid wobble (highs) —
 * the world breathes with the music without us hand-animating uniforms.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * Architecture
 * ───────────────────────────────────────────────────────────────────────────
 *
 *   musicSource ──► musicGain ──► analyser ──► Howler.masterGain ──► destination
 *                                     │
 *                                     └─► getByteFrequencyData() per frame
 *                                         → 8 logarithmic band aggregation
 *                                         → smoothed write into globalUniforms.audioFFT
 *
 * AudioContext sharing — we piggy-back on Howler's own AudioContext via
 * `Howler.ctx`. That keeps SFX + music + analyser on a single context (browser
 * limit is ~6 contexts; one is plenty). `Howler.masterGain` is used as the
 * output node so the existing `sfxBus.setMuted()` master volume still dictates
 * the final mix.
 *
 * Autoplay policy — Chromium/Safari refuse to start an AudioContext until a
 * user-gesture happens. `ensureRunning()` is wired to the first click/keydown
 * (handled in `main.ts`); calling it before the gesture is a no-op.
 *
 * Three Pass Rule — this bridge does NOT add any post-FX pass. It only writes
 * to a Float32Array. Shader passes are unchanged; convolution count is unchanged.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * Band aggregation (fftSize = 256 → frequencyBinCount = 128 bins)
 * ───────────────────────────────────────────────────────────────────────────
 *
 * At 48 kHz sample-rate, each bin spans ~187 Hz (24000 / 128). We split the
 * 128 bins into 8 logarithmic bands so low-frequency resolution is denser —
 * matches human hearing + matches our music palette (kick / bass / koto pluck
 * sit in lows, wooden-flute body in mids, tape-hiss + air in highs).
 *
 *   Band 0 :  bins  0..1     (~0–375 Hz)    sub / kick
 *   Band 1 :  bins  2..3     (~375–750 Hz)  bass / low body
 *   Band 2 :  bins  4..7     (~750–1.5 kHz) low-mid / koto pluck
 *   Band 3 :  bins  8..15    (~1.5–3 kHz)   mid / flute body
 *   Band 4 :  bins  16..31   (~3–6 kHz)     high-mid / pluck transients
 *   Band 5 :  bins  32..63   (~6–12 kHz)    air / shimmer
 *   Band 6 :  bins  64..95   (~12–18 kHz)   tape-hiss top
 *   Band 7 :  bins  96..127  (~18–24 kHz)   sparkle / cymbal sheen
 *
 * Edges hard-coded (see BAND_EDGES); each value in audioFFT is the band's
 * average normalised to 0..1 (byte data 0..255 → /255), then lerped against
 * the previous frame at α=0.4 to dampen flicker.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * Music source — silent fallback vs Suno
 * ───────────────────────────────────────────────────────────────────────────
 *
 * `MUSIC_TRACK = ''` → the bridge wires up `createSilentSource()` (a constant-
 * zero buffer source) so the analyser graph stays connected and FFT bands
 * settle on 0. Post-FX shaders accept zero-valued bands as a quiet baseline.
 *
 * Once Suno tracks land in `public/assets/audio/music/`, set
 *   MUSIC_TRACK = '/assets/audio/music/title-theme.mp3'
 * and the bridge will swap to a streamed AudioBufferSourceNode automatically —
 * one-line change, no other call-sites updated.
 *
 * Sprint 17 fix (2026-05-02): the previous fallback was a triangle/saw oscillator
 * pair with LFO + filter sweep. It was audible as a "raar fluitje" whenever the
 * streamed track failed to start (autoplay-policy reject, asset 404, etc.). The
 * synth has been removed; silence is the new fallback. NO MELODY. NO HIGHS.
 */

import type { GlobalUniforms } from '../core/globalUniforms';
import { assetPath } from '../core/assetPath';

// Howler exposes its AudioContext + master gain on the global Howler object
// (typed in @types/howler). Howler creates the context lazily on first Howl
// construction or first `volume()`/`mute()` call.
import { Howler } from 'howler';

/**
 * Active OST track. Empty string → silent fallback (FFT bands stay at 0).
 * When a track is rendered + saved to `public/assets/audio/music/<name>.mp3`,
 * the constant uses `assetPath()` so the URL respects Vite's `base` config
 * (dev `/`, prod `/games/cosmos-2026/`).
 *
 * Typed `string` (not literal) so TS keeps both factory branches live.
 */
const MUSIC_TRACK: string = assetPath('assets/audio/music/title-theme.mp3');

/**
 * Track-pools for stingers and hallucinations. Sprint 10 architecture:
 * the same trigger picks a random track per fire so the listener never
 * gets fatigued by the same audio cue. Pools can grow without code changes.
 *
 *   audio.playStinger(DAMAGE_WARPS)        → one-shot, full-length, fades on `ended`
 *   audio.startHallucination(HALLUCINATION_PEAKS) → up to MAX_HALLUCINATION_S, then fade
 */
export const DAMAGE_WARPS: readonly string[] = [
  assetPath('assets/audio/music/damage-warp-1.mp3'),
  // damage-warp-2 lands when Richard renders the second variant; the
  // pool grows automatically and pickFrom() handles it.
];

export const HALLUCINATION_PEAKS: readonly string[] = [
  assetPath('assets/audio/music/hallucination-peak-1.mp3'),
  assetPath('assets/audio/music/hallucination-peak-2.mp3'),
];

const MAX_HALLUCINATION_S = 30;
const STINGER_GAIN = 0.85;
const HALLUCINATION_GAIN = 0.55;
const HALLUCINATION_FADE_S = 4;

/** Smoothing factor for the per-band lerp. Higher = snappier, lower = sleepier. */
const BAND_LERP_ALPHA = 0.4;

function pickFrom<T>(pool: readonly T[]): T | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Bin index *exclusive* upper-bound for each of the 8 logarithmic bands. */
const BAND_EDGES: readonly number[] = [2, 4, 8, 16, 32, 64, 96, 128];

interface MusicSource {
  /** Output node that should be wired into the analyser. */
  output: AudioNode;
  /** Underlying HTMLAudioElement (only set for streamed tracks). Used by ensureRunning() to retry play after gesture. */
  audioEl?: HTMLAudioElement;
  /** Stop and free the source. */
  dispose(): void;
}

export class AudioFFTBridge {
  private readonly uniforms: GlobalUniforms;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private musicGain: GainNode | null = null;
  private stingerGain: GainNode | null = null;
  private source: MusicSource | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private muted = false;
  private initialised = false;
  private musicVolume = 0.55;
  /** Last track requested via setMusicTrack(), remembered even when the graph
   *  is not yet built. The substrate selects a room bed at boot — before the
   *  first user-gesture — so the AudioContext isn't alive yet; init() then
   *  honors this over the default MUSIC_TRACK. Without it every substrate
   *  universe fell back to the title theme (live UAT 2026-06-07). */
  private pendingTrackUrl: string | null = null;
  /** The logical URL currently loaded into the persistent music element. Lets
   *  setMusicTrack skip a redundant reload (which would restart the bed) and
   *  drives the blessed-element reuse (see setMusicTrack). */
  private currentTrackUrl: string | null = null;
  private hallucinationActive: { audio: HTMLAudioElement; node: MediaElementAudioSourceNode; gain: GainNode; timer: number } | null = null;

  constructor(uniforms: GlobalUniforms) {
    this.uniforms = uniforms;
  }

  /**
   * Boot the analyser graph. Safe to call before user-gesture — it just
   * creates the nodes; the AudioContext only needs to be in `running` state
   * before `update()` produces non-zero output, which `ensureRunning()`
   * handles.
   */
  init(): void {
    if (this.initialised) return;
    // Force Howler to lazily create its AudioContext + masterGain. Calling
    // .volume() with the current value is a side-effect-free way to trigger
    // setupAudioContext() without altering global state.
    Howler.volume(Howler.volume());
    // v2.10.4 — THE "music stops sometimes, SFX still play" bug. We share
    // Howler's AudioContext, and Howler suspends that context 30 s after its
    // own last sound (autoSuspend) — taking our music bed down with it until
    // the next SFX resumes it. Howler's timer callback checks this flag, so
    // setting it here also defuses a timer that is already running.
    Howler.autoSuspend = false;
    if (!Howler.ctx || !Howler.masterGain || !Howler.usingWebAudio) {
      // eslint-disable-next-line no-console
      console.warn('[audioFFTBridge] Web Audio unavailable; FFT disabled.');
      return;
    }
    // v2.10.5 — THE iPhone "no music, SFX fine" root cause. On the first
    // `new Howl` Howler runs `_unlockAudio()`, and if the context's sampleRate
    // is not 44100 (48000 on every iPhone and Mac) it CLOSES the context and
    // creates a new one (Howler.unload). Our graph — captured below — then
    // hangs on a closed context forever while SFX use the new one. Trigger
    // that one-time swap now, before we capture the context.
    (Howler as unknown as { _unlockAudio?: () => void })._unlockAudio?.();
    if (!Howler.ctx || !Howler.masterGain) return;
    this.ctx = Howler.ctx;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;

    // Stingers + hallucinations go through their own sub-bus so they can
    // be ducked independently. Both buses meet at the analyser, so the
    // post-FX shaders react to insanity-cues as well as the base music.
    this.stingerGain = this.ctx.createGain();
    this.stingerGain.gain.value = 1.0;

    // music → musicGain    ─┐
    //                       ├→ analyser → Howler.masterGain → destination
    // stingers → stingerGain─┘
    this.musicGain.connect(this.analyser);
    this.stingerGain.connect(this.analyser);
    this.analyser.connect(Howler.masterGain);

    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    // A room bed requested before this graph existed wins over the default
    // title theme; '' (explicit silence) still yields the silent fallback.
    const bootTrack = this.pendingTrackUrl ?? MUSIC_TRACK;
    this.source = bootTrack
      ? createStreamedTrack(this.ctx, bootTrack)
      : createSilentSource(this.ctx);
    this.currentTrackUrl = bootTrack || null;
    this.source.output.connect(this.musicGain);

    this.initialised = true;
  }

  /**
   * Resume the AudioContext on user-gesture. Browsers block autoplay until
   * the page receives a real input event.
   */
  ensureRunning(): void {
    if (!this.initialised) this.init();
    // v2.10.5 — belt and braces: if Howler ever swaps its context under us
    // (unload → close → new), rebuild our graph on the new one, keeping the
    // current bed. We are inside a gesture here, so the fresh element's
    // play() is blessed.
    if (this.initialised && this.ctx && (this.ctx !== Howler.ctx || (this.ctx.state as string) === 'closed')) {
      const keep = this.currentTrackUrl;
      this.dispose();
      this.pendingTrackUrl = keep;
      this.init();
      this.debugNote('graph rebuilt on new ctx');
    }
    // v2.6.1 — iOS reports `interrupted` (not `suspended`) after AirPods
    // out/in, screen lock, a notification, Siri. We only resumed on
    // `suspended`, so after any interruption the bed stayed dead while Howler
    // SFX (which checks both states) kept playing. Live report 2026-09-05.
    const state = this.ctx?.state as string | undefined;
    if (this.ctx && (state === 'suspended' || state === 'interrupted')) {
      void this.ctx.resume();
    }
    if (state === 'closed') this.debugNote('ctx closed (Howler unload?)');
    // Sprint 11D fix — autoplay-policy rejects the initial `<audio>.play()` call
    // before user-gesture, leaving the music track paused even after the
    // AudioContext resumes. Retry play() on every gesture; idempotent if
    // already playing (the play promise just resolves immediately).
    const audioEl = this.source?.audioEl;
    if (audioEl && audioEl.paused) {
      void audioEl.play().catch((err) => {
        // eslint-disable-next-line no-console
        console.warn(`[audioFFTBridge] music play() retry rejected: ${err.name} ${err.message}`);
        this.debugNote(`play() rejected: ${err.name}`);
      });
    }
    this.debugNote();
  }

  /** `?audiodebug=1` — a tiny on-screen readout for phones (no devtools):
   *  context state · bed paused/playing · last play() rejection. */
  private debugEl: HTMLDivElement | null = null;
  private debugLast = '';
  private debugNote(note?: string): void {
    if (typeof window === 'undefined' || !/[?&]audiodebug=1/.test(window.location.search)) return;
    if (note) this.debugLast = note;
    if (!this.debugEl) {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'fixed', left: '8px', bottom: '8px', zIndex: '999', font: '11px/1.3 monospace',
        color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '4px 6px', borderRadius: '6px', pointerEvents: 'none',
      } as Partial<CSSStyleDeclaration>);
      document.body.appendChild(el);
      this.debugEl = el;
    }
    const a = this.source?.audioEl;
    this.debugEl.textContent =
      `ctx ${this.ctx?.state ?? '-'} · bed ${a ? (a.paused ? 'paused' : 'playing') : 'none'}` +
      ` · t ${a ? a.currentTime.toFixed(1) : '-'} · ${(this.currentTrackUrl ?? '').split('/').pop() ?? ''}` +
      (this.debugLast ? ` · ${this.debugLast}` : '');
  }

  /** Per-frame: pull byte FFT, aggregate to 8 bands, lerp into uniforms. */
  update(): void {
    if (this.debugEl) this.debugNote();
    if (!this.analyser || !this.freqData) return;
    if (this.ctx?.state !== 'running') return; // pre-gesture: bands stay 0

    this.analyser.getByteFrequencyData(this.freqData);

    const out = this.uniforms.audioFFT;
    let lo = 0;
    for (let band = 0; band < 8; band++) {
      const hi = BAND_EDGES[band];
      let sum = 0;
      for (let i = lo; i < hi; i++) sum += this.freqData[i];
      const avg = sum / (hi - lo) / 255;
      // Decay/lerp damping — mix(prev, new, α) — keeps flicker out of bloom.
      out[band] = out[band] * (1 - BAND_LERP_ALPHA) + avg * BAND_LERP_ALPHA;
      lo = hi;
    }
  }

  /** Toggle the music sub-bus mute. SFX bus is unaffected. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.musicGain) {
      this.musicGain.gain.value = muted ? 0 : this.musicVolume;
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Read-only debug snapshot of the current 8-band FFT. */
  snapshot(): readonly number[] {
    return Array.from(this.uniforms.audioFFT);
  }

  /**
   * One-shot stinger overlay (e.g. damage-warp). Picks a random track from
   * the pool, plays it once via the stinger sub-bus, auto-disposes on `ended`.
   * Multiple stingers may overlap — that's fine, the analyser sums them.
   */
  playStinger(pool: readonly string[]): void {
    if (this.muted || !this.ctx || !this.stingerGain) return;
    const url = pickFrom(pool);
    if (!url) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const audio = document.createElement('audio');
    audio.src = url;
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.addEventListener('error', () => {
      // eslint-disable-next-line no-console
      console.warn(`[audioFFTBridge] stinger load failed: ${url}`);
    });

    const gain = this.ctx.createGain();
    gain.gain.value = STINGER_GAIN;
    const node = this.ctx.createMediaElementSource(audio);
    node.connect(gain).connect(this.stingerGain);

    const cleanup = (): void => {
      audio.pause();
      audio.src = '';
      try {
        node.disconnect();
        gain.disconnect();
      } catch {
        /* ignore — already disposed */
      }
    };
    audio.addEventListener('ended', cleanup);

    void audio.play().catch(() => cleanup());
  }

  /**
   * Sustained hallucination overlay (e.g. hallucination-peak). Only one
   * hallucination plays at a time — re-trigger while active is a no-op,
   * keeping the soundscape from becoming a smear of overlapping textures.
   * Auto-fades out after MAX_HALLUCINATION_S, then disposes.
   */
  startHallucination(pool: readonly string[]): void {
    if (this.muted || !this.ctx || !this.stingerGain) return;
    if (this.hallucinationActive) return;
    const url = pickFrom(pool);
    if (!url) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const audio = document.createElement('audio');
    audio.src = url;
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.loop = false;
    audio.addEventListener('error', () => {
      // eslint-disable-next-line no-console
      console.warn(`[audioFFTBridge] hallucination load failed: ${url}`);
    });

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    const node = this.ctx.createMediaElementSource(audio);
    node.connect(gain).connect(this.stingerGain);

    // Quick fade-in (1s) so the entry isn't a click; held at HALLUCINATION_GAIN
    // until the fade-out begins at (MAX - FADE_S).
    const now = this.ctx.currentTime;
    gain.gain.linearRampToValueAtTime(HALLUCINATION_GAIN, now + 1);
    gain.gain.setValueAtTime(HALLUCINATION_GAIN, now + (MAX_HALLUCINATION_S - HALLUCINATION_FADE_S));
    gain.gain.linearRampToValueAtTime(0, now + MAX_HALLUCINATION_S);

    const dispose = (): void => {
      audio.pause();
      audio.src = '';
      try {
        node.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
      if (this.hallucinationActive?.audio === audio) {
        clearTimeout(this.hallucinationActive.timer);
        this.hallucinationActive = null;
      }
    };
    audio.addEventListener('ended', dispose);
    const timer = window.setTimeout(dispose, MAX_HALLUCINATION_S * 1000 + 100);

    this.hallucinationActive = { audio, node, gain, timer };
    void audio.play().catch(() => dispose());
  }

  /** True if a hallucination is currently playing. */
  hallucinationPlaying(): boolean {
    return this.hallucinationActive !== null;
  }

  /**
   * Sprint 13A — swipe-to-tempo-shift hook. Sets the playbackRate of the
   * underlying streamed `<audio>` element when the music source is streamed.
   * The silent fallback has no rate to vary, so this is a no-op there.
   */
  setMusicRate(rate: number): void {
    const audioEl = this.source?.audioEl;
    if (audioEl) {
      audioEl.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    }
  }

  /**
   * Sprint 13B/13E — current playback position of the streamed music source,
   * in seconds. Returns 0 when the source is the silent fallback or before
   * first user gesture. Consumed by BeatmapScheduler so beat-timing follows
   * the audio clock instead of rAF (drift-free over long sessions).
   */
  musicCurrentTime(): number {
    return this.source?.audioEl?.currentTime ?? 0;
  }

  /**
   * Sprint 13E — swap the active music track. Disposes the current source,
   * creates a fresh streamed track, and connects it to the music sub-bus.
   * Used by BiomeManager.onTrackSwap to crossfade between biomes (the lerp
   * itself is on biomeIntensity uniforms; here we just swap the audio).
   */
  setMusicTrack(url: string): void {
    // Remember the request even pre-init so init() can honor it (substrate
    // boots its room bed before the first gesture; see pendingTrackUrl).
    this.pendingTrackUrl = url;
    if (!this.ctx || !this.musicGain) return;
    if (url === this.currentTrackUrl && this.source?.audioEl) {
      // Same bed already loaded — just make sure it's playing (e.g. re-enter).
      void this.source.audioEl.play().catch(() => {});
      return;
    }

    // iOS FIX (Wave 25.5): REUSE the existing, already-gesture-"blessed" audio
    // element — only swap its `.src`. Creating a NEW element per track means a
    // fresh, un-blessed element; when the swap fires async (after the travel
    // veil, OUTSIDE the wake gesture), iOS autoplay-policy blocks its play() and
    // every world reached by travelling goes silent. A blessed element re-plays
    // programmatically. We only build a fresh element if none exists yet (the
    // boot source was the silent fallback).
    const existing = this.source?.audioEl;
    if (existing) {
      existing.src = url; // setting src loads; an explicit load() can drop
      existing.loop = true; // the iOS gesture-blessing of the element
      this.currentTrackUrl = url;
      void existing.play().catch(() => {
        /* gesture still pending; ensureRunning() retries play() on next gesture */
      });
      return;
    }

    this.source?.dispose();
    this.source = createStreamedTrack(this.ctx, url);
    this.currentTrackUrl = url;
    this.source.output.connect(this.musicGain);
  }

  /**
   * Sprint 13C — expose a MediaStream tap of the music+stinger mix so the
   * ClipRecorder (`src/share/captureClip.ts`) can include audio in its
   * 60s clip export. We branch off the analyser into a fresh
   * `MediaStreamAudioDestinationNode`; the existing `analyser → masterGain`
   * graph is untouched, so the live playback is not affected.
   *
   * Returns `null` if the bridge isn't initialised (pre-gesture / Web Audio
   * unsupported). The returned stream stays live until `dispose()` is called.
   */
  captureStream(): MediaStream | null {
    if (!this.ctx || !this.analyser) return null;
    const dest = this.ctx.createMediaStreamDestination();
    try {
      this.analyser.connect(dest);
    } catch {
      return null;
    }
    return dest.stream;
  }

  /** Tear down. Call on hot-reload / scene swap. */
  dispose(): void {
    this.source?.dispose();
    this.source = null;
    if (this.hallucinationActive) {
      clearTimeout(this.hallucinationActive.timer);
      this.hallucinationActive.audio.pause();
      this.hallucinationActive = null;
    }
    this.musicGain?.disconnect();
    this.stingerGain?.disconnect();
    this.analyser?.disconnect();
    this.musicGain = null;
    this.stingerGain = null;
    this.analyser = null;
    this.initialised = false;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Music sources                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Silent fallback source. Used when `MUSIC_TRACK = ''` or before the streamed
 * track has actually started producing samples. A 1-sample looping zero-buffer
 * keeps the analyser graph live and gives `getByteFrequencyData()` a stable
 * 0-floor — post-FX bands settle at 0 (no bloom pump, no kaleido jitter).
 *
 * Why not just leave `musicGain` un-fed? Some browsers (Safari) throttle
 * disconnected analysers; keeping a real (silent) source attached avoids the
 * throttle without adding any audible content.
 */
function createSilentSource(ctx: AudioContext): MusicSource {
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  // buffer is already zero-filled; explicit fill not required.
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  node.start();
  return {
    output: node,
    dispose(): void {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
      node.disconnect();
    },
  };
}

/**
 * Streamed Suno-track source. Used when `MUSIC_TRACK` is set.
 * Keeps the bridge agnostic of file format — browser-native audio decoding
 * via `<audio>` element + MediaElementSource (works for mp3/ogg/wav, supports
 * looping via the audio element).
 *
 * If the `<audio>` element fires `error` (404, decode failure, …) we log a
 * single warning so the dev knows the swap is broken — but we do NOT throw,
 * because the analyser graph is already wired. The world will simply be
 * silent; the silent fallback (`createSilentSource`) covers the FFT floor.
 */
function createStreamedTrack(ctx: AudioContext, src: string): MusicSource {
  const audioEl = document.createElement('audio');
  audioEl.src = src;
  audioEl.loop = true;
  audioEl.crossOrigin = 'anonymous';
  audioEl.preload = 'auto';
  audioEl.addEventListener('error', () => {
    // eslint-disable-next-line no-console
    console.warn(
      `[audioFFTBridge] failed to load music track: ${src} (audio.error.code=${audioEl.error?.code} msg=${audioEl.error?.message}) — set MUSIC_TRACK='' to fall back to silence.`,
    );
  });
  // Best-effort autoplay — autoplay-policy will reject before user-gesture.
  // `ensureRunning()` retries play() on every gesture (Sprint 11D fix), so we
  // can safely swallow this rejection silently.
  void audioEl.play().catch(() => {
    /* gesture pending; ensureRunning() retries play() after ctx.resume() */
  });

  const node = ctx.createMediaElementSource(audioEl);
  return {
    output: node,
    audioEl,
    dispose(): void {
      audioEl.pause();
      audioEl.src = '';
      node.disconnect();
    },
  };
}
