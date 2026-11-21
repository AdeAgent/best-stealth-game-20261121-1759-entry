// EMBERHUSH — guards: patrol, suspicion, alarm and recovery.
// A guard walks its waypoint route and pauses at each corner, watching. When
// it sees the thief its suspicion climbs; past a threshold it walks over to
// investigate, and at full suspicion it raises the alarm and gives chase. Lose
// its line of sight and hide, and suspicion drains again — the player always
// gets a chance to recover. A thrown pebble pulls every guard in earshot to
// the clatter point instead.

import {
  ALARM_MEMORY_SECONDS,
  GUARD_CHASE_SPEED,
  GUARD_CLOSE_RANGE,
  GUARD_PATROL_SPEED,
  GUARD_SIGHT_RANGE,
  GUARD_SUSPICIOUS_SPEED,
  PEBBLE_HEAR_RADIUS,
  SPOT_RATE_BRIGHT,
  SPOT_RATE_DARK,
  SPOT_RATE_FERN,
  SPOT_RATE_NORMAL,
  SPOT_RATE_RUNNING,
  SPOT_RATE_SNEAK,
  SUSPICION_ALARM_AT,
  SUSPICION_DECAY,
  SUSPICION_SUSPICIOUS_AT,
} from './config.js';
import { hasLineOfSight, isSolidTile, lightAt, playerInsideCone } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_RETURN = 'return';

export function makeGuard(startTile, patrolRoute) {
  const start = { x: startTile.x + 0.5, y: startTile.y + 0.5 };
  const waypoints = patrolRoute.map(([tx, ty]) => ({ x: tx + 0.5, y: ty + 0.5 }));
  const firstLeg = waypoints[1] || waypoints[0];
  return {
    x: start.x,
    y: start.y,
    facing: Math.atan2(firstLeg.y - start.y, firstLeg.x - start.x),
    waypoints,
    waypointIndex: 1 % waypoints.length,
    waitTimer: 0,
    state: GUARD_PATROL,
    suspicion: 0,
    lastSeenX: null,
    lastSeenY: null,
    loseSightTimer: 0,
    investigateX: null,
    investigateY: null,
    stepPhase: 0,
    heardX: null,
    heardY: null,
  };
}

function spotRateFor(light, sneaking, running) {
  let rate = SPOT_RATE_NORMAL;
  if (light === 'bright') rate = SPOT_RATE_BRIGHT;
  else if (light === 'dark') rate = SPOT_RATE_DARK;
  else if (light === 'fern') rate = SPOT_RATE_FERN;
  if (sneaking) rate *= SPOT_RATE_SNEAK;
  if (running) rate *= SPOT_RATE_RUNNING;
  return rate;
}

function moveToward(guard, targetX, targetY, speed, dt, grid) {
  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.05) return true;
  const step = Math.min(distance, speed * dt);
  const nx = guard.x + (dx / distance) * step;
  const ny = guard.y + (dy / distance) * step;
  if (!isSolidTile(grid, nx, guard.y)) guard.x = nx;
  if (!isSolidTile(grid, guard.x, ny)) guard.y = ny;
  guard.facing = Math.atan2(dy, dx);
  guard.stepPhase += step * 6;
  return distance - step < 0.08;
}

function patrolStep(guard, dt, grid) {
  if (guard.waitTimer > 0) {
    guard.waitTimer -= dt;
    guard.facing += Math.sin(guard.waitTimer * 2.2) * 0.35 * dt;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  if (moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt, grid)) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.waitTimer = 1.2;
  }
}

// A pebble clatter every guard in earshot can hear: turn and investigate it.
export function guardHearNoise(guard, noiseX, noiseY) {
  const distance = Math.hypot(noiseX - guard.x, noiseY - guard.y);
  if (distance > PEBBLE_HEAR_RADIUS) return;
  if (guard.state === GUARD_CHASE) return;
  guard.heardX = noiseX;
  guard.heardY = noiseY;
  guard.investigateX = noiseX;
  guard.investigateY = noiseY;
  guard.state = GUARD_SUSPICIOUS;
  guard.suspicion = Math.max(guard.suspicion, SUSPICION_SUSPICIOUS_AT);
}

export function updateGuard(guard, dt, grid, player, game) {
  const seen = playerInsideCone(grid, guard, player.x, player.y);
  const light = lightAt(grid, player.x, player.y);
  const hiddenInFern = light === 'fern' && Math.hypot(player.x - guard.x, player.y - guard.y) > GUARD_CLOSE_RANGE;

  if (seen && !hiddenInFern) {
    const rate = spotRateFor(light, player.sneaking, player.running);
    guard.suspicion = Math.min(100, guard.suspicion + rate * dt);
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.loseSightTimer = 0;
    if (guard.suspicion >= SUSPICION_ALARM_AT && guard.state !== GUARD_CHASE) {
      guard.state = GUARD_CHASE;
      game.onAlarmRaised(guard);
    } else if (guard.suspicion >= SUSPICION_SUSPICIOUS_AT && guard.state === GUARD_PATROL) {
      guard.state = GUARD_SUSPICIOUS;
      guard.investigateX = player.x;
      guard.investigateY = player.y;
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
    if (guard.state === GUARD_CHASE) {
      guard.loseSightTimer += dt;
      if (guard.loseSightTimer > ALARM_MEMORY_SECONDS) {
        guard.state = GUARD_RETURN;
        guard.suspicion = Math.min(guard.suspicion, 45);
      }
    } else if (guard.state === GUARD_SUSPICIOUS && guard.suspicion < SUSPICION_SUSPICIOUS_AT * 0.4) {
      guard.state = GUARD_RETURN;
    }
  }

  if (guard.state === GUARD_PATROL) {
    patrolStep(guard, dt, grid);
  } else if (guard.state === GUARD_SUSPICIOUS) {
    const tx = guard.investigateX ?? guard.x;
    const ty = guard.investigateY ?? guard.y;
    if (moveToward(guard, tx, ty, GUARD_SUSPICIOUS_SPEED, dt, grid)) {
      guard.waitTimer = 1.6;
      guard.state = GUARD_PATROL;
      guard.investigateX = null;
      guard.investigateY = null;
      guard.heardX = null;
      guard.heardY = null;
    }
  } else if (guard.state === GUARD_CHASE) {
    // Chase the last place the thief was seen; a fresh sighting updates it.
    const tx = seen ? player.x : guard.lastSeenX ?? player.x;
    const ty = seen ? player.y : guard.lastSeenY ?? player.y;
    moveToward(guard, tx, ty, GUARD_CHASE_SPEED, dt, grid);
    if (hasLineOfSight(grid, guard.x, guard.y, player.x, player.y)) {
      guard.lastSeenX = player.x;
      guard.lastSeenY = player.y;
    }
  } else if (guard.state === GUARD_RETURN) {
    const home = guard.waypoints[guard.waypointIndex];
    if (moveToward(guard, home.x, home.y, GUARD_PATROL_SPEED, dt, grid)) {
      guard.state = GUARD_PATROL;
      guard.waitTimer = 0.8;
    }
  }
  return seen;
}
