// EMBERHUSH — the game itself: state, the loop, and the rules that tie the
// modules together. Screens: title → play → (caught | levelclear) → play →
// win / gameover. The loop runs on requestAnimationFrame with a fixed step so
// the simulation is stable at any frame rate, and every rule that matters is
// visible in the HUD: loot, suspicion, pebbles, lives and time.

import {
  ALARM_PENALTY,
  POINTS_PER_HEIST,
  POINTS_PER_LOOT,
  START_LIVES,
  TIME_BONUS_PER_SECOND,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { makeGuard, updateGuard, guardHearNoise, GUARD_CHASE } from './guards.js';
import { makePlayer, updatePlayer, throwPebble, collectLoot } from './player.js';
import { makeSoundEngine, unlockSound, playAlertSting, playExitShimmer, playFootstep, playLootChime, playPebbleClink } from './audio.js';
import { makeInputState, attachInput } from './input.js';
import { renderGame } from './render.js';
import { makeSeededRandom } from './rng.js';
import { stageShotScene } from './shots.js';

const STEP = 1 / 60;

export function createGame(canvas) {
  const context = canvas.getContext('2d');
  const input = makeInputState();
  const sound = makeSoundEngine();
  const random = makeSeededRandom(20261121);

  const game = {
    canvas,
    context,
    input,
    sound,
    random,
    screen: 'title',
    levelIndex: 0,
    level: parseLevel(LEVELS[0]),
    guards: [],
    player: null,
    lives: START_LIVES,
    score: 0,
    elapsed: 0,
    alarmsRaised: 0,
    lootTaken: 0,
    time: 0,
    accumulator: 0,
    lastTimestamp: 0,
    shotMode: null,

    onAlarmRaised(guard) {
      this.alarmsRaised += 1;
      this.score = Math.max(0, this.score - ALARM_PENALTY);
      playAlertSting(this.sound);
      void guard;
    },
    onFootstep(player) {
      playFootstep(this.sound, player.sneaking, player.running, player.stepCount);
    },
    onLootTaken(relic) {
      this.lootTaken += 1;
      this.score += POINTS_PER_LOOT;
      playLootChime(this.sound, relic.big);
    },
    onPebbleLanded(x, y) {
      playPebbleClink(this.sound);
      for (const guard of this.guards) guardHearNoise(guard, x, y);
    },
  };

  game.loadLevel = function loadLevel(index) {
    game.levelIndex = index;
    game.level = parseLevel(LEVELS[index]);
    game.player = makePlayer(game.level.playerStart);
    game.guards = game.level.guardStarts.map((start, i) => makeGuard(start, game.level.patrols[i]));
    game.elapsed = 0;
    game.screen = 'play';
  };

  game.startGame = function startGame() {
    game.lives = START_LIVES;
    game.score = 0;
    game.lootTaken = 0;
    game.alarmsRaised = 0;
    game.loadLevel(0);
  };

  game.handleCaught = function handleCaught() {
    game.lives -= 1;
    playAlertSting(game.sound);
    if (game.lives <= 0) {
      game.screen = 'gameover';
    } else {
      game.screen = 'caught';
    }
  };

  game.advanceAfterClear = function advanceAfterClear() {
    const timeBonus = Math.max(0, Math.floor(300 - game.elapsed)) * TIME_BONUS_PER_SECOND;
    game.score += POINTS_PER_HEIST + timeBonus;
    playExitShimmer(game.sound);
    if (game.levelIndex + 1 >= LEVELS.length) {
      game.screen = 'win';
    } else {
      game.screen = 'levelclear';
    }
  };

  game.step = function step(dt) {
    game.time += dt;
    if (game.screen !== 'play') return;
    game.elapsed += dt;
    const player = game.player;
    updatePlayer(player, dt, input, game.level.grid, game);
    collectLoot(player, game.level.loot, game);

    // Pebble input: Space throws toward the mouse, a click throws at the tile.
    if (input.pressedPebbleKey) {
      input.pressedPebbleKey = false;
      throwPebble(player, input.mouseTileX, input.mouseTileY);
    }
    if (input.clickedTile) {
      const tile = input.clickedTile;
      input.clickedTile = null;
      throwPebble(player, tile.x, tile.y);
    }

    let anyChase = false;
    for (const guard of game.guards) {
      updateGuard(guard, dt, game.level.grid, player, game);
      if (guard.state === GUARD_CHASE) anyChase = true;
      // Caught: a chasing guard reaches the thief.
      if (guard.state === GUARD_CHASE && Math.hypot(guard.x - player.x, guard.y - player.y) < 0.55) {
        game.handleCaught();
        return;
      }
    }
    void anyChase;

    // Exit opens only once every relic is taken; stepping in clears the heist.
    const exitOpen = game.level.loot.every((relic) => relic.taken);
    if (exitOpen) {
      const exit = game.level.exit;
      if (Math.hypot(exit.x + 0.5 - player.x, exit.y + 0.5 - player.y) < 0.7) {
        game.advanceAfterClear();
      }
    }
  };

  game.frame = function frame(timestamp) {
    const dt = Math.min(0.1, (timestamp - game.lastTimestamp) / 1000 || 0);
    game.lastTimestamp = timestamp;
    game.accumulator += dt;
    while (game.accumulator >= STEP) {
      game.step(STEP);
      game.accumulator -= STEP;
    }
    // Screen transitions on Enter.
    if (input.pressedStart) {
      input.pressedStart = false;
      if (game.screen === 'title' || game.screen === 'gameover') game.startGame();
      else if (game.screen === 'caught') game.loadLevel(game.levelIndex);
      else if (game.screen === 'levelclear') game.loadLevel(game.levelIndex + 1);
      else if (game.screen === 'win') game.startGame();
    }
    renderGame(context, game, game.time);
    requestAnimationFrame(game.frame);
  };

  game.start = function start() {
    attachInput(canvas, input, () => unlockSound(sound));
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      // A deterministic screenshot scene: stage the real simulation, then
      // hold the frame still for the capture.
      game.shotMode = shot;
      game.startGame();
      stageShotScene(game, shot);
      game.screen = 'play';
      renderGame(context, game, game.time);
      return;
    }
    game.player = makePlayer(game.level.playerStart);
    game.guards = game.level.guardStarts.map((start, i) => makeGuard(start, game.level.patrols[i]));
    game.lastTimestamp = performance.now();
    requestAnimationFrame(game.frame);
  };

  return game;
}

export function bootGame(canvas) {
  const game = createGame(canvas);
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;
  game.start();
  return game;
}
