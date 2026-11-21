// EMBERHUSH — a tiny seeded random generator.
// The game uses this everywhere it needs chance (guard idle sway, loot sparkle,
// footstep variation) so a fixed seed always replays the same world, which is
// what makes the screenshot scenes deterministic.

export function makeSeededRandom(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick an integer in [min, max] from a seeded generator.
export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
