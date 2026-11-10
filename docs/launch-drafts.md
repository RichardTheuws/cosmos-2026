# Launch post drafts

Ready-to-publish drafts for sharing Zorp's Universe. All in English; adapt to other languages or platforms freely. Pick the one that fits the channel + your mood. None of these are mandatory; the project speaks for itself.

---

## Show HN (Hacker News)

**Title** (≤80 chars):
> Zorp's Universe — an open substrate for Claude-paired devs to build small worlds

**Body**:

I've been building a small psychedelic browser-game called Zorp's Universe alongside Claude (Claude Code as the dev companion). The character — a small green being loosely based on an old memory — has reached a point where the game itself wants to become something else: a **substrate** that other developers can plug their own Universes into.

The pitch is one sentence: *your Zorp can visit my forest, my Zorp can visit your world.*

The repo is now structured for that. Zorp himself is a primitive-skeleton + painted-decal hybrid (Three.js Object3D nodes with painted PNG textures, no SkinnedMesh — we tried that and it melted). Universes plug in via a four-part contract: background renderer, room-list + traversal graph, asset manifest, Zorp-arrival hook. State persists when Zorp travels between Universes.

It's deliberately ambitious about being a meeting point for the population of developers who build small things alongside Claude. Quickstart is a paste-into-Claude-Code prompt that runs an honest fitness-check on the new contributor before suggesting they author a Universe — care, not gatekeeping.

Live: https://theuws.com/games/cosmos-2026/play/
Repo: https://github.com/RichardTheuws/cosmos-2026
Charter: https://github.com/RichardTheuws/cosmos-2026/blob/main/NORTH-STAR.md

MIT, all costs documented, no platform tos, no marketplace. Just a substrate with clear contracts and a small green being who wanders through whoever's imagination plugs in.

Welcome to anyone who wants to author a Universe.

---

## X / Twitter / Bluesky thread

**Tweet 1**:
Building Zorp's Universe — an open substrate where developers paired with Claude can plug in their own small psychedelic worlds. Your Zorp can visit my forest. My Zorp can visit your world. 🍄

https://github.com/RichardTheuws/cosmos-2026

**Tweet 2**:
The character: a small green being loosely based on an old memory, painted in watercolor, alive on screen whether you're touching it or not.

After three failed rig-fix attempts I rebuilt him as primitive-skeleton + painted decals. Six PNG faces ($0.27 fal.ai cost) carry his expressions.

**Tweet 3**:
The contract: four artifacts to author a Universe — background renderer, room-list, asset manifest, Zorp-arrival hook. Fork, build under universes/, open a PR.

Universes don't ask permission. They just plug in.

**Tweet 4**:
Quickstart is literal: paste a 4-line prompt into Claude Code. It clones the repo, reads the charter, runs an honest fitness-check, and asks if you're ready to build a Universe together. Care, not gatekeeping.

https://github.com/RichardTheuws/cosmos-2026

**Tweet 5**:
MIT-licensed. All costs transparent. No marketplace, no TOS, no committee. The forks aren't competing — they're each carving out a corner of imagination on shared infrastructure that gets better when any one of them improves it.

The being is the constant. The world keeps growing.

---

## LinkedIn

**Title**: Open-sourcing a substrate for Claude-paired game development

I've been building a small psychedelic browser-experience called Zorp's Universe over the past months, paired with Claude (using Claude Code) as my development companion.

This week the project crossed an interesting threshold. The single game I was building wants to become a **shared substrate** — an open repository where any developer who works alongside Claude can plug in their own small Universe, and the same character (Zorp, a small green being loosely based on an old memory) travels between them.

The technical commitment is concrete: a documented four-part Universe contract, MIT license, full transparency on integrations and costs, brand contract enforced by PR review rather than policy, and a quickstart prompt that runs an honest fitness-check on new contributors before suggesting they author a Universe.

I'm sharing this less as a recruiting pitch and more as an experiment: there is now a real population of developers who pair with Claude to build small ambitious things, and I'd like to see what happens if we have a shared anchor to build around.

Repo: https://github.com/RichardTheuws/cosmos-2026
Live: https://theuws.com/games/cosmos-2026/play/

Welcome to anyone curious.

---

## /r/gamedev or /r/threejs

**Title**: I rebuilt my game's main character as primitive geometry + painted decals after the rig kept melting — and turned the project into an open substrate

**Body**:

Background: I've been building a watercolor browser-game called Zorp's Universe (Three.js + Phaser dual-canvas). The main character started as a Meshy-imported GLB. It had a hand-rigged skeleton with weight-paint bleed across ~1500 face/eye verts. Three patch attempts later, the character was still melting under head rotation.

Pivot: replaced the entire skinned mesh with a hybrid rig — primitive Three.js Object3D bones (capsule body, sphere head, plane decals for face) with painted PNG textures swapped per face-state. Result: no SkinnedMesh, no AnimationMixer, no inverse-bind matrices. 360° head rotation produces zero shear vertices because there's nothing to shear.

The painted face plane carries four states (neutral/coo/blink/wave); lip-sync is a texture URL swap. Procedural transforms drive idle-breath/walk/jump (wave 20b coming).

Repo: https://github.com/RichardTheuws/cosmos-2026
The cosmoV2 builder: src/three/cosmoV2.ts (270 LOC, single file)

Also turned the project into a substrate any developer can plug a new Universe into. MIT-licensed, all integrations + costs documented, four-part Universe contract for authoring. Quickstart is a paste-into-Claude-Code prompt.

Honest about being built alongside Claude (Claude Code) as a pair. Curious whether the rig pivot or the substrate framing lands better for this audience.

---

## Notes for posting

- **Best time** for HN: Tuesday-Thursday morning US-East. Avoid weekends.
- **X / Bluesky**: thread plays better than single tweet for this kind of project. Tag @AnthropicAI when ready.
- **LinkedIn**: most professional channel; aim it at the "I work with AI tools" crowd.
- **Reddit**: pick one subreddit per post (don't cross-post). r/gamedev, r/threejs, r/proceduralgeneration are candidates.
- **Don't pre-launch on multiple channels the same day**. Stagger over a week to learn what resonates.
- **Engage with comments**. The substrate framing is interesting to people; lean into the conversations.

If you want help drafting a response to a specific comment thread, just paste it back in and we'll work it out.
