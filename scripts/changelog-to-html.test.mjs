import { describe, it, expect } from 'vitest';
import {
  forbiddenHits,
  publicProse,
  parseChangelog,
  renderEntry,
  dropOldTraitSentences,
} from './changelog-to-html.mjs';

const render = (md) => parseChangelog(md).map(renderEntry).join('\n');

describe('forbidden-name gate', () => {
  it('catches the old title in raw text, with every apostrophe', () => {
    expect(forbiddenHits("Cosmo's Cosmic Adventure")).not.toHaveLength(0);
    expect(forbiddenHits('Cosmo’s Cosmic Adventure')).not.toHaveLength(0);
    expect(forbiddenHits('Cosmo&#039;s Cosmic Adventure')).not.toHaveLength(0);
    expect(forbiddenHits('Cosmos Cosmic Adventure 2026')).not.toHaveLength(0);
  });

  it('catches the other names and the year', () => {
    expect(forbiddenHits('a nod to Apogee')).not.toHaveLength(0);
    expect(forbiddenHits('3D Realms')).not.toHaveLength(0);
    expect(forbiddenHits('psychedelica')).not.toHaveLength(0);
    expect(forbiddenHits('since 1992')).not.toHaveLength(0);
  });

  it('passes clean text', () => {
    expect(forbiddenHits("Zorp's Universe, v2.10.6, /games/cosmos-2026/")).toHaveLength(0);
  });
});

describe('publicProse', () => {
  it('renames Cosmo and COSMO outside code spans only', () => {
    expect(publicProse('Cosmo walks; `CosmoAgent` and `cosmo.glb` stay')).toBe(
      'Zorp walks; `CosmoAgent` and `cosmo.glb` stay',
    );
    expect(publicProse('COSMO NEEMT JE MEE')).toBe('ZORP NEEMT JE MEE');
  });

  it('renames the old project name Cosmos, not paths or ids', () => {
    expect(publicProse('Cosmos rhythm-trip rebuild')).toBe("Zorp's Universe rhythm-trip rebuild");
    expect(publicProse('Cosmos-card toegevoegd')).toBe('Zorp-card toegevoegd');
    expect(publicProse('pad /games/cosmos-2026/ en `cosmos-navigate`')).toBe(
      'pad /games/cosmos-2026/ en `cosmos-navigate`',
    );
  });
});

describe('rendered page', () => {
  const md = [
    '## [1.0.0] — 2026-05-02 — Cosmo begint',
    '',
    '### Added (7A — Cosmo anim)',
    '- Cosmo loopt nu.',
    '- Two clean suction-cup discs on the hands.',
    '- Eerste zin blijft. De zuignap-handen werkten niet.',
    '',
    '> Cosmo is gaaf — Richard',
    '',
  ].join('\n');
  const html = render(md);

  it('renames headings, so no upper-case COSMO appears', () => {
    expect(html).toContain('<h3>ADDED (7A — ZORP ANIM)</h3>');
    expect(html).not.toMatch(/COSMO/);
    expect(html).toContain('Zorp begint');
  });

  it('keeps a blockquote word for word', () => {
    expect(html).toContain('<blockquote class="update__quote">Cosmo is gaaf — Richard</blockquote>');
  });

  it('drops sentences about the old suction-cup hands', () => {
    expect(html).not.toMatch(/suction|zuignap/i);
    expect(html).toContain('<li>Zorp loopt nu.</li>');
    expect(html).toContain('<li>Eerste zin blijft.</li>');
  });

  it('drops a quote that mentions the old trait whole, never edits it', () => {
    const out = render('## [1.0.1] — 2026-05-03\n\n### Added\n- x\n\n> Zuignap-handen. Mooi.\n');
    expect(out).not.toContain('update__quote');
  });

  it('filters suction images out of a grid and its caption', () => {
    const out = render(
      '## [1.0.2] — 2026-05-04\n\n### Added\n[grid: /a/enemy-suctioncrawler.png /a/spark.png "suctioncrawler · spark"]\n',
    );
    expect(out).not.toMatch(/suction/i);
    expect(out).toContain('/a/spark.png');
    expect(out).toContain('<figcaption>spark</figcaption>');
  });
});

describe('dropOldTraitSentences', () => {
  it('returns empty when every sentence is about the old trait', () => {
    expect(dropOldTraitSentences('Suction-cup wallcling werkend.')).toBe('');
  });
});
