# EMBERHUSH — Three Quiet Heists

[![make.fun](https://img.shields.io/badge/make.fun-bounty-7c5cff)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth game built for the [make.fun](https://make.fun/bounty/best-stealth-game-20261121-1759) bounty **best-stealth-game-20261121-1759** — three heists, five guards, fourteen relics, one quiet thief.

## The game

Slip past patrolling guards in three original heists — **The Fern Gallery**, **The Ink Archive**, **The Cinder Vault**. Every guard sweeps a raycast vision cone that stops at walls; step into lamplight and suspicion spikes, crouch in ferns and shadow and it drains away. Throw pebbles to lure guards off their patrol, take every relic to open the green exit, and reach it unseen.

- **Patrols you can learn** — guards walk fixed waypoint routes and pause at corners.
- **A detection system with recovery** — suspicion climbs in the cone and drains in cover; at full suspicion guards chase, but breaking line of sight lets you vanish again.
- **Feel** — cones react to walls, near-misses raise the alarm, footsteps tell you where a guard is.
- **Sound** — every effect is synthesized live with WebAudio (footsteps, alert sting, loot chime, pebble clink); no audio files, no network.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak (slower, much harder to spot) |
| Ctrl / right mouse | Run (faster, louder, easier to spot) |
| Click / Space | Throw a pebble at that tile to lure guards |
| Enter | Start / continue |

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network requests. Screenshots are deterministic scenes staged through the real simulation (`?shot=cover|stalk|alarm|escape`).

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored `vendor/makefun-game.ts` library.

## License

MIT — see [LICENSE](LICENSE).
