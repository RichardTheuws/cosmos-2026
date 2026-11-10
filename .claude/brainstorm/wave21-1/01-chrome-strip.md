# Wave 21.1 — chrome-strip on /play/

**Status**: shipped (locally — pending phase 2 deploy)
**Date**: 2026-05-05
**Agent**: chrome-stripper
**File touched**: `play/index.html` only (no src/, no universes/, no other HTML)

## 1 · Lines deleted (count + sections)

Net diff: **-50 lines** (old 446 → new 396; 174 lines changed: 62 insertions, 112 deletions).

What was removed:

- **HTML chrome** (~10 lines):
  - `<nav class="hud-nav" aria-label="Navigatie">` + 3 anchor links (`← Home`, `Het Verhaal`, `Updates`) + a stray empty anchor placeholder (`Steun` appeared to have been already deleted in an earlier pass — only the `Steun` CSS reference would have lived elsewhere; it was not in the served HTML).
  - `<span class="hud-version">v2.2.0 · substrate</span>`.
  - The `.hud-right` wrapper div that only existed to hold the nav + version.
  - **Note on `0m` altitude counter**: the `0m` text was NOT in the static HTML — it was injected at runtime by `HudOverlay` into `.hud-left`. Since I'm scoped to `play/index.html` only and cannot modify `src/`, I left `.hud-left` as the injection point but **the altitude pill itself is still injected by `HudOverlay.attach()`**. See §3 for the TODO surfaced.

- **CSS chrome** (~60 lines):
  - All `.hud-nav` rules (base + hover) — gone.
  - All `.hud-nav a` rules — gone.
  - All `.hud-version` rules — gone.
  - The `.hud-nav` and `.hud-version` overrides inside the two `@media` breakpoints (tablet `<1024px` and mobile `<600px`) — gone.
  - The `.hud-right` rule — gone (no longer any child element to right-justify).
  - `.hud { justify-content: space-between; ... flex-wrap: nowrap; gap: 0.6rem; }` simplified to a left-aligned flex (the right-side is now empty).

- **Dutch strings**:
  - `<html lang="nl">` → `<html lang="en">`.
  - `<title>Speel · [oude titel]</title>` → `<title>Cosmo's Universe — play</title>`.
  - `<meta name="description"` content rewritten English: *"A psychedelic companion in an ever-growing world."*
  - Boot overlay copy: *"Cosmos ontwaakt…"* → *"Cosmo awakening…"*; *"tik om te ontwaken"* → *"tap to wake him"*.
  - Mobile disclaimer: *"touch-controls actief"* → *"touch-controls active"*.
  - Boot-error fallback link label: *"← Terug naar home"* → *"← Back home"*.
  - Mobile-disclaimer close-button `aria-label`: *"Sluiten"* → *"Close"*.
  - `aria-label="Navigatie"` removed with the nav.

## 2 · Black-bar diagnosis

**Diagnosis**: not conclusively reproduced from the local dev server (the file-served HTML by Vite served clean and renders at `100vw × 100vh` with the new defensive CSS). The likely root cause was **either**:

1. **Defensive CSS was missing on `.play-shell`, `#scene-canvas`, and `#game-canvas`**. The old CSS only set `inset: 0` on these; while `inset: 0` *should* equal full viewport when the parent is the viewport, browser quirks (especially when `box-sizing` cascades from a stylesheet imported afterwards, or when a flex/grid ancestor exists) can make `inset: 0` collapse if width/height aren't explicit. **Fix applied**: added explicit `width: 100vw; height: 100vh` on `.play-shell`, `#scene-canvas`, `#game-canvas`, plus `width: 100% !important; height: 100% !important` on the inner Phaser canvas (`#game-canvas canvas`). This is belt-and-suspenders.

2. **Phaser's `Scale.RESIZE` mode reading the parent at-init time**. Phaser is initialised with `parent: gameMount` (the `#game-canvas` div). If the parent has `inset: 0` but no explicit width/height when Phaser reads it, the parent measurement could be stale. The added explicit width/height makes that read deterministic.

3. **Less likely**: the screenshot Richard sent was after the live deploy where stale CDN edge caches served the old `dist/` bundle. After the next deploy + CF purge, the new HTML should serve clean.

**What I changed** that solves both 1 and 2:
```css
.play-shell { position: fixed; inset: 0; width: 100vw; height: 100vh; overflow: hidden; }
#scene-canvas { position: absolute; inset: 0; width: 100vw; height: 100vh; ... }
#game-canvas  { position: absolute; inset: 0; width: 100vw; height: 100vh; ... }
#game-canvas canvas { display: block; width: 100% !important; height: 100% !important; }
```

If after deploy + CF-purge the bars *still* show, the issue is in `src/main.ts` Phaser config or `parallaxScene.ts` renderer setup — and the next-wave runtime-wirer should investigate `Phaser.Scale.RESIZE` interactions and the `setSize(w, h, false)` call that suppresses canvas-style updates in Three.js (line 456 of `parallaxScene.ts`).

## 3 · TODOs / smells / future-revisits

These are things I noticed but did NOT touch (out of scope):

1. **`0m` altitude counter is JS-injected** by `HudOverlay.attach()` into `.hud-left`. I could not delete it without touching `src/ui/hudOverlay.ts`. The plan §2.3 says delete it. Action for runtime-wirer (next agent or next session): in `src/ui/hudOverlay.ts`, remove the altitude-pill injection or skip the `.hud-left` mount on `/play/`. The `.hud-left` div is preserved as injection point, but if NORTH-STAR §3 is the law, *nothing* should be injected — close the tab to leave, no on-screen instrumentation. Recommend killing the injection entirely.

2. **`mobile-disclaimer` is preserved** but its English copy ("Best on desktop · touch-controls active") may itself be chrome-creep. NORTH-STAR §3 ("the world breathes, doesn't shake") arguably means even this is breathing chrome around the world. If a deploy proves it's never visible (it's display:none until JS sets `.is-visible`), it's dead-weight. Audit recommended next pass.

3. **Boot-error fallback** still has a `<a href="/" ...>← Back home</a>` link inside its inline-styled HTML at the bottom of the script. This is fine because it only renders when `import('/src/main.ts')` rejects (catastrophic boot failure) — surfacing a "back home" then is a kindness, not chrome. Left alone.

4. **`.hud` opacity-on-hover pattern is preserved** for the (still-injected) game-info pill, but if §1 above is acted on and HudOverlay stops injecting, the entire `.hud`/`.hud-reveal-zone`/`.hud-pill*` CSS block (~100 lines) becomes dead code and can be ripped in a follow-up. Did not delete in this pass because the JS would throw on missing `#hud-root`.

5. **`.controls-hint` / `.hud-pill--controls`**: the CSS lives but no element with that class is in the static HTML — must also be JS-injected somewhere in `src/`. If it's the motion-explorer hint pill (NORTH-STAR §3 says motion-controlled world-explorer is canonical), keep. If it's the rhythm-tap "tap on beat" hint from the dead Sprint era, kill at the source. **Cannot diagnose from HTML alone** — flagged for src-side review.

6. **`tokens.css` import path**: `<link rel="stylesheet" href="/assets/css/tokens.css">` — confirmed exists at `public/assets/css/tokens.css`. This file has `body { min-height: 100vh; }` which is harmless given my explicit `html, body { height: 100%; width: 100%; overflow: hidden; }` override. No collision.

## 4 · Verification log

```
Check 1 — grep -E "Home|Het Verhaal|Updates|hud-nav|hud-version|Steun|Speel" play/index.html      → 0 matches
Check 2 — grep -E 'lang="nl"|<title>Speel' play/index.html                                       → 0 matches
Check 3 — grep -E 'lang="en"|<title>Cosmo'\''s Universe' play/index.html                          → 2 matches (lang + title)
Check 4 — npx tsc --noEmit                                                                       → clean (exit 0, no output)
Check 5 — curl http://localhost:5173/play/ | grep -E 'Home|hud-nav|Speel|Het Verhaal'            → 0 matches
Check 6 — curl http://localhost:5173/play/ | grep -E '<title>[^<]+</title>'                      → "<title>Cosmo's Universe — play</title>"
HTTP status                                                                                       → 200 OK
```

All six checks green.

## 5 · Executive summary (200 words)

The `/play/` page has shed its marketing chrome. The Dutch nav-pill (`← Home / Het Verhaal / Updates`), the `v2.2.0 · substrate` version badge, and the right-side HUD container that held them are gone — both from the served HTML and the inline stylesheet. The page now carries `<html lang="en">` and `<title>Cosmo's Universe — play>`, with all Dutch UI copy translated to English (the boot overlay's "Cosmos ontwaakt…/tik om te ontwaken" became "Cosmo awakening…/tap to wake him"). The play-shell, scene-canvas, and game-canvas now explicitly claim `100vw × 100vh` instead of relying on `inset: 0` alone — defensive against the black-bar regression visible in Richard's UAT screenshot. Net diff: -50 lines, with the static HTML now carrying only the `<canvas>`, the boot overlay, the (JS-driven) HudOverlay injection point, and the mobile-disclaimer. One TODO surfaced: the `0m` altitude pill is injected at runtime from `src/ui/hudOverlay.ts` and cannot be killed from HTML alone — the next runtime-wirer pass should remove the injection. The static HTML is now exactly what NORTH-STAR §3 asks for: a full-viewport canvas, no menu, close-the-tab to leave.
