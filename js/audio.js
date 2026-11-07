'use strict';
// All sounds are synthesized with WebAudio, so the game needs no audio files.
// Bob's "voice" is a wobbly, low-passed sawtooth: gross on purpose.
// Guns and explosions also go through a small echo (reverb) so they sound bigger.

const SFX = (() => {
  let ac = null, master = null, reverb = null, noiseBuf = null, muted = false, unlocked = false;
  const BOB_VOL = 1.35; // Bob is loud.

  // Browsers only allow audio after the player presses a key or clicks.
  function ctx() {
    if (!unlocked) return null;
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ac = new C();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ac.destination);
      reverb = ac.createConvolver();
      reverb.buffer = makeEcho(1.3);
      const wet = ac.createGain(); wet.gain.value = 0.35;
      reverb.connect(wet); wet.connect(master);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function makeEcho(secs) {
    const len = Math.floor(ac.sampleRate * secs), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return b;
  }
  function getNoise() {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  function send(g, rev) {
    if (!rev) return;
    const s = ac.createGain(); s.gain.value = rev; g.connect(s); s.connect(reverb);
  }
  function tone(type, f0, f1, dur, vol, delay = 0, rev = 0) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); send(g, rev);
    o.start(t); o.stop(t + dur + 0.02);
  }
  // Filtered noise burst. f1 (optional) sweeps the filter for whooshes.
  function noise(dur, vol, freq, delay = 0, type = 'lowpass', rev = 0, f1 = 0) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + delay;
    const s = a.createBufferSource(); s.buffer = getNoise();
    const f = a.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); send(g, rev);
    s.start(t); s.stop(t + dur);
  }
  // Bob's voice: f0->f1 over dur, with a wobble of `wob` Hz at `rate` Hz.
  function gross(f0, f1, dur, wob, rate, vol = 0.35, delay = 0) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + delay;
    vol = Math.min(0.7, vol * BOB_VOL);
    const o = a.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f1, t + dur);
    const lfo = a.createOscillator(); lfo.frequency.value = rate;
    const lg = a.createGain(); lg.gain.value = wob;
    lfo.connect(lg); lg.connect(o.frequency);
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 850; f.Q.value = 7;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(master); send(g, 0.15);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }

  const BOB = {
    'BLORP!':          () => gross(180, 60, 0.35, 30, 18),
    'GLRRRK':          () => gross(120, 90, 0.6, 40, 35),
    'HNNNNGH':         () => gross(140, 175, 0.8, 10, 8, 0.3),
    'HRRRNNGH!':       () => gross(110, 160, 0.6, 18, 12, 0.35),
    'MWAAAP!':         () => { gross(90, 220, 0.3, 5, 4); gross(220, 80, 0.3, 5, 4, 0.3, 0.3); },
    'SKRONK!':         () => { gross(300, 150, 0.15, 60, 40); gross(250, 120, 0.2, 60, 40, 0.35, 0.18); },
    'PFFFBBT':         () => { noise(0.5, 0.4, 600); gross(70, 60, 0.5, 30, 50, 0.25); },
    'BUUUURRRP!':      () => gross(95, 55, 1.1, 25, 22, 0.45),
    'SNRRRK':          () => { noise(0.4, 0.3, 2500, 0, 'bandpass'); gross(200, 260, 0.4, 50, 30, 0.15); },
    'BWAMP':           () => gross(110, 105, 0.4, 3, 3, 0.4),
    'HEH HEH HUH':     () => { for (let i = 0; i < 3; i++) gross(160 - i * 15, 130 - i * 15, 0.14, 8, 10, 0.3, i * 0.2); },
    'BLUBBA BLUB':     () => { for (let i = 0; i < 3; i++) gross(130 + i * 20, 100 + i * 20, 0.12, 30, 25, 0.35, i * 0.14); },
    'HURRK':           () => gross(220, 90, 0.3, 50, 30),
    'NYEHHH':          () => gross(260, 230, 0.7, 12, 7, 0.3),
    'BRAAAP!':         () => { noise(0.4, 0.3, 500); gross(80, 70, 0.6, 35, 45, 0.4); },
    'WOOOBLE':         () => gross(150, 150, 0.8, 60, 6, 0.35),
    'SCHLORP':         () => { noise(0.3, 0.3, 1200, 0, 'bandpass'); gross(190, 70, 0.4, 25, 20, 0.3); },
    'HONK!':           () => { gross(330, 320, 0.2, 4, 3, 0.4); gross(330, 300, 0.25, 4, 3, 0.4, 0.25); },
    'MMMBRRR':         () => gross(100, 95, 0.9, 20, 28, 0.3),
    'FWEEEE!':         () => { tone('triangle', 900, 1400, 0.5, 0.1); gross(300, 420, 0.5, 15, 9, 0.2); },
    'GURGLE GURGLE':   () => gross(120, 140, 0.7, 70, 13, 0.35),
    'HUP HUP!':        () => { gross(200, 150, 0.12, 10, 10, 0.3); gross(210, 150, 0.12, 10, 10, 0.3, 0.2); },
    'SPLOOORT!':       () => { noise(0.6, 0.35, 900); gross(160, 70, 0.5, 40, 25, 0.25); },
    'BZZZ! MY BABIES!':() => { tone('sawtooth', 220, 230, 0.6, 0.08); gross(130, 180, 0.7, 20, 14, 0.25, 0.1); },
    "THIS AIN'T OVER!":() => { gross(150, 120, 0.25, 15, 8); gross(170, 90, 0.5, 15, 8, 0.35, 0.3); },
    "NOW BOB'S MAD!":  () => gross(90, 200, 0.9, 35, 16, 0.45),
    'NOOOOOOO...':     () => gross(220, 50, 2.2, 20, 6, 0.4),
    'OOF!':            () => gross(160, 90, 0.18, 10, 10, 0.3),
    'OWIE!':           () => gross(260, 180, 0.3, 30, 20, 0.3),
    'MY BELLY!':       () => gross(140, 100, 0.5, 40, 12, 0.3),
  };

  const ding = () => tone('square', 1320, 1320, 0.05, 0.03, 0.04);
  const KILL = {
    blob:       () => { noise(0.25, 0.3, 700); tone('sine', 260, 60, 0.25, 0.2); },
    fly:        () => tone('square', 900, 150, 0.12, 0.08),
    bird:       () => { tone('sine', 2000, 3200, 0.08, 0.08); tone('sine', 2400, 1600, 0.1, 0.06, 0.08); },
    goon:       () => gross(150, 80, 0.3, 15, 12, 0.25),
    meatball:   () => { noise(0.2, 0.3, 400); tone('sine', 140, 50, 0.2, 0.25); },
    gator:      () => { noise(0.1, 0.3, 1500); gross(90, 60, 0.5, 20, 8, 0.25, 0.08); },
    tumbleweed: () => { for (let i = 0; i < 3; i++) noise(0.05, 0.2, 3000, i * 0.05, 'bandpass'); },
    rat:        () => { tone('sine', 2200, 3000, 0.07, 0.07); tone('sine', 2800, 1800, 0.1, 0.06, 0.07); },
    raccoon:    () => { tone('sine', 1500, 2400, 0.1, 0.07); tone('sine', 2000, 1200, 0.12, 0.06, 0.1); },
    goose:      () => { tone('sawtooth', 500, 250, 0.3, 0.09); },
    hog:        () => { gross(220, 120, 0.4, 40, 30, 0.3); },
    skunk:      () => { noise(0.4, 0.3, 600); tone('sine', 200, 90, 0.3, 0.1); },
    snake:      () => { noise(0.3, 0.2, 5000, 0, 'highpass'); tone('sine', 300, 100, 0.2, 0.08); },
    chicken:    () => { tone('square', 900, 400, 0.12, 0.06); tone('square', 1000, 600, 0.1, 0.05, 0.1); },
    fireworks:  () => gross(150, 80, 0.3, 15, 12, 0.25),
    bowler:     () => gross(130, 70, 0.35, 15, 12, 0.25),
    balloon:    () => { noise(0.15, 0.3, 2500, 0, 'bandpass'); gross(200, 90, 0.4, 30, 12, 0.2, 0.1); },
    banjo:      () => { tone('triangle', 600, 200, 0.4, 0.08); gross(150, 90, 0.3, 15, 12, 0.2); },
  };

  let lastMg = 0, lastFlame = 0, lastStep = 0, lastLmg = 0;
  const limit = (last, ms) => performance.now() - last >= ms;
  return {
    unlock() { unlocked = true; return ctx(); },
    context: ctx, // used by music.js (null until the player has pressed something)
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.5; return muted; },
    get muted() { return muted; },
    // For sounds defined in other files: SFX.raw.tone/noise/gross, and SFX.addKill({ type: () => ... }).
    raw: { tone, noise, gross },
    addKill(map) { Object.assign(KILL, map); },
    clink() { tone('square', 1800, 1500, 0.05, 0.05); tone('sine', 3200, 2900, 0.12, 0.04, 0.01); }, // shot bounces off a shield

    // ---- Guns ----
    casing(d = 0.22) { const f = 3000 + Math.random() * 1500; tone('sine', f, f * 0.9, 0.05, 0.035, d); tone('sine', f * 1.1, f, 0.05, 0.022, d + 0.09); },
    click(d = 0) { noise(0.03, 0.3, 2500, d, 'bandpass'); tone('square', 500, 300, 0.03, 0.06, d); },
    pistol() { noise(0.05, 0.35, 4000, 0, 'highpass', 0.3); tone('triangle', 260, 70, 0.12, 0.25); noise(0.18, 0.12, 900, 0.02, 'lowpass', 0.4); this.casing(); },
    rifle() {
      noise(0.06, 0.5, 3500, 0, 'highpass', 0.5); tone('sine', 140, 40, 0.3, 0.45);
      noise(0.4, 0.25, 700, 0.01, 'lowpass', 0.6); noise(0.3, 0.08, 500, 0.18, 'lowpass', 0.5);
      this.click(0.3); this.casing(0.4);
    },
    mg() {
      if (!limit(lastMg, 45)) return; lastMg = performance.now();
      noise(0.04, 0.3, 3000, 0, 'highpass', 0.2); tone('triangle', 200, 60, 0.07, 0.22); noise(0.08, 0.12, 800, 0.01);
      if (Math.random() < 0.3) this.casing(0.15);
    },
    shotgun() {
      noise(0.08, 0.6, 2500, 0, 'highpass', 0.5); tone('sine', 110, 35, 0.4, 0.55); noise(0.5, 0.35, 600, 0.01, 'lowpass', 0.7);
      this.click(0.32); this.click(0.44); this.casing(0.5); // chk-chk!
    },
    br() { // .308: deep, heavy crack
      noise(0.06, 0.55, 3200, 0, 'highpass', 0.5); tone('sine', 120, 38, 0.32, 0.5);
      noise(0.35, 0.28, 650, 0.01, 'lowpass', 0.6); this.casing(0.3);
    },
    gl() { tone('sine', 220, 60, 0.18, 0.45); noise(0.12, 0.3, 500, 0, 'lowpass', 0.3); tone('triangle', 400, 900, 0.15, 0.03, 0.05); }, // thoonk!
    lmg() {
      if (!limit(lastLmg, 55)) return; lastLmg = performance.now();
      noise(0.05, 0.38, 2600, 0, 'highpass', 0.3); tone('triangle', 160, 45, 0.09, 0.3); noise(0.1, 0.16, 700, 0.01);
      if (Math.random() < 0.4) this.casing(0.12);
    },
    rocket() { noise(0.12, 0.3, 1500, 0, 'bandpass', 0.3); noise(0.7, 0.25, 400, 0.03, 'bandpass', 0.3, 2500); tone('sawtooth', 90, 300, 0.5, 0.05); },
    flame() {
      if (!limit(lastFlame, 80)) return; lastFlame = performance.now();
      noise(0.18, 0.2, 500, 0, 'lowpass', 0.2); noise(0.1, 0.05, 3000, 0, 'bandpass');
    },
    boom() {
      noise(1.0, 0.6, 300, 0, 'lowpass', 0.8); tone('sine', 90, 25, 0.8, 0.5); noise(0.3, 0.3, 2000, 0, 'bandpass', 0.4);
      for (let i = 0; i < 3; i++) tone('triangle', 1400 + Math.random() * 800, 900, 0.05, 0.03, 0.25 + i * 0.12);
    },

    // ---- Moving around ----
    step() { if (!limit(lastStep, 120)) return; lastStep = performance.now(); noise(0.04, 0.07, 600); },
    land() { noise(0.08, 0.15, 400); tone('sine', 120, 60, 0.08, 0.12); },
    jump() { tone('square', 280, 560, 0.12, 0.05); noise(0.05, 0.05, 1500); },
    bobStep() { tone('sine', 70, 35, 0.18, 0.3); noise(0.12, 0.12, 200); },

    // ---- Enemies ----
    buzz() { tone('sawtooth', 210 + Math.random() * 30, 200, 0.3, 0.035); },
    squish() { noise(0.1, 0.1, 900); tone('sine', 300, 120, 0.1, 0.06); },
    ratSqueak() { tone('sine', 2400, 3000, 0.05, 0.035); },
    honk() { tone('sawtooth', 420, 380, 0.18, 0.08); tone('sawtooth', 430, 360, 0.2, 0.08, 0.2); },
    oink() { gross(260, 180, 0.2, 40, 30, 0.2); gross(240, 160, 0.25, 40, 30, 0.2, 0.22); },
    hiss() { noise(0.5, 0.15, 5000, 0, 'highpass'); },
    cluck() { tone('square', 700, 500, 0.05, 0.04); tone('square', 800, 550, 0.06, 0.04, 0.08); },
    whistle() { tone('sine', 900, 2400, 0.6, 0.05); noise(0.6, 0.06, 3000, 0, 'bandpass'); },
    roll() { noise(1.2, 0.12, 180); tone('sine', 60, 50, 1.0, 0.08); },
    pluck() { tone('triangle', 440 + Math.random() * 300, 430, 0.25, 0.06); },
    splash() { noise(0.3, 0.25, 1500, 0, 'bandpass'); },
    grunt() { gross(170, 120, 0.15, 10, 8, 0.15); },
    kill(type) { (KILL[type] || KILL.blob)(); ding(); },

    // ---- Everything else ----
    pop() { noise(0.2, 0.25, 800); },
    chomp() { noise(0.1, 0.3, 1500); tone('square', 200, 80, 0.1, 0.1); },
    squeak() { tone('square', 1300, 1900, 0.08, 0.05); tone('square', 1900, 1200, 0.12, 0.05, 0.08); },
    throwIt() { tone('triangle', 500, 900, 0.12, 0.08); noise(0.15, 0.06, 1200, 0, 'bandpass', 0, 3000); },
    hurt() { tone('square', 300, 90, 0.25, 0.12); noise(0.1, 0.15, 1000); },
    hit() { tone('square', 1200, 600, 0.04, 0.04); noise(0.03, 0.08, 2500, 0, 'highpass'); },
    splat() { noise(0.25, 0.25, 700); tone('sine', 220, 60, 0.2, 0.15); },
    squirt() { noise(0.12, 0.1, 1200, 0, 'bandpass'); },
    pickup() { tone('square', 660, 660, 0.07, 0.07); tone('square', 990, 990, 0.1, 0.07, 0.07); tone('square', 1320, 1320, 0.12, 0.05, 0.14); },
    select() { tone('square', 520, 780, 0.08, 0.06); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone('square', f, f, 0.18, 0.07, i * 0.14, 0.3)); },
    sad() { [392, 349, 311, 262].forEach((f, i) => tone('triangle', f, f * 0.98, 0.3, 0.1, i * 0.25)); },
    bob(word) { (BOB[word] || BOB['BLORP!'])(); },
  };
})();
