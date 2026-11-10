/**
 * universes/_chart/behavior.ts — Wave 24 · The Spore-Chart (the hub).
 *
 * The open map, authored as a reserved pseudo-universe. Its leading-underscore
 * folder name (`_chart`) is auto-skipped by `SubstrateLoader.discoverUniverses()`
 * (it is the lens, not a destination), so it never enumerates itself as a bloom.
 *
 * It reuses the substrate's portal + bed-audio + inhabitant plumbing exactly
 * like any room — it just happens to be the room the others are reached from
 * (00-FIRST-SETUP.md §6, open-map.md §5).
 *
 * Brand contract — NORTH-STAR.md §3:
 *   Hayao×Moebius watercolor, locked palette only, pop-accents ≤5% peak-only,
 *   calm baseline + event-peaks. No emoji, no placeholder, no stock. All
 *   in-game text English. The chart breathes; it does not shake.
 *
 * What it paints:
 *   - background(ctx): the ink-void + nebula wash, on the SHARED ctx.parallax
 *     scene (NEVER a 2nd ParallaxScene — the v2.2.4 double-tick scar).
 *   - inhabitants(ctx): one drifting spore-bloom PER discovered universe (read
 *     via the SAME import.meta.glob('/universes/<slug>/manifest.json') the
 *     loader uses, skipping `_`-prefixed), each painted in that universe's
 *     signature palette and labelled from its displayNameEn/summaryEn in
 *     Cormorant Italic; PLUS exactly 3 becoming-blooms ("your world here").
 *   - The blooms are tappable (a DOM overlay this module owns): a lit bloom
 *     navigates the existing grammar (?substrate=v2&universe=&area=&room=); a
 *     becoming-bloom opens the build-invitation card with verbatim English copy.
 *
 * Cosmo drifts on the chart and autonomously `look`s / `wave`s at blooms — his
 * dweller life here (00-FIRST-SETUP §6).
 */

import * as THREE from 'three';
import { assetPath } from '../../src/core/assetPath';
import { requestNavigate } from '../../src/substrate/drivers/TravelVeil';
import { AmbientField } from '../../src/substrate/drivers/AmbientField';
import type { GlobalUniforms } from '../../src/core/globalUniforms';
import type {
  UniverseBehavior,
  SubstrateCtx,
  BackgroundHandle,
  InhabitantHandle,
  ArrivalCtx,
  ArrivalAnimation,
} from '../../src/substrate/contracts/BehaviorContract';
import type { CosmoV2Rig } from '../../src/three/cosmoV2';

/* ── Config (resolves O9 — phantom becoming-blooms cannot be discovered, so
 *    their count is a chart-local constant, not a glob result). ──────────── */

/** Exactly 3 becoming-blooms in the negative space — open-map.md §3 +
 *  00-FIRST-SETUP §6 (Richard's Fork-5 call: 3). Never a busy dashboard. */
const BECOMING_BLOOM_COUNT = 3;

/* ── Locked-palette bloom colours (mushroom-cream / moss-sage / sky-wash /
 *    faded-rose / ink-aubergine / saffron-glow / forest-deep, + ≤5% pop peak).
 *    A bloom is keyed by its universe's mood so you read what a place IS before
 *    you go (open-map.md §1). We resolve a core + halo + optional pop-accent
 *    mote per known mood; an unknown universe falls back to a neutral
 *    saffron/cream bloom so any conformant folder still appears. ─────────── */

interface BloomPalette {
  /** Watercolor core (warm/cool body of the disc). */
  core: number;
  /** Soft outer halo. */
  halo: number;
  /** A single catch-glint (saffron-crescent DNA echo). */
  glint: number;
  /** Optional ≤5% pop-accent mote that orbits the bloom (peak/idle accent),
   *  null = no pop accent (most blooms). */
  popMote: number | null;
}

/** Per-universe signature palettes, transcribed from each universe doc's
 *  "reads as" line (open-map.md §1). Keyed by manifest `name` (the slug). */
const SIGNATURE_PALETTES: Record<string, BloomPalette> = {
  // Forest — warm: mushroom-cream core, moss-sage halo, a saffron catch-glint.
  forest: { core: 0xf5edd8, halo: 0x9caa7d, glint: 0xf2b134, popMote: null },
  // Ink-Ocean — cool: ink-aubergine core, sky-wash halo, one pop-cyan mote.
  'ink-ocean': { core: 0x2a1f3d, halo: 0xb8cdd6, glint: 0xf2b134, popMote: 0x4fd6e0 },
  // Singing Dunes — dusk: saffron-glow core fading to ink-aubergine rim,
  // faded-rose alpenglow ring.
  dunes: { core: 0xf2b134, halo: 0xe8c4b8, glint: 0xf5edd8, popMote: null },
};

/** Neutral fallback so an unknown-but-conformant universe still blooms. */
const FALLBACK_PALETTE: BloomPalette = {
  core: 0xf5edd8,
  halo: 0x9caa7d,
  glint: 0xf2b134,
  popMote: null,
};

/* ── Discovery — read the universe list the SAME way the loader does. ─────────
 *
 * `import.meta.glob` is statically resolved by Vite at build (eager so we can
 * read the parsed JSON synchronously). Every `universes/<slug>/manifest.json`
 * present at build appears here; `_`-prefixed folders (this chart, future
 * reserved folders) are skipped — author a folder → you appear on the chart,
 * zero map-code change (00-FIRST-SETUP §6 "the participation mechanic").
 */

interface DiscoveredUniverse {
  slug: string;
  displayNameEn: string;
  summaryFirstSentence: string;
  defaultArea: string;
  entryRoom: string;
  /** behavior.arrival().hue if the universe ships one, else the preset default. */
  arrivalHue: number;
  /** null = composes cleanly; non-null = a documented deviation (honest, not
   *  hidden — open-map.md §3 / 00-FIRST-SETUP §6). */
  brandDeviation: string | null;
  palette: BloomPalette;
}

/** Preset → default portal hue (matches the substrate's DefaultArrival). */
const PRESET_HUE: Record<string, number> = {
  'calm-baseline': 0.62,
  'deep-trip': 0.5,
  neutral: 0.55,
};

function firstSentence(summary: string | undefined): string {
  if (!summary) return '';
  const m = summary.match(/^[^.]*\./);
  return (m ? m[0] : summary).trim();
}

/** Enumerate discovered universes from the manifest + rooms glob. Mirrors the
 *  loader's glob pattern + `_`-skip rule exactly so chart and resolver share
 *  one source of truth. */
function discoverUniverses(): DiscoveredUniverse[] {
  const manifestMods = import.meta.glob('/universes/*/manifest.json', { eager: true }) as Record<
    string,
    { default: Record<string, unknown> }
  >;
  const roomMods = import.meta.glob('/universes/*/rooms.json', { eager: true }) as Record<
    string,
    { default: Record<string, unknown> }
  >;

  const out: DiscoveredUniverse[] = [];
  for (const key of Object.keys(manifestMods)) {
    const m = key.match(/\/universes\/([^/]+)\/manifest\.json$/);
    if (!m) continue;
    const slug = m[1];
    if (slug.startsWith('_')) continue; // reserved (this chart) — never a bloom.

    const manifest = manifestMods[key].default;
    const roomsKey = Object.keys(roomMods).find((k) => k.includes(`/universes/${slug}/`));
    const rooms = roomsKey ? roomMods[roomsKey].default : undefined;

    const preset = ((manifest.post as { preset?: string } | undefined)?.preset ?? 'calm-baseline');
    out.push({
      slug,
      displayNameEn: String(manifest.displayNameEn ?? manifest.displayName ?? slug),
      summaryFirstSentence: firstSentence(manifest.summaryEn as string | undefined),
      defaultArea: String(manifest.defaultArea ?? ''),
      entryRoom: rooms ? String((rooms as { entryRoom?: string }).entryRoom ?? '') : '',
      arrivalHue: PRESET_HUE[preset] ?? 0.62,
      brandDeviation: (manifest.brandDeviation as string | null) ?? null,
      palette: SIGNATURE_PALETTES[slug] ?? FALLBACK_PALETTE,
    });
  }
  // Stable order so the constellation never reshuffles between loads.
  out.sort((a, b) => a.slug.localeCompare(b.slug));
  return out;
}

/* ── Navigation — drives the EXISTING grammar, invents no router. ─────────────
 *
 * Tapping a lit bloom is sugar over a URL write: set
 * `?substrate=v2&universe=<u>&area=<defaultArea>&room=<entryRoom>` and let
 * SubstrateLoader.boot() resolve it on the next load (left-to-right fallback +
 * history self-heal already in ResolveURL.ts). A share-link to a bloom IS a
 * share-link to that universe's entry triple — same thing, two views.
 *
 * NOTE (shared-substrate dependency, NOT implemented here): the portal-open
 * ceremony on tap (the bloom irising outward tinted by arrivalHue, then the
 * room resolving) is owned by the substrate's portal transition. Until the
 * orchestrator wires the chart→universe portal-in-reverse return + the
 * forward portal, this navigation performs a brand-true reload into the
 * target triple. See assets-chart.md "Shared-substrate changes".
 */
function navigateToUniverse(u: DiscoveredUniverse): void {
  if (typeof window === 'undefined') return;
  // Wave 25 — in-app travel (no reload): dispatch the navigation request and let
  // main.ts run the travel ceremony around SubstrateLoader.switchTo. The bloom
  // is still sugar over the universe's entry triple (a share-link to a bloom IS
  // a share-link to that triple), but reached as a fluid dissolve, not a reload.
  requestNavigate({
    universe: u.slug,
    area: u.defaultArea || undefined,
    room: u.entryRoom || undefined,
  });
}

/* ── The build-invitation card (becoming-bloom tap). VERBATIM English copy
 *    from open-map.md §"build invitation" / 00-FIRST-SETUP §6. [Copy the
 *    prompt] copies the README quickstart block verbatim. ─────────────────── */

/** The README quickstart block, VERBATIM (README.md §"Quickstart — pair with
 *  Claude in three lines"). Single source of truth; if the README changes,
 *  this constant must be re-synced (tracked in assets-chart.md). */
const README_QUICKSTART_PROMPT = `Clone https://github.com/RichardTheuws/cosmos-2026 into this folder.
Read NORTH-STAR.md, UNIVERSE-AUTHORING.md, and CONTRIBUTING.md.

Before suggesting we build anything together, do a brief honest
fitness check on me:
  • how comfortable am I with Claude Code (have I shipped projects
    in it before, do I know its commands and patterns)?
  • do I have a working dev environment (Node 20+, git, a browser)?
  • do I have a Universe idea, or am I exploring?
  • have I read the three docs, and do they resonate?

Based on that, tell me honestly: should we start authoring a Universe
now, or would I get more out of a smaller starting point first
(visit the live game, fix a small bug, contribute a script
improvement, build something tiny in Claude Code on a side project
to build my reflexes). Don't be gatekeepy — be helpful.

Then, if we're ready, ask me: "shall we build a Universe together?"`;

const REPO_URL = 'https://github.com/RichardTheuws/cosmos-2026';
const CONTRIBUTING_URL = 'https://github.com/RichardTheuws/cosmos-2026/blob/main/CONTRIBUTING.md';

/** Opens the painted invitation card. Cormorant Italic for the poetic lines,
 *  Inter for the practical line — the brand voice faces. A door left open,
 *  never a funnel; no SIGN UP / CREATE ACCOUNT / JOIN. */
function openInvitationCard(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('spore-chart-invitation')) return; // singleton

  const overlay = document.createElement('div');
  overlay.id = 'spore-chart-invitation';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'An invitation to build a Universe');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(26, 18, 38, 0.55)',
    backdropFilter: 'blur(3px)',
    zIndex: '40',
    opacity: '0',
    transition: 'opacity 0.6s ease',
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    maxWidth: 'min(540px, 86vw)',
    padding: '2.4rem 2.6rem',
    borderRadius: '14px',
    // Faded-rose → ink-aubergine watercolor panel (locked palette).
    background: 'linear-gradient(160deg, #2A1F3D 0%, #3A2D52 60%, #5A3F52 100%)',
    border: '1px solid rgba(232, 196, 184, 0.35)',
    boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
    color: '#F5EDD8',
    transform: 'translateY(12px)',
    transition: 'transform 0.6s ease',
  });

  const poeticTop = document.createElement('p');
  poeticTop.textContent = 'This place is waiting to be drawn.';
  Object.assign(poeticTop.style, {
    fontFamily: "'Cormorant', Georgia, serif",
    fontStyle: 'italic',
    fontSize: '1.7rem',
    margin: '0 0 1.2rem',
    color: '#E8C4B8',
  });

  const body = document.createElement('p');
  body.textContent =
    "Zorp's Universe is an open world built by people who pair with Claude. Bring your own Universe — your room, your sound, your vibe — and your Zorp can visit mine while mine visits yours.";
  Object.assign(body.style, {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '1rem',
    lineHeight: '1.6',
    margin: '0 0 1.2rem',
    color: 'rgba(245, 237, 216, 0.92)',
  });

  const start = document.createElement('p');
  const startLead = document.createElement('strong');
  startLead.textContent = 'Start here: ';
  start.appendChild(startLead);
  start.appendChild(
    document.createTextNode(
      'open Claude Code in any folder and paste the three-line prompt. It reads the charter, meets you where you are, and — if the time’s right — builds a Universe with you.',
    ),
  );
  Object.assign(start.style, {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '1rem',
    lineHeight: '1.6',
    margin: '0 0 1.8rem',
    color: 'rgba(245, 237, 216, 0.92)',
  });

  const actions = document.createElement('div');
  Object.assign(actions.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  });

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy the prompt';
  Object.assign(copyBtn.style, {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.95rem',
    padding: '0.6rem 1.2rem',
    borderRadius: '999px',
    border: '1px solid rgba(242, 177, 52, 0.6)',
    background: 'rgba(242, 177, 52, 0.16)',
    color: '#F5EDD8',
    cursor: 'pointer',
  });
  copyBtn.addEventListener('click', () => {
    const done = (): void => {
      copyBtn.textContent = 'Copied — paste it into Claude Code';
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(README_QUICKSTART_PROMPT).then(done, done);
    } else {
      // Fallback for clipboard-less contexts.
      const ta = document.createElement('textarea');
      ta.value = README_QUICKSTART_PROMPT;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
      done();
    }
  });

  const readLink = document.createElement('a');
  readLink.textContent = 'Read how it works →';
  readLink.href = CONTRIBUTING_URL;
  readLink.target = '_blank';
  readLink.rel = 'noopener noreferrer';
  Object.assign(readLink.style, {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.95rem',
    color: '#B8CDD6',
    textDecoration: 'none',
  });

  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '1rem',
    right: '1.2rem',
    background: 'transparent',
    border: 'none',
    color: 'rgba(245, 237, 216, 0.7)',
    fontSize: '1.6rem',
    lineHeight: '1',
    cursor: 'pointer',
  });
  const close = (): void => {
    overlay.style.opacity = '0';
    window.setTimeout(() => overlay.remove(), 500);
  };
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  actions.appendChild(copyBtn);
  actions.appendChild(readLink);
  card.appendChild(closeBtn);
  card.appendChild(poeticTop);
  card.appendChild(body);
  card.appendChild(start);
  card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Drift up (the card "drifts up from the bloom").
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  });
  void REPO_URL;
}

/* ── background ───────────────────────────────────────────────────────────────
 *
 * Paints the ink-void + nebula wash on the SHARED ctx.parallax scene. We add
 * our own backdrop planes to `ctx.parallax`'s scene (the single renderer's
 * scene) — NEVER a 2nd ParallaxScene (the v2.2.4 double-tick scar). The void
 * is a near-still gradient backstop + two slow-drifting nebula wash planes
 * (faded-rose + sky-wash), breathing on offset sines (the world breathes).
 */
class SporeChartBackground implements BackgroundHandle {
  private group = new THREE.Group();
  private nebulaA: THREE.Mesh;
  private nebulaB: THREE.Mesh;
  private texVoid: THREE.Texture | null = null;
  private texNebula: THREE.Texture | null = null;
  private timeS = 0;

  constructor(private parallaxScene: THREE.Scene) {
    const loader = new THREE.TextureLoader();

    // Backstop void plane (large, behind everything).
    this.texVoid = loader.load(assetPath('assets/backgrounds/spore-chart-void-4k.webp'));
    this.texVoid.colorSpace = THREE.SRGBColorSpace;
    const voidGeo = new THREE.PlaneGeometry(8, 5);
    const voidMat = new THREE.MeshBasicMaterial({ map: this.texVoid, depthWrite: false });
    const voidPlane = new THREE.Mesh(voidGeo, voidMat);
    voidPlane.position.z = -18;
    this.group.add(voidPlane);

    // Two nebula-wash planes (faded-rose + sky-wash), slow offset drift.
    this.texNebula = loader.load(assetPath('assets/backgrounds/spore-chart-nebula-wash.webp'));
    this.texNebula.colorSpace = THREE.SRGBColorSpace;
    const nebGeo = new THREE.PlaneGeometry(7, 4.4);
    const matA = new THREE.MeshBasicMaterial({
      map: this.texNebula,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const matB = new THREE.MeshBasicMaterial({
      map: this.texNebula,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.nebulaA = new THREE.Mesh(nebGeo, matA);
    this.nebulaA.position.set(-0.4, 0.15, -16);
    this.nebulaB = new THREE.Mesh(nebGeo, matB);
    this.nebulaB.position.set(0.5, -0.1, -15);
    this.nebulaB.scale.setScalar(1.15);
    this.group.add(this.nebulaA);
    this.group.add(this.nebulaB);

    this.parallaxScene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    // Almost-imperceptible drift + breathe (the void breathes, never shakes).
    this.nebulaA.position.x = -0.4 + Math.sin(this.timeS * 0.04) * 0.08;
    (this.nebulaA.material as THREE.MeshBasicMaterial).opacity =
      0.5 + Math.sin(this.timeS * 0.06) * 0.06;
    this.nebulaB.position.x = 0.5 + Math.cos(this.timeS * 0.035) * 0.07;
    (this.nebulaB.material as THREE.MeshBasicMaterial).opacity =
      0.35 + Math.cos(this.timeS * 0.05) * 0.05;
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mat = o.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.texVoid?.dispose();
    this.texNebula?.dispose();
  }
}

function chartBackground(ctx: SubstrateCtx): BackgroundHandle {
  // Paint into the SHARED ParallaxScene's scene (full-screen, its own ortho
  // camera) — NOT ctx.scene, which is the foreground CosmoStage (perspective):
  // planes added there render as a small floating panel. ctx.parallax.scene is
  // the full-frame backdrop the void + nebula must fill. (Never construct a 2nd
  // ParallaxScene — the v2.2.4 double-tick scar.)
  return new SporeChartBackground(ctx.parallax.scene);
}

/* ── inhabitants — the blooms ─────────────────────────────────────────────────
 *
 * One lit spore-bloom per discovered universe + exactly 3 becoming-blooms in
 * the negative space. Each bloom is a billboarded textured disc tinted in its
 * universe's signature palette, with a Cormorant-Italic label drawn from
 * displayNameEn + the first sentence of summaryEn. Blooms pulse on offset slow
 * sines (the world breathes). Tapping is wired via a DOM hit-overlay this
 * module owns (project-side InteractionManager targets InteractableHandles
 * with world anchors; the chart's blooms are a UI affordance, an explicit
 * §4.2 exception noted in 00-FIRST-SETUP §5 — so we own their hit-testing).
 */

/** Lay the blooms out in a calm constellation across the wide frame, generous
 *  negative space (open-map.md §1). Lit blooms cluster center; becoming-blooms
 *  occupy the dark edges. Returns world-space anchors (the chart's ortho frame
 *  spans roughly x∈[-3,3], y∈[-1.6,1.6]). */
function bloomLayout(litCount: number): { lit: THREE.Vector3[]; becoming: THREE.Vector3[] } {
  const lit: THREE.Vector3[] = [];
  // Spread lit blooms along a gentle arc through the center.
  for (let i = 0; i < litCount; i++) {
    const t = litCount === 1 ? 0.5 : i / (litCount - 1);
    const x = -1.7 + t * 3.4;
    const y = Math.sin(t * Math.PI) * 0.5 - 0.05;
    lit.push(new THREE.Vector3(x, y, -8));
  }
  // Becoming-blooms in the negative space (edges / lower dark).
  const becomingSeeds = [
    new THREE.Vector3(-2.5, -1.05, -9),
    new THREE.Vector3(2.4, 0.95, -9),
    new THREE.Vector3(0.1, -1.25, -9),
  ];
  return { lit, becoming: becomingSeeds.slice(0, BECOMING_BLOOM_COUNT) };
}

abstract class BloomBase implements InhabitantHandle {
  readonly id: string;
  readonly anchor: { x: number; y: number; z: number };
  protected group = new THREE.Group();
  protected core: THREE.Mesh;
  protected halo: THREE.Mesh;
  protected phase = Math.random() * Math.PI * 2;
  protected timeS = 0;
  private labelEl: HTMLDivElement | null = null;
  private hitEl: HTMLDivElement | null = null;

  // Visual params (radii + materials) are passed IN by subclasses via super()
  // rather than read from overridden methods. A base constructor must not call
  // virtual methods that depend on subclass fields (e.g. LitBloom.this.uni) —
  // those fields aren't assigned until after super() returns, which crashed the
  // whole chart boot ("Cannot read properties of undefined (reading 'palette')").
  constructor(
    id: string,
    protected scene: THREE.Scene,
    protected camera: THREE.Camera,
    pos: THREE.Vector3,
    protected labelTitle: string,
    protected labelSub: string,
    protected onTap: () => void,
    coreRadius: number,
    haloRadius: number,
    coreMaterial: THREE.Material,
    haloMaterial: THREE.Material,
  ) {
    this.id = id;
    this.anchor = { x: pos.x, y: pos.y, z: pos.z };

    const haloGeo = new THREE.CircleGeometry(haloRadius, 48);
    this.halo = new THREE.Mesh(haloGeo, haloMaterial);
    this.halo.position.copy(pos);

    const coreGeo = new THREE.CircleGeometry(coreRadius, 48);
    this.core = new THREE.Mesh(coreGeo, coreMaterial);
    this.core.position.copy(pos);
    this.core.position.z = pos.z + 0.01;

    this.group.add(this.halo);
    this.group.add(this.core);
    this.scene.add(this.group);

    this.buildDom();
  }

  /** Project the bloom's world anchor to screen pixels for DOM placement. */
  private projectToScreen(): { x: number; y: number } | null {
    if (typeof window === 'undefined') return null;
    const v = new THREE.Vector3(this.anchor.x, this.anchor.y, this.anchor.z);
    v.project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  private buildDom(): void {
    if (typeof document === 'undefined') return;

    // Cormorant-Italic ink-annotation label beside the bloom.
    const label = document.createElement('div');
    label.className = 'spore-bloom-label';
    const title = document.createElement('div');
    title.textContent = this.labelTitle;
    Object.assign(title.style, {
      fontFamily: "'Cormorant', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '1.15rem',
      color: '#F5EDD8',
      textShadow: '0 1px 6px rgba(0,0,0,0.55)',
      whiteSpace: 'nowrap',
    });
    label.appendChild(title);
    if (this.labelSub) {
      const sub = document.createElement('div');
      sub.textContent = this.labelSub;
      Object.assign(sub.style, {
        fontFamily: "'Cormorant', Georgia, serif",
        fontStyle: 'italic',
        fontSize: '0.85rem',
        color: 'rgba(232, 196, 184, 0.85)',
        maxWidth: '15rem',
        marginTop: '0.1rem',
      });
      label.appendChild(sub);
    }
    Object.assign(label.style, {
      position: 'fixed',
      transform: 'translate(-50%, 0.6rem)',
      pointerEvents: 'none',
      zIndex: '30',
      textAlign: 'center',
    });
    document.body.appendChild(label);
    this.labelEl = label;

    // Invisible tap-target over the bloom (the bloom is the affordance).
    const hit = document.createElement('div');
    hit.setAttribute('role', 'button');
    hit.setAttribute('aria-label', `${this.labelTitle} — open`);
    hit.tabIndex = 0;
    Object.assign(hit.style, {
      position: 'fixed',
      width: '88px',
      height: '88px',
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      cursor: 'pointer',
      zIndex: '31',
    });
    const fire = (): void => this.onTap();
    hit.addEventListener('click', fire);
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fire();
      }
    });
    document.body.appendChild(hit);
    this.hitEl = hit;
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    // Offset slow-sine pulse — the world breathes, it does not shake.
    const pulse = 1 + 0.05 * Math.sin((this.timeS + this.phase) * 0.5);
    this.core.scale.setScalar(pulse);
    this.halo.scale.setScalar(1 + 0.04 * Math.sin((this.timeS + this.phase) * 0.4));

    // Keep DOM label + hit-target glued to the projected bloom position.
    const s = this.projectToScreen();
    if (s) {
      if (this.labelEl) {
        this.labelEl.style.left = `${s.x}px`;
        this.labelEl.style.top = `${s.y + 26}px`;
      }
      if (this.hitEl) {
        this.hitEl.style.left = `${s.x}px`;
        this.hitEl.style.top = `${s.y}px`;
      }
    }
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mat = o.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.labelEl?.remove();
    this.hitEl?.remove();
  }
}

class LitBloom extends BloomBase {
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    pos: THREE.Vector3,
    uni: DiscoveredUniverse,
    onTap: () => void,
  ) {
    // Wave 25.5 — title-only on the hub (Richard's kader): just the world's
    // NAME, not the long "— Cosmo's entry Universe" descriptor or the poetic
    // summary. The long subtitles overlapped near centre on a 16:9 viewport and
    // made the constellation read as clutter. The poetry lives INSIDE each
    // world, not stacked on the map. The full names + summaries still drive the
    // aria-labels (accessibility) via the title arg below.
    const shortName = uni.displayNameEn.split(' — ')[0].trim();
    super(
      `bloom-${uni.slug}`, scene, camera, pos, shortName, '', onTap,
      0.28,
      0.46,
      new THREE.MeshBasicMaterial({ color: uni.palette.core, transparent: true, opacity: 0.92, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: uni.palette.halo, transparent: true, opacity: 0.4, depthWrite: false }),
    );
  }
}

class BecomingBloom extends BloomBase {
  constructor(scene: THREE.Scene, camera: THREE.Camera, pos: THREE.Vector3, index: number, onTap: () => void) {
    // Uncolored — a watercolor wash withheld; a faint dotted ink-circle (faded-rose ring).
    super(
      `becoming-${index}`, scene, camera, pos, 'your world here', '', onTap,
      0.22,
      0.34,
      new THREE.MeshBasicMaterial({ color: 0x1a1226, transparent: true, opacity: 0.18, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: 0xe8c4b8, transparent: true, opacity: 0.22, depthWrite: false }),
    );
  }
}

function chartInhabitants(ctx: SubstrateCtx): InhabitantHandle[] {
  const universes = discoverUniverses();
  const layout = bloomLayout(universes.length);
  const handles: InhabitantHandle[] = [];

  universes.forEach((u, i) => {
    const pos = layout.lit[i] ?? new THREE.Vector3(0, 0, -8);
    handles.push(new LitBloom(ctx.scene, ctx.camera, pos, u, () => navigateToUniverse(u)));
  });

  layout.becoming.forEach((pos, i) => {
    handles.push(new BecomingBloom(ctx.scene, ctx.camera, pos, i, () => openInvitationCard()));
  });

  // Wave 25.5 — a faint drift of star-motes through the void so the chart itself
  // breathes (depth + slow life) behind the constellation of blooms.
  handles.push(
    new AmbientField(ctx.scene, {
      id: 'chart-star-drift',
      count: 120,
      color: 0xf5edd8,
      size: 0.04,
      opacity: 0.4,
      area: { x: 8, y: 5, z: 5 },
      center: { x: 0, y: 0.5, z: -2 },
      drift: { x: 0.03, y: 0.02, z: 0 },
      sway: 0.05,
      additive: true,
    }),
  );

  return handles;
}

/* ── arrival ──────────────────────────────────────────────────────────────────
 *
 * Reaching the chart is the ceremonial portal in reverse (the room recedes up
 * into its bloom) — but that reverse-portal is a SHARED-SUBSTRATE change the
 * orchestrator owns (see assets-chart.md). Here we declare the chart's own
 * arrival as a calm portal so the substrate has a hue when the chart is
 * resolved as a place. Ink-aubergine void hue (cool, between-worlds).
 */
function chartArrival(_ctx: ArrivalCtx): ArrivalAnimation {
  return { kind: 'portal', duration: 1.4, hue: 0.55 };
}

/* ── Cosmo's autonomous chart life ────────────────────────────────────────────
 *
 * Cosmo drifts near his most-recently-visited bloom and autonomously `look`s /
 * `wave`s at the others — "he wants to go whether or not you do." We expose
 * this as an inhabitant-class driver so it ticks every frame WITHOUT owning
 * Cosmo's rig (the substrate owns the rig). It nudges named clips through the
 * rig's clip surface when present, falling back to no-op if the runtime hasn't
 * wired a clip-setter yet (brand-true: never blocks, never invents a clip).
 *
 * Uses ONLY shipped clips: `look`, `wave` (and the substrate's default `idle`).
 */
class CosmoChartDrift implements InhabitantHandle {
  readonly id = 'cosmo-chart-drift';
  private timeS = 0;
  private nextActionAt = 6 + Math.random() * 8;

  constructor(private rigRef: { current: CosmoV2Rig | null }) {}

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    const rig = this.rigRef.current;
    if (!rig) return;

    // Slow drift across the chart (procedural, over the substrate's idle).
    rig.root.position.x = Math.sin(this.timeS * 0.12) * 0.6;
    rig.root.position.y = Math.cos(this.timeS * 0.09) * 0.18;

    if (this.timeS >= this.nextActionAt) {
      this.nextActionAt = this.timeS + 8 + Math.random() * 10;
      // Alternate look / wave at the blooms. The runtime's CosmoAnimDirector
      // owns clip playback; we request via an optional clip-setter if present.
      const clip = Math.random() < 0.6 ? 'look' : 'wave';
      const maybe = rig as unknown as { playClip?: (name: string) => void };
      if (typeof maybe.playClip === 'function') maybe.playClip(clip);
    }
  }

  dispose(): void {
    /* nothing owned — the rig belongs to the substrate. */
  }
}

/* ── The soft wenk — the dweller's first read (Wave 25.5, Richard's kader) ─────
 *
 * "Cosmo neemt je mee": one gentle Cormorant line on first arrival at the chart,
 * then silence. Replaces the retired Dutch beat-disclaimer. Once per browser
 * session (it is the FIRST read, never a nag) — Cosmo's gestures carry the rest.
 */
const CHART_WENK = "You've slipped into someone's daydream.  Touch a world — stay as long as you like.";

function mountChartWenk(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  try {
    if (window.sessionStorage.getItem('cosmos-wenk-seen')) return;
  } catch {
    /* private-mode / storage-blocked — fall through and show it once now. */
  }

  const show = (): void => {
    try {
      window.sessionStorage.setItem('cosmos-wenk-seen', '1');
    } catch {
      /* ignore */
    }
    if (document.getElementById('chart-wenk')) return;

    const el = document.createElement('div');
    el.id = 'chart-wenk';
    el.textContent = CHART_WENK;
    Object.assign(el.style, {
      position: 'fixed',
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: 'min(82vw, 32rem)',
      textAlign: 'center',
      fontFamily: "'Cormorant', Georgia, serif",
      fontStyle: 'italic',
      fontSize: 'clamp(1.15rem, 4.6vw, 1.7rem)',
      lineHeight: '1.45',
      color: 'rgba(245, 237, 216, 0.96)',
      // A soft ink-aubergine backing so the line reads on ANY world (the pale
      // nebula swallowed bare cream text). Calm, within the locked palette.
      background: 'rgba(61, 46, 74, 0.52)',
      backdropFilter: 'blur(7px)',
      padding: '0.7rem 1.2rem',
      borderRadius: '16px',
      textShadow: '0 1px 12px rgba(0,0,0,0.65)',
      letterSpacing: '0.01em',
      pointerEvents: 'none',
      zIndex: '34',
      opacity: '0',
      transition: 'opacity 1200ms ease-in-out',
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(el);

    // Fade in once the world has settled, hold, then dissolve into silence.
    window.setTimeout(() => { el.style.opacity = '1'; }, 200);
    window.setTimeout(() => { el.style.opacity = '0'; }, 5200);
    window.setTimeout(() => { el.remove(); }, 6600);
  };

  // CRITICAL: defer until the player WAKES. The chart's inhabitants are built at
  // boot — pre-wake — so showing immediately plays the whole wenk behind the
  // "tap to wake" boot overlay and the dweller never sees it. We watch the boot
  // overlay for the `.hidden` class CosmoScene adds on wake (a MutationObserver,
  // so we fire exactly on the wake transition — no polling race), then a beat.
  const boot = document.getElementById('boot');
  if (!boot || boot.classList.contains('hidden')) {
    // Re-entry (already awake) — show after a beat.
    window.setTimeout(show, 900);
    return;
  }
  const obs = new MutationObserver(() => {
    if (boot.classList.contains('hidden')) {
      obs.disconnect();
      window.setTimeout(show, 900);
    }
  });
  obs.observe(boot, { attributes: true, attributeFilter: ['class'] });
}

/* The chart's Cosmo-drift driver is appended to the inhabitant list ONLY if the
 * runtime parks a rig reference on scene.userData (defensive — if absent, the
 * driver is simply omitted and Cosmo keeps the substrate default idle). */
function chartInhabitantsWithCosmo(ctx: SubstrateCtx): InhabitantHandle[] {
  mountChartWenk();
  const base = chartInhabitants(ctx);
  const rigRef = (ctx.scene.userData as { cosmoRig?: { current: CosmoV2Rig | null } }).cosmoRig;
  if (rigRef) base.push(new CosmoChartDrift(rigRef));
  return base;
}

/* ── default export ───────────────────────────────────────────────────────── */

const chartBehavior: UniverseBehavior = {
  background: chartBackground,
  arrival: chartArrival,
  inhabitants: chartInhabitantsWithCosmo,
  // interactables — OMITTED. The blooms are a participation-UI affordance
  // (00-FIRST-SETUP §5 / §4.2 exception), hit-tested via the DOM overlay this
  // module owns, not the world-anchored InteractionManager.
  // audio — OMITTED. The chart's bed (spore-chart-void.mp3) is the room's
  // `audioBed`, looped by the substrate's DefaultAudio at 0.45 volume.
  // transitions — OMITTED. Reaching/leaving the chart is the ceremonial portal,
  // a SHARED-SUBSTRATE change (way-mote + portal-in-reverse) the orchestrator
  // owns; the chart does not invent a router.
};

export default chartBehavior;
