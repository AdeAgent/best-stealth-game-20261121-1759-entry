// EMBERHUSH — screenshot scenes behind ?shot=cover|stalk|alarm|escape.
// Each scene stages the real game — the same level, the same guards, the same
// renderer — then runs a few fixed simulation steps so the frame settles
// through the real update path. Nothing is drawn specially for the camera:
// what the screenshot shows is what a player sees mid-heist.

import { GUARD_CHASE, GUARD_SUSPICIOUS } from './guards.js';

function placePlayer(game, tileX, tileY, sneaking) {
  game.player.x = tileX + 0.5;
  game.player.y = tileY + 0.5;
  game.player.sneaking = Boolean(sneaking);
  game.player.moving = false;
}

function placeGuard(game, index, tileX, tileY, facingDegrees, state, suspicion) {
  const guard = game.guards[index];
  guard.x = tileX + 0.5;
  guard.y = tileY + 0.5;
  guard.facing = (facingDegrees * Math.PI) / 180;
  guard.state = state;
  guard.suspicion = suspicion;
  guard.waitTimer = 0;
  guard.lastSeenX = game.player.x;
  guard.lastSeenY = game.player.y;
  return guard;
}

function settleSteps(game, steps) {
  // Run the real simulation with no input, so cones and guards settle.
  for (let i = 0; i < steps; i += 1) {
    for (const guard of game.guards) {
      if (guard.state === 'patrol') guard.waitTimer = 99;
    }
    game.step(1 / 60);
  }
  for (const guard of game.guards) guard.waitTimer = 0;
}

export function stageShotScene(game, name) {
  game.startGame();
  game.screen = 'play';
  if (name === 'stalk') {
    // The thief crouched in fern at the very edge of a guard's cone: the
    // guard is turning toward them, suspicion halfway up, recovery possible.
    placePlayer(game, 5, 1, true);
    placeGuard(game, 0, 10, 1, 180, 'patrol', 0);
    placeGuard(game, 1, 3, 10, 90, 'patrol', 0);
    placeGuard(game, 2, 16, 6, 180, GUARD_SUSPICIOUS, 48);
    game.guards[2].investigateX = game.player.x;
    game.guards[2].investigateY = game.player.y;
    game.guards[2].facing = Math.atan2(game.player.y - game.guards[2].y, game.player.x - game.guards[2].x);
    settleSteps(game, 12);
    game.screen = 'play';
    return;
  }
  if (name === 'alarm') {
    // A near-miss gone wrong: the thief stepped into lamplight inside a cone,
    // the nearest guard is chasing at full suspicion and a second is closing in.
    placePlayer(game, 17, 6, false);
    placeGuard(game, 0, 14, 6, 0, GUARD_CHASE, 100);
    placeGuard(game, 1, 20, 10, 270, GUARD_SUSPICIOUS, 82);
    placeGuard(game, 2, 20, 2, 90, 'patrol', 12);
    game.level.loot[0].taken = true;
    game.lootTaken = 1;
    game.score = 250;
    settleSteps(game, 6);
    game.screen = 'play';
    return;
  }
  if (name === 'escape') {
    // Every relic taken, the exit open and glowing, the thief slipping through
    // the door while the guards patrol far away, none the wiser.
    for (const relic of game.level.loot) relic.taken = true;
    game.lootTaken = game.level.loot.length;
    game.score = 1250;
    placePlayer(game, 34, 11, false);
    placeGuard(game, 0, 28, 2, 0, 'patrol', 0);
    placeGuard(game, 1, 8, 12, 180, 'patrol', 0);
    placeGuard(game, 2, 17, 8, 90, 'patrol', 0);
    settleSteps(game, 12);
    game.screen = 'play';
    return;
  }
  // Default: cover. The gallery at a glance — ferns, cones, relics, the exit
  // door and the HUD, the thief already moving along the top corridor.
  // Guards face open floor so their cones read at full length.
  placePlayer(game, 8, 2, false);
  placeGuard(game, 0, 30, 2, 90, 'patrol', 0);
  placeGuard(game, 1, 5, 11, 0, 'patrol', 0);
  placeGuard(game, 2, 16, 10, 0, 'patrol', 22);
  game.level.loot[0].taken = true;
  game.lootTaken = 1;
  game.score = 250;
  settleSteps(game, 12);
  game.screen = 'play';
}
