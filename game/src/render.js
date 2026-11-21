// EMBERHUSH — rendering: everything the judge sees.
// The whole game is drawn on one canvas: lamplit floors and dark shadow zones,
// fern cover you can read at a glance, crates, relics, the exit door, guards
// with raycast vision cones, and the thief. The HUD sits on top: heist name,
// loot, the suspicion meter, pebbles and lives. Cones are bright and guards
// contrast hard against the floor, so the stealth reads even when the shot is
// shrunk to a contact-sheet cell.

import { COLS, PALETTE, ROWS, TILE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { computeVisionCone } from './vision.js';
import { GUARD_CHASE, GUARD_SUSPICIOUS } from './guards.js';

function tileCentre(tile) {
  return tile * TILE + TILE / 2;
}

function drawFloor(context, grid, time) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (cell === '#') continue;
      let colour = (x + y) % 2 === 0 ? PALETTE.floor : PALETTE.floorAlt;
      if (cell === 'd') colour = PALETTE.floorDark;
      if (cell === 'l') colour = '#3a3222';
      context.fillStyle = colour;
      context.fillRect(px, py, TILE, TILE);
      if (cell === 'l') {
        const glow = 0.10 + 0.05 * Math.sin(time * 2 + x);
        context.fillStyle = `rgba(255, 217, 138, ${glow.toFixed(3)})`;
        context.beginPath();
        context.arc(tileCentre(x), tileCentre(y), TILE * 0.62, 0, Math.PI * 2);
        context.fill();
      }
      if (cell === 'd') {
        context.fillStyle = 'rgba(8, 12, 20, 0.35)';
        context.fillRect(px, py, TILE, TILE);
      }
    }
  }
}

function drawWalls(context, grid) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (grid[y][x] !== '#') continue;
      const px = x * TILE;
      const py = y * TILE;
      context.fillStyle = PALETTE.wall;
      context.fillRect(px, py, TILE, TILE);
      if (y === 0 || grid[y - 1][x] !== '#') {
        context.fillStyle = PALETTE.wallTop;
        context.fillRect(px, py, TILE, 6);
      }
      context.fillStyle = 'rgba(255,255,255,0.05)';
      context.fillRect(px, py + TILE - 3, TILE, 3);
    }
  }
}

function drawCoverAndCrates(context, grid, time) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = grid[y][x];
      const cx = tileCentre(x);
      const cy = tileCentre(y);
      if (cell === 'f') {
        context.fillStyle = PALETTE.fernDark;
        context.beginPath();
        context.arc(cx, cy, TILE * 0.52, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = PALETTE.fern;
        for (let i = 0; i < 5; i += 1) {
          const angle = (i / 5) * Math.PI * 2 + x * 0.7;
          const sway = Math.sin(time * 1.4 + x + y) * 2;
          context.beginPath();
          context.arc(cx + Math.cos(angle) * 8 + sway, cy + Math.sin(angle) * 8, 6.5, 0, Math.PI * 2);
          context.fill();
        }
      } else if (cell === 'c') {
        context.fillStyle = PALETTE.crate;
        context.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6);
        context.fillStyle = PALETTE.crateTop;
        context.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, 5);
        context.strokeStyle = 'rgba(0,0,0,0.35)';
        context.lineWidth = 2;
        context.strokeRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6);
        context.beginPath();
        context.moveTo(x * TILE + 3, y * TILE + 3);
        context.lineTo(x * TILE + TILE - 3, y * TILE + TILE - 3);
        context.moveTo(x * TILE + TILE - 3, y * TILE + 3);
        context.lineTo(x * TILE + 3, y * TILE + TILE - 3);
        context.stroke();
      }
    }
  }
}

function drawLoot(context, loot, time) {
  for (const relic of loot) {
    if (relic.taken) continue;
    const cx = tileCentre(relic.x);
    const cy = tileCentre(relic.y);
    const pulse = 0.75 + 0.25 * Math.sin(time * 3 + relic.x);
    const radius = relic.big ? 9 : 6.5;
    context.fillStyle = relic.big ? PALETTE.lootBig : PALETTE.loot;
    context.globalAlpha = pulse;
    context.beginPath();
    context.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    context.save();
    context.translate(cx, cy);
    context.rotate(Math.PI / 4);
    context.fillStyle = relic.big ? '#ffd98a' : '#ffe98a';
    context.fillRect(-radius * 0.62, -radius * 0.62, radius * 1.24, radius * 1.24);
    context.restore();
    context.fillStyle = '#fff6cf';
    context.beginPath();
    context.arc(cx - 2, cy - 2, 1.8, 0, Math.PI * 2);
    context.fill();
  }
}

function drawExit(context, exit, open, time) {
  const cx = tileCentre(exit.x);
  const cy = tileCentre(exit.y);
  const glow = open ? 0.35 + 0.12 * Math.sin(time * 3) : 0.12;
  context.fillStyle = open ? `rgba(57, 208, 165, ${glow.toFixed(3)})` : 'rgba(90, 107, 122, 0.25)';
  context.beginPath();
  context.arc(cx, cy, TILE * 0.72, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
  context.fillRect(cx - 11, cy - 13, 22, 26);
  context.fillStyle = '#0b1a14';
  context.font = 'bold 15px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(open ? '→' : '✕', cx, cy + 1);
  context.fillStyle = open ? '#c9ffe9' : '#c8d4de';
  context.font = 'bold 10px system-ui, sans-serif';
  context.fillText('EXIT', cx, cy - 22);
}

function drawVisionCone(context, grid, guard) {
  const range = 7.5;
  const points = computeVisionCone(grid, guard.x, guard.y, guard.facing, range);
  let fill = 'rgba(255, 176, 61, 0.20)';
  if (guard.state === GUARD_SUSPICIOUS) fill = 'rgba(255, 140, 40, 0.30)';
  if (guard.state === GUARD_CHASE) fill = 'rgba(255, 60, 50, 0.34)';
  context.beginPath();
  context.moveTo(guard.x * TILE, guard.y * TILE);
  for (const point of points.slice(1)) context.lineTo(point.x * TILE, point.y * TILE);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = fill.replace(/0\.\d+\)$/, '0.55)');
  context.lineWidth = 1.5;
  context.stroke();
}

function drawGuard(context, guard, time) {
  const cx = guard.x * TILE;
  const cy = guard.y * TILE;
  const bob = Math.sin(guard.stepPhase) * 1.5;
  context.fillStyle = 'rgba(0, 0, 0, 0.35)';
  context.beginPath();
  context.ellipse(cx, cy + 11, 11, 4, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = guard.state === GUARD_CHASE ? '#ff5a4d' : '#ffb03d';
  context.beginPath();
  context.arc(cx, cy + bob * 0.4, 11, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#1c1210';
  context.lineWidth = 2;
  context.stroke();
  // Helmet brim and facing tick, so the guard's direction reads at a glance.
  context.fillStyle = '#7a2a22';
  context.beginPath();
  context.arc(cx + Math.cos(guard.facing) * 5, cy + Math.sin(guard.facing) * 5 + bob * 0.4, 5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#fff2d8';
  context.beginPath();
  context.arc(cx + Math.cos(guard.facing) * 8, cy + Math.sin(guard.facing) * 8 - 3, 1.8, 0, Math.PI * 2);
  context.arc(cx + Math.cos(guard.facing) * 8, cy + Math.sin(guard.facing) * 8 + 3, 1.8, 0, Math.PI * 2);
  context.fill();
  // Suspicion arc above the guard's head.
  if (guard.suspicion > 4) {
    const frac = guard.suspicion / 100;
    context.strokeStyle = 'rgba(0,0,0,0.5)';
    context.lineWidth = 4;
    context.beginPath();
    context.arc(cx, cy - 18, 9, -Math.PI / 2, Math.PI * 1.5);
    context.stroke();
    context.strokeStyle = guard.suspicion >= 100 ? '#ff4d42' : guard.suspicion >= 55 ? '#ff9d2e' : '#ffd23d';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(cx, cy - 18, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    context.stroke();
    if (guard.suspicion >= 55) {
      context.fillStyle = guard.suspicion >= 100 ? '#ff4d42' : '#ffb03d';
      context.font = 'bold 13px system-ui, sans-serif';
      context.textAlign = 'center';
      context.fillText(guard.suspicion >= 100 ? '!' : '?', cx, cy - 30);
    }
  }
  void time;
}

function drawPlayer(context, player, time) {
  const cx = player.x * TILE;
  const cy = player.y * TILE;
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.6 : Math.sin(time * 2) * 0.8;
  context.fillStyle = 'rgba(0, 0, 0, 0.4)';
  context.beginPath();
  context.ellipse(cx, cy + 11, 10, 4, 0, 0, Math.PI * 2);
  context.fill();
  const crouch = player.sneaking ? 3 : 0;
  context.fillStyle = player.sneaking ? PALETTE.playerSneak : PALETTE.player;
  context.beginPath();
  context.arc(cx, cy + bob * 0.4 + crouch, 10, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#31435c';
  context.lineWidth = 2;
  context.stroke();
  // Hood point and eyes, so the thief reads as a figure, not a dot.
  context.fillStyle = '#31435c';
  context.beginPath();
  context.moveTo(cx + Math.cos(player.facingX * 0 + Math.atan2(player.facingY, player.facingX)) * 10, cy + Math.sin(Math.atan2(player.facingY, player.facingX)) * 10 + bob * 0.4 + crouch);
  context.arc(cx, cy + bob * 0.4 + crouch, 7, Math.atan2(player.facingY, player.facingX) - 0.9, Math.atan2(player.facingY, player.facingX) + 0.9);
  context.closePath();
  context.fill();
  context.fillStyle = '#0e1420';
  const eyeAngle = Math.atan2(player.facingY, player.facingX);
  context.beginPath();
  context.arc(cx + Math.cos(eyeAngle) * 4 - Math.sin(eyeAngle) * 3, cy + Math.sin(eyeAngle) * 4 + Math.cos(eyeAngle) * 3 + bob * 0.4 + crouch, 1.6, 0, Math.PI * 2);
  context.arc(cx + Math.cos(eyeAngle) * 4 + Math.sin(eyeAngle) * 3, cy + Math.sin(eyeAngle) * 4 - Math.cos(eyeAngle) * 3 + bob * 0.4 + crouch, 1.6, 0, Math.PI * 2);
  context.fill();
  if (player.sneaking) {
    context.fillStyle = '#b9d2ff';
    context.font = 'bold 9px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText('SNEAK', cx, cy - 17);
  }
}

function drawPebble(context, player) {
  if (!player.pebble) return;
  const cx = player.pebble.x * TILE;
  const cy = player.pebble.y * TILE;
  context.fillStyle = '#d8dee8';
  context.beginPath();
  context.arc(cx, cy, 4, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = 'rgba(216, 222, 232, 0.6)';
  context.setLineDash([3, 4]);
  context.beginPath();
  context.moveTo(player.x * TILE, player.y * TILE);
  context.lineTo(cx, cy);
  context.stroke();
  context.setLineDash([]);
}

function drawHud(context, game) {
  const level = game.level;
  const lootTaken = level.loot.filter((relic) => relic.taken).length;
  const maxSuspicion = Math.max(0, ...game.guards.map((guard) => guard.suspicion));
  const alarming = game.guards.some((guard) => guard.state === GUARD_CHASE);

  context.fillStyle = PALETTE.hudBack;
  context.fillRect(0, 0, VIEW_WIDTH, 40);
  context.fillStyle = '#ffd23d';
  context.font = 'bold 17px system-ui, sans-serif';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText('EMBERHUSH', 14, 21);
  context.fillStyle = PALETTE.hudText;
  context.font = 'bold 13px system-ui, sans-serif';
  context.fillText(level.definition.name, 150, 21);

  context.fillStyle = PALETTE.hudDim;
  context.font = '12px system-ui, sans-serif';
  context.fillText(`LOOT ${lootTaken}/${level.loot.length}`, 560, 21);
  context.fillText(`PEBBLES ${game.player.pebbles}`, 660, 21);
  context.fillText(`LIVES ${'♥'.repeat(Math.max(0, game.lives))}${'·'.repeat(Math.max(0, 3 - game.lives))}`, 760, 21);
  context.fillText(`TIME ${Math.floor(game.elapsed)}s`, 860, 21);

  // Suspicion meter: the single number that tells the player how hot they are.
  const meterX = 960;
  const meterW = 200;
  context.fillStyle = '#10151c';
  context.fillRect(meterX, 13, meterW, 14);
  context.fillStyle = alarming ? '#ff4d42' : maxSuspicion >= 55 ? '#ff9d2e' : '#ffd23d';
  context.fillRect(meterX, 13, meterW * (maxSuspicion / 100), 14);
  context.strokeStyle = 'rgba(255,255,255,0.35)';
  context.lineWidth = 1;
  context.strokeRect(meterX, 13, meterW, 14);
  // Status word sits inside the bar's own row, right of the meter.
  context.fillStyle = alarming ? '#ff6d66' : maxSuspicion >= 55 ? '#ff9d2e' : PALETTE.hudDim;
  context.font = 'bold 11px system-ui, sans-serif';
  context.textAlign = 'left';
  context.fillText(alarming ? 'SPOTTED!' : maxSuspicion >= 55 ? 'SUSPICIOUS' : 'UNSEEN', meterX + meterW + 8, 21);
}

function drawHints(context, game) {
  context.fillStyle = 'rgba(10, 14, 20, 0.72)';
  context.fillRect(0, VIEW_HEIGHT - 26, VIEW_WIDTH, 26);
  context.fillStyle = PALETTE.hudDim;
  context.font = '12px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const exitOpen = game.level.loot.every((relic) => relic.taken);
  context.fillText(
    exitOpen
      ? 'EXIT OPEN — reach the green door unseen · WASD move · SHIFT sneak · CLICK / SPACE throw a pebble'
      : 'WASD / arrows move · SHIFT sneak in shadow & ferns · CLICK / SPACE throw a pebble to lure guards · take all relics to open the exit',
    VIEW_WIDTH / 2,
    VIEW_HEIGHT - 13,
  );
}

function drawBanner(context, title, subtitle, colour) {
  context.fillStyle = 'rgba(8, 11, 16, 0.72)';
  context.fillRect(0, 150, VIEW_WIDTH, 130);
  context.fillStyle = colour || '#ffd23d';
  context.font = 'bold 44px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(title, VIEW_WIDTH / 2, 200);
  context.fillStyle = PALETTE.hudText;
  context.font = '16px system-ui, sans-serif';
  context.fillText(subtitle, VIEW_WIDTH / 2, 244);
}

export function renderGame(context, game, time) {
  context.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  context.fillStyle = '#10141a';
  context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  const grid = game.level.grid;
  drawFloor(context, grid, time);
  drawLoot(context, game.level.loot, time);
  drawExit(context, game.level.exit, game.level.loot.every((relic) => relic.taken), time);
  for (const guard of game.guards) drawVisionCone(context, grid, guard);
  drawCoverAndCrates(context, grid, time);
  drawWalls(context, grid);
  for (const guard of game.guards) drawGuard(context, guard, time);
  drawPebble(context, game.player);
  drawPlayer(context, game.player, time);
  drawHud(context, game);
  drawHints(context, game);

  if (game.screen === 'title') {
    drawBanner(context, 'EMBERHUSH', 'Three quiet heists · 3 levels · 5 guards · 6 relics · pebble lures — press ENTER to begin', '#ffd23d');
  } else if (game.screen === 'caught') {
    drawBanner(context, 'CAUGHT!', `A guard laid hands on you — ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left · press ENTER to slip back in`, '#ff5a4d');
  } else if (game.screen === 'levelclear') {
    drawBanner(context, 'HEIST COMPLETE', `${game.level.definition.name} cleared unseen enough · press ENTER for the next heist`, '#39d0a5');
  } else if (game.screen === 'win') {
    drawBanner(context, 'THE QUIET VAULTS ARE YOURS', `All 3 heists done · score ${game.score} · press ENTER to play again`, '#39d0a5');
  } else if (game.screen === 'gameover') {
    drawBanner(context, 'THE HOUSE WINS THIS TIME', `Score ${game.score} · press ENTER to try the gallery again`, '#ff5a4d');
  }
}
