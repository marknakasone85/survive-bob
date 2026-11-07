'use strict';
// Background music, synthesized live (no audio files), like the sound effects.
//
// A song is a set of tracks. Each track is a string of steps (16 per bar):
//   '.'          rest
//   'C4'         a note        'C4+E4+G4'  a chord
//   'x' / 'X'    a drum hit / louder drum hit
//   'G4:4'       hold the note for 4 steps
// Tracks loop on their own length, so a 1-bar drum beat can sit under a 4-bar tune.

const Music = (() => {
  let ac = null, out = null, noiseBuf = null;
  let song = null, songName = null, step = 0, nextT = 0, paused = false, tempo = 1, enabled = true, lastVol = -1;
  const VOL = 0.22;

  // ---- Notes ----
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n);
    if (!m) throw new Error('Bad note: ' + n);
    const midi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function parse(str, defLen) {
    return str.trim().split(/\s+/).map(tok => {
      if (tok === '.') return null;
      const [body, len] = tok.split(':');
      const l = Number(len) || defLen || 1;
      if (body === 'x' || body === 'X') return { freqs: [0], len: l, acc: body === 'X' ? 1.5 : 1 };
      return { freqs: body.split('+').map(freq), len: l, acc: 1 };
    });
  }

  // ---- Instruments ----
  function env(t, peak, attack, hold, release) {
    const n = ac.createGain();
    n.gain.setValueAtTime(0.0001, t);
    n.gain.exponentialRampToValueAtTime(peak, t + attack);
    if (hold > 0) n.gain.setValueAtTime(peak, t + attack + hold);
    n.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    n.connect(out);
    return n;
  }
  function osc(type, f, t, end, dest, detune = 0) {
    const o = ac.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(end + 0.05);
    return o;
  }
  function filt(type, f, dest, q = 1) {
    const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest);
    return b;
  }
  function vibrato(o, t, end, rate, cents) {
    const l = ac.createOscillator(); l.frequency.value = rate;
    const g = ac.createGain(); g.gain.value = cents;
    l.connect(g); g.connect(o.detune); l.start(t); l.stop(end + 0.05);
  }
  function noise(t, dur, dest) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.connect(dest); s.start(t); s.stop(t + dur);
  }
  function makeNoise(a) {
    const b = a.createBuffer(1, a.sampleRate, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  const hold = (d, cut) => Math.max(0, d - cut);

  const INST = {
    pluck(t, f, d, v) { const e = env(t, v, 0.004, 0, 0.4); const lp = filt('lowpass', f * 5, e); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.35); osc('sawtooth', f, t, t + 0.45, lp); },
    banjo(t, f, d, v) { const e = env(t, v, 0.002, 0, 0.22); const lp = filt('lowpass', f * 8, e); osc('square', f, t, t + 0.25, lp); osc('triangle', f * 2, t, t + 0.25, lp); },
    twang(t, f, d, v) { const e = env(t, v, 0.004, 0, 0.6); const o = osc('sawtooth', f * 0.94, t, t + 0.65, filt('lowpass', 2200, e, 3)); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); },
    bass(t, f, d, v) { const e = env(t, v, 0.008, hold(d, 0.1), 0.12); osc('triangle', f, t, t + d + 0.15, e); osc('sine', f, t, t + d + 0.15, e); },
    tuba(t, f, d, v) { const e = env(t, v, 0.02, d * 0.5, 0.12); osc('square', f, t, t + d + 0.2, filt('lowpass', 500, e)); },
    lead(t, f, d, v) { const e = env(t, v, 0.01, hold(d, 0.06), 0.06); vibrato(osc('square', f, t, t + d + 0.1, filt('lowpass', 3000, e)), t, t + d, 5.5, 12); },
    fiddle(t, f, d, v) { const e = env(t, v, 0.04, hold(d, 0.08), 0.08); vibrato(osc('sawtooth', f, t, t + d + 0.1, filt('lowpass', 2600, e)), t, t + d, 6, 18); },
    whistle(t, f, d, v) { const e = env(t, v, 0.06, hold(d, 0.12), 0.15); vibrato(osc('sine', f, t, t + d + 0.2, e), t, t + d, 5, 20); },
    accordion(t, f, d, v) { const e = env(t, v, 0.03, hold(d, 0.06), 0.06); const lp = filt('lowpass', 1800, e); osc('square', f, t, t + d + 0.1, lp, -8); osc('sawtooth', f, t, t + d + 0.1, lp, 8); },
    synth(t, f, d, v) { const e = env(t, v, 0.005, hold(d, 0.05), 0.1); const lp = filt('lowpass', f * 10, e, 6); lp.frequency.exponentialRampToValueAtTime(f * 2, t + 0.2); osc('sawtooth', f, t, t + d + 0.15, lp); osc('sawtooth', f, t, t + d + 0.15, lp, 10); },
    stab(t, f, d, v) { const e = env(t, v, 0.004, 0.04, 0.12); osc('square', f, t, t + 0.2, filt('lowpass', 2200, e)); },
    kick(t, f, d, v) { const e = env(t, v, 0.002, 0, 0.22); const o = osc('sine', 150, t, t + 0.25, e); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); },
    snare(t, f, d, v) { noise(t, 0.16, filt('bandpass', 1800, env(t, v, 0.002, 0, 0.14), 0.7)); osc('triangle', 190, t, t + 0.08, env(t, v * 0.6, 0.002, 0, 0.06)); },
    hat(t, f, d, v) { noise(t, 0.05, filt('highpass', 7000, env(t, v, 0.001, 0, 0.035))); },
    ohat(t, f, d, v) { noise(t, 0.2, filt('highpass', 6000, env(t, v, 0.002, 0, 0.16))); },
    clap(t, f, d, v) { for (let i = 0; i < 3; i++) { const s = t + i * 0.012; noise(s, 0.1, filt('bandpass', 1300, env(s, v, 0.001, 0, 0.08))); } },
    block(t, f, d, v) { osc('sine', f || 900, t, t + 0.07, env(t, v, 0.001, 0, 0.05)); },
    // World-tour instruments.
    koto(t, f, d, v) { const e = env(t, v, 0.002, 0, 0.7); const lp = filt('lowpass', f * 6, e, 2); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.5); osc('triangle', f, t, t + 0.75, lp); osc('square', f * 2, t, t + 0.2, env(t, v * 0.25, 0.002, 0, 0.12)); },
    taiko(t, f, d, v) { const o = osc('sine', 110, t, t + 0.55, env(t, v, 0.003, 0, 0.5)); o.frequency.exponentialRampToValueAtTime(48, t + 0.3); noise(t, 0.08, filt('lowpass', 600, env(t, v * 0.6, 0.002, 0, 0.07))); },
    conga(t, f, d, v) { const g = f || 260; const o = osc('sine', g * 1.15, t, t + 0.2, env(t, v, 0.002, 0, 0.18)); o.frequency.exponentialRampToValueAtTime(g, t + 0.05); },
    shaker(t, f, d, v) { noise(t, 0.07, filt('bandpass', 5000, env(t, v, 0.01, 0, 0.05), 1.5)); },
    flute(t, f, d, v) { vibrato(osc('sine', f, t, t + d + 0.25, env(t, v, 0.08, hold(d, 0.1), 0.12)), t, t + d, 4.5, 14); noise(t, Math.min(d, 0.9) + 0.1, filt('bandpass', f * 2, env(t, v * 0.15, 0.05, hold(d, 0.1), 0.1), 4)); },
    didge(t, f, d, v) { const lp = filt('lowpass', 300, env(t, v, 0.05, hold(d, 0.1), 0.15), 8); const l = ac.createOscillator(); l.frequency.value = 3; const g = ac.createGain(); g.gain.value = 180; l.connect(g); g.connect(lp.frequency); l.start(t); l.stop(t + d + 0.3); osc('sawtooth', f, t, t + d + 0.3, lp); },
    marimba(t, f, d, v) { osc('sine', f, t, t + 0.4, env(t, v, 0.002, 0, 0.35)); osc('sine', f * 4, t, t + 0.1, env(t, v * 0.3, 0.001, 0, 0.06)); },
    brass(t, f, d, v) { const lp = filt('lowpass', f * 1.5, env(t, v, 0.03, hold(d, 0.08), 0.1), 2); lp.frequency.exponentialRampToValueAtTime(f * 6, t + 0.08); osc('sawtooth', f, t, t + d + 0.15, lp); osc('sawtooth', f, t, t + d + 0.15, lp, 7); },
    bell(t, f, d, v) { osc('sine', f, t, t + 1.5, env(t, v, 0.002, 0, 1.4)); osc('sine', f * 2.76, t, t + 0.6, env(t, v * 0.35, 0.002, 0, 0.5)); osc('sine', f * 5.4, t, t + 0.3, env(t, v * 0.15, 0.002, 0, 0.2)); },
    organ(t, f, d, v) { const e = env(t, v, 0.01, hold(d, 0.05), 0.08); osc('sine', f, t, t + d + 0.1, e); osc('sine', f * 2, t, t + d + 0.1, e); osc('square', f * 3, t, t + d + 0.1, filt('lowpass', 2000, env(t, v * 0.2, 0.01, hold(d, 0.05), 0.08))); },
    theremin(t, f, d, v) { const o = osc('sine', f * 0.97, t, t + d + 0.3, env(t, v, 0.08, hold(d, 0.1), 0.2)); o.frequency.exponentialRampToValueAtTime(f, t + 0.12); vibrato(o, t, t + d + 0.3, 6.5, 30); },
  };

  // ---- Little helpers for writing songs ----
  const bars = (...b) => b.join(' ');
  const off = c => `. . ${c} . . . ${c} . . . ${c} . . . ${c} .`;           // chord on the off-beats
  const two4 = c => `. . . . ${c} . . . . . . . ${c} . . .`;                   // chord on beats 2 and 4
  const roll = (a, b, c, d) => { const h = `${a} ${b} ${c} ${a} ${b} ${c} ${a} ${d}`; return `${h} ${h}`; }; // banjo roll
  const T = (inst, vol, notes, len) => ({ inst, vol, notes, len });

  const SONGS = {
    // Sneaky villain theme for the title screen.
    title: { bpm: 112, tracks: [
      T('tuba', 0.45, bars('C2 . . . G2 . . . C2 . . . G2 . . .', 'C2 . . . G2 . . . C2 . . . G2 . . .', 'Ab1 . . . Eb2 . . . Ab1 . . . Eb2 . . .', 'G1 . . . D2 . . . G1 . . . B1 . . .'), 3),
      T('pluck', 0.08, bars(two4('C4+Eb4+G4'), two4('C4+Eb4+G4'), two4('Ab3+C4+Eb4'), two4('G3+B3+D4'))),
      T('lead', 0.11, bars('G4 . C5 . Eb5 . D5 C5 . . G4:4 . . . . .', 'G4 . C5 . Eb5 . F5 Eb5 D5:4 . . . . . . .', 'Ab4 . C5 . Eb5 . Ab5 . G5 . F5 . Eb5:2 . . .', 'D5:3 . . . B4:3 . . . G4:6 . . . . . . .')),
      T('kick', 0.35, 'x . . . . . . . x . . . . . . .'),
      T('hat', 0.04, '. . x . . . x . . . x . . . x .'),
    ] },
    // Level 1: banjo bluegrass.
    holler: { bpm: 150, tracks: [
      T('banjo', 0.1, bars(roll('G3', 'B3', 'D4', 'G4'), roll('G3', 'B3', 'D4', 'G4'), roll('C4', 'E4', 'G4', 'C5'), roll('D4', 'F#4', 'A4', 'D5'))),
      T('bass', 0.3, bars('G2 . . . . . . . D2 . . . . . . .', 'G2 . . . . . . . D2 . . . . . . .', 'C2 . . . . . . . G2 . . . . . . .', 'D2 . . . . . . . A2 . . . . . . .'), 3),
      T('fiddle', 0.1, bars('D5 . B4 . G4 . B4 . D5 . E5 . D5 . B4 .', 'G5:3 . . . E5 . D5 . B4 . A4 . G4:3 . . .', 'E5 . G5 . E5 . C5 . E5 . D5 . C5:3 . . .', 'D5 . F#5 . A5 . F#5 . D5 . C5 . B4 . A4 .'), 2),
      T('block', 0.05, '. . . . A5 . . . . . . . A5 . . .'),
    ] },
    // Level 2: country shuffle.
    trailer: { bpm: 116, tracks: [
      T('bass', 0.3, bars('E2 . . . B1 . . . E2 . . . G#2 . . .', 'A1 . . . E2 . . . A2 . . . C#3 . . .', 'B1 . . . F#2 . . . B2 . . . A2 . . .', 'E2:3 . . . B1:3 . . . E2 . G#2 . B2:2 . . .'), 3),
      T('pluck', 0.07, bars(off('E3+G#3+B3'), off('A3+C#4+E4'), off('B3+D#4+F#4'), off('E3+G#3+B3'))),
      T('twang', 0.12, bars('B4:2 . . G#4:2 . . E4 . F#4 . G#4 . B4:3 . . .', 'C#5:2 . . A4:2 . . E4 . F#4 . A4 . C#5 . B4 .', 'D#5:2 . . B4:2 . . F#4 . A4:3 . . . F#4 . D#4 .', 'E4 . G#4 . B4 . E5:6 . . . . . . . . .')),
      T('kick', 0.35, 'x . . . . . . . x . . . . . . .'),
      T('snare', 0.12, '. . . . x . . . . . . . x . . .'),
      T('hat', 0.035, 'x . x . x . x . x . x . x . x .'),
    ] },
    // Level 3: swampy zydeco.
    bayou: { bpm: 104, tracks: [
      T('bass', 0.3, bars('A1:2 . . A2 . . E2 . A1:2 . . A2 . . G2 .', 'D2:2 . . D3 . . A2 . D2:2 . . D3 . . C3 .', 'A1:2 . . A2 . . E2 . A1:2 . . A2 . . G2 .', 'E2:2 . . E3 . . B2 . E2:2 . . D3 . . B2 .')),
      T('accordion', 0.06, bars(off('A3+C#4+G4:2'), off('D4+F#4+C5:2'), off('A3+C#4+G4:2'), off('E3+G#3+D4:2'))),
      T('accordion', 0.09, bars('E5:2 . . C5 . A4:2 . . C5 . D5 . D#5 . E5 .', 'F#5 . E5 . D5 . C5 . A4:6 . . . . . . .', 'E5 . G5 . E5 . C5 . A4 . C5 . A4 . G4 .', 'G#4 . B4 . D5:3 . . . E5:6 . . . . . . .'), 2),
      T('hat', 0.04, 'x x X x x x X x x x X x x x X x'),
      T('kick', 0.3, 'x . . . . . . . x . . . . . . .'),
    ] },
    // Level 4: spaghetti western.
    route66: { bpm: 92, tracks: [
      T('bass', 0.3, bars('D2:5 . . . . . A1 . D2:5 . . . . . A1 .', 'D2:5 . . . . . A1 . D2:5 . . . . . A1 .', 'C2:5 . . . . . G1 . C2:5 . . . . . G1 .', 'A1:5 . . . . . E2 . A1:3 . . . C#2 . E2 .')),
      T('twang', 0.08, bars('D3 . A3 . D4 . F4 . A4 . F4 . D4 . A3 .', 'D3 . A3 . D4 . F4 . A4 . F4 . D4 . A3 .', 'C3 . G3 . C4 . E4 . G4 . E4 . C4 . G3 .', 'A2 . E3 . A3 . C#4 . E4 . C#4 . A3 . E3 .')),
      T('whistle', 0.12, bars('A4:4 . . . D5:12 . . . . . . . . . . .', 'F5:2 . E5:2 . D5:4 . . . A4:8 . . . . . . .', 'G4:4 . . . C5:4 . . . E5:4 . . . G5:4 . . .', 'E5:8 . . . . . . . C#5:4 . . . A4:4 . . .')),
      T('block', 0.06, 'A5 . . E5 . . . . A5 . . E5 . . . .'),
    ] },
    // Level 5: back-alley disco (Bob has a disco ball, after all).
    alley: { bpm: 116, tracks: [
      T('kick', 0.45, 'x . . . x . . . x . . . x . . .'),
      T('clap', 0.14, '. . . . x . . . . . . . x . . .'),
      T('ohat', 0.05, '. . x . . . x . . . x . . . x .'),
      T('bass', 0.28, bars('E2 . E3 . E2 . E3 . E2 . E3 . D3 . E3 .', 'E2 . E3 . E2 . E3 . G2 . G3 . A2 . A3 .', 'A2 . A3 . A2 . A3 . A2 . A3 . G2 . A3 .', 'B1 . B2 . B1 . B2 . D#2 . D#3 . F#2 . F#3 .')),
      T('stab', 0.06, bars('. . . . . . E4+G4+B4 . . . . . . . E4+G4+B4 .', '. . . . . . E4+G4+B4 . . . . . . . E4+G4+B4 .', '. . . . . . A4+C5+E5 . . . . . . . A4+C5+E5 .', '. . . . . . B3+D#4+F#4 . . . . . . . B3+D#4+F#4 .')),
      T('synth', 0.07, bars('B4:2 . . E5:2 . . G5 . F#5 . E5 . D5 . E5 .', 'B4:2 . . E5:2 . . G5 . A5 . G5 . F#5:3 . . .', 'C5:2 . . E5:2 . . A5 . G5 . E5 . C5 . E5 .', 'D#5 . F#5 . B5 . A5 . F#5 . D#5 . B4:4 . . .')),
    ] },
    // Level 6: frantic kitchen polka.
    kitchen: { bpm: 168, tracks: [
      T('tuba', 0.4, bars('F2:2 . . . C2:2 . . . F2:2 . . . C2:2 . . .', 'C2:2 . . . G1:2 . . . C2:2 . . . G1:2 . . .', 'C2:2 . . . G1:2 . . . C2:2 . . . G1:2 . . .', 'F2:2 . . . C2:2 . . . F2:2 . A2 . C3 . . .')),
      T('accordion', 0.05, bars(off('F3+A3+C4'), off('E3+Bb3+C4'), off('E3+Bb3+C4'), off('F3+A3+C4'))),
      T('lead', 0.1, bars('C5 . A4 . C5 . F5 . E5 . D5 . C5 . A4 .', 'G4 . Bb4 . D5 . G5 . F5 . E5 . D5 . C5 .', 'E5 . G5 . C6 . G5 . E5 . C5 . Bb4 . G4 .', 'A4 . C5 . F5:2 . . F5 F5 . . . F5:3 . . .')),
      T('snare', 0.08, '. . x . . . x . . . x . . . x .'),
    ] },
    // Boss fight (tempo goes up in later levels and when Bob gets mad).
    boss: { bpm: 140, tracks: [
      T('kick', 0.45, 'x . . . x . . . x . . . x . x .'),
      T('snare', 0.18, '. . . . x . . . . . . . x . . .'),
      T('hat', 0.03, 'x x x x x x x x x x x x x x x x'),
      T('bass', 0.28, bars('E2 . E2 . E2 . E2 . E2 . E2 . F2 . E2 .', 'E2 . E2 . E2 . E2 . E2 . E2 . F2 . E2 .', 'C2 . C2 . C2 . C2 . D2 . D2 . D2 . D2 .', 'E2 . E2 . E2 . E2 . B1 . B1 . D2 . D#2 .')),
      T('stab', 0.06, bars('E4+G4+B4 . . . . . E4+G4+B4 . . . . . F4+A4+C5 . . .', 'E4+G4+B4 . . . . . E4+G4+B4 . . . . . F4+A4+C5 . . .', 'C4+E4+G4 . . . . . C4+E4+G4 . . . . . D4+F#4+A4 . . .', 'E4+G4+B4 . . . . . E4+G4+B4 . . . . . B3+D#4+F#4 . . .')),
      T('synth', 0.07, bars('E5:4 . . . G5:4 . . . F#5:2 . E5:2 . D5:2 . E5:2 .', 'B4:8 . . . . . . . F5:2 . E5:2 . D5:4 . . .', 'C5:4 . . . E5:4 . . . G5:4 . . . A5:2 . G5:2 .', 'F#5:4 . . . D#5:4 . . . B4:8 . . . . . . .')),
    ] },
    // You survived Bob!
    win: { bpm: 126, tracks: [
      T('bass', 0.28, bars('C2:2 . G2:2 . C3:2 . G2:2 . C2:2 . G2:2 . C3:2 . G2:2 .', 'F2:2 . C3:2 . F3:2 . C3:2 . F2:2 . C3:2 . F3:2 . C3:2 .', 'G2:2 . D3:2 . G3:2 . D3:2 . G2:2 . D3:2 . G3:2 . D3:2 .', 'C2:2 . G2:2 . C3:2 . G2:2 . C2:2 . G2:2 . C3:2 . G2:2 .')),
      T('pluck', 0.07, bars(off('C4+E4+G4'), off('F4+A4+C5'), off('G3+B3+D4'), off('C4+E4+G4'))),
      T('lead', 0.1, bars('C5 . E5 . G5 . C6:4 . . . G5 . E5 . G5 .', 'A5 . F5 . C5 . F5:4 . . . A5 . C6 . A5 .', 'B5 . G5 . D5 . G5:4 . . . B5 . D6 . B5 .', 'C6:8 . . . . . . . G5 . E5 . C5:4 . . .')),
      T('kick', 0.35, 'x . . . x . . . x . . . x . . .'),
      T('hat', 0.04, '. . x . . . x . . . x . . . x .'),
    ] },
    // Junkyard: chunky garage rock.
    junkyard: { bpm: 132, tracks: [
      T('kick', 0.45, 'x . . . . . x . x . . . . . . .'),
      T('snare', 0.16, '. . . . x . . . . . . . x . . .'),
      T('hat', 0.03, 'x . x . x . x . x . x . x . x .'),
      T('bass', 0.28, bars('E2 E2 . E2 . E2 G2 . E2 E2 . E2 . D2 E2 .', 'C2 C2 . C2 . C2 E2 . D2 D2 . D2 . F#2 D2 .')),
      T('stab', 0.06, bars('E3+B3 . . E3+B3 . . G3+D4 . E3+B3 . . E3+B3 . . D3+A3 .', 'C3+G3 . . C3+G3 . . E3+B3 . D3+A3 . . D3+A3 . . F#3+C#4 .')),
      T('synth', 0.06, bars('E5:2 . G5:2 . A5:4 . . . B5:2 . A5:2 . G5:4 . . .', 'E5:2 . D5:2 . C5:4 . . . D5:4 . . . B4:4 . . .')),
    ] },
    // County fair: a calliope waltz (12 steps = one 3/4 bar).
    fair: { bpm: 160, tracks: [
      T('tuba', 0.38, bars('C2:3 . . . . . . . . . . .', 'G1:3 . . . . . . . . . . .', 'G1:3 . . . . . . . . . . .', 'C2:3 . . . . . . . . . . .')),
      T('stab', 0.05, bars('. . . . C4+E4+G4 . . . C4+E4+G4 . . .', '. . . . B3+D4+G4 . . . B3+D4+G4 . . .', '. . . . B3+D4+G4 . . . B3+D4+G4 . . .', '. . . . C4+E4+G4 . . . C4+E4+G4 . . .')),
      T('lead', 0.09, bars('E5:4 . . . G5:4 . . . E5:4 . . .', 'D5:4 . . . F5:4 . . . D5:4 . . .', 'B4:4 . . . D5:4 . . . G5:4 . . .', 'C5:8 . . . . . . . E5:2 . D5:2 .')),
    ] },
    // Mud bog: stomping southern rock.
    mudbog: { bpm: 124, tracks: [
      T('kick', 0.45, 'x . . . x . x . x . . . x . x .'),
      T('snare', 0.16, '. . . . x . . . . . . . x . . .'),
      T('hat', 0.03, 'x . x . x . x . x . x . x . x .'),
      T('bass', 0.28, bars('A1 . A1 . A2 . A1 . G1 . G1 . G2 . G1 .', 'D2 . D2 . D3 . D2 . E2 . E2 . E3 . E2 .')),
      T('twang', 0.09, bars('A3 . C4 . D4 . D#4 E4 . . C4 . A3 . G3 .', 'D4 . F#4 . A4 . F#4 . E4 . G#4 . B4 . G#4 .')),
      T('synth', 0.05, bars('E5:4 . . . E5:2 . D5:2 . C5:2 . A4:6 . . . . .', 'F#5:4 . . . E5:2 . D5:2 . E5:8 . . . . . . .')),
    ] },
    // Swap meet: jug band with a washboard.
    flea: { bpm: 120, tracks: [
      T('tuba', 0.38, bars('G1:2 . . . D2:2 . . . G1:2 . . . D2:2 . . .', 'C2:2 . . . G1:2 . . . D2:2 . . . A1:2 . . .')),
      T('banjo', 0.08, bars(roll('G3', 'B3', 'D4', 'G4'), roll('C4', 'E4', 'G4', 'C5'))),
      T('fiddle', 0.08, bars('B4 . D5 . G5:2 . F#5 . E5 . D5 . B4:3 . . .', 'C5 . E5 . G5:2 . E5 . D5 . C5 . A4:3 . . .')),
      T('hat', 0.035, 'x x X x x x X x x x X x x x X x'),
    ] },
  };
  for (const s of Object.values(SONGS)) {
    for (const tr of s.tracks) tr.steps = parse(tr.notes, tr.len);
    s.length = Math.max(...s.tracks.map(tr => tr.steps.length));
  }

  // ---- Playback (schedules a little ahead so timing stays tight) ----
  const stepDur = s => 60 / (s.bpm * tempo) / 4;
  function playStep(s, i, t, sd) {
    for (const tr of s.tracks) {
      const n = tr.steps[i % tr.steps.length];
      if (!n) continue;
      for (const f of n.freqs) INST[tr.inst](t, f, n.len * sd, tr.vol * n.acc);
    }
  }
  function ensure() {
    const a = SFX.context();
    if (!a) return null;
    if (!out) {
      ac = a;
      const comp = a.createDynamicsCompressor(); comp.connect(a.destination);
      out = a.createGain(); out.gain.value = VOL; out.connect(comp);
      noiseBuf = makeNoise(a);
    }
    return a;
  }
  function tick() {
    const a = ensure();
    if (!a) return;
    const v = SFX.muted || !enabled ? 0 : VOL;
    if (v !== lastVol) { out.gain.setTargetAtTime(Math.max(v, 0.0001), a.currentTime, 0.05); lastVol = v; }
    if (!song || paused || document.hidden) { nextT = 0; return; }
    if (nextT < a.currentTime) nextT = a.currentTime + 0.05;
    while (nextT < a.currentTime + 0.15) {
      const sd = stepDur(song);
      playStep(song, step % song.length, nextT, sd);
      nextT += sd; step++;
    }
  }
  setInterval(tick, 25);

  return {
    play(name) {
      if (name === songName) return;
      songName = name; song = name ? SONGS[name] : null; step = 0; nextT = 0;
    },
    setPaused(p) { paused = p; },
    setTempo(m) { tempo = m; },
    toggle() { enabled = !enabled; return enabled; },
    get enabled() { return enabled; },
    get current() { return songName; },
    songs: SONGS,
    // Songs from other files: Music.add('name', { bpm, tracks: [T(inst, vol, notes, len), ...] }).
    add(name, s) {
      for (const tr of s.tracks) tr.steps = parse(tr.notes, tr.len);
      s.length = Math.max(...s.tracks.map(tr => tr.steps.length));
      SONGS[name] = s;
    },
    helpers: { T, bars, off, two4, roll },
    // Test helper: renders a song offline and reports how loud it is.
    async render(name, secs = 4) {
      const s = SONGS[name], rate = 22050;
      const offCtx = new OfflineAudioContext(1, rate * secs, rate);
      const saved = [ac, out, noiseBuf];
      ac = offCtx; out = offCtx.createGain(); out.gain.value = VOL; out.connect(offCtx.destination); noiseBuf = makeNoise(offCtx);
      const sd = 60 / s.bpm / 4;
      for (let i = 0, t = 0; t < secs - 0.6; i++, t += sd) playStep(s, i % s.length, t, sd);
      [ac, out, noiseBuf] = saved;
      const d = (await offCtx.startRendering()).getChannelData(0);
      let peak = 0, sum = 0, bad = false;
      for (const x of d) { if (!Number.isFinite(x)) bad = true; peak = Math.max(peak, Math.abs(x)); sum += x * x; }
      return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), bad };
    },
  };
})();
