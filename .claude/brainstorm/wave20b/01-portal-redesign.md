# Portal redesign — Wave 20b architecture

The live portal at `theuws.com/games/cosmos-2026/` is still a Dutch game-marketing site. The spoof framing was stripped in Wave 19a, but framing was never re-anchored to the v2.0.0 substrate pivot. README is now substrate-first; the portal must match. `/play/` stays untouched.

## 1. Information architecture (sitemap)

- `/` — substrate landing (hero · pitch · quickstart · how-to-join · gallery · brand contract · GitHub CTA). **Full rewrite.**
- `/lore/` — character-DNA backstory poem. Wave-19a-clean. **Voice-pass + English summary block.**
- `/support/` — sponsor / patron path. Mollie placeholders kept; GitHub Sponsors slot added. **Voice-pass.**
- `/thanks/` — minimal post-pledge. **Voice-pass.**
- `/updates/` — auto-built from CHANGELOG. **Don't touch.**
- `/press/` — redirects to `/lore/`. **Don't touch.**
- `/play/` — game itself. **Don't touch.**

## 2. The new `/` landing — content outline

1. **Hero.** Background: `docs/showcase/hero-cosmo-in-forest.jpg`. Tagline: *"Your Cosmo can visit my forest. My Cosmo can visit your world."* Subhead: *"An open substrate for Claude-paired developers."* Two CTAs: ▶ Play live (→ `/play/`) and View on GitHub (→ `github.com/RichardTheuws/cosmos-2026`).
2. **Quickstart panel** — substrate's killer feature. The literal paste-into-Claude-Code prompt in a copy-button JetBrains Mono code-block. Heading: *"Open Claude Code in any folder and paste this."* Same text as README §Quickstart. Visually slightly more prominent — this *is* the entry point.
3. **What this is** — three short paragraphs. **Cosmo** (small green being, painted thirty years after a memory that doesn't need naming). **The Universe** (runtime + first world + invitation; Universes plug in). **The invitation** (open, MIT, multilingual, authored by people who pair with Claude).
4. **Visual gallery** — three visuals: `docs/showcase/cosmo-faces-quad.jpg`, `weirdo-inhabitants.jpg`, `palette.jpg`. One-line captions matching README.
5. **How to join** — three paths from CONTRIBUTING: **Visit** · **Author a Universe** (→ UNIVERSE-AUTHORING) · **Improve the runtime** (→ CONTRIBUTING).
6. **Brand contract** — palette swatch + four bullets (visual base · voice · never-list · deviation policy). Links NORTH-STAR §brand.
7. **Footer** — GitHub repo, NORTH-STAR, UNIVERSE-AUTHORING, AGENTS, INTEGRATIONS, CONTRIBUTING, MIT. *"Built alongside Claude."* Last line: *"Adem mee. Hij blijft niet stil."* (intentional Dutch easter-egg.)

## 3. Voice

English-first. Same tone as NORTH-STAR / README — poetic but grounded, direct, substrate-honest. Cormorant Italic for hero + section headings; Inter body; JetBrains Mono code blocks. No emojis. No marketing-cringe. Reader should feel "this is serious work that's also a little weird."

## 4. Mobile-first considerations

Hero stacks vertically on ≤720px (Cosmo above text). Quickstart code-block scrolls horizontally rather than wrapping (paste-target stays selectable). Gallery becomes single-column. Nav is top-hamburger. Page weight ≤500KB beyond fonts (showcase JPGs are already ≤220KB each).

## 5. What stays from current `index.html` (KEEP / DROP / TRANSLATE / REWRITE)

**KEEP**: Cormorant + Inter + JetBrains Mono fonts; `tokens.css`; existing `og:*` tags (already English/substrate); `site.js` analytics + reveal hooks.

**REWRITE**: `<html lang>` to `en`. `<title>` → "Cosmo's Universe — an open substrate for Claude-paired devs". Dutch `<meta description>` → English substrate-pitch. JSON-LD `VideoGame` → English description, `inLanguage: en`, add `softwareHelp` URL → README. `.hero-bg` (cathedral-sky) → `hero-cosmo-in-forest.jpg` (forest is the entry point per NORTH-STAR §3). `.eyebrow` → "v2.0 substrate · MIT · authored alongside Claude". `h1` [oude titel] → *"Cosmo's Universe"* with subhead *"Your Cosmo can visit my forest."* `.cta-row` → ▶ Play live · View on GitHub primary; Charter · Universe Contract secondary. `.meta-pills` → "MIT · Three.js · Vite · Claude-paired · Universe contract v1.0". Sticky nav → Play / Lore / Updates / GitHub / Support (drop PRD). `.cta-banner` "De droom moet gefinancierd" → soft "How to join" banner (Play / Author / Improve), not a fundraising push. Footer → GitHub-prominent, MIT, doc-links, Built alongside Claude, Dutch easter-egg last line.

**DROP**: `<link hreflang="nl">`. `.tagline` "Een aquarel-trip..." (the "your Cosmo / my world" tagline replaces it; Dutch line migrates to footer easter-egg). `.world-grid` (3 biomes — episode framing retired in NORTH-STAR §3). `.numbers-grid` (10 levels / 12 enemies / 1 boss — same retired framing). `.about` strip (Richard's voice belongs on `/lore/`; credits move to footer link).

## 6. Linguistic policy

`/` is English-only for now — too much surface to bilingualize, no contributor has asked. `/lore/` stays Dutch (poem is more powerful in original); add 50–70 word English summary block at top. `/support/` stays Dutch with one English intro paragraph linking to GitHub Sponsors path. `/thanks/` stays Dutch (`noindex`). Defer language toggle until a Dutch contributor asks.

## 7. Implementation handoff

- **Implementer A** — full rewrite of root `/index.html` per §2 / §5. Reuses `tokens.css`. Valid HTML5; updates JSON-LD; sets `lang="en"`; adds copy-button JS for the quickstart code-block; preserves `site.js` reveal-anim hooks.
- **Implementer B** — voice-pass on `public/lore/`, `public/support/`, `public/thanks/`. Adds 50–70 word English summary block to top of `/lore/`. Adds English intro paragraph + GitHub Sponsors placeholder slot to `/support/`. Minor edits to `/thanks/` removing fundraising-tier language. Updates nav-strip in all three to the new portal nav (Play / Lore / Updates / GitHub / Support). **Not a full rewrite** — the lore poem is good; just align the frame.

## 8. Open questions (with recommendations)

1. **Language toggle now or defer?** Defer. Ship English-first; add if a Dutch contributor asks.
2. **GitHub Sponsors first, or Mollie placeholders?** Placeholders with a "GitHub Sponsors coming" slot. Sponsors setup is its own task.
3. **Mobile sticky-bottom nav vs top-hamburger?** Top-hamburger. Consistent with desktop, lower cost, expected.
4. **Drop `/prd/` link entirely?** Yes. PRDs are snapshots; the charter on GitHub is the living doc.
