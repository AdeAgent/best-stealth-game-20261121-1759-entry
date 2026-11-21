// EMBERHUSH — shared constants for the whole game.
// One place for every number the other modules agree on: the canvas size, the
// tile grid, movement speeds, the detection model and the scoring rules.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 480;
export const TILE = 32;
export const COLS = 40;
export const ROWS = 15;

// Player movement, tiles per second.
export const PLAYER_WALK_SPEED = 4.6;
export const PLAYER_SNEAK_SPEED = 2.4;
export const PLAYER_RUN_SPEED = 6.4;

// Guard movement, tiles per second.
export const GUARD_PATROL_SPEED = 1.5;
export const GUARD_SUSPICIOUS_SPEED = 2.2;
export const GUARD_CHASE_SPEED = 3.4;

// Vision: how far a guard sees, in tiles, and how wide the cone is.
export const GUARD_SIGHT_RANGE = 7.5;
export const GUARD_FOV_DEGREES = 72;
export const GUARD_CLOSE_RANGE = 1.6;

// Detection: suspicion points per second while the player is seen.
export const SPOT_RATE_BRIGHT = 55;
export const SPOT_RATE_NORMAL = 38;
export const SPOT_RATE_DARK = 16;
export const SPOT_RATE_FERN = 9;
export const SPOT_RATE_SNEAK = 0.55;
export const SPOT_RATE_RUNNING = 1.35;
export const SUSPICION_DECAY = 14;
export const SUSPICION_SUSPICIOUS_AT = 55;
export const SUSPICION_ALARM_AT = 100;
export const ALARM_MEMORY_SECONDS = 4;

// Pebble lure gadget.
export const PEBBLE_START_COUNT = 3;
export const PEBBLE_HEAR_RADIUS = 6.5;
export const PEBBLE_THROW_RANGE = 9;

// Lives and scoring.
export const START_LIVES = 3;
export const POINTS_PER_LOOT = 250;
export const POINTS_PER_HEIST = 1000;
export const TIME_BONUS_PER_SECOND = 10;
export const ALARM_PENALTY = 150;

// Colours, kept in one place so the look stays consistent.
export const PALETTE = {
  floor: '#232a33',
  floorAlt: '#20262e',
  floorDark: '#161b21',
  wall: '#3d4756',
  wallTop: '#55627a',
  fern: '#2e6b3a',
  fernDark: '#245430',
  crate: '#6b5232',
  crateTop: '#8a6a41',
  lampGlow: '#ffd98a',
  exit: '#39d0a5',
  exitLocked: '#5a6b7a',
  loot: '#ffcf4d',
  lootBig: '#ff9d3d',
  player: '#e8f1ff',
  playerSneak: '#b9d2ff',
  guard: '#ff5a4d',
  guardCalm: '#ffb03d',
  coneCalm: 'rgba(255, 176, 61, 0.20)',
  coneSuspicious: 'rgba(255, 140, 40, 0.30)',
  coneAlarm: 'rgba(255, 60, 50, 0.34)',
  hudBack: 'rgba(10, 14, 20, 0.82)',
  hudText: '#e8f1ff',
  hudDim: '#9fb2c8',
};
