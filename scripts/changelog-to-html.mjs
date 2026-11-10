#!/usr/bin/env node
/**
 * changelog-to-html.mjs
 *
 * Parses CHANGELOG.md (Keep-a-Changelog format) and emits the timeline portion
 * of public/updates/index.html. The page itself contains a placeholder marker
 * — <!-- TIMELINE:START --> ... <!-- TIMELINE:END --> — that gets replaced.
 *
 * Supported rich-media in CHANGELOG entries:
 *   - Standard markdown image:   ![caption](path/to/img.png)
 *       → renders as <figure> with caption
 *   - Image grid (2-6 cols):     [grid: img1.png img2.png img3.png "Caption"]
 *       → renders as a CSS grid of figures with shared caption
 *   - Quote:                     > Some quote text
 *       → renders as styled <blockquote>
 *   - Lead paragraph (intro):    Plain text on lines after `## [version]` and
 *       before the first `###` is treated as the entry's lead paragraph
 *       (italic, larger, set off above the section bullets).
 *
 * Run via `npm run updates:build` (also chained inside `npm run build`).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CHANGELOG_PATH = resolve(ROOT, 'CHANGELOG.md');
const UPDATES_PATH = resolve(ROOT, 'public/updates/index.html');

const TAG_VOCAB = {
  added: 'feat',
  changed: 'change',
  deprecated: 'deprecated',
  removed: 'fix',
  fixed: 'fix',
  security: 'security',
  decisions: 'gameplay',
  'decisions locked': 'gameplay',
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/**
 * Public naming. The character was called "Cosmo" until v2.10.6; the project
 * is now "Zorp's Universe". CHANGELOG history keeps the old name (it is a
 * historical record), but the public updates page shows the current name.
 * Renaming happens only outside code spans (`CosmoAgent`, `cosmo.glb`,
 * `cosmos-2026`): those are file, path and symbol names, not prose. Both
 * "Cosmo" and "COSMO" are renamed (section headings are upper-cased), and the
 * old project name "Cosmos" too: "Cosmos-…" compounds become "Zorp-…", the
 * bare word becomes "Zorp's Universe". Blockquotes are never renamed: they are
 * Richard's own words, and a quote with a different name is a made-up quote.
 */
const PROJECT_NAMES = [
  [/Cosmos'? Cosmic Adventure 2026/g, "Zorp's Universe"],
  [/Cosmo's Universe/g, "Zorp's Universe"],
];
const NOT_IN_PATH = '(?<![\\w/.\\-])';
const PROSE_NAMES = [
  [new RegExp(`${NOT_IN_PATH}Cosmos(?=-[A-Za-z])`, 'g'), 'Zorp'],
  [new RegExp(`${NOT_IN_PATH}COSMOS(?=-[A-Za-z])`, 'g'), 'ZORP'],
  [new RegExp(`${NOT_IN_PATH}Cosmos(?![\\w(\\-/]|\\.\\w)`, 'g'), "Zorp's Universe"],
  [new RegExp(`${NOT_IN_PATH}COSMOS(?![\\w(\\-/]|\\.\\w)`, 'g'), "ZORP'S UNIVERSE"],
  [new RegExp(`${NOT_IN_PATH}Cosmo(?![\\w(/]|\\.\\w)`, 'g'), 'Zorp'],
  [new RegExp(`${NOT_IN_PATH}COSMO(?![\\w(/]|\\.\\w)`, 'g'), 'ZORP'],
];
const applyAll = (s, pairs) => pairs.reduce((acc, [rx, rep]) => acc.replace(rx, rep), s);

/** Rename prose; inside `code spans` only the project titles. */
export const publicProse = (s) =>
  applyAll(String(s), PROJECT_NAMES)
    .split(/(`[^`]+`)/)
    .map((part, i) => (i % 2 ? part : applyAll(part, PROSE_NAMES)))
    .join('');

/**
 * Names that must never reach the public page (IP check 2026-11-10). The gate
 * runs on the RAW CHANGELOG (before renaming and escaping, so a rename can't
 * hide an old title) and on the rendered page. If one turns up, the build
 * stops instead of publishing it.
 */
const FORBIDDEN_PUBLIC = [
  /cosmos?\s*'?\s*s?\s+cosmic\s+adventure/i,
  /apogee/i,
  /3d\s*realms/i,
  /psychedelica/i,
  /\b1992\b/,
  /replogle|hornback|bobby\s*prince/i,
  /\bzonk\b|funplex/i,
  /hint[\s-]?globe/i,
];

/** Fold every apostrophe spelling (’ ‘ ʼ ` &#039; &#39; &apos; &rsquo;) to a plain '. */
export const normalizeApostrophes = (s) =>
  String(s)
    .replace(/&(?:#0*39|#x0*27|apos|rsquo|lsquo);/gi, "'")
    .replace(/[\u2018\u2019\u201B\u02BC\u2032`\u00B4]/g, "'");

/** Returns the forbidden patterns found in `text` (as strings). */
export const forbiddenHits = (text) => {
  const norm = normalizeApostrophes(text);
  return FORBIDDEN_PUBLIC.filter((rx) => rx.test(norm)).map(String);
};

/**
 * The old character design had suction-cup hands. Zorp doesn't, so on the
 * public page sentences that describe them are left out (CHANGELOG itself
 * keeps them as history).
 */
const OLD_TRAIT = /suction|zuignap/i;
export const hasOldTrait = (s) => OLD_TRAIT.test(String(s));

/** Drop sentences that mention the old trait. Returns '' if nothing is left. */
export const dropOldTraitSentences = (text) => {
  const t = String(text);
  if (!hasOldTrait(t)) return t;
  return t
    .split(/(?<=[.!?)])\s+(?=[A-Z*_(`\[])/)
    .filter((sentence) => !hasOldTrait(sentence))
    .join(' ')
    .trim();
};

/** Filter the old trait out of one parsed block; returns null to drop it. */
export function publicBlock(block) {
  switch (block.type) {
    case 'item':
    case 'paragraph': {
      const text = dropOldTraitSentences(block.text);
      return text ? { ...block, text } : null;
    }
    case 'quote':
      // A quote is never edited; it is shown whole or not at all.
      return hasOldTrait(block.text) ? null : block;
    case 'image':
      return hasOldTrait(block.src) || hasOldTrait(block.caption) ? null : block;
    case 'grid': {
      const images = block.images.filter((src) => !hasOldTrait(src));
      if (!images.length) return null;
      const caption = hasOldTrait(block.caption)
        ? block.caption.split(/\s+·\s+/).filter((part) => !hasOldTrait(part)).join(' · ')
        : block.caption;
      return { ...block, images, caption };
    }
    default:
      return block;
  }
}

const publicBlocks = (blocks) => (blocks || []).map(publicBlock).filter(Boolean);

/** Inline-format a single line of markdown:
 *  `code`, **bold**, *italic*, [link](url). Order matters. */
function inlineMd(text, { rename = true } = {}) {
  let out = escapeHtml(rename ? publicProse(text) : text);
  // `code`
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // **bold**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // *italic*
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  // [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return out;
}

/** Detect special block-line patterns (image, grid, quote). Returns { type, ... } or null. */
function parseBlockLine(line) {
  // ![caption](path)
  const imgMatch = line.match(/^\!\[([^\]]*)\]\(([^)]+)\)\s*$/);
  if (imgMatch) {
    return { type: 'image', caption: imgMatch[1], src: imgMatch[2] };
  }

  // [grid: a.png b.png c.png "Caption"]
  const gridMatch = line.match(/^\[grid:\s*(.+?)(?:\s+"([^"]+)")?\]\s*$/);
  if (gridMatch) {
    const tokens = gridMatch[1].trim().split(/\s+/);
    const caption = gridMatch[2] || '';
    return { type: 'grid', images: tokens, caption };
  }

  // > quote
  const quoteMatch = line.match(/^>\s+(.+)$/);
  if (quoteMatch) {
    return { type: 'quote', text: quoteMatch[1] };
  }

  return null;
}

/**
 * Parse a Keep-a-Changelog markdown into structured entries.
 * Each entry: { version, date, lead: [paragraph-line...], sections: [{title, blocks: [...]}] }
 * Each block is either { type: 'item', text } or { type: 'image'|'grid'|'quote', ... }
 */
export function parseChangelog(md) {
  const lines = md.split('\n');
  const entries = [];
  let current = null;
  let sectionTitle = null;
  let sectionBlocks = null;
  let preSectionLines = null;  // collects lead-paragraph + media before first ###

  const flushSection = () => {
    if (current && sectionTitle && sectionBlocks && sectionBlocks.length) {
      current.sections.push({ title: sectionTitle, blocks: sectionBlocks });
    }
    sectionTitle = null;
    sectionBlocks = null;
  };

  const flushEntry = () => {
    flushSection();
    if (current) {
      if (preSectionLines && preSectionLines.length) current.preBlocks = preSectionLines;
      entries.push(current);
    }
    current = null;
    preSectionLines = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');

    // Version header
    const versionMatch = line.match(/^##\s+\[([^\]]+)\]\s*[—\-]?\s*(.*)$/);
    if (versionMatch) {
      flushEntry();
      current = {
        version: versionMatch[1].trim(),
        date: versionMatch[2].trim(),
        sections: [],
        preBlocks: [],
      };
      preSectionLines = [];
      continue;
    }
    if (!current) continue;

    // Section header
    const sectionMatch = line.match(/^###\s+(.+)$/);
    if (sectionMatch) {
      flushSection();
      sectionTitle = sectionMatch[1].trim();
      sectionBlocks = [];
      continue;
    }

    const blockLine = parseBlockLine(line);

    if (!sectionBlocks) {
      // We are in lead-paragraph zone (before first section)
      if (blockLine) {
        preSectionLines.push(blockLine);
      } else if (line.trim()) {
        preSectionLines.push({ type: 'paragraph', text: line.trim() });
      }
      continue;
    }

    if (blockLine) {
      sectionBlocks.push(blockLine);
      continue;
    }

    const itemMatch = line.match(/^[\-\*]\s+(.+)$/);
    if (itemMatch) {
      sectionBlocks.push({ type: 'item', text: itemMatch[1].trim() });
    } else if (line.startsWith('  ') && sectionBlocks.length) {
      const last = sectionBlocks[sectionBlocks.length - 1];
      if (last.type === 'item') last.text += ' ' + line.trim();
    }
  }
  flushEntry();
  return entries;
}

function tagFor(sectionTitle) {
  const key = sectionTitle.toLowerCase().trim();
  for (const [k, v] of Object.entries(TAG_VOCAB)) {
    if (key.startsWith(k)) return v;
  }
  return 'change';
}

function tagLabel(tag) {
  const labels = {
    feat: 'Feature',
    change: 'Wijziging',
    fix: 'Fix',
    deprecated: 'Deprecated',
    security: 'Security',
    gameplay: 'Gameplay',
    ui: 'UI',
    visual: 'Visual',
    audio: 'Audio',
  };
  return labels[tag] || tag;
}

function renderBlock(block) {
  switch (block.type) {
    case 'item':
      return `<li>${inlineMd(block.text)}</li>`;
    case 'image':
      return `<figure class="update__figure">
            <img src="${escapeHtml(block.src)}" alt="${escapeHtml(publicProse(block.caption || ''))}" loading="lazy">
            ${block.caption ? `<figcaption>${inlineMd(block.caption)}</figcaption>` : ''}
          </figure>`;
    case 'grid': {
      const cols = Math.min(Math.max(block.images.length, 2), 6);
      const items = block.images
        .map((src) => `<div class="update__grid-item"><img src="${escapeHtml(src)}" alt="" loading="lazy"></div>`)
        .join('\n            ');
      return `<figure class="update__figure update__figure--grid update__figure--cols-${cols}">
            <div class="update__grid">
            ${items}
            </div>
            ${block.caption ? `<figcaption>${inlineMd(block.caption)}</figcaption>` : ''}
          </figure>`;
    }
    case 'quote':
      return `<blockquote class="update__quote">${inlineMd(block.text, { rename: false })}</blockquote>`;
    case 'paragraph':
      return `<p class="update__lead-line">${inlineMd(block.text)}</p>`;
    default:
      return '';
  }
}

function renderPreBlocks(rawBlocks) {
  const blocks = publicBlocks(rawBlocks);
  if (!blocks.length) return '';
  return `
        <div class="update__lead">
          ${blocks.map(renderBlock).join('\n          ')}
        </div>`;
}

function renderSection(section) {
  // Separate items from non-item blocks. Items go in <ul>, others stand-alone in order.
  const out = [`<h3>${escapeHtml(publicProse(section.title).toUpperCase())}</h3>`];
  let buf = [];
  const flushItems = () => {
    if (buf.length) {
      out.push(`<ul class="update__highlights">\n          ${buf.join('\n          ')}\n        </ul>`);
      buf = [];
    }
  };
  for (const b of publicBlocks(section.blocks)) {
    if (b.type === 'item') buf.push(renderBlock(b));
    else {
      flushItems();
      out.push(renderBlock(b));
    }
  }
  flushItems();
  return out.join('\n        ');
}

export function renderEntry(entry) {
  const tags = new Set();
  entry.sections.forEach((s) => tags.add(tagFor(s.title)));
  if (entry.sections.length === 0 && (entry.preBlocks?.length ?? 0) > 0) tags.add('feat');
  const tagPills = Array.from(tags)
    .map((t) => `<span class="tag tag--${t}">${tagLabel(t)}</span>`)
    .join('\n          ');

  const sectionsHtml = entry.sections.map(renderSection).join('\n');

  // Try to extract a title from the date string if author put one inline; fall back to version.
  const titleMatch = entry.date.match(/[—\-]\s*(.+)$/);
  const dateClean = entry.date.replace(/^[—\-]?\s*/, '').split(/\s*[—\-]\s+/)[0];
  const title = titleMatch ? titleMatch[1] : `Sprint ${entry.version}`;

  return `
    <article class="update" data-reveal>
      <div class="update__card">
        <div class="update__header">
          <span class="update__version">v${escapeHtml(entry.version)}</span>
          <span class="update__date">${escapeHtml(dateClean)}</span>
          <h2 class="update__title">${escapeHtml(publicProse(title))}</h2>
        </div>
        <div class="update__body">
          <div class="update__tags">
          ${tagPills}
          </div>${renderPreBlocks(entry.preBlocks)}
        ${sectionsHtml}
        </div>
      </div>
    </article>`;
}

async function main() {
  const md = await readFile(CHANGELOG_PATH, 'utf8');
  const html = await readFile(UPDATES_PATH, 'utf8');

  const rawHits = forbiddenHits(md);
  if (rawHits.length) {
    console.error(`[changelog-to-html] Forbidden public name(s) in CHANGELOG.md: ${rawHits.join(', ')}. Rewrite the CHANGELOG line.`);
    process.exit(1);
  }

  const entries = parseChangelog(md);
  if (!entries.length) {
    console.error('[changelog-to-html] No entries found in CHANGELOG.md');
    process.exit(1);
  }

  const timeline = entries.map(renderEntry).join('\n');
  const next = html.replace(
    /<!--\s*TIMELINE:START\s*-->[\s\S]*?<!--\s*TIMELINE:END\s*-->/,
    `<!-- TIMELINE:START -->\n${timeline}\n      <!-- TIMELINE:END -->`,
  );

  const hits = forbiddenHits(next);
  if (hits.length) {
    console.error(`[changelog-to-html] Forbidden public name(s) on the updates page: ${hits.join(', ')}. Rewrite the CHANGELOG line.`);
    process.exit(1);
  }

  if (next === html) {
    console.warn('[changelog-to-html] Timeline markers not found — nothing replaced.');
    return;
  }

  await writeFile(UPDATES_PATH, next, 'utf8');
  console.log(`[changelog-to-html] Rendered ${entries.length} entries → ${UPDATES_PATH}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error('[changelog-to-html] Failed:', e);
    process.exit(1);
  });
}
