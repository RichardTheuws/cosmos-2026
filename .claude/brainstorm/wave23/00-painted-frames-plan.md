# Wave 23 — Painted-frames Cosmo (locomotion rebuild)

**Decision**: NORTH-STAR §6 (2026-05-31). Cosmo's motion = painted-frame clips
generated per animation-state from the LoRA hero, alpha-cut per frame, played
on the camera-facing billboard. Richard chose **full state-set up front**
(generate everything before shipping).

## The integration seam (elegant — already wired)

`CosmoAgent` already has a `playClip(name, loop)` vocabulary called at exactly
the right moments by the state machine, but it drives a **dead** `THREE.Animation
Mixer` (null since the 21.2 billboard pivot). We revive `playClip` to drive a new
**`CosmoFramePlayer`** instead of the mixer. The state machine doesn't change —
only what `playClip` does. The clip vocabulary IS the state set to generate.

Clips referenced in CosmoAgent today: `idle`, `walk`, `jump`, `bounce` (via
`bouncing` state), `duck`, `dance`, `wave`, `wink`, `stretch`, `look`/`looking`,
`fall`/`falling`, `petted`, `sit`. `walking-backward` / `walking-to` reuse `walk`.

## Clip set to generate (full set, up front)

| clip | loop | ~frames | note |
|------|------|---------|------|
| idle | yes | 24 | alive: breath, blink, slow look — the calm baseline |
| walk | yes | 24 | in-place step cycle; flip x for direction, translate moves him |
| jump | no | 18 | crouch → leap → land |
| bounce | yes | 24 | trampoline launch → airborne → land (the locked delight loop) |
| duck | no | 12 | quick crouch |
| dance | yes | 24 | happy dance |
| wave | no | 18 | greeting |
| wink | no | 12 | wink |
| stretch | no | 18 | spring-up after pet |
| fall | no | 18 | tumble + settle |
| petted | yes | 18 | blush / happy wiggle |
| look | no | 18 | look around |

Tricks (spins/flips) = **procedural**, composed on top of the `bounce` clip via
the v2.2.11 `rig.rollZ` / `rig.pitchX` layer (frames + procedural compose).
Escalates per rebounce. No separate gen.

## Pipeline (`scripts/wave23/`, promoted from the spike)

1. **gen** — for each clip: composite hero onto a neutral stage, fal.ai
   image-to-video (`fal-ai/kling-video/v2/master/image-to-video`) with a
   per-clip prompt → mp4. Config-driven via `clips.json`.
2. **frames** — ffmpeg extract to target frame-count, square, ~480px.
3. **alpha** — per-frame BiRefNet (`fal-ai/birefnet`) → RGBA cut-outs. (Proven
   endpoint from fase-b-batch.sh.) Validate flicker; fall back to video-matting
   if per-frame edges shimmer.
4. **atlas** — pack each clip's frames into one atlas PNG + `manifest.json`
   (clip → {cols, rows, frameW, frameH, count, fps, loop}). One texture/clip.

## Runtime `CosmoFramePlayer` (`src/three/`)

- Owns the billboard plane's material `map`. Given a clip + dt, advances the
  current frame (UV-offset into the clip atlas), honoring loop / one-shot.
- `playClip(name, loop)` selects the clip; one-shots auto-return to `idle`.
- Billboard `lookAt` + the v2.2.11 rollZ/pitchX/bobY layer stay; bob can retire
  once the walk clip carries its own step-lift.
- Facing: `root.scale.x` flip (unchanged) handles left/right from one walk clip.
- Fallback: if a clip is missing, hold the static hero (graceful degrade).

## Sequencing (de-risk before spend)

1. ✅ Prove **alpha-cut** quality on the existing spike frames (cheap, no new gen).
2. Build the config-driven pipeline + `CosmoFramePlayer` runtime.
3. Validate ONE clip (walk) end-to-end live in /play/ (gen→alpha→atlas→runtime).
4. **Fire the full batch** (the 12 gens) — confirm with Richard first (cost).
5. Curate, wire all clips to states, live UAT, ship.

Quality > cost (locked). Each clip = gen + curation + alpha pass. Regen until the
character-DNA + watercolor reads right; discard bad gens without sunk-cost defense.
