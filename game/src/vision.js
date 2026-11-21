// EMBERHUSH — vision: raycast cones and line of sight.
// A guard sees through open floor only. Every sight query walks a ray in small
// steps and stops at the first wall tile, so cones wrap around corners the way
// a player expects, and cover behind a wall is real cover.

import { GUARD_FOV_DEGREES, GUARD_SIGHT_RANGE } from './config.js';

export function tileAt(grid, x, y) {
  const col = Math.floor(x);
  const row = Math.floor(y);
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return '#';
  return grid[row][col];
}

export function isWallTile(grid, x, y) {
  return tileAt(grid, x, y) === '#';
}

export function isSolidTile(grid, x, y) {
  const cell = tileAt(grid, x, y);
  return cell === '#' || cell === 'c';
}

// Walk from (x0, y0) toward (x1, y1); true when no wall or crate blocks the way.
export function hasLineOfSight(grid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / 0.15));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (isSolidTile(grid, x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

// Cast one ray from a guard and return how far it travels before hitting a wall.
export function castVisionRay(grid, x, y, angle, maxRange) {
  const step = 0.12;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let travelled = 0;
  while (travelled < maxRange) {
    const px = x + dx * (travelled / step);
    const py = y + dy * (travelled / step);
    if (isWallTile(grid, px, py)) return travelled;
    travelled += step;
  }
  return maxRange;
}

// Build the guard's vision cone as a polygon of ray endpoints, so the renderer
// can fill exactly the floor the guard can see — never through a wall.
export function computeVisionCone(grid, guardX, guardY, facing, range) {
  const halfFov = (GUARD_FOV_DEGREES / 2) * (Math.PI / 180);
  const rays = 26;
  const points = [{ x: guardX, y: guardY }];
  for (let i = 0; i <= rays; i += 1) {
    const angle = facing - halfFov + (2 * halfFov * i) / rays;
    const hit = castVisionRay(grid, guardX, guardY, angle, range);
    points.push({ x: guardX + Math.cos(angle) * hit, y: guardY + Math.sin(angle) * hit });
  }
  return points;
}

// Is the player inside the guard's cone (angle, range and a clear sight line)?
export function playerInsideCone(grid, guard, playerX, playerY) {
  const dx = playerX - guard.x;
  const dy = playerY - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance > GUARD_SIGHT_RANGE) return false;
  if (distance < 0.4) return true;
  let angleDiff = Math.atan2(dy, dx) - guard.facing;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  const halfFov = (GUARD_FOV_DEGREES / 2) * (Math.PI / 180);
  if (Math.abs(angleDiff) > halfFov) return false;
  return hasLineOfSight(grid, guard.x, guard.y, playerX, playerY);
}

// What kind of floor is the player standing on? Decides how fast suspicion
// grows: lamplight is dangerous, shadow and fern cover are safe.
export function lightAt(grid, x, y) {
  const cell = tileAt(grid, x, y);
  if (cell === 'l') return 'bright';
  if (cell === 'd') return 'dark';
  if (cell === 'f') return 'fern';
  return 'normal';
}
