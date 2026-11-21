// EMBERHUSH — the thief: movement, sneaking, loot and the pebble lure.
// The thief walks with WASD or arrows, sneaks while Shift is held (slower and
// much harder to spot), and throws a pebble with Space or a mouse click. A
// pebble flies to the clicked tile and clatters there, pulling guards away
// from the thief's route. Loot is picked up by walking over it.

import {
  PEBBLE_START_COUNT,
  PEBBLE_THROW_RANGE,
  PLAYER_RUN_SPEED,
  PLAYER_SNEAK_SPEED,
  PLAYER_WALK_SPEED,
} from './config.js';
import { isSolidTile } from './vision.js';

export function makePlayer(startTile) {
  return {
    x: startTile.x + 0.5,
    y: startTile.y + 0.5,
    facingX: 1,
    facingY: 0,
    sneaking: false,
    running: false,
    moving: false,
    stepPhase: 0,
    stepCount: 0,
    pebbles: PEBBLE_START_COUNT,
    pebble: null,
    pebbleTimer: 0,
  };
}

export function updatePlayer(player, dt, input, grid, game) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  const moving = mx !== 0 || my !== 0;
  player.moving = moving;
  player.sneaking = Boolean(input.sneak) && moving;
  player.running = Boolean(input.run) && moving && !player.sneaking;

  if (moving) {
    const length = Math.hypot(mx, my);
    mx /= length;
    my /= length;
    const speed = player.sneaking ? PLAYER_SNEAK_SPEED : player.running ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    const nx = player.x + mx * speed * dt;
    const ny = player.y + my * speed * dt;
    if (!isSolidTile(grid, nx, player.y)) player.x = nx;
    if (!isSolidTile(grid, player.x, ny)) player.y = ny;
    player.facingX = mx;
    player.facingY = my;
    const before = Math.floor(player.stepPhase);
    player.stepPhase += speed * dt * 2.4;
    if (Math.floor(player.stepPhase) !== before) {
      player.stepCount += 1;
      game.onFootstep(player);
    }
  }

  if (player.pebble) {
    player.pebbleTimer -= dt;
    const pebble = player.pebble;
    const dx = pebble.targetX - pebble.x;
    const dy = pebble.targetY - pebble.y;
    const distance = Math.hypot(dx, dy);
    const flySpeed = 14;
    if (distance < 0.2 || player.pebbleTimer <= 0) {
      game.onPebbleLanded(pebble.targetX, pebble.targetY);
      player.pebble = null;
    } else {
      const step = Math.min(distance, flySpeed * dt);
      pebble.x += (dx / distance) * step;
      pebble.y += (dy / distance) * step;
    }
  }
}

// Throw a pebble toward a tile. Returns false when none are left.
export function throwPebble(player, targetTileX, targetTileY) {
  if (player.pebbles <= 0 || player.pebble) return false;
  const dx = targetTileX + 0.5 - player.x;
  const dy = targetTileY + 0.5 - player.y;
  const distance = Math.hypot(dx, dy);
  if (distance > PEBBLE_THROW_RANGE) return false;
  player.pebbles -= 1;
  player.pebble = { x: player.x, y: player.y, targetX: targetTileX + 0.5, targetY: targetTileY + 0.5 };
  player.pebbleTimer = 1.2;
  return true;
}

// Collect any relic under the thief's feet. Returns how many were taken.
export function collectLoot(player, loot, game) {
  let taken = 0;
  for (const relic of loot) {
    if (relic.taken) continue;
    if (Math.hypot(relic.x + 0.5 - player.x, relic.y + 0.5 - player.y) < 0.6) {
      relic.taken = true;
      taken += 1;
      game.onLootTaken(relic);
    }
  }
  return taken;
}
