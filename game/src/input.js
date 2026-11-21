// EMBERHUSH — input: keyboard and mouse, one shared state.
// WASD or arrows move, Shift sneaks, Ctrl (or holding right mouse) runs, Space
// throws a pebble toward the mouse, and a mouse click throws one at the
// clicked tile. Enter starts the game and advances past end screens.

export function makeInputState() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    run: false,
    mouseTileX: 0,
    mouseTileY: 0,
    mouseX: 0,
    mouseY: 0,
    clickedTile: null,
    pressedStart: false,
    pressedPebbleKey: false,
  };
}

const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
  ControlLeft: 'run',
  ControlRight: 'run',
};

export function attachInput(canvas, input, onFirstGesture) {
  function markGesture() {
    if (onFirstGesture) onFirstGesture();
  }

  window.addEventListener('keydown', (event) => {
    markGesture();
    const field = KEYMAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'Enter') {
      input.pressedStart = true;
      event.preventDefault();
    }
    if (event.code === 'Space') {
      input.pressedPebbleKey = true;
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.mouseX = (event.clientX - rect.left) * scaleX;
    input.mouseY = (event.clientY - rect.top) * scaleY;
    input.mouseTileX = Math.floor(input.mouseX / 32);
    input.mouseTileY = Math.floor(input.mouseY / 32);
  });

  canvas.addEventListener('mousedown', (event) => {
    markGesture();
    if (event.button === 0) {
      input.clickedTile = { x: input.mouseTileX, y: input.mouseTileY };
    }
    if (event.button === 2) input.run = true;
  });

  canvas.addEventListener('mouseup', (event) => {
    if (event.button === 2) input.run = false;
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('blur', () => {
    input.up = false;
    input.down = false;
    input.left = false;
    input.right = false;
    input.sneak = false;
    input.run = false;
  });
}
