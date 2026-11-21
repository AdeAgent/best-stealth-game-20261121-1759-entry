// EMBERHUSH — the three heists.
// Each level is an ASCII map plus the patrol routes of its guards. Map letters:
//   #  wall (blocks movement and sight)
//   .  lit floor (guards spot you fast here)
//   d  dark floor / shadow (guards spot you slowly here)
//   f  fern cover (hides you unless a guard is very close)
//   c  crate (low cover: blocks movement and sight, hides you behind it)
//   l  lamplight pool (bright: guards spot you fastest here)
//   o  small relic loot, O  grand relic loot
//   E  exit door (opens once every relic is taken)
//   P  where the thief starts, G  where a guard starts
// Patrol routes are waypoint lists in tile coordinates, one per guard, in the
// same order the G letters appear when the map is read top to bottom.

import { COLS, ROWS } from './config.js';

function normalizeMap(rows) {
  const fixed = rows.slice(0, ROWS);
  while (fixed.length < ROWS) fixed.push('#'.repeat(COLS));
  return fixed.map((row) => {
    const line = String(row);
    if (line.length >= COLS) return line.slice(0, COLS);
    return line + '#'.repeat(COLS - line.length);
  });
}

export const LEVELS = [
  {
    id: 1,
    name: 'HEIST 1 — THE FERN GALLERY',
    subtitle: 'A moonlit gallery. 3 guards · 4 relics · fern cover',
    seed: 101,
    map: normalizeMap([
      '########################################',
      '#P...f.......#.......o.......#.........#',
      '#....f.......#...............#....G....#',
      '#...........#....f.....f.....#.........#',
      '#..####.....#...............#....###...#',
      '#..#........#.....#####......#....#....#',
      '#..#.o......#.....#...#......#....#.o..#',
      '#..#........#..f..#...#..f...#....#....#',
      '#..####.....#.....#...#......#....#....#',
      '#...........#.....#####......#....#....#',
      '#....f......#...............#....#....#',
      '#...........#....f.....f....#....#.E..#',
      '#..G....f...#...............#....#....#',
      '#...........#.......o.......#.........#',
      '########################################',
    ]),
    patrols: [
      [[33, 2], [33, 12], [26, 12], [26, 2]],
      [[3, 12], [10, 12], [10, 2], [3, 2]],
      [[20, 6], [20, 11], [15, 11], [15, 6]],
    ],
  },
  {
    id: 2,
    name: 'HEIST 2 — THE INK ARCHIVE',
    subtitle: 'A library of forbidden ledgers. 4 guards · 5 relics · deep shadow',
    seed: 202,
    map: normalizeMap([
      '########################################',
      '#P..d....f...#....o.....d....#.........#',
      '#..d........#...........d...#....G....#',
      '#..d...f....#..d....d.......#.........#',
      '#.....####..#.....#####.....#....##...#',
      '#..d..#.....#..d..#...#..d..#....#...#',
      '#.....#.o...#.....#...#.o...#....#.o.#',
      '#..f..#.....#..f..#...#.....#....#...#',
      '#.....####..#.....#...#..d..#....#...#',
      '#..d........#..d..#####.....#....#...#',
      '#.....f.....#...........d...#....#...#',
      '#..d........#..f....f.......#....#.E.#',
      '#..G....d...#......o....d...#....#...#',
      '#.....f.....#...........d...#...G....#',
      '########################################',
    ]),
    patrols: [
      [[33, 1], [33, 13], [26, 13], [26, 1]],
      [[3, 12], [11, 12], [11, 3], [3, 3]],
      [[20, 5], [20, 12], [15, 12], [15, 5]],
      [[36, 13], [36, 4], [30, 4], [30, 13]],
    ],
  },
  {
    id: 3,
    name: 'HEIST 3 — THE CINDER VAULT',
    subtitle: 'The vault under the old mint. 5 guards · 5 relics · lamplight',
    seed: 303,
    map: normalizeMap([
      '########################################',
      '#P...l......#......o......l..#........#',
      '#....l......#.............l..#....G...#',
      '#...........#..l......l......#........#',
      '#..####.....#......#####.....#...###..#',
      '#..#...l....#..l...#...#..l..#...#...#',
      '#..#.o......#.....#...#.o....#...#.o.#',
      '#..#........#..f..#...#......#...#...#',
      '#..####.....#.....#...#..f...#...#...#',
      '#.....l.....#..l..#####......#...#...#',
      '#...........#.............l..#...#...#',
      '#..f....l...#..f......f......#...#.E.#',
      '#..G........#......o.....l...#...#...#',
      '#.....f.....#.............l..#..G....#',
      '########################################',
    ]),
    patrols: [
      [[33, 1], [33, 13], [26, 13], [26, 1]],
      [[3, 12], [11, 12], [11, 3], [3, 3]],
      [[20, 5], [20, 12], [15, 12], [15, 5]],
      [[36, 13], [36, 4], [30, 4], [30, 13]],
      [[22, 8], [24, 8], [24, 2], [22, 2]],
    ],
  },
];

// Turn a level definition into the live data the game runs on: a tile grid,
// the player start, guard starts with patrols, loot spots and the exit.
export function parseLevel(definition) {
  const grid = [];
  const loot = [];
  let playerStart = { x: 2, y: 2 };
  let exit = { x: COLS - 2, y: ROWS - 2 };
  for (let y = 0; y < ROWS; y += 1) {
    const row = [];
    for (let x = 0; x < COLS; x += 1) {
      const cell = definition.map[y][x];
      if (cell === 'P') {
        playerStart = { x, y };
        row.push('.');
      } else if (cell === 'G') {
        // A guard letter marks a patrol corner; the guard itself spawns on its
        // patrol route, so the letter just becomes open floor here.
        row.push('.');
      } else if (cell === 'E') {
        exit = { x, y };
        row.push('E');
      } else if (cell === 'o' || cell === 'O') {
        loot.push({ x, y, big: cell === 'O', taken: false });
        row.push('.');
      } else {
        row.push(cell);
      }
    }
    grid.push(row);
  }
  return {
    definition,
    grid,
    loot,
    playerStart,
    exit,
    // Guards spawn on the first waypoint of their own patrol route.
    guardStarts: definition.patrols.map((route) => ({ x: route[0][0], y: route[0][1] })),
    patrols: definition.patrols,
  };
}
