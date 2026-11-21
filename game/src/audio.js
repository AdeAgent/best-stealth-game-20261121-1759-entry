// EMBERHUSH — sound: every effect is synthesized with WebAudio.
// No audio files are shipped: footsteps are filtered noise ticks, the alert is
// a rising two-note sting, loot is a soft chime, the pebble is a clink and the
// exit is a short shimmer. The context is created on the first user gesture,
// so the game never complains in a headless screenshot run.

export function makeSoundEngine() {
  return {
    context: null,
    master: null,
    ambientStarted: false,
    enabled: true,
  };
}

function ensureContext(engine) {
  if (engine.context) return engine.context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    engine.context = new AudioContext();
    engine.master = engine.context.createGain();
    engine.master.gain.value = 0.5;
    engine.master.connect(engine.context.destination);
  } catch {
    engine.context = null;
  }
  return engine.context;
}

export function unlockSound(engine) {
  const context = ensureContext(engine);
  if (context && context.state === 'suspended') context.resume().catch(() => {});
  startAmbientDrone(engine);
}

function startAmbientDrone(engine) {
  const context = ensureContext(engine);
  if (!context || engine.ambientStarted) return;
  engine.ambientStarted = true;
  try {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 55;
    const gain = context.createGain();
    gain.gain.value = 0.035;
    const wobble = context.createOscillator();
    wobble.frequency.value = 0.07;
    const wobbleGain = context.createGain();
    wobbleGain.gain.value = 0.015;
    wobble.connect(wobbleGain);
    wobbleGain.connect(gain.gain);
    oscillator.connect(gain);
    gain.connect(engine.master);
    oscillator.start();
    wobble.start();
  } catch {
    // Silence is fine; the game plays the same without sound.
  }
}

function playTone(engine, frequency, duration, type, volume, slideTo) {
  if (!engine.enabled) return;
  const context = ensureContext(engine);
  if (!context || !engine.master) return;
  try {
    const oscillator = context.createOscillator();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, context.currentTime + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(engine.master);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  } catch {
    // Ignore audio failures; the game continues silently.
  }
}

function playNoiseTick(engine, volume, lowpass) {
  if (!engine.enabled) return;
  const context = ensureContext(engine);
  if (!context || !engine.master) return;
  try {
    const length = Math.floor(context.sampleRate * 0.06);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(engine.master);
    source.start();
  } catch {
    // Ignore audio failures; the game continues silently.
  }
}

// A footstep: soft while sneaking, crisp while running. The pitch alternates
// slightly so a guard's patrol has a rhythm you can follow by ear.
export function playFootstep(engine, sneaking, running, stepCount) {
  const volume = sneaking ? 0.05 : running ? 0.16 : 0.1;
  playNoiseTick(engine, volume, sneaking ? 500 : running ? 1400 : 900);
  if (stepCount % 2 === 0) playTone(engine, 90, 0.05, 'sine', volume * 0.4);
}

// Two rising notes when a guard's suspicion crosses into alarm.
export function playAlertSting(engine) {
  playTone(engine, 220, 0.16, 'sawtooth', 0.12, 330);
  setTimeout(() => playTone(engine, 330, 0.24, 'sawtooth', 0.12, 440), 140);
}

// A soft two-note chime when a relic is picked up.
export function playLootChime(engine, big) {
  playTone(engine, big ? 660 : 587, 0.18, 'sine', 0.14);
  setTimeout(() => playTone(engine, big ? 990 : 880, 0.26, 'sine', 0.12), 90);
}

// A pebble clink when the lure lands.
export function playPebbleClink(engine) {
  playTone(engine, 1400, 0.07, 'triangle', 0.1);
  setTimeout(() => playTone(engine, 1050, 0.09, 'triangle', 0.08), 60);
}

// A short shimmer when a heist is finished.
export function playExitShimmer(engine) {
  [523, 659, 784, 1047].forEach((frequency, index) => {
    setTimeout(() => playTone(engine, frequency, 0.3, 'sine', 0.1), index * 90);
  });
}
