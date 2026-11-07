// World tour, part 1 (levels 11-15): Bob flees overseas.
// TOKYO, GIZA, PETRA, AMAZON, OUTBACK, each with its own critters, art and music.
(() => {
  'use strict';
  const R = SFX.raw;
  const dirTo = d => Math.sign(d) || 1;
  const pcx = p => p.x + p.w / 2;
  const ecx = e => e.x + e.w / 2;

  // Hidden enemies (buried, vanished, under water) are parked just past the end of the
  // level so bullets, auto-aim and contact damage can't reach them. e.hx keeps their real x.
  function hide(e) { e.hx = e.x; e.x = G.level.length + 100; e.hidden = true; }
  function unhide(e, x) { e.x = x; e.hidden = false; }
  // A hit that also shoves you hard (unless you're Hambone).
  function bigHit(e, p, dmg, kx, ky) {
    const hp0 = p.hp;
    hurtPlayer(dmg, ecx(e));
    if (p.hp < hp0 && p.hero.special !== 'tough') { p.vx = kx; p.vy = ky; }
  }
  function shootAt(kind, sx, sy, tx, ty, speed, extra) {
    const a = Math.atan2(ty - sy, tx - sx);
    const b = Object.assign({ kind, x: sx, y: sy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, g: 0, r: 8, dmg: 1, life: 170, spin: 0.3 }, extra);
    G.ebullets.push(b);
    return b;
  }
  // Highest floor (ground, platform or block top) under x, at or below y.
  function floorBelow(x, y) {
    let best = GROUND_Y;
    for (const s of G.solids) if (x > s.x && x < s.x + s.w && s.y >= y - 2 && s.y < best) best = s.y;
    return best;
  }
  // Keep-your-distance enemies shouldn't back out of a locked arena (Bob fights, Waves mode).
  function stayIn(e) {
    if (!G.arenaLocked || e.hidden) return;
    const a = G.level.arenaX;
    if (e.x < a + 4 && e.vx < 0) { e.x = a + 4; e.vx = 0; }
    else if (e.x + e.w > a + W - 4 && e.vx > 0) { e.x = a + W - 4 - e.w; e.vx = 0; }
  }
  const smoke = (x, y, n = 18) => particles(x, y, n, ['#ced4da', '#adb5bd', '#f1f3f5'], { speed: 3, grav: -0.03, sizeMul: 2 });
  const sand = (x, y, n = 10) => particles(x, y, n, ['#e2b66d', '#c9a15a', '#f3d9a4'], { speed: 3, up: 2 });

  // ---- Shared scenery helpers ----
  function star4(ctx, x, y, r, rot, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, k = i % 2 ? r * 0.35 : r; pts.push(Math.cos(a) * k, Math.sin(a) * k); }
    poly(ctx, pts, col); circle(ctx, 0, 0, r * 0.2, '#212529');
    ctx.restore();
  }
  function palm(ctx, x, y, s, trunk = '#8b5e3c', leaf = '#2f9e44') {
    for (let i = 0; i < 9; i++) { const k = i / 9; ellipse(ctx, x + Math.sin(k * 1.4) * 18 * s, y - 8 * s - k * 118 * s, 7 * s, 8 * s, i % 2 ? trunk : '#7a5230'); }
    const tx = x + Math.sin(1.4) * 18 * s, ty = y - 128 * s;
    for (const a of [0.35, -0.3, -1.2, -1.95, -2.85, 2.8]) {
      const w = a + Math.sin(G.t * 0.02 + x + a) * 0.05;
      ellipse(ctx, tx + Math.cos(w) * 30 * s, ty + Math.sin(w) * 22 * s + 8 * s, 34 * s, 7 * s, leaf, w);
    }
    for (let i = 0; i < 3; i++) circle(ctx, tx - 5 * s + i * 5 * s, ty + 8 * s, 3.5 * s, '#a0522d');
  }
  function gumTree(ctx, x, y, s, trunk, leaf) {
    line(ctx, x, y, x + 6 * s, y - 160 * s, trunk, 12 * s);
    line(ctx, x + 4 * s, y - 110 * s, x - 42 * s, y - 175 * s, trunk, 6 * s);
    line(ctx, x + 6 * s, y - 140 * s, x + 48 * s, y - 195 * s, trunk, 5 * s);
    for (let i = 0; i < 7; i++) circle(ctx, x - 55 * s + hash(i + x) * 115 * s, y - 210 * s + hash(i * 5 + x) * 55 * s, 24 * s, leaf);
  }
  function pyramid(ctx, x, base, h, light, dark) {
    poly(ctx, [x - h * 1.1, base, x, base - h, x + h * 1.1, base], light);
    poly(ctx, [x, base - h, x + h * 1.1, base, x + h * 0.3, base], dark);
  }

  // ===================================================================
  // ENEMIES
  // ===================================================================
  Object.assign(ENEMY_TYPES, {
    // Tokyo
    ninja:    { w: 34, h: 54, hp: 9,  score: 25, wave: 6, bits: ['#212529', '#e03131', '#495057'] },
    sumo:     { w: 74, h: 72, hp: 28, score: 40, wave: 9, dmg: 2, bits: ['#f1c9a5', '#1c1c3a', '#f8f9fa'] },
    vendbot:  { w: 46, h: 72, hp: 16, score: 30, wave: 7, bits: ['#1c7ed6', '#e9ecef', '#ff6b6b', '#ffd43b'] },
    // Giza
    mummy:    { w: 38, h: 64, hp: 16, score: 25, wave: 5, bits: ['#e9e2c8', '#c9bc94', '#6b5d45'] },
    scarab:   { w: 30, h: 20, hp: 3,  score: 12, wave: 4, bits: ['#1864ab', '#2b8a3e', '#ffd43b'] },
    camel:    { w: 80, h: 66, hp: 20, score: 30, wave: 8, bits: ['#c9a46b', '#a67c52', '#e03131'] },
    // Petra
    ibex:     { w: 50, h: 46, hp: 12, score: 25, wave: 7, bits: ['#a87b54', '#e9d8a6', '#5c3d22'] },
    vulture:  { w: 52, h: 34, hp: 6,  score: 20, wave: 6, fly: true, bits: ['#343a40', '#f1f3f5', '#ff8787'] },
    scorpion: { w: 52, h: 28, hp: 14, score: 25, wave: 8, bits: ['#7c4a1e', '#f08c00', '#2b2b2b'],
      // Armored claws: plain bullets from the front clink off. Shoot it from above, from behind, or blow it up.
      block: (e, b) => b.type === 'bullet' && Math.sign(b.vx) === -e.face && Math.abs(b.vy) < Math.abs(b.vx) * 1.5 },
    // Amazon
    jaguar:   { w: 66, h: 34, hp: 14, score: 30, wave: 9, bits: ['#f59f00', '#3b2a1a', '#fff3bf'] },
    monkey:   { w: 34, h: 38, hp: 7,  score: 20, wave: 5, bits: ['#8b5a2b', '#d9a066', '#ffd43b'] },
    piranha:  { w: 34, h: 26, hp: 4,  score: 15, wave: 10, bits: ['#e03131', '#868e96', '#ffd43b'] },
    dartfrog: { w: 26, h: 20, hp: 4,  score: 15, wave: 6, bits: ['#1c7ed6', '#212529', '#fcc419'] },
    // Outback
    kangaroo: { w: 46, h: 70, hp: 18, score: 30, wave: 7, bits: ['#b5651d', '#e03131', '#e0a96d'] },
    emu:      { w: 40, h: 64, hp: 7,  score: 15, wave: 6, bits: ['#5c4a3a', '#3b4a6b', '#868e96'] },
    dropbear: { w: 40, h: 40, hp: 8,  score: 25, wave: 8, fly: true, bits: ['#adb5bd', '#495057', '#f8f9fa'] },
    boomer:   { w: 40, h: 62, hp: 12, score: 25, wave: 7, bits: ['#e9c46a', '#2b8a3e', '#c9a46b'] },
  });

  Object.assign(ENEMY_AI, {
    // ---------------- TOKYO ----------------
    // Runs around, then vanishes in smoke and pops up behind you to throw 3 shuriken.
    ninja(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'walk'; e.timer = randi(50, 90); }
      if (e.st === 'gone') {
        if (--e.st2 <= 0) {
          const side = Math.random() < 0.7 ? -(p.face || 1) : (p.face || 1); // usually right behind you
          let nx = pcx(p) + side * rand(110, 170) - e.w / 2;
          nx = clamp(nx, G.camX + 30, G.camX + W - e.w - 30);
          if (G.arenaLocked) nx = clamp(nx, G.level.arenaX + 20, G.level.arenaX + W - e.w - 20);
          unhide(e, nx); e.y = p.y + p.h - e.h - 30; e.vx = 0; e.vy = 0;
          smoke(ecx(e), e.y + 30); SFX.pop();
          e.st = 'aim'; e.st2 = 24;
        }
        return;
      }
      const d = Math.abs(dx), dir = dirTo(dx);
      if (e.st === 'aim') {
        e.vx = 0; e.face = dir;
        if (--e.st2 <= 0) {
          const sx = ecx(e) + dir * 16, sy = e.y + 20;
          for (const da of [-0.2, 0, 0.2]) {
            const a = Math.atan2(p.y + p.h / 2 - sy, pcx(p) - sx) + da;
            G.ebullets.push({ kind: 'tk_shuriken', x: sx, y: sy, vx: Math.cos(a) * 6.5, vy: Math.sin(a) * 6.5, g: 0, r: 8, dmg: 1, life: 150, spin: 0.5 });
          }
          R.noise(0.15, 0.15, 3000, 0, 'highpass', 0, 6000);
          e.st = 'walk'; e.timer = randi(90, 140);
        }
      } else {
        e.face = dir;
        e.vx = d > 260 ? dir * 2.4 : d < 130 ? -dir * 1.6 : e.vx * 0.8;
        if (e.onGround && Math.random() < 0.012) e.vy = -9;
        if (--e.timer <= 0 && d < 620 && !p.dead) {
          if (Math.random() < 0.6) { // poof!
            smoke(ecx(e), e.y + 30); SFX.pop(); R.noise(0.3, 0.2, 900, 0, 'bandpass');
            hide(e); e.st = 'gone'; e.st2 = randi(35, 55); return;
          }
          e.st = 'aim'; e.st2 = 24;
        }
      }
      moveActor(e);
    },
    // Big and slow. Stomps (shockwaves both ways) or belly-slides across the street.
    sumo(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'walk'; }
      const d = Math.abs(dx);
      switch (e.st) {
        case 'walk':
          e.dir = dirTo(dx); e.face = e.dir; e.vx = d > 150 ? e.dir * 0.9 : 0;
          if (--e.timer <= 0 && d < 520 && !p.dead && e.onGround) {
            if (d < 330 && Math.random() < 0.5) { e.st = 'crouch'; e.st2 = 34; R.gross(140, 100, 0.5, 20, 10, 0.25); }
            else { e.st = 'lift'; e.st2 = 42; R.gross(160, 240, 0.6, 15, 8, 0.25); }
          }
          break;
        case 'lift': // big leg up... then STOMP
          e.vx = 0;
          if (--e.st2 <= 0) {
            shake(10); SFX.boom(); R.tone('sine', 90, 35, 0.4, 0.35);
            for (const s of [-1, 1]) G.ebullets.push({ kind: 'wave', x: ecx(e) + s * 46, y: GROUND_Y - 16, vx: s * 5, vy: 0, g: 0, r: 16, dmg: 1, life: 100, spin: 0 });
            particles(ecx(e), GROUND_Y - 4, 20, ['#adb5bd', '#868e96'], { speed: 5, up: 2 });
            e.st = 'rest'; e.st2 = 45;
          }
          break;
        case 'crouch':
          e.vx = 0;
          if (--e.st2 <= 0) { e.st = 'slide'; e.st2 = 48; e.dir = dirTo(dx); R.noise(0.6, 0.2, 500, 0, 'lowpass'); }
          break;
        case 'slide':
          e.vx = e.dir * 8; e.face = e.dir;
          if (e.t % 3 === 0) particles(ecx(e) - e.dir * 30, e.y + e.h, 2, ['#adb5bd'], { speed: 2 });
          if (--e.st2 <= 0 || e.hitWall) { e.st = 'rest'; e.st2 = 50; if (e.hitWall) shake(5); }
          break;
        default: // rest
          e.vx *= 0.85;
          if (--e.st2 <= 0) { e.st = 'walk'; e.timer = randi(80, 130); }
      }
      moveActor(e);
    },
    // Hops toward you and fires soda cans from its slot, two at a time.
    vendbot(e, p, dx) {
      if (!e.init) { e.init = true; e.hopT = 0; e.burst = 0; }
      const d = Math.abs(dx), dir = dirTo(dx);
      e.face = dir;
      if (e.onGround) {
        e.vx *= 0.8;
        if (--e.hopT <= 0 && d > 220) { e.vy = -7; e.vx = dir * 2.6; e.hopT = 55; R.tone('square', 300, 600, 0.08, 0.04); }
      }
      if (--e.timer <= 0 && d < 580 && !p.dead) { e.burst = 2; e.timer = randi(110, 150); }
      if (e.burst > 0 && e.t % 14 === 0) {
        e.burst--;
        throwArc(ecx(e) + dir * 10, e.y + 52, pcx(p), p.y + p.h / 2, 'tk_soda', 36 + randi(0, 12));
        R.tone('square', 180, 120, 0.08, 0.06); SFX.pop();
      }
      moveActor(e);
    },

    // ---------------- GIZA ----------------
    // Shambles at you and tosses bandages that leave a sticky, slow-you-down mess.
    mummy(e, p, dx) {
      const d = Math.abs(dx), dir = dirTo(dx);
      e.face = dir;
      if (e.wind > 0) {
        e.vx = 0;
        if (--e.wind === 0) {
          e.band = throwArc(ecx(e) + dir * 14, e.y + 14, pcx(p), p.y + p.h - 6, 'eg_bandage', clamp(d / 8, 30, 56));
          SFX.throwIt();
        }
      } else {
        e.vx = d > 110 ? dir * 0.6 : 0;
        if (--e.timer <= 0 && d < 460 && !p.dead) { e.wind = 22; e.timer = randi(150, 200); R.gross(180, 120, 0.7, 8, 4, 0.2); }
      }
      if (e.band && e.band.life <= 0) { // it landed: leave a sticky patch
        const bx = e.band.x;
        G.puddles.push({ x: bx - 45, w: 90, life: 200, mud: true });
        G.ebullets.push({ kind: 'eg_wrap', x: bx, y: GROUND_Y - 3, vx: 0, vy: 0, g: 0, r: 0, dmg: 0, life: 200, linger: true, spin: 0 });
        e.band = null;
      }
      moveActor(e);
    },
    // Tunnels under the sand (can't be hit), then bursts out right next to you.
    scarab(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'buried'; e.st2 = randi(40, 90); e.side = rand(-50, 50); hide(e); }
      if (e.st === 'buried') {
        const tx = pcx(p) - e.w / 2 + e.side;
        e.hx += clamp(tx - e.hx, -3, 3);
        if (e.t % 8 === 0 && e.hx > G.camX - 40 && e.hx < G.camX + W + 40) sand(e.hx + e.w / 2, GROUND_Y - 2, 2);
        if (--e.st2 <= 0 && Math.abs(tx - e.hx) < 40 && !p.dead) {
          unhide(e, e.hx); e.y = GROUND_Y - e.h; e.vy = -7; e.vx = 0;
          e.st = 'up'; e.st2 = randi(150, 220);
          sand(ecx(e), GROUND_Y - 4, 16); R.noise(0.2, 0.25, 1500, 0, 'bandpass');
        }
        return;
      }
      e.face = dirTo(dx);
      e.vx += (dirTo(dx) * 2.6 - e.vx) * 0.12;
      if (e.onGround && Math.random() < 0.02) e.vy = -5;
      moveActor(e);
      if (--e.st2 <= 0 && e.onGround && e.y + e.h >= GROUND_Y - 1) {
        sand(ecx(e), GROUND_Y - 4, 12);
        e.st = 'buried'; e.st2 = randi(60, 110); e.side = rand(-60, 60); hide(e);
      }
    },
    // Keeps its distance, rears back... and hocks a huge loogie at you.
    camel(e, p, dx) {
      const d = Math.abs(dx), dir = dirTo(dx);
      e.face = dir;
      if (e.wind > 0) {
        e.vx = 0;
        if (--e.wind === 0) {
          const hx = ecx(e) + dir * 46, hy = e.y + 8;
          const b = throwArc(hx, hy, pcx(p), p.y + p.h / 2, 'eg_spit', clamp(d / 9, 28, 60));
          b.r = 13;
          R.gross(300, 500, 0.25, 40, 30, 0.2); R.noise(0.2, 0.2, 1500, 0.05, 'bandpass');
        }
      } else {
        e.vx = d > 380 ? dir * 1.2 : d < 220 ? -dir * 1.2 : 0;
        if (--e.timer <= 0 && d < 620 && !p.dead) { e.wind = 30; e.timer = randi(120, 160); R.gross(120, 260, 0.7, 30, 20, 0.22); }
      }
      moveActor(e); stayIn(e);
    },

    // ---------------- PETRA ----------------
    // Leaps up onto your ledge and rams you with its horns (big knockback).
    ibex(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'walk'; e.jumpT = 0; e.drop = 0; }
      const d = Math.abs(dx), pf = p.y + p.h, ef = e.y + e.h, same = Math.abs(pf - ef) < 24;
      if (e.jumpT > 0) e.jumpT--;
      switch (e.st) {
        case 'walk':
          e.dir = dirTo(dx); e.face = e.dir; e.vx = d > 60 ? e.dir * 1.8 : 0;
          if (e.onGround && pf < ef - 40 && d < 280 && e.jumpT <= 0) { e.vy = -12.8; e.vx = e.dir * 3.2; e.jumpT = 70; R.gross(520, 380, 0.3, 50, 24, 0.15); }
          if (e.onGround && pf > ef + 40 && e.standOn && e.standOn.oneWay) e.drop = 14;
          if (e.onGround && same && d < 300 && d > 50 && --e.timer <= 0 && !p.dead) { e.st = 'lower'; e.st2 = 22; R.gross(480, 300, 0.35, 60, 24, 0.15); }
          break;
        case 'lower': e.vx = 0; if (--e.st2 <= 0) { e.st = 'ram'; e.st2 = 34; } break;
        case 'ram':
          e.vx = e.dir * 7.5; e.face = e.dir;
          if (!p.dead && overlap(e, p)) bigHit(e, p, 1, e.dir * 12, -8);
          if (--e.st2 <= 0 || e.hitWall) { e.st = 'rest'; e.st2 = 40; }
          break;
        default: e.vx *= 0.8; if (--e.st2 <= 0) { e.st = 'walk'; e.timer = randi(70, 110); }
      }
      if (e.drop > 0) e.drop--;
      moveActor(e, e.drop > 0);
    },
    // Circles high above you and drops bones (watch for the shadow).
    vulture(e, p, dx) {
      if (!e.init) { e.init = true; e.baseY = clamp(e.y, 100, 170); e.ang = rand(0, 6.28); }
      e.ang += 0.02;
      const tx = pcx(p) + Math.cos(e.ang) * 160;
      e.vx = clamp((e.vx + clamp((tx - ecx(e)) * 0.004, -0.2, 0.2)) * 0.98, -3, 3);
      e.x += e.vx; e.y += (e.baseY + Math.sin(e.ang * 2) * 20 - e.y) * 0.05;
      e.face = e.vx < 0 ? -1 : 1;
      if (--e.timer <= 0 && Math.abs(dx + p.vx * 30) < 16 && !p.dead) { // aims where you'll be
        G.ebullets.push({ kind: 'pt_bone', x: ecx(e), y: e.y + e.h, vx: 0, vy: 1, g: 0.25, r: 9, dmg: 1, life: 200, warn: true, spin: 0.25 });
        e.timer = randi(80, 120); R.tone('sawtooth', 600, 350, 0.25, 0.05);
      }
    },
    // Front claws are armored. Raises its tail, fires a poison dart, then scuttles off (back exposed!).
    scorpion(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'walk'; }
      const d = Math.abs(dx), dir = dirTo(dx);
      if (e.st === 'walk') {
        e.face = dir; e.vx = d > 230 ? dir * 1.4 : d < 140 ? -dir * 0.8 : 0;
        if (--e.timer <= 0 && d < 520 && !p.dead) { e.st = 'aim'; e.st2 = 26; R.noise(0.25, 0.12, 4000, 0, 'bandpass'); }
      } else if (e.st === 'aim') {
        e.face = dir; e.vx = 0;
        if (--e.st2 <= 0) {
          shootAt('pt_dart', ecx(e) + dir * 4, e.y - 18, pcx(p), p.y + p.h / 2, 6.5, { g: 0, r: 7, spin: 0, rot: Math.atan2(p.y + p.h / 2 - (e.y - 18), pcx(p) - ecx(e)) });
          SFX.hiss();
          e.st = 'scuttle'; e.st2 = 55;
        }
      } else {
        e.face = -dir; e.vx = -dir * 2.2;
        if (--e.st2 <= 0) { e.st = 'walk'; e.timer = randi(70, 110); }
      }
      moveActor(e); stayIn(e);
    },

    // ---------------- AMAZON ----------------
    // Creeps up almost invisible, crouches (you'll see it), then pounces a long way.
    jaguar(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'stalk'; e.alpha = 0.3; }
      const d = Math.abs(dx), dir = dirTo(dx);
      switch (e.st) {
        case 'stalk':
          e.face = dir; e.vx = d > 200 ? dir * 1.5 : 0; e.alpha += (0.28 - e.alpha) * 0.1;
          if (d < 340 && Math.abs(p.y + p.h - (e.y + e.h)) < 120 && e.onGround && --e.timer <= 0 && !p.dead) {
            e.st = 'crouch'; e.st2 = 30; R.gross(110, 90, 0.5, 20, 30, 0.22);
          }
          break;
        case 'crouch':
          e.vx = 0; e.face = dir; e.alpha += (1 - e.alpha) * 0.2;
          if (--e.st2 <= 0) { e.st = 'pounce'; e.vx = clamp(dx / 38, -9, 9); e.vy = -10.5; R.gross(200, 120, 0.4, 30, 25, 0.28); }
          break;
        case 'pounce':
          e.alpha = 1;
          if (!p.dead && overlap(e, p)) bigHit(e, p, 2, dirTo(e.vx) * 9, -6);
          if (e.onGround && e.vy >= 0) { e.st = 'rest'; e.st2 = 50; }
          break;
        default: e.vx *= 0.8; if (--e.st2 <= 0) { e.st = 'stalk'; e.timer = randi(60, 100); }
      }
      moveActor(e);
    },
    // Sits up on the branches throwing coconuts and bananas; swings away if you get close.
    monkey(e, p, dx) {
      if (!e.init) { e.init = true; e.swingT = 0; }
      const d = Math.abs(dx), dir = dirTo(dx);
      e.face = dir;
      if (e.swingT > 0) e.swingT--;
      if (e.onGround) {
        e.vx *= 0.7;
        const close = d < 110 && Math.abs(p.y - e.y) < 90;
        if ((close || e.flash === 5) && e.swingT <= 0) {
          e.vy = -11; e.vx = -dir * rand(3.5, 5); e.swingT = 45;
          R.tone('square', 900, 1500, 0.1, 0.05); R.tone('square', 1400, 800, 0.12, 0.05, 0.1);
        }
        if (--e.timer <= 0 && d < 560 && !p.dead) {
          throwArc(ecx(e), e.y + 6, pcx(p), p.y + p.h / 2, Math.random() < 0.5 ? 'am_coconut' : 'banana', randi(38, 52));
          e.timer = randi(80, 120); e.throwAnim = 14; SFX.throwIt();
        }
      }
      if (e.throwAnim > 0) e.throwAnim--;
      moveActor(e); stayIn(e);
    },
    // Hides in the river and leaps out at you. Out of water, it flops around angrily.
    piranha(e, p, dx) {
      if (!e.init) {
        e.init = true;
        const mid = ecx(e);
        e.pool = G.puddles.find(q => q.mud && q.life === Infinity && mid > q.x - 40 && mid < q.x + q.w + 40) || null;
        if (e.pool) { e.st = 'swim'; e.st2 = randi(30, 90); hide(e); e.hx = clamp(e.hx, e.pool.x + 4, e.pool.x + e.pool.w - e.w - 4); e.home = e.hx; }
        else { e.st = 'flop'; e.st2 = 20; }
      }
      const inPool = x => e.pool && x > e.pool.x - 10 && x < e.pool.x + e.pool.w + 10;
      if (e.st === 'swim') {
        const span = Math.max(0, e.pool.w / 2 - e.w / 2 - 6), c0 = e.pool.x + e.pool.w / 2 - e.w / 2;
        e.hx = c0 + Math.sin(e.t * 0.04 + e.home) * span;
        const near = Math.abs(pcx(p) - (e.hx + e.w / 2)) < 230;
        if (--e.st2 <= 0 && near && !p.dead) {
          unhide(e, e.hx); e.y = GROUND_Y - 4; e.vy = -rand(11, 13.5);
          e.vx = clamp((pcx(p) - ecx(e)) / 60, -2.2, 2.2); e.st = 'leap';
          particles(ecx(e), GROUND_Y - 2, 12, ['#74c0fc', '#d0ebff', '#fff'], { speed: 3, up: 3 }); SFX.splash();
        }
        return;
      }
      if (e.st === 'leap') {
        e.x += e.vx; e.y += e.vy; e.vy += 0.45; e.face = e.vx < 0 ? -1 : 1;
        if (e.vy > 0 && e.y >= GROUND_Y - 6) {
          if (inPool(ecx(e))) {
            particles(ecx(e), GROUND_Y - 2, 10, ['#74c0fc', '#d0ebff', '#fff'], { speed: 3, up: 2 }); SFX.splash();
            hide(e); e.st = 'swim'; e.st2 = randi(60, 110);
          } else { e.st = 'flop'; e.y = GROUND_Y - e.h; e.vy = 0; e.st2 = 15; }
        }
        return;
      }
      // flop: back toward the water if there is any, otherwise at you
      const tx = e.pool ? e.pool.x + e.pool.w / 2 : pcx(p);
      if (e.onGround) {
        e.vx *= 0.8;
        if (--e.st2 <= 0) {
          if (!e.pool && Math.abs(dx) < 200 && Math.random() < 0.35) { e.vy = -9; e.vx = clamp(dx / 30, -4, 4); }
          else { e.vy = -rand(4, 6); e.vx = dirTo(tx - ecx(e)) * rand(1.5, 2.5); }
          e.st2 = randi(20, 35); R.noise(0.08, 0.15, 900);
        }
      }
      e.face = dirTo(e.vx || dx);
      moveActor(e);
      if (e.onGround && inPool(ecx(e))) { hide(e); e.st = 'swim'; e.st2 = randi(60, 110); SFX.splash(); }
    },
    // Tiny, colorful and poisonous: hops at you and spits floating poison bubbles.
    dartfrog(e, p, dx) {
      if (!e.init) { e.init = true; e.col = pick(['#1c7ed6', '#fcc419', '#e03131', '#37b24d']); e.hopT = randi(10, 40); }
      const d = Math.abs(dx), dir = dirTo(dx);
      e.face = dir;
      if (e.onGround) {
        e.vx *= 0.75;
        if (--e.hopT <= 0 && d > 150) { e.vy = -6; e.vx = dir * 2.4; e.hopT = randi(40, 60); R.tone('sine', 300, 700, 0.07, 0.06); }
      }
      if (--e.timer <= 0 && d < 420 && !p.dead) {
        G.ebullets.push({ kind: 'am_bubble', x: ecx(e) + dir * 12, y: e.y + 4, vx: dir * 2.2, vy: -0.5, g: 0.004, r: 11, dmg: 1, life: 200, linger: true, spin: 0 });
        e.timer = randi(100, 140); R.tone('sine', 500, 200, 0.12, 0.08); R.tone('sine', 900, 1200, 0.06, 0.05, 0.1);
      }
      moveActor(e);
    },

    // ---------------- OUTBACK ----------------
    // Hops in close, puts its gloves up... and throws a punch that sends you flying.
    kangaroo(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'hop'; e.hopT = 0; }
      const d = Math.abs(dx), dir = dirTo(dx);
      e.face = dir;
      if (e.st === 'hop') {
        if (e.onGround) {
          e.vx *= 0.6;
          if (--e.hopT <= 0 && d > 70) { e.vy = -8.5; e.vx = dir * clamp(d / 30, 2, 5); e.hopT = 22; R.tone('sine', 220, 520, 0.12, 0.08); }
          if (d < 85 && Math.abs(p.y + p.h - (e.y + e.h)) < 40 && --e.timer <= 0 && !p.dead) { e.st = 'windup'; e.st2 = 20; }
        }
      } else if (e.st === 'windup') {
        e.vx = 0;
        if (--e.st2 <= 0) {
          e.st = 'punch'; e.st2 = 14; R.noise(0.12, 0.2, 1200, 0, 'bandpass', 0, 400);
          const reach = { x: dir > 0 ? e.x + e.w - 6 : e.x - 44, y: e.y + 12, w: 50, h: 34 };
          if (!p.dead && overlap(reach, p)) { bigHit(e, p, 1, dir * 13, -8); floatText(pcx(p), p.y - 20, 'BOING!', '#ffd43b', 20); }
        }
      } else if (--e.st2 <= 0) { e.st = 'hop'; e.timer = randi(50, 80); }
      moveActor(e);
    },
    // Stampede! Waits, then sprints past you at full speed, turns around, and comes back.
    emu(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'wait'; e.dir = dirTo(dx); }
      const d = Math.abs(dx);
      if (e.st === 'wait') {
        e.vx = 0; e.face = dirTo(dx);
        if (d < 640) { e.st = 'run'; e.dir = dirTo(dx); if (onScreen(e) || d < 700) { R.tone('sine', 110, 80, 0.3, 0.2); R.tone('sine', 110, 80, 0.3, 0.2, 0.2); } }
      } else if (e.st === 'run') {
        e.vx += (e.dir * 7 - e.vx) * 0.15; e.face = e.dir;
        if (e.t % 4 === 0) particles(ecx(e), e.y + e.h, 1, ['#c75a35', '#e8a07a'], { speed: 2 });
        if (e.onGround && e.hitWall) e.vy = -10;
        if ((pcx(p) - ecx(e)) * e.dir < -380) { e.st = 'turn'; e.st2 = 40; }
      } else {
        e.vx *= 0.85; e.face = dirTo(dx);
        if (--e.st2 <= 0) { e.dir = dirTo(dx); e.st = 'run'; R.tone('sine', 110, 80, 0.3, 0.15); }
      }
      moveActor(e);
    },
    // Hangs in the gum trees. When you walk under: growl, shadow... THUD. Then it bites.
    dropbear(e, p, dx) {
      if (!e.init) { e.init = true; e.st = 'hang'; e.baseY = e.y; }
      const d = Math.abs(dx);
      if (e.st === 'hang' || e.st === 'warn') {
        e.vx = 0;
        if (G.mode === 'waves' && e.st === 'hang') e.x += clamp(dx * 0.01, -1, 1); // creeps along its vine
        e.y = e.baseY + (e.st === 'warn' ? Math.sin(e.t * 0.9) * 3 : Math.sin(e.t * 0.05) * 3);
        if (e.st === 'hang') {
          const coming = Math.sign(p.vx) === -Math.sign(dx) && Math.abs(p.vx) > 1 && d < 240;
          if ((d < 70 || coming) && p.y > e.y && !p.dead && --e.timer <= 0) { e.st = 'warn'; e.st2 = 28; R.gross(240, 140, 0.5, 30, 25, 0.25); }
        } else if (--e.st2 <= 0) { e.st = 'drop'; e.vy = 2; }
        return;
      }
      if (e.st === 'drop') {
        e.vx = 0;
        if (!p.dead && overlap(e, p)) bigHit(e, p, 2, dirTo(-dx) * -6, -4);
        moveActor(e, false, 0.7);
        if (e.onGround) { e.st = 'ground'; shake(6); R.tone('sine', 120, 40, 0.25, 0.3); particles(ecx(e), e.y + e.h, 10, ['#c75a35', '#e8a07a'], { speed: 3 }); }
        return;
      }
      // on the ground: angry hops toward you (and down off ledges if you're below)
      e.face = dirTo(dx);
      e.vx += (dirTo(dx) * 2.2 - e.vx) * 0.1;
      if (e.onGround && Math.random() < 0.03) e.vy = -6;
      const below = p.y + p.h > e.y + e.h + 30;
      moveActor(e, below && !!e.standOn && e.standOn.oneWay);
    },
    // One of Bob's cousins on vacation: throws boomerangs that fly out and come back.
    boomer(e, p, dx) {
      const d = Math.abs(dx), dir = dirTo(dx);
      e.face = dir;
      e.vx = d > 420 ? dir * 1.2 : d < 200 ? -dir : 0;
      if (e.rang) {
        const b = e.rang;
        b.vx -= b.dir * b.dec;
        if (!b.back && b.vx * b.dir < 0) { b.back = true; b.vy = -b.vy; }
        if (b.life <= 0) e.rang = null;
        else if (b.back && Math.abs(b.x - ecx(e)) < 28 && Math.abs(b.y - (e.y + 30)) < 50) { b.life = 0; e.rang = null; R.tone('square', 600, 400, 0.05, 0.04); }
      } else if (e.windup > 0) {
        if (--e.windup === 0 && !p.dead) {
          const sx = ecx(e) + dir * 16, sy = e.y + 24, dist = clamp(d + 60, 180, 480), v = 9;
          const dec = v * v / (2 * dist), T = 2 * dist / v;
          e.rang = { kind: 'oz_boomerang', x: sx, y: sy, vx: dir * v, vy: (p.y + p.h / 2 - sy) / T * 1.4, g: 0, r: 12, dmg: 1, life: 300, linger: true, spin: 0.45, dir, dec, back: false };
          G.ebullets.push(e.rang); e.timer = randi(80, 120);
          R.noise(0.5, 0.12, 900, 0, 'bandpass', 0, 2000);
        }
      } else if (--e.timer <= 0 && d < 560 && !p.dead) e.windup = 18;
      moveActor(e); stayIn(e);
    },
  });

  // ===================================================================
  // ENEMY ART
  // ===================================================================
  Object.assign(ENEMY_ART, {
    ninja(ctx, e, c, cx, by, f) {
      if (e.hidden) return;
      const run = Math.abs(e.vx) > 0.3 && e.onGround ? Math.sin(e.t * 0.45) * 5 : 0, aim = e.st === 'aim';
      line(ctx, cx - f * 12, by - 52, cx + f * 6, by - 24, '#ced4da', 3); rect(ctx, cx - f * 13 - 2, by - 56, 4, 7, '#7f2d2d'); // sword on back
      rect(ctx, cx - 9 + run * 0.5, by - 18, 7, 18, c('#212529')); rect(ctx, cx + 2 - run * 0.5, by - 18, 7, 18, c('#212529'));
      ellipse(ctx, cx - 6 + run * 0.5, by - 2, 6, 3, '#000'); ellipse(ctx, cx + 6 - run * 0.5, by - 2, 6, 3, '#000');
      fillRR(ctx, cx - 11, by - 40, 22, 24, 6, c('#343a40'));
      rect(ctx, cx - 11, by - 23, 22, 4, c('#e03131'));
      circle(ctx, cx + f, by - 47, 10, c('#212529'));
      rect(ctx, cx - 7 + f * 3, by - 51, 14, 6, '#f1c9a5');
      circle(ctx, cx + f * 7, by - 48, 1.7, '#111'); circle(ctx, cx + f * 1, by - 48, 1.7, '#111');
      line(ctx, cx + f * 4, by - 52, cx + f * 9, by - 50, '#111', 1.5);
      rect(ctx, cx - 10 + f, by - 56, 20, 3.5, '#e03131');
      const fl = Math.sin(e.t * 0.3) * 3;
      line(ctx, cx - f * 9, by - 54, cx - f * 19, by - 52 + fl, '#e03131', 2.5); line(ctx, cx - f * 9, by - 54, cx - f * 17, by - 46 - fl, '#e03131', 2.5);
      if (aim) {
        line(ctx, cx + f * 6, by - 34, cx + f * 20, by - 42, c('#343a40'), 5);
        star4(ctx, cx + f * 23, by - 44, 7, e.t * 0.2, '#ced4da');
      } else line(ctx, cx + f * 6, by - 34, cx + f * 12, by - 21, c('#343a40'), 5);
    },
    sumo(ctx, e, c, cx, by, f) {
      const skin = c('#f1c9a5'), belt = c('#1c1c3a');
      if (e.st === 'slide') { // belly slide!
        ellipse(ctx, cx, by - 20, 42, 20, skin);
        rect(ctx, cx - f * 20 - 6, by - 39, 12, 38, belt);
        circle(ctx, cx + f * 42, by - 28, 12, skin);
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx + f * 42, by - 30, 12.5, Math.PI, 0); ctx.fill();
        ellipse(ctx, cx + f * 44, by - 43, 6, 4, '#111');
        line(ctx, cx + f * 44, by - 30, cx + f * 50, by - 29, '#111', 2);
        ellipse(ctx, cx + f * 56, by - 12, 12, 5, skin); ellipse(ctx, cx - f * 44, by - 8, 10, 5, skin);
        for (let i = 0; i < 3; i++) line(ctx, cx - f * (50 + i * 8), by - 30 + i * 10, cx - f * (64 + i * 8), by - 30 + i * 10, 'rgba(255,255,255,0.6)', 2);
        return;
      }
      const lift = e.st === 'lift' ? clamp(1 - e.st2 / 42, 0, 1) : 0, squish = e.st === 'crouch' ? 6 : 0;
      ellipse(ctx, cx - f * 18, by - 12, 12, 13, skin);
      ellipse(ctx, cx + f * 18, by - 12 - lift * 36, 12, 13, skin);
      ellipse(ctx, cx, by - 40 + squish, 37, 30 - squish * 0.5, skin);
      ctx.strokeStyle = 'rgba(160,100,70,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx + f * 6, by - 52 + squish, 12, 0.2, 2.6); ctx.stroke();
      circle(ctx, cx + f * 6, by - 34 + squish, 2, '#c08a6a');
      rect(ctx, cx - 35, by - 25, 70, 11, belt);
      rect(ctx, cx + f * 4 - 7, by - 16, 14, 12, belt);
      for (let i = -2; i <= 2; i++) rect(ctx, cx + i * 8 - 1, by - 15, 2, 10, c('#f8f9fa'));
      ellipse(ctx, cx - f * 33, by - 46 + squish, 10, 17, skin, f * 0.4);
      ellipse(ctx, cx + f * 33, by - 46 + squish, 10, 17, skin, -f * 0.4);
      const hy = by - 72 + squish;
      circle(ctx, cx + f * 4, hy, 12, skin);
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx + f * 4, hy - 2, 12.5, Math.PI, 0); ctx.fill();
      ellipse(ctx, cx + f * 2, hy - 15, 7, 4, '#111');
      line(ctx, cx + f * 2, hy - 3, cx + f * 7, hy - 1, '#111', 2); line(ctx, cx + f * 9, hy - 1, cx + f * 14, hy - 3, '#111', 2);
      circle(ctx, cx + f * 5, hy + 1, 1.5, '#111'); circle(ctx, cx + f * 12, hy + 1, 1.5, '#111');
      if (e.st === 'lift') ellipse(ctx, cx + f * 9, hy + 7, 3.5, 4, '#7a1f1f'); else line(ctx, cx + f * 5, hy + 7, cx + f * 12, hy + 7, '#7a1f1f', 2);
    },
    vendbot(ctx, e, c, cx, by, f) {
      const step = e.onGround ? 0 : 4;
      rect(ctx, cx - 16, by - 10 + step, 8, 10, '#495057'); rect(ctx, cx + 8, by - 10 + step, 8, 10, '#495057');
      fillRR(ctx, cx - 20, by - 3 + step, 16, 4, 2, '#343a40'); fillRR(ctx, cx + 4, by - 3 + step, 16, 4, 2, '#343a40');
      fillRR(ctx, cx - 23, by - 72, 46, 64, 5, c('#1c7ed6'));
      rect(ctx, cx - 19, by - 60, 28, 34, '#d0ebff');
      const cols = ['#ff6b6b', '#ffd43b', '#69db7c', '#f8f9fa'];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) fillRR(ctx, cx - 17 + k * 7, by - 58 + r * 11, 5, 9, 2, cols[(r + k) % 4]);
      rect(ctx, cx + 11, by - 60, 9, 34, c('#1864ab'));
      for (let k = 0; k < 4; k++) circle(ctx, cx + 15.5, by - 55 + k * 8, 2, k === 0 ? '#ffd43b' : '#adb5bd');
      rect(ctx, cx - 21, by - 70, 42, 8, '#111');
      const blink = e.t % 90 < 6;
      if (!blink) { rect(ctx, cx - 12 + f * 4, by - 68, 7, 4, '#ff4d4d'); rect(ctx, cx + 3 + f * 4, by - 68, 7, 4, '#ff4d4d'); }
      rect(ctx, cx - 16, by - 22, 32, 9, '#111');
      if (e.burst > 0) fillRR(ctx, cx - 6 + f * 6, by - 22, 12, 7, 2, '#4dabf7');
      line(ctx, cx + 14, by - 72, cx + 18, by - 84, '#868e96', 2);
      circle(ctx, cx + 18, by - 85, 3, e.t % 30 < 15 ? '#ff6b6b' : '#ffd43b');
    },
    mummy(ctx, e, c, cx, by, f) {
      const sh = Math.sin(e.t * 0.12) * 3, wrap = c('#e9e2c8'), dk = '#c9bc94';
      rect(ctx, cx - 10 + sh * 0.5, by - 22, 9, 22, wrap); rect(ctx, cx + 1 - sh * 0.5, by - 22, 9, 22, wrap);
      line(ctx, cx - f * 10, by - 34, cx - f * 26, by - 14 + sh, wrap, 3);
      fillRR(ctx, cx - 13, by - 50, 26, 31, 8, wrap);
      for (let i = 0; i < 6; i++) line(ctx, cx - 13, by - 48 + i * 5, cx + 13, by - 46 + i * 5 + (i % 2 ? 2 : -2), dk, 1.5);
      circle(ctx, cx + f * 2, by - 57, 11, wrap);
      for (let i = 0; i < 3; i++) line(ctx, cx - 9 + f * 2, by - 64 + i * 6, cx + 11 + f * 2, by - 62 + i * 6, dk, 1.5);
      rect(ctx, cx + f * 3 - 7, by - 60, 14, 5, '#3b2f22');
      circle(ctx, cx + f * 6, by - 57.5, 1.8, '#ffd43b'); circle(ctx, cx + f * 0, by - 57.5, 1.8, '#ffd43b');
      if (e.wind > 0) {
        line(ctx, cx - f * 4, by - 44, cx - f * 18, by - 60, wrap, 7);
        circle(ctx, cx - f * 20, by - 62, 6, '#f8f0dc');
        line(ctx, cx + f * 4, by - 40, cx + f * 20, by - 36, wrap, 7);
      } else {
        line(ctx, cx + f * 4, by - 44, cx + f * 25, by - 43 + sh * 0.3, wrap, 7);
        line(ctx, cx + f * 4, by - 38, cx + f * 24, by - 35 - sh * 0.3, wrap, 7);
      }
    },
    scarab(ctx, e, c, cx, by, f) {
      if (e.hidden) { // a little mound of sand moving under the ground
        const mx = e.hx + e.w / 2, wob = Math.sin(e.t * 0.5) * 2;
        ellipse(ctx, mx, GROUND_Y + 1, 15 + wob, 6, '#c9a15a'); ellipse(ctx, mx - 3, GROUND_Y - 1, 8, 3, '#e8c27a');
        return;
      }
      const leg = Math.sin(e.t * 0.8) * 3;
      for (let i = 0; i < 3; i++) {
        line(ctx, cx - 8 + i * 8, by - 6, cx - 12 + i * 8 + leg * (i % 2 ? 1 : -1), by, '#111', 2);
      }
      ellipse(ctx, cx, by - 9, 14, 9, c('#1864ab'));
      ellipse(ctx, cx - 3, by - 13, 8, 3, 'rgba(105,219,124,0.6)');
      line(ctx, cx - f * 2, by - 18, cx - f * 2, by - 2, '#0b3d6e', 1.5);
      circle(ctx, cx + f * 13, by - 8, 5, c('#0b3d6e'));
      line(ctx, cx + f * 16, by - 10, cx + f * 21, by - 14, '#ffd43b', 2); line(ctx, cx + f * 16, by - 6, cx + f * 21, by - 3, '#ffd43b', 2);
      circle(ctx, cx + f * 15, by - 9, 1.3, '#ff6b6b');
    },
    camel(ctx, e, c, cx, by, f) {
      const walk = Math.abs(e.vx) > 0.2 ? Math.sin(e.t * 0.2) * 5 : 0, fur = c('#c9a46b'), dk = c('#a67c52');
      for (const [lx, s] of [[-26, 1], [-16, -1], [14, 1], [24, -1]]) {
        line(ctx, cx + lx * f + walk * s * 0.4, by - 32, cx + lx * f + walk * s, by - 3, dk, 5);
        ellipse(ctx, cx + lx * f + walk * s, by - 2, 4, 2.5, '#5c3d22');
      }
      line(ctx, cx - f * 32, by - 42, cx - f * 37, by - 26, dk, 2); circle(ctx, cx - f * 37, by - 25, 3, '#5c3d22');
      ellipse(ctx, cx - f * 2, by - 38, 31, 14, fur);
      ellipse(ctx, cx - f * 13, by - 51, 11, 10, fur); ellipse(ctx, cx + f * 7, by - 51, 10, 9, fur);
      rect(ctx, cx - f * 3 - 7, by - 54, 14, 20, '#e03131'); rect(ctx, cx - f * 3 - 7, by - 46, 14, 4, '#ffd43b');
      for (let i = 0; i < 3; i++) line(ctx, cx - f * 3 - 6 + i * 6, by - 34, cx - f * 3 - 6 + i * 6, by - 29, '#ffd43b', 2);
      const wind = e.wind > 0, hx = cx + f * (wind ? 26 : 36), hy = by - (wind ? 70 : 60);
      line(ctx, cx + f * 24, by - 40, hx, hy + 4, fur, 10);
      ellipse(ctx, hx + f * 5, hy, 11, 7, fur);
      ellipse(ctx, hx + f * 13, hy + 2, 5, 5, dk);
      ellipse(ctx, hx - f * 3, hy - 7, 2.5, 4, dk);
      circle(ctx, hx + f * 3, hy - 3, 2, '#111'); line(ctx, hx + f * 1, hy - 4.5, hx + f * 6, hy - 5, '#5c3d22', 2);
      if (wind) { circle(ctx, hx + f * 13, hy + 4, 6, '#d8b28a'); circle(ctx, hx + f * 16, hy + 8, 2.5, '#d8f5a2'); }
      else line(ctx, hx + f * 11, hy + 5, hx + f * 17, hy + 5, '#5c3d22', 1.5);
    },
    ibex(ctx, e, c, cx, by, f) {
      const ram = e.st === 'ram', low = ram || e.st === 'lower';
      const run = ram ? Math.sin(e.t * 0.9) * 5 : Math.abs(e.vx) > 0.3 ? Math.sin(e.t * 0.35) * 3 : 0;
      for (const [lx, s] of [[-14, 1], [-7, -1], [8, 1], [14, -1]]) line(ctx, cx + lx * f + run * s * 0.5, by - 20, cx + lx * f + run * s, by - 1, c('#6b4423'), 3.5);
      ellipse(ctx, cx - f * 2, by - 25, 21, 11, c('#a87b54'));
      ellipse(ctx, cx - f * 2, by - 20, 14, 5, c('#e9d8a6'));
      ellipse(ctx, cx - f * 22, by - 30, 4, 3, '#f8f9fa');
      const hx = cx + f * (low ? 25 : 20), hy = by - (low ? 22 : 40);
      line(ctx, cx + f * 14, by - 28, hx, hy + 2, c('#a87b54'), 8);
      ellipse(ctx, hx + f * 3, hy, 8, 6, c('#8c6239'));
      poly(ctx, [hx + f * 3, hy + 4, hx + f * 9, hy + 4, hx + f * 6, hy + 13], '#5c3d22');
      circle(ctx, hx + f * 5, hy - 2, 1.6, '#111');
      ctx.strokeStyle = '#5c3d22'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx + f * 1, hy - 5);
      if (low) { ctx.lineTo(hx + f * 7, hy - 15); ctx.lineTo(hx + f * 17, hy - 16); ctx.lineTo(hx + f * 22, hy - 8); }
      else { ctx.lineTo(hx - f * 4, hy - 18); ctx.lineTo(hx - f * 14, hy - 21); ctx.lineTo(hx - f * 19, hy - 13); }
      ctx.stroke();
    },
    vulture(ctx, e, c, cx, by, f) {
      const flap = Math.sin(e.t * 0.15) * 10, y = e.y + 18, dk = c('#343a40');
      poly(ctx, [cx - f * 2, y - 2, cx - f * 34, y - 8 - flap, cx - f * 40, y + 2 - flap * 0.5, cx - f * 22, y + 6], dk);
      poly(ctx, [cx + f * 2, y - 2, cx + f * 26, y - 10 - flap, cx + f * 30, y - flap * 0.4, cx + f * 14, y + 6], dk);
      for (let i = 0; i < 3; i++) line(ctx, cx - f * (30 + i * 4), y - 4 - flap * 0.8, cx - f * (36 + i * 4), y - 10 - flap, '#212529', 2);
      ellipse(ctx, cx, y + 2, 14, 9, dk);
      ellipse(ctx, cx + f * 9, y - 4, 7, 5, '#f1f3f5');
      line(ctx, cx + f * 10, y - 5, cx + f * 16, y - 10, c('#ff8787'), 4);
      circle(ctx, cx + f * 18, y - 11, 5, c('#ff8787'));
      poly(ctx, [cx + f * 21, y - 13, cx + f * 28, y - 9, cx + f * 21, y - 8], '#f1f3f5');
      circle(ctx, cx + f * 19, y - 12, 1.4, '#111');
      line(ctx, cx - 3, y + 10, cx - 3, y + 15, '#adb5bd', 2); line(ctx, cx + 3, y + 10, cx + 3, y + 15, '#adb5bd', 2);
    },
    scorpion(ctx, e, c, cx, by, f) {
      const aim = e.st === 'aim', shell = c('#7c4a1e'), dk = c('#5c3410'), leg = Math.sin(e.t * 0.6) * 2.5;
      for (let i = 0; i < 4; i++) {
        const lx = cx - 12 + i * 7;
        line(ctx, lx, by - 9, lx - 5 + (i % 2 ? leg : -leg), by, '#3b2a1a', 2);
        line(ctx, lx, by - 9, lx + 5 + (i % 2 ? -leg : leg), by, '#3b2a1a', 2);
      }
      const tip = aim ? [cx + f * 2, by - 44] : [cx - f * 4, by - 40];
      const pts = [[cx - f * 14, by - 10], [cx - f * 24, by - 20], [cx - f * 22, by - 33], [cx - f * 12, by - 41], tip];
      pts.forEach(([x, y], i) => circle(ctx, x, y, 5.5 - i * 0.5, i % 2 ? dk : shell));
      poly(ctx, [tip[0], tip[1] - 3, tip[0] + f * 9, tip[1] + 3, tip[0], tip[1] + 4], '#2b2b2b');
      if (aim) { ctx.globalAlpha = 0.5; circle(ctx, tip[0] + f * 5, tip[1], 7, '#8ce99a'); ctx.globalAlpha = 1; }
      ellipse(ctx, cx, by - 10, 17, 8, shell);
      for (let i = -1; i <= 1; i++) line(ctx, cx + i * 6, by - 17, cx + i * 6, by - 4, dk, 1.5);
      line(ctx, cx + f * 12, by - 11, cx + f * 22, by - 14, shell, 4);
      ellipse(ctx, cx + f * 25, by - 14, 7, 6, shell);
      poly(ctx, [cx + f * 29, by - 18, cx + f * 38, by - 20, cx + f * 31, by - 14], shell);
      poly(ctx, [cx + f * 29, by - 11, cx + f * 38, by - 8, cx + f * 31, by - 13], shell);
      ellipse(ctx, cx + f * 23, by - 16, 3, 1.6, 'rgba(255,255,255,0.45)');
      circle(ctx, cx + f * 14, by - 14, 1.4, '#111'); circle(ctx, cx + f * 11, by - 15, 1.4, '#111');
    },
    jaguar(ctx, e, c, cx, by, f) {
      ctx.save();
      ctx.globalAlpha = e.flash > 0 ? 1 : clamp(e.alpha ?? 1, 0.2, 1);
      const pounce = e.st === 'pounce', lo = e.st === 'crouch' ? 6 : 0, fur = c('#f59f00'), dk = '#3b2a1a';
      const run = Math.abs(e.vx) > 0.3 && e.onGround ? Math.sin(e.t * 0.35) * 4 : 0;
      ctx.strokeStyle = fur; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - f * 24, by - 20 + lo); ctx.quadraticCurveTo(cx - f * 40, by - 30, cx - f * 36, by - 8 + Math.sin(e.t * 0.1) * 4); ctx.stroke();
      if (pounce) {
        line(ctx, cx + f * 14, by - 20, cx + f * 32, by - 12, fur, 6); line(ctx, cx - f * 16, by - 18, cx - f * 32, by - 8, fur, 6);
      } else for (const [lx, s] of [[-16, 1], [-8, -1], [10, 1], [18, -1]]) line(ctx, cx + lx * f + run * s, by - 14 + lo, cx + lx * f + run * s * 1.5, by - 1, fur, 5);
      ellipse(ctx, cx - f * 2, by - 19 + lo, 27, 10, fur);
      ellipse(ctx, cx - f * 2, by - 14 + lo, 18, 4, c('#fff3bf'));
      for (let i = 0; i < 8; i++) {
        const sx = cx - f * 20 + f * i * 6, sy = by - 22 + lo + (i % 2 ? 4 : -2);
        circle(ctx, sx, sy, 2.6, dk); circle(ctx, sx, sy, 1.1, fur);
      }
      const hx = cx + f * 27, hy = by - 22 + lo;
      circle(ctx, hx, hy, 9, fur);
      poly(ctx, [hx - f * 6, hy - 6, hx - f * 2, hy - 14, hx + f * 1, hy - 7], fur);
      poly(ctx, [hx + f * 2, hy - 7, hx + f * 6, hy - 14, hx + f * 8, hy - 5], fur);
      ellipse(ctx, hx + f * 6, hy + 3, 5, 4, c('#fff3bf'));
      circle(ctx, hx + f * 10, hy + 1, 1.8, '#111');
      const glow = e.st !== 'stalk';
      circle(ctx, hx + f * 3, hy - 3, 2, glow ? '#ffd43b' : '#2b8a3e'); circle(ctx, hx + f * 3.5, hy - 3, 0.9, '#111');
      if (pounce || e.st === 'crouch') {
        ellipse(ctx, hx + f * 7, hy + 6, 4, 3, '#7a1f1f');
        poly(ctx, [hx + f * 5, hy + 4, hx + f * 6, hy + 8, hx + f * 7, hy + 4], '#fff');
      }
      ctx.restore();
    },
    monkey(ctx, e, c, cx, by, f) {
      const air = !e.onGround, fur = c('#8b5a2b'), face = c('#d9a066');
      if (air) line(ctx, cx + f * 6, by - 36, cx + f * 6 - e.vx * 10, 0, '#2b8a3e', 2.5);
      ctx.strokeStyle = fur; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - f * 8, by - 8); ctx.quadraticCurveTo(cx - f * 24, by - 6, cx - f * 20, by - 22); ctx.arc(cx - f * 16, by - 22, 4, Math.PI, 0); ctx.stroke();
      line(ctx, cx - 5, by - 6, cx - 7, by, fur, 4); line(ctx, cx + 5, by - 6, cx + 7, by, fur, 4);
      ellipse(ctx, cx, by - 15, 11, 12, fur);
      ellipse(ctx, cx + f * 2, by - 13, 6, 8, face);
      if (air) line(ctx, cx + f * 4, by - 22, cx + f * 6, by - 36, fur, 4);
      else if (e.throwAnim > 0) { line(ctx, cx + f * 6, by - 20, cx + f * 10, by - 36, fur, 4); circle(ctx, cx + f * 10, by - 38, 5, '#6b4423'); }
      else line(ctx, cx + f * 8, by - 18, cx + f * 12, by - 8, fur, 4);
      circle(ctx, cx + f * 3, by - 31, 10, fur);
      circle(ctx, cx - f * 6, by - 33, 4, face); circle(ctx, cx + f * 12, by - 33, 4, face);
      ellipse(ctx, cx + f * 5, by - 29, 7, 6, face);
      circle(ctx, cx + f * 3, by - 32, 1.6, '#111'); circle(ctx, cx + f * 8, by - 32, 1.6, '#111');
      ctx.strokeStyle = '#5c3d22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx + f * 6, by - 28, 3, 0.3, Math.PI - 0.3); ctx.stroke();
    },
    piranha(ctx, e, c, cx, by, f) {
      if (e.hidden) { // ripples and a fin in the river
        const mx = e.hx + e.w / 2, k = (e.t % 40) / 40;
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(mx, GROUND_Y + 1, 6 + k * 16, 2 + k * 3, 0, 0, Math.PI * 2); ctx.stroke();
        poly(ctx, [mx - 5, GROUND_Y, mx + 3, GROUND_Y - 8, mx + 6, GROUND_Y], '#495057');
        return;
      }
      const y = e.y + e.h / 2, rot = e.st === 'leap' ? Math.atan2(e.vy, Math.abs(e.vx) + 1.5) * 0.8 : Math.sin(e.t * 0.4) * 0.2;
      ctx.save(); ctx.translate(cx, y); ctx.scale(f, 1); ctx.rotate(rot);
      poly(ctx, [-12, 0, -24, -10, -24, 10], c('#868e96'));
      ellipse(ctx, 0, 0, 16, 12, c('#868e96'));
      ellipse(ctx, 2, 5, 12, 6, c('#e03131'));
      poly(ctx, [-6, -10, 3, -17, 6, -9], '#495057');
      poly(ctx, [8, 3, 18, 4, 14, 10], c('#e03131'));
      for (let i = 0; i < 3; i++) poly(ctx, [9 + i * 3, 3, 10.5 + i * 3, 7, 12 + i * 3, 3], '#fff');
      circle(ctx, 8, -4, 3.2, '#ffd43b'); circle(ctx, 9, -4, 1.5, '#111');
      line(ctx, 4, -9, 11, -6, '#212529', 2);
      ctx.restore();
    },
    dartfrog(ctx, e, c, cx, by, f) {
      const col = c(e.col || '#1c7ed6'), air = !e.onGround, puff = e.timer < 14 ? 1 : 0;
      if (air) { line(ctx, cx - f * 8, by - 8, cx - f * 18, by + 2, col, 3); line(ctx, cx - f * 2, by - 8, cx - f * 10, by + 2, col, 3); }
      else { ellipse(ctx, cx - f * 9, by - 4, 6, 4, col); ellipse(ctx, cx + f * 8, by - 2, 4, 2.5, col); }
      ellipse(ctx, cx, by - 9, 12, 8, col);
      for (const [sx, sy] of [[-5, -11], [2, -6], [6, -12], [-2, -14]]) circle(ctx, cx + sx * f, by + sy, 2, '#212529');
      if (puff) circle(ctx, cx + f * 9, by - 5, 5, '#fff3bf');
      circle(ctx, cx + f * 5, by - 16, 4, col); circle(ctx, cx + f * 5, by - 16, 2.5, '#fff'); circle(ctx, cx + f * 6, by - 16, 1.4, '#111');
      line(ctx, cx + f * 6, by - 9, cx + f * 11, by - 9, '#111', 1.2);
    },
    kangaroo(ctx, e, c, cx, by, f) {
      const fur = c('#b5651d'), lt = c('#e0a96d'), air = !e.onGround, glove = c('#e03131');
      line(ctx, cx - f * 10, by - 22, cx - f * 32, by - 2, fur, 9);
      if (air) ellipse(ctx, cx + f * 2, by - 6, 13, 4, fur, f * 0.5); else ellipse(ctx, cx + f * 6, by - 3, 15, 4, fur);
      ellipse(ctx, cx - f * 2, by - 20, 12, 15, fur);
      rect(ctx, cx - 10, by - 32, 20, 10, '#1c7ed6');
      ellipse(ctx, cx + f * 2, by - 44, 13, 18, fur);
      ellipse(ctx, cx + f * 5, by - 42, 7, 12, lt);
      ellipse(ctx, cx + f * 8, by - 62, 8, 7, fur);
      ellipse(ctx, cx + f * 15, by - 60, 7, 4, fur);
      circle(ctx, cx + f * 21, by - 61, 2, '#111');
      ellipse(ctx, cx + f * 3, by - 73, 3, 8, fur, -f * 0.3); ellipse(ctx, cx + f * 9, by - 73, 3, 8, fur, f * 0.2);
      circle(ctx, cx + f * 10, by - 64, 1.6, '#111');
      line(ctx, cx + f * 7, by - 67, cx + f * 12, by - 66, '#5c3d22', 1.5);
      if (e.st === 'windup') {
        line(ctx, cx + f * 2, by - 50, cx - f * 8, by - 48, fur, 5); circle(ctx, cx - f * 10, by - 48, 7, glove);
        line(ctx, cx + f * 8, by - 50, cx + f * 16, by - 56, fur, 5); circle(ctx, cx + f * 17, by - 57, 7, glove);
      } else if (e.st === 'punch') {
        line(ctx, cx + f * 8, by - 48, cx + f * 36, by - 46, fur, 5); circle(ctx, cx + f * 40, by - 46, 9, glove);
        for (let i = 0; i < 3; i++) line(ctx, cx + f * (46 + i * 2), by - 54 + i * 8, cx + f * (54 + i * 3), by - 56 + i * 8, '#fff', 2);
        line(ctx, cx + f * 2, by - 50, cx + f * 10, by - 56, fur, 5); circle(ctx, cx + f * 11, by - 57, 7, glove);
      } else {
        const bob = Math.sin(e.t * 0.2) * 2;
        line(ctx, cx + f * 4, by - 50, cx + f * 16, by - 52 + bob, fur, 5); circle(ctx, cx + f * 18, by - 53 + bob, 7, glove);
        line(ctx, cx + f * 8, by - 48, cx + f * 22, by - 44 - bob, fur, 5); circle(ctx, cx + f * 24, by - 44 - bob, 7, glove);
      }
    },
    emu(ctx, e, c, cx, by, f) {
      const run = Math.abs(e.vx) > 1 ? Math.sin(e.t * 0.6) * 9 : 0, fl = c('#5c4a3a'), neckC = c('#3b4a6b');
      line(ctx, cx - 4, by - 28, cx - 4 + run, by - 2, '#868e96', 3); line(ctx, cx + 4, by - 28, cx + 4 - run, by - 2, '#868e96', 3);
      line(ctx, cx - 4 + run, by - 1, cx + f * 4 + run, by - 1, '#868e96', 2); line(ctx, cx + 4 - run, by - 1, cx + f * 12 - run, by - 1, '#868e96', 2);
      ellipse(ctx, cx - f * 2, by - 36, 18, 12, fl);
      for (let i = 0; i < 6; i++) line(ctx, cx - 16 + i * 6, by - 28, cx - 18 + i * 6, by - 22, fl, 2);
      const lean = Math.abs(e.vx) > 3 ? 8 : 0, nx = cx + f * (14 + lean), ny = by - 60 + lean * 0.6;
      line(ctx, cx + f * 10, by - 40, nx, ny, neckC, 5);
      circle(ctx, nx, ny, 5.5, neckC);
      poly(ctx, [nx + f * 4, ny - 2, nx + f * 12, ny + 1, nx + f * 4, ny + 3], '#495057');
      circle(ctx, nx + f * 1.5, ny - 1.5, 2.4, '#ff922b'); circle(ctx, nx + f * 2.5, ny - 1, 1, '#111');
      line(ctx, nx - f * 2, ny - 5, nx - f * 5, ny - 9, fl, 2);
    },
    dropbear(ctx, e, c, cx, by, f) {
      const hang = e.st === 'hang' || e.st === 'warn' || !e.st, fur = c('#adb5bd'), lt = c('#f1f3f5');
      if (hang) {
        if (G.mode === 'waves') line(ctx, cx, 0, cx, e.y + 2, '#5c940d', 3);
        else {
          line(ctx, cx - 46, e.baseY - 4, cx + 44, (e.baseY || e.y) + 1, '#d0c4b0', 7);
          for (let i = 0; i < 4; i++) ellipse(ctx, cx - 40 + i * 26, (e.baseY || e.y) - 8 + (i % 2) * 6, 12, 4, '#5c7c3a', i % 2 ? 0.4 : -0.4);
        }
        if (e.st === 'warn') {
          const sy = floorBelow(cx, by);
          ellipse(ctx, cx, sy - 1, 22, 5, 'rgba(0,0,0,0.35)');
          text(ctx, '!', cx, e.y - 14, { size: 22, color: '#ff6b6b', stroke: '#000', sw: 4 });
        }
        line(ctx, cx - 8, by - 28, cx - 12, e.y + 1, fur, 5); line(ctx, cx + 8, by - 28, cx + 12, e.y + 1, fur, 5);
      } else {
        line(ctx, cx - 10, by - 22, cx - 18, by - 12, fur, 5); line(ctx, cx + 10, by - 22, cx + 18, by - 12, fur, 5);
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) line(ctx, cx + s * 18, by - 12, cx + s * (20 + k * 2), by - 7 + k, '#f8f9fa', 1.2);
      }
      ellipse(ctx, cx, by - 15, 15, 15, fur);
      ellipse(ctx, cx, by - 12, 9, 10, lt);
      const hy = by - 33;
      circle(ctx, cx - 12, hy - 8, 8, fur); circle(ctx, cx + 12, hy - 8, 8, fur);
      circle(ctx, cx - 12, hy - 8, 4.5, lt); circle(ctx, cx + 12, hy - 8, 4.5, lt);
      circle(ctx, cx, hy, 13, fur);
      ellipse(ctx, cx + f * 2, hy + 3, 5, 6.5, '#212529');
      circle(ctx, cx - 5 + f * 2, hy - 4, 2.2, '#e03131'); circle(ctx, cx + 6 + f * 2, hy - 4, 2.2, '#e03131');
      line(ctx, cx - 9 + f * 2, hy - 9, cx - 2 + f * 2, hy - 6, '#212529', 2); line(ctx, cx + 10 + f * 2, hy - 9, cx + 3 + f * 2, hy - 6, '#212529', 2);
      if (e.st !== 'hang') { poly(ctx, [cx - 3, hy + 9, cx - 1, hy + 14, cx + 1, hy + 9], '#fff'); poly(ctx, [cx + 3, hy + 9, cx + 5, hy + 14, cx + 7, hy + 9], '#fff'); }
    },
    boomer(ctx, e, c, cx, by, f) {
      cousin(ctx, e, c, cx, by, f, { pants: '#c9a46b', shirt: '#2b8a3e', hat: 'band', hatColor: '#3b2a1a', beard: '#a0522d' });
      for (let i = 0; i < 4; i++) { // tourist cork hat
        const kx = cx + f * 2 - 12 + i * 8, sw = Math.sin(e.t * 0.15 + i) * 2;
        line(ctx, kx, by - 58, kx + sw, by - 50, '#5c3d22', 1); ellipse(ctx, kx + sw, by - 49, 1.8, 2.5, '#c9a46b');
      }
      if (!e.rang) {
        const wind = e.windup > 0;
        line(ctx, cx + f * 10, by - 40, cx + f * (wind ? -4 : 18), by - (wind ? 56 : 32), c('#f1c9a5'), 5);
        ctx.save(); ctx.translate(cx + f * (wind ? -6 : 20), by - (wind ? 58 : 32)); ctx.rotate(wind ? -f * 0.6 : f * 0.4); THROWN_ART.oz_boomerang(ctx); ctx.restore();
      } else line(ctx, cx + f * 10, by - 40, cx + f * 22, by - 44, c('#f1c9a5'), 5);
    },
  });

  // ===================================================================
  // THROWN THINGS
  // ===================================================================
  Object.assign(THROWN_ART, {
    tk_shuriken(ctx) { star4(ctx, 0, 0, 9, 0, '#ced4da'); },
    tk_soda(ctx) { fillRR(ctx, -5, -8, 10, 16, 2, '#4dabf7'); rect(ctx, -5, -8, 10, 3, '#ced4da'); line(ctx, -5, 1, 5, -1, '#fff', 2); },
    tk_sushi(ctx) { ellipse(ctx, 0, 3, 11, 5, '#f8f9fa'); ellipse(ctx, 0, -1, 12, 4.5, '#ff8787'); for (let i = -1; i <= 1; i++) line(ctx, i * 5 - 2, -4, i * 5 + 2, 2, '#ffe3e3', 1.5); rect(ctx, -2, -4, 4, 11, '#1b3a2b'); },
    eg_bandage(ctx) {
      circle(ctx, 0, 0, 7, '#e9e2c8');
      ctx.strokeStyle = '#c9bc94'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 5); ctx.stroke();
      line(ctx, -6, 2, -18, 6, '#e9e2c8', 4);
    },
    eg_wrap(ctx) {
      ctx.globalAlpha = 0.95;
      for (let i = 0; i < 4; i++) line(ctx, -40 + i * 6, -2 + (i % 2) * 3, 30 - i * 8, 1 - (i % 2) * 3, i % 2 ? '#c9bc94' : '#e9e2c8', 4);
      ctx.globalAlpha = 1;
    },
    eg_spit(ctx) { circle(ctx, 0, 0, 11, 'rgba(216,245,162,0.92)'); circle(ctx, -4, -4, 3.5, 'rgba(255,255,255,0.8)'); circle(ctx, 6, 7, 4, 'rgba(192,235,117,0.9)'); },
    eg_pot(ctx) { ellipse(ctx, 0, 2, 9, 10, '#c0763a'); rect(ctx, -5, -11, 10, 5, '#a0612a'); line(ctx, -8, 1, 8, 1, '#5c3d22', 1.5); },
    pt_bone(ctx) { rect(ctx, -9, -2, 18, 4, '#f8f9fa'); for (const s of [-1, 1]) { circle(ctx, s * 10, -3, 3.5, '#f8f9fa'); circle(ctx, s * 10, 3, 3.5, '#f8f9fa'); } },
    pt_dart(ctx) { rect(ctx, -9, -1.5, 14, 3, '#5c940d'); poly(ctx, [5, -3, 11, 0, 5, 3], '#2b2b2b'); poly(ctx, [-9, 0, -14, -5, -12, 0, -14, 5], '#94d82d'); },
    pt_rock(ctx) { poly(ctx, [-9, -4, -3, -10, 7, -7, 10, 2, 3, 9, -7, 7], '#c96f57'); line(ctx, -4, -2, 4, 2, '#a85240', 1.5); },
    am_coconut(ctx) { circle(ctx, 0, 0, 9, '#6b4423'); for (const [x, y] of [[-3, -2], [2, -3], [0, 2]]) circle(ctx, x, y, 1.6, '#3b2a1a'); for (let i = 0; i < 4; i++) line(ctx, -8 + i * 4, -6, -6 + i * 4, -9, '#8b5e3c', 1); },
    am_bubble(ctx) {
      ctx.globalAlpha = 0.6; circle(ctx, 0, 0, 11, '#94d82d'); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#5c940d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
      circle(ctx, -4, -4, 2.5, 'rgba(255,255,255,0.8)');
      circle(ctx, 1, 1, 3.5, '#f8f9fa'); circle(ctx, -0.3, 0.5, 0.9, '#111'); circle(ctx, 2.3, 0.5, 0.9, '#111');
    },
    oz_boomerang(ctx) { line(ctx, -12, -4, 0, 4, '#b5651d', 5); line(ctx, 0, 4, 12, -4, '#b5651d', 5); line(ctx, -10, -3, -4, 1, '#ffd43b', 1.5); },
    oz_pie(ctx) { ellipse(ctx, 0, 1, 11, 6, '#c47a2c'); ellipse(ctx, 0, -1, 9, 4, '#e0a050'); circle(ctx, 2, -4, 3, '#e03131'); },
  });
  Object.assign(SPLAT_COLS, {
    tk_shuriken: ['#ced4da', '#868e96'], tk_soda: ['#4dabf7', '#e7f5ff', '#fff'], tk_sushi: ['#f8f9fa', '#ff8787', '#1b3a2b'],
    eg_bandage: ['#e9e2c8', '#c9bc94'], eg_wrap: ['#e9e2c8'], eg_spit: ['#d8f5a2', '#f1f3f5', '#c0eb75'], eg_pot: ['#c0763a', '#a0612a'],
    pt_bone: ['#f8f9fa', '#dee2e6'], pt_dart: ['#94d82d', '#5c940d'], pt_rock: ['#c96f57', '#e8957a'],
    am_coconut: ['#6b4423', '#f8f9fa'], am_bubble: ['#94d82d', '#d8f5a2'],
    oz_boomerang: ['#b5651d', '#ffd43b'], oz_pie: ['#c47a2c', '#e03131'],
  });

  SFX.addKill({
    ninja:    () => { R.noise(0.3, 0.25, 1200, 0, 'bandpass'); R.tone('sine', 900, 300, 0.2, 0.08); },
    sumo:     () => { R.gross(120, 60, 0.6, 20, 8, 0.3); R.tone('sine', 90, 40, 0.4, 0.3); },
    vendbot:  () => { R.tone('square', 600, 100, 0.4, 0.07); R.noise(0.3, 0.25, 2000, 0, 'bandpass'); for (let i = 0; i < 3; i++) R.tone('sine', 1500 + i * 300, 1500 + i * 300, 0.05, 0.05, 0.12 + i * 0.07); },
    mummy:    () => { R.gross(200, 70, 0.7, 10, 5, 0.25); R.noise(0.4, 0.12, 3000, 0, 'highpass'); },
    scarab:   () => { R.noise(0.08, 0.3, 4000, 0, 'bandpass'); R.tone('square', 1800, 600, 0.06, 0.05); },
    camel:    () => { R.gross(300, 100, 0.6, 50, 14, 0.3); },
    ibex:     () => { R.gross(500, 300, 0.4, 60, 22, 0.2); },
    vulture:  () => { R.tone('sawtooth', 700, 300, 0.25, 0.06); R.noise(0.2, 0.2, 1500); },
    scorpion: () => { R.noise(0.1, 0.35, 3000, 0, 'bandpass'); R.tone('square', 400, 120, 0.15, 0.06); },
    jaguar:   () => { R.gross(180, 70, 0.6, 25, 18, 0.28); },
    monkey:   () => { R.tone('square', 900, 1400, 0.08, 0.06); R.tone('square', 1300, 700, 0.12, 0.06, 0.09); R.tone('square', 1100, 1500, 0.08, 0.05, 0.2); },
    piranha:  () => { R.noise(0.2, 0.25, 800); R.tone('sine', 600, 200, 0.15, 0.08); },
    dartfrog: () => { R.tone('sine', 400, 900, 0.08, 0.1); R.tone('sine', 300, 150, 0.12, 0.1, 0.08); },
    kangaroo: () => { R.tone('sine', 300, 800, 0.15, 0.12); R.gross(160, 80, 0.3, 15, 10, 0.2, 0.1); },
    emu:      () => { R.tone('sine', 120, 90, 0.3, 0.2); R.tone('sine', 120, 90, 0.3, 0.2, 0.18); },
    dropbear: () => { R.gross(260, 120, 0.5, 30, 20, 0.25); },
    boomer:   () => R.gross(150, 80, 0.3, 15, 12, 0.25),
  });

  // ===================================================================
  // MUSIC
  // ===================================================================
  const { T, bars, off } = Music.helpers;
  // Tokyo: city-pop with koto and taiko.
  Music.add('tokyo', { bpm: 112, tracks: [
    T('kick', 0.38, 'x . . . x . . . x . . . x . . .'),
    T('clap', 0.12, '. . . . x . . . . . . . x . . .'),
    T('hat', 0.035, '. . x . . . x . . . x . . . x .'),
    T('taiko', 0.3, 'X . . . . . . . . . . . . . x x'),
    T('bass', 0.28, bars('F2 . F3 . . F2 . F3 . . F2 . E2 . F2 .', 'E2 . E3 . . E2 . E3 . . E2 . D2 . E2 .',
      'D2 . D3 . . D2 . D3 . . D2 . C2 . D2 .', 'G2 . G3 . . G2 . G3 . . G2 . A2 . B2 .')),
    T('stab', 0.05, bars(off('F3+A3+C4+E4'), off('E3+G3+B3+D4'), off('D3+F3+A3+C4'), off('G3+B3+D4+F4'))),
    T('koto', 0.11, bars('A4 . C5 . D5 . E5 . . . G5 . E5 . D5 .', 'E5 . D5 . B4 . G4 . . . A4 . B4 . D5 .',
      'C5 . A4 . F4 . A4 . C5 . D5 . F5 . E5 .', 'D5:4 . . . B4:4 . . . G4:6 . . . . . . .')),
    T('bell', 0.035, 'C6 . . . . . . . G5 . . . . . . .'),
  ] });
  // Giza: a hot, snaky desert groove.
  Music.add('giza', { bpm: 104, tracks: [
    T('conga', 0.18, 'C4 . G3 . C4 C4 G3 . C4 . G3 . C4 C4 G3 G3'),
    T('shaker', 0.05, 'x x x x x x x x x x x x x x x x'),
    T('kick', 0.3, 'x . . . . . x . x . . . . . . .'),
    T('bass', 0.3, bars('E2:4 . . . E2 . F2 . E2:4 . . . D2 . E2 .', 'E2:4 . . . E2 . F2 . G#2 . F2 . E2:4 . . .')),
    T('twang', 0.09, bars('E4 F4 G#4 . A4 . G#4 F4 E4 . . . B4 . A4 .', 'G#4 . F4 . E4 . F4 G#4 A4:4 . . . G#4 . F4 .',
      'B4 C5 B4 . A4 . G#4 . A4 B4 C5 . D5 . C5 .', 'B4 . A4 . G#4 . F4 . E4:8 . . . . . . .')),
    T('flute', 0.05, bars('B4:8 . . . . . . . C5:8 . . . . . . .', 'B4:8 . . . . . . . G#4:8 . . . . . . .',
      'A4:8 . . . . . . . C5:8 . . . . . . .', 'B4:16 . . . . . . . . . . . . . . .')),
  ] });
  // Petra: slow and mysterious, oud-style twang over hand drums.
  Music.add('petra', { bpm: 96, tracks: [
    T('conga', 0.18, 'D4 . . A3 . . D4 . D4 . A3 . . . A3 .'),
    T('clap', 0.08, '. . . . x . . . . . . . x . . x'),
    T('shaker', 0.04, '. x . x . x . x . x . x . x . x'),
    T('bass', 0.3, bars('D2:6 . . . . . D2 . Eb2:4 . . . D2:4 . . .', 'C2:6 . . . . . C2 . D2:8 . . . . . . .')),
    T('twang', 0.09, bars('D4 Eb4 F#4 . G4 . A4 . Bb4 . A4 . G4 F#4 G4 .', 'A4:4 . . . F#4 . Eb4 . D4:8 . . . . . . .',
      'A4 . Bb4 . C5 . Bb4 . A4 . G4 . F#4 . G4 .', 'A4:4 . . . G4 F#4 Eb4 . D4:8 . . . . . . .')),
    T('flute', 0.04, bars('D5:16 . . . . . . . . . . . . . . .', 'C5:16 . . . . . . . . . . . . . . .')),
  ] });
  // Amazon: marimba samba with shakers and a flute.
  Music.add('amazon', { bpm: 120, tracks: [
    T('kick', 0.35, 'x . . x x . . . x . . x x . . .'),
    T('conga', 0.15, '. . G4 . . D4 . G4 . . G4 . D4 . G4 .'),
    T('shaker', 0.05, 'x x X x x x X x x x X x x x X x'),
    T('bass', 0.28, bars('G2 . . G2 . . D2 . G2 . . G2 . . B2 .', 'C3 . . C3 . . G2 . D3 . . D3 . . A2 .')),
    T('marimba', 0.1, bars('G4 B4 D5 . B4 . G4 . A4 . B4 D5 . B4 . .', 'C5 E5 G5 . E5 . C5 . D5 . F#5 A5 . F#5 . .')),
    T('flute', 0.07, bars('D5:4 . . . E5 . D5 . B4:4 . . . G4 . A4 .', 'B4:4 . . . C5 . B4 . A4:8 . . . . . . .',
      'G5:4 . . . E5 . D5 . B4:4 . . . D5 . E5 .', 'D5:12 . . . . . . . . . . . B4 . A4 .')),
  ] });
  // Outback: didgeridoo drone, clap sticks and a dusty guitar.
  Music.add('outback', { bpm: 100, tracks: [
    T('didge', 0.22, 'D2:8 . . . . . . . D2:6 . . . . . D2 D2'),
    T('block', 0.07, 'C6 . . C6 . . C6 . C6 . . C6 . . C6 .'),
    T('kick', 0.3, 'x . . . . . . . x . . . . . . .'),
    T('bass', 0.2, bars('D2:4 . . . D2 . . . C2:4 . . . C2 . . .', 'G1:4 . . . G1 . . . A1:4 . . . A1 . A1 .')),
    T('twang', 0.07, bars('A4 . . D5 . . F#5 . E5 . D5 . . A4 . .', 'B4 . . D5 . . E5 . F#5:4 . . . E5 . D5 .',
      'G4 . . B4 . . D5 . C5 . B4 . . G4 . .', 'A4:8 . . . . . . . . . . . . . . .')),
  ] });

  // ===================================================================
  // SCENERY: props (decoration) and solids (platforms/blocks)
  // ===================================================================
  Object.assign(Props, {
    // --- Tokyo ---
    tk_vending(ctx, x) {
      const y = GROUND_Y;
      ctx.globalAlpha = 0.15; circle(ctx, x + 24, y - 50, 55, '#e7f5ff'); ctx.globalAlpha = 1;
      fillRR(ctx, x, y - 92, 48, 92, 4, '#e03131'); rect(ctx, x + 4, y - 86, 30, 52, '#f8f9fa');
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) fillRR(ctx, x + 6 + k * 7, y - 82 + r * 16, 5, 12, 2, ['#4dabf7', '#ffd43b', '#69db7c', '#ff8787'][(r + k) % 4]);
      for (let k = 0; k < 4; k++) circle(ctx, x + 41, y - 80 + k * 8, 2, '#ffd43b');
      rect(ctx, x + 6, y - 26, 30, 10, '#212529');
    },
    tk_sakura(ctx, x) {
      const y = GROUND_Y;
      poly(ctx, [x - 7, y, x + 7, y, x + 5, y - 70, x + 32, y - 112, x + 25, y - 116, x, y - 84, x - 22, y - 114, x - 28, y - 110, x - 5, y - 70], '#4a2f2a');
      for (let i = 0; i < 10; i++) circle(ctx, x - 55 + hash(x + i) * 110, y - 160 + hash(i * 3 + x) * 60, 22 + hash(i + 7) * 10, i % 2 ? '#ffc9de' : '#faa2c1');
      for (let i = 0; i < 6; i++) {
        const k = (G.t * 0.6 + i * 40 + x) % 170;
        ellipse(ctx, x - 60 + hash(i + x) * 120 + Math.sin(G.t * 0.03 + i) * 10, y - 150 + k, 3, 2, '#ffdeeb', 0.5);
      }
    },
    tk_lamp(ctx, x) {
      const y = GROUND_Y, s = '#adb5bd';
      rect(ctx, x - 16, y - 8, 32, 8, s); rect(ctx, x - 6, y - 40, 12, 32, s); rect(ctx, x - 14, y - 48, 28, 8, s);
      rect(ctx, x - 11, y - 70, 22, 22, s);
      ctx.globalAlpha = 0.7 + Math.sin(G.t * 0.2 + x) * 0.2; rect(ctx, x - 6, y - 66, 12, 12, '#ffd43b'); ctx.globalAlpha = 1;
      poly(ctx, [x - 22, y - 70, x + 22, y - 70, x + 8, y - 84, x - 8, y - 84], '#868e96'); circle(ctx, x, y - 87, 4, '#868e96');
    },
    tk_torii(ctx, x) {
      const y = GROUND_Y, red = '#e03131';
      rect(ctx, x, y - 150, 12, 150, red); rect(ctx, x + 108, y - 150, 12, 150, red);
      rect(ctx, x - 10, y - 128, 140, 10, red);
      rect(ctx, x + 52, y - 146, 16, 18, red);
      rect(ctx, x - 16, y - 150, 152, 8, red);
      poly(ctx, [x - 26, y - 164, x + 146, y - 164, x + 136, y - 150, x - 16, y - 150], '#212529');
      rect(ctx, x - 2, y - 10, 16, 10, '#212529'); rect(ctx, x + 106, y - 10, 16, 10, '#212529');
    },
    tk_ramen(ctx, x) {
      const y = GROUND_Y;
      rect(ctx, x, y - 60, 120, 60, '#8b5e3c'); rect(ctx, x - 6, y - 66, 132, 8, '#6b4423');
      rect(ctx, x + 4, y - 112, 4, 48, '#6b4423'); rect(ctx, x + 112, y - 112, 4, 48, '#6b4423');
      poly(ctx, [x - 14, y - 110, x + 134, y - 110, x + 124, y - 126, x - 4, y - 126], '#495057');
      for (let i = 0; i < 4; i++) rect(ctx, x + 10 + i * 26, y - 108, 22, 26, '#1c3d6e');
      text(ctx, 'RAMEN', x + 60, y - 96, { size: 11, color: '#fff' });
      for (let i = 0; i < 3; i++) {
        ellipse(ctx, x + 26 + i * 34, y - 68, 10, 4, '#f8f9fa');
        ctx.globalAlpha = 0.35;
        for (let k = 0; k < 2; k++) line(ctx, x + 22 + i * 34 + k * 6, y - 74, x + 24 + i * 34 + k * 6 + Math.sin(G.t * 0.05 + i + k) * 3, y - 88, '#fff', 2);
        ctx.globalAlpha = 1;
      }
      ellipse(ctx, x + 128, y - 96, 7, 10, '#e03131'); rect(ctx, x + 125, y - 107, 6, 3, '#212529');
    },
    // --- Giza ---
    eg_palm(ctx, x) { palm(ctx, x, GROUND_Y, 1.25); },
    eg_obelisk(ctx, x) {
      const y = GROUND_Y;
      poly(ctx, [x - 16, y, x + 16, y, x + 11, y - 170, x - 11, y - 170], '#e0b46a');
      poly(ctx, [x, y, x + 16, y, x + 11, y - 170, x, y - 170], '#c4924a');
      poly(ctx, [x - 11, y - 170, x + 11, y - 170, x, y - 190], '#ffd43b');
      for (let i = 0; i < 7; i++) {
        const gy = y - 150 + i * 20;
        if (i % 3 === 0) circle(ctx, x - 3, gy, 3, '#8a5a2b');
        else if (i % 3 === 1) { line(ctx, x - 7, gy, x + 2, gy, '#8a5a2b', 2); line(ctx, x - 2, gy - 5, x - 2, gy + 5, '#8a5a2b', 2); }
        else poly(ctx, [x - 7, gy + 4, x - 2, gy - 5, x + 3, gy + 4], '#8a5a2b');
      }
    },
    eg_urns(ctx, x) {
      const y = GROUND_Y;
      for (const [dx, s] of [[0, 1], [24, 0.8], [44, 1.1]]) {
        ellipse(ctx, x + dx, y - 16 * s, 11 * s, 16 * s, '#c0763a'); rect(ctx, x + dx - 5 * s, y - 36 * s, 10 * s, 6 * s, '#a0612a');
        line(ctx, x + dx - 9 * s, y - 18 * s, x + dx + 9 * s, y - 18 * s, '#5c3d22', 1.5);
      }
    },
    eg_foot(ctx, x) { // a giant stone foot: all that's left of a statue
      const y = GROUND_Y, s = '#d4a259';
      fillRR(ctx, x, y - 50, 110, 50, 20, s); rect(ctx, x, y - 90, 50, 70, s);
      for (let i = 0; i < 5; i++) circle(ctx, x + 96 - i * 2, y - 40 + i * 9, 9 - i * 0.8, '#e0b46a');
      poly(ctx, [x, y - 90, x + 50, y - 90, x + 44, y - 98, x + 30, y - 92, x + 18, y - 100, x + 6, y - 92], s);
      line(ctx, x + 20, y - 70, x + 34, y - 50, '#b8863f', 2);
    },
    eg_tent(ctx, x) {
      const y = GROUND_Y;
      poly(ctx, [x, y, x + 60, y - 80, x + 120, y], '#f8f0dc');
      for (let i = 0; i < 4; i++) poly(ctx, [x + 15 + i * 30, y, x + 60, y - 80, x + 30 + i * 30, y], '#e03131');
      poly(ctx, [x + 46, y, x + 60, y - 40, x + 74, y], '#3b2a1a');
      line(ctx, x + 60, y - 80, x + 60, y - 96, '#868e96', 2); poly(ctx, [x + 60, y - 96, x + 74, y - 92, x + 60, y - 88], '#ffd43b');
    },
    // --- Petra ---
    pt_column(ctx, x) {
      const y = GROUND_Y;
      rect(ctx, x - 14, y - 12, 28, 12, '#c96f57'); rect(ctx, x - 10, y - 130, 20, 118, '#e8957a');
      for (let i = -1; i <= 1; i++) line(ctx, x + i * 5, y - 128, x + i * 5, y - 14, '#c96f57', 1.5);
      rect(ctx, x - 16, y - 142, 32, 12, '#c96f57'); poly(ctx, [x - 16, y - 142, x + 16, y - 142, x + 10, y - 150, x - 10, y - 150], '#d97a5f');
    },
    pt_tomb(ctx, x) { // a little tomb carved into a rock
      const y = GROUND_Y;
      fillRR(ctx, x, y - 150, 120, 150, 10, '#c4614b');
      for (let i = 0; i < 4; i++) line(ctx, x + 4, y - 130 + i * 30, x + 116, y - 126 + i * 30, 'rgba(255,200,170,0.25)', 3);
      for (let i = 0; i < 4; i++) { // crow-step crown
        rect(ctx, x + 18 + i * 10, y - 118 + i * 0, 8, 10 + i * 4, '#d97a5f'); rect(ctx, x + 94 - i * 10, y - 118, 8, 10 + i * 4, '#d97a5f');
      }
      rect(ctx, x + 22, y - 100, 76, 100, '#d97a5f'); rect(ctx, x + 44, y - 64, 32, 64, '#3b1f1a');
      rect(ctx, x + 38, y - 72, 44, 8, '#c4614b');
    },
    pt_rocks(ctx, x) {
      const y = GROUND_Y;
      ellipse(ctx, x, y - 12, 26, 14, '#b85c4a'); ellipse(ctx, x + 28, y - 8, 16, 10, '#c96f57'); ellipse(ctx, x - 22, y - 6, 12, 7, '#a85240');
    },
    pt_candle(ctx, x) { // paper-bag candles lining the path
      const y = GROUND_Y;
      for (let i = 0; i < 4; i++) {
        const cx = x + i * 30;
        fillRR(ctx, cx - 7, y - 18, 14, 18, 2, '#f8e1c2');
        ctx.globalAlpha = 0.5 + Math.sin(G.t * 0.25 + i + x) * 0.25; circle(ctx, cx, y - 9, 6, '#ffd43b'); ctx.globalAlpha = 1;
      }
    },
    // --- Amazon ---
    am_river(ctx, x, w = 150) { // drawn over the mud puddle: a river you shouldn't swim in
      const cx = x + w / 2;
      ellipse(ctx, cx, GROUND_Y + 3, w / 2 + 6, 9, '#1971c2');
      ellipse(ctx, cx, GROUND_Y + 1, w / 2 - 2, 5, '#339af0');
      for (let i = 0; i < 3; i++) line(ctx, cx - w / 2 + 20 + i * w / 3 + Math.sin(G.t * 0.05 + i) * 6, GROUND_Y + 1, cx - w / 2 + 34 + i * w / 3 + Math.sin(G.t * 0.05 + i) * 6, GROUND_Y + 1, 'rgba(255,255,255,0.6)', 1.5);
      ellipse(ctx, cx + w / 3, GROUND_Y + 2, 9, 3, '#37b24d');
    },
    am_fern(ctx, x) {
      const y = GROUND_Y;
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.35 + Math.sin(G.t * 0.03 + i + x) * 0.04;
        ellipse(ctx, x + Math.cos(a) * 28, y + Math.sin(a) * 28, 32, 6, i % 2 ? '#2f9e44' : '#37b24d', a);
      }
    },
    am_flower(ctx, x) {
      const y = GROUND_Y;
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * 18, y - 14 + Math.sin(a) * 7, 15, 8, '#e03131', a); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; circle(ctx, x + Math.cos(a) * 18, y - 14 + Math.sin(a) * 7, 2.5, '#fff3bf'); }
      ellipse(ctx, x, y - 14, 10, 5, '#5c1a1a');
    },
    am_sign(ctx, x) {
      const y = GROUND_Y;
      rect(ctx, x - 3, y - 70, 6, 70, '#6b4423');
      fillRR(ctx, x - 50, y - 100, 100, 40, 4, '#8b5e3c');
      text(ctx, 'NO SWIMMING', x, y - 90, { size: 10, color: '#fff3bf' });
      line(ctx, x - 22, y - 74, x + 12, y - 74, '#fff3bf', 2);
      for (let i = 0; i < 4; i++) line(ctx, x - 14 + i * 7, y - 79, x - 14 + i * 7, y - 69, '#fff3bf', 1.5);
      poly(ctx, [x + 12, y - 74, x + 22, y - 80, x + 22, y - 68], '#fff3bf');
    },
    // --- Outback ---
    oz_gum(ctx, x) { gumTree(ctx, x, GROUND_Y, 1.9, '#e9ecef', 'rgba(116,160,67,0.85)'); }, // tall enough for drop bears
    oz_sign(ctx, x) {
      const y = GROUND_Y;
      rect(ctx, x - 3, y - 80, 6, 80, '#868e96');
      ctx.save(); ctx.translate(x, y - 110); ctx.rotate(Math.PI / 4); fillRR(ctx, -26, -26, 52, 52, 4, '#fab005'); ctx.restore();
      // a kangaroo silhouette
      ellipse(ctx, x - 2, y - 106, 8, 11, '#212529'); circle(ctx, x + 6, y - 120, 5, '#212529'); line(ctx, x - 6, y - 98, x - 18, y - 92, '#212529', 4);
      line(ctx, x + 2, y - 98, x + 10, y - 94, '#212529', 3); line(ctx, x + 4, y - 124, x + 3, y - 131, '#212529', 2);
    },
    oz_tank(ctx, x) {
      const y = GROUND_Y;
      for (const px of [x + 6, x + 70]) rect(ctx, px, y - 50, 6, 50, '#6b4423');
      rect(ctx, x, y - 54, 82, 6, '#8b5e3c');
      rect(ctx, x + 4, y - 130, 74, 76, '#adb5bd');
      for (let i = 0; i < 8; i++) rect(ctx, x + 4, y - 128 + i * 10, 74, 2, '#868e96');
      poly(ctx, [x, y - 130, x + 82, y - 130, x + 41, y - 146], '#868e96');
    },
    oz_skull(ctx, x) {
      const y = GROUND_Y;
      ellipse(ctx, x, y - 8, 12, 9, '#f1f3f5'); circle(ctx, x - 4, y - 9, 2.5, '#495057'); circle(ctx, x + 4, y - 9, 2.5, '#495057');
      line(ctx, x - 10, y - 14, x - 24, y - 24, '#f1f3f5', 4); line(ctx, x + 10, y - 14, x + 24, y - 24, '#f1f3f5', 4);
    },
  });

  Object.assign(SolidArt, {
    // --- Tokyo ---
    tk_awning(ctx, s) {
      for (const px of [s.x + 6, s.x + s.w - 10]) rect(ctx, px, s.y + 10, 4, GROUND_Y - s.y - 10, '#495057');
      const cols = [['#e03131', '#f8f9fa'], ['#1c7ed6', '#f8f9fa'], ['#2b8a3e', '#f8f9fa']][Math.floor(s.x / 300) % 3];
      for (let i = 0; i < s.w; i += 20) rect(ctx, s.x + i, s.y, Math.min(20, s.w - i), 12, cols[(i / 20) % 2]);
      for (let i = 0; i < s.w; i += 20) circle(ctx, s.x + i + 10, s.y + 12, 10, cols[(i / 20) % 2]);
      ctx.globalAlpha = 0.2; rect(ctx, s.x + 10, s.y + 22, s.w - 20, GROUND_Y - s.y - 22, '#ffd43b'); ctx.globalAlpha = 1;
    },
    tk_roof(ctx, s) {
      rect(ctx, s.x + 14, s.y + 12, 8, GROUND_Y - s.y - 12, '#7f2d2d'); rect(ctx, s.x + s.w - 22, s.y + 12, 8, GROUND_Y - s.y - 12, '#7f2d2d');
      rect(ctx, s.x + 22, s.y + 30, s.w - 44, GROUND_Y - s.y - 30, '#f1e3c8');
      for (let i = s.x + 34; i < s.x + s.w - 30; i += 14) line(ctx, i, s.y + 32, i, GROUND_Y - 4, '#c9b48e', 1.5);
      for (let j = s.y + 46; j < GROUND_Y; j += 16) line(ctx, s.x + 24, j, s.x + s.w - 24, j, '#c9b48e', 1.5);
      poly(ctx, [s.x - 12, s.y + 14, s.x + s.w + 12, s.y + 14, s.x + s.w - 6, s.y, s.x + 6, s.y], '#343a40');
      poly(ctx, [s.x - 12, s.y + 14, s.x - 20, s.y + 1, s.x + 4, s.y + 8], '#343a40');
      poly(ctx, [s.x + s.w + 12, s.y + 14, s.x + s.w + 20, s.y + 1, s.x + s.w - 4, s.y + 8], '#343a40');
      for (let i = s.x; i < s.x + s.w; i += 12) line(ctx, i, s.y + 2, i - 4, s.y + 13, '#495057', 1.5);
    },
    tk_crate(ctx, s) {
      rect(ctx, s.x, s.y + s.h * 0.45, s.w, s.h * 0.55, '#c9a46b'); rect(ctx, s.x + 6, s.y, s.w - 12, s.h * 0.45, '#d9b67b');
      rect(ctx, s.x + s.w / 2 - 4, s.y, 8, s.h, 'rgba(230,57,70,0.6)');
      rect(ctx, s.x + 8, s.y + s.h * 0.6, 16, 10, '#f8f9fa');
    },
    tk_cooler(ctx, s) {
      fillRR(ctx, s.x, s.y, s.w, s.h, 4, '#1c7ed6');
      rect(ctx, s.x + 5, s.y + 8, s.w - 10, s.h - 14, '#d0ebff');
      for (let i = 0; i < Math.floor((s.w - 14) / 8); i++) fillRR(ctx, s.x + 8 + i * 8, s.y + 14, 5, s.h - 24, 2, ['#69db7c', '#ff8787', '#ffd43b'][i % 3]);
      rect(ctx, s.x, s.y, s.w, 6, '#1864ab');
    },
    // --- Giza ---
    eg_slab(ctx, s) {
      for (const px of [s.x + 10, s.x + s.w - 26]) { rect(ctx, px, s.y + 14, 16, GROUND_Y - s.y - 14, '#d9b26a'); rect(ctx, px - 3, s.y + 14, 22, 6, '#c4924a'); }
      rect(ctx, s.x, s.y, s.w, 14, '#e8c27a'); rect(ctx, s.x, s.y + 10, s.w, 4, '#c4924a');
      for (let i = s.x + 12, k = 0; i < s.x + s.w - 10; i += 18, k++) {
        if (k % 3 === 0) circle(ctx, i, s.y + 6, 2.5, '#8a5a2b');
        else if (k % 3 === 1) line(ctx, i - 4, s.y + 6, i + 4, s.y + 6, '#8a5a2b', 2);
        else poly(ctx, [i - 4, s.y + 9, i, s.y + 2, i + 4, s.y + 9], '#8a5a2b');
      }
    },
    eg_scaffold(ctx, s) {
      for (const px of [s.x + 8, s.x + s.w - 14]) rect(ctx, px, s.y + 8, 6, GROUND_Y - s.y - 8, '#8b5e3c');
      line(ctx, s.x + 11, s.y + 12, s.x + s.w - 11, GROUND_Y - 6, '#8b5e3c', 4); line(ctx, s.x + s.w - 11, s.y + 12, s.x + 11, GROUND_Y - 6, '#8b5e3c', 4);
      fillRR(ctx, s.x, s.y, s.w, 12, 3, '#a87b54'); for (let i = 10; i < s.w; i += 24) line(ctx, s.x + i, s.y + 2, s.x + i, s.y + 10, '#6b4423', 1.5);
    },
    eg_stone(ctx, s) {
      rect(ctx, s.x, s.y, s.w, s.h, '#d9b26a'); rect(ctx, s.x, s.y, s.w, 5, '#e8c27a');
      line(ctx, s.x, s.y + s.h / 2, s.x + s.w, s.y + s.h / 2, '#b8863f', 2); line(ctx, s.x + s.w / 2, s.y, s.x + s.w / 2, s.y + s.h / 2, '#b8863f', 2);
    },
    eg_pillar(ctx, s) {
      rect(ctx, s.x + 4, s.y + 6, s.w - 8, s.h - 6, '#e0b46a');
      for (let i = s.x + 10; i < s.x + s.w - 6; i += 8) line(ctx, i, s.y + 8, i, s.y + s.h, '#c4924a', 1.5);
      poly(ctx, [s.x + 4, s.y + 8, s.x + 14, s.y, s.x + 24, s.y + 6, s.x + 34, s.y - 2, s.x + s.w - 4, s.y + 8], '#e0b46a');
      rect(ctx, s.x, s.y + s.h - 6, s.w, 6, '#c4924a');
    },
    // --- Petra ---
    pt_ledge(ctx, s) {
      poly(ctx, [s.x + 14, s.y + 12, s.x + s.w - 14, s.y + 12, s.x + s.w - 30, GROUND_Y, s.x + 30, GROUND_Y], '#b85c4a');
      for (let j = s.y + 30; j < GROUND_Y; j += 22) line(ctx, s.x + 24, j, s.x + s.w - 24, j + 4, 'rgba(255,200,170,0.25)', 3);
      rect(ctx, s.x, s.y, s.w, 12, '#e8957a');
      for (let i = s.x + 4; i < s.x + s.w - 4; i += 10) rect(ctx, i, s.y + 12, 6, 5, '#c96f57');
    },
    pt_arch(ctx, s) {
      rect(ctx, s.x, s.y, s.w, 14, '#e8957a');
      rect(ctx, s.x + 6, s.y + 14, s.w - 12, 22, '#d97a5f');
      for (const px of [s.x + 6, s.x + s.w - 30]) rect(ctx, px, s.y + 14, 24, GROUND_Y - s.y - 14, '#d97a5f');
      ctx.fillStyle = '#7a3b2e'; ctx.beginPath(); ctx.moveTo(s.x + 30, GROUND_Y); ctx.lineTo(s.x + 30, s.y + 60);
      ctx.arc(s.x + s.w / 2, s.y + 60, (s.w - 60) / 2, Math.PI, 0); ctx.lineTo(s.x + s.w - 30, GROUND_Y); ctx.closePath(); ctx.fill();
    },
    pt_boulder(ctx, s) {
      ellipse(ctx, s.x + s.w / 2, s.y + s.h / 2 + 2, s.w / 2 + 2, s.h / 2 + 2, '#a85240');
      ellipse(ctx, s.x + s.w / 2 - 4, s.y + s.h / 2 - 4, s.w / 2 - 6, s.h / 2 - 6, '#c96f57');
      line(ctx, s.x + 10, s.y + s.h / 2, s.x + s.w - 14, s.y + s.h / 2 + 6, 'rgba(255,220,200,0.35)', 2);
    },
    pt_block(ctx, s) {
      rect(ctx, s.x, s.y, s.w, s.h, '#d97a5f'); rect(ctx, s.x, s.y, s.w, 6, '#e8957a');
      rect(ctx, s.x + 8, s.y + 14, s.w - 16, s.h - 22, '#c4614b');
    },
    // --- Amazon ---
    am_log(ctx, s) {
      for (const px of [s.x + 12, s.x + s.w - 20]) rect(ctx, px, s.y + 10, 8, GROUND_Y - s.y + 4, '#5c3d2e');
      fillRR(ctx, s.x, s.y, s.w, 16, 8, '#8b5e3c'); line(ctx, s.x + 6, s.y + 5, s.x + s.w - 6, s.y + 5, '#a87b54', 2);
      circle(ctx, s.x + 8, s.y + 8, 6, '#c9a46b'); circle(ctx, s.x + 8, s.y + 8, 3, '#a87b54');
      for (let i = 20; i < s.w - 10; i += 40) ellipse(ctx, s.x + i, s.y + 1, 8, 3, '#37b24d');
      ctx.strokeStyle = '#d9c29a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(s.x + 16, s.y - 20); ctx.quadraticCurveTo(s.x + s.w / 2, s.y - 4, s.x + s.w - 16, s.y - 20); ctx.stroke();
      line(ctx, s.x + 16, s.y - 22, s.x + 16, s.y, '#5c3d2e', 3); line(ctx, s.x + s.w - 16, s.y - 22, s.x + s.w - 16, s.y, '#5c3d2e', 3);
    },
    am_branch(ctx, s) {
      const tx = s.x + 18;
      rect(ctx, tx - 14, 0, 28, GROUND_Y, '#5c3d2e');
      poly(ctx, [tx - 14, GROUND_Y, tx - 30, GROUND_Y, tx - 14, GROUND_Y - 40], '#5c3d2e'); poly(ctx, [tx + 14, GROUND_Y, tx + 30, GROUND_Y, tx + 14, GROUND_Y - 40], '#5c3d2e');
      line(ctx, tx - 6, 40, tx - 4, GROUND_Y - 10, '#4a3022', 2);
      fillRR(ctx, s.x, s.y, s.w, 14, 7, '#6b4423');
      for (let i = 30; i < s.w; i += 34) { ellipse(ctx, s.x + i, s.y - 2, 14, 5, '#2f9e44', -0.3); ellipse(ctx, s.x + i + 10, s.y + 14, 10, 4, '#37b24d', 0.5); }
    },
    am_stump(ctx, s) {
      rect(ctx, s.x + 4, s.y + 6, s.w - 8, s.h - 6, '#6b4423'); ellipse(ctx, s.x + s.w / 2, s.y + 6, s.w / 2 - 4, 6, '#c9a46b');
      ctx.strokeStyle = '#a87b54'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + 6, s.w / 4, 3, 0, 0, Math.PI * 2); ctx.stroke();
      ellipse(ctx, s.x + 10, s.y + s.h - 4, 8, 4, '#37b24d');
    },
    am_rock(ctx, s) {
      fillRR(ctx, s.x, s.y, s.w, s.h, 16, '#6c757d'); fillRR(ctx, s.x + 4, s.y, s.w - 8, 14, 8, '#2f9e44');
      ellipse(ctx, s.x + 16, s.y + 24, 8, 4, '#868e96');
    },
    // --- Outback ---
    oz_shed(ctx, s) {
      for (const px of [s.x + 8, s.x + s.w - 14]) rect(ctx, px, s.y + 8, 6, GROUND_Y - s.y - 8, '#6b4423');
      rect(ctx, s.x - 6, s.y, s.w + 12, 12, '#adb5bd');
      for (let i = s.x - 6; i < s.x + s.w + 6; i += 8) rect(ctx, i, s.y, 3, 12, '#868e96');
      ctx.globalAlpha = 0.5; rect(ctx, s.x + 40, s.y + 2, 20, 8, '#c75a35'); ctx.globalAlpha = 1;
    },
    oz_stand(ctx, s) {
      for (const px of [s.x + 8, s.x + s.w - 16]) rect(ctx, px, s.y + 10, 8, GROUND_Y - s.y - 10, '#8b5e3c');
      line(ctx, s.x + 12, s.y + 14, s.x + s.w - 12, GROUND_Y - 8, '#8b5e3c', 3); line(ctx, s.x + s.w - 12, s.y + 14, s.x + 12, GROUND_Y - 8, '#8b5e3c', 3);
      fillRR(ctx, s.x, s.y, s.w, 12, 3, '#a87b54');
    },
    oz_drum(ctx, s) {
      const n = Math.max(1, Math.round(s.w / 26)), w = s.w / n;
      for (let i = 0; i < n; i++) {
        fillRR(ctx, s.x + i * w + 1, s.y, w - 2, s.h, 4, ['#c92a2a', '#1c7ed6', '#2b8a3e'][i % 3]);
        rect(ctx, s.x + i * w + 1, s.y + s.h * 0.3, w - 2, 3, 'rgba(0,0,0,0.3)'); rect(ctx, s.x + i * w + 1, s.y + s.h * 0.7, w - 2, 3, 'rgba(0,0,0,0.3)');
      }
      ellipse(ctx, s.x + s.w / 2, s.y + 2, s.w / 2 - 2, 3, 'rgba(255,255,255,0.25)');
    },
  });

  // ===================================================================
  // BACKGROUND PIECES
  // ===================================================================
  function sphinx(ctx, x, y) {
    const s = '#d4a259', d = '#b8863f';
    ellipse(ctx, x - 150, y - 30, 32, 30, s);
    rect(ctx, x - 150, y - 56, 210, 56, s);
    rect(ctx, x + 50, y - 18, 90, 18, s); line(ctx, x + 60, y - 9, x + 138, y - 9, d, 2);
    rect(ctx, x + 36, y - 112, 72, 82, s);
    poly(ctx, [x + 24, y - 64, x + 44, y - 150, x + 100, y - 150, x + 120, y - 64], d);
    for (let i = 0; i < 6; i++) line(ctx, x + 30 + i * 3, y - 130 + i * 12, x + 114 - i * 3, y - 130 + i * 12, '#a3762f', 2);
    rect(ctx, x + 56, y - 142, 32, 46, s);
    circle(ctx, x + 64, y - 128, 2.5, '#6b4423'); circle(ctx, x + 80, y - 128, 2.5, '#6b4423');
    rect(ctx, x + 70, y - 122, 4, 6, '#a3762f'); line(ctx, x + 64, y - 108, x + 80, y - 108, '#6b4423', 2);
  }
  function treasury(ctx, x, base) { // the carved facade
    const f = '#e8957a', m = '#c96f57', d = '#7a3b2e';
    rect(ctx, x - 150, base - 300, 300, 300, 'rgba(201,111,87,0.35)');
    rect(ctx, x - 130, base - 140, 260, 140, f);
    for (let i = 0; i < 6; i++) { rect(ctx, x - 122 + i * 48, base - 130, 14, 130, m); rect(ctx, x - 126 + i * 48, base - 140, 22, 8, d); }
    poly(ctx, [x - 70, base - 150, x + 70, base - 150, x, base - 190], f);
    poly(ctx, [x - 54, base - 154, x + 54, base - 154, x, base - 182], m);
    rect(ctx, x - 140, base - 154, 280, 10, m);
    rect(ctx, x - 18, base - 100, 36, 100, d);
    rect(ctx, x - 130, base - 290, 70, 100, f); rect(ctx, x + 60, base - 290, 70, 100, f);
    for (const px of [x - 124, x - 80, x + 66, x + 110]) rect(ctx, px, base - 280, 10, 90, m);
    poly(ctx, [x - 130, base - 290, x - 60, base - 290, x - 60, base - 312], m); poly(ctx, [x + 60, base - 290, x + 130, base - 290, x + 60, base - 312], m);
    rect(ctx, x - 32, base - 290, 64, 100, f);
    for (const px of [x - 28, x - 6, x + 16]) rect(ctx, px, base - 282, 10, 92, m);
    poly(ctx, [x - 34, base - 290, x + 34, base - 290, x, base - 330], m);
    ellipse(ctx, x, base - 336, 8, 10, f);
    rect(ctx, x - 140, base - 196, 280, 8, d);
  }
  function waterfall(ctx, x) {
    poly(ctx, [x - 140, 470, x - 110, 140, x - 40, 100, x + 60, 110, x + 130, 160, x + 160, 470], '#5c7c3a');
    poly(ctx, [x - 110, 470, x - 90, 180, x - 40, 140, x + 30, 150, x + 100, 190, x + 120, 470], '#495057');
    rect(ctx, x - 30, 110, 60, 360, '#74c0fc');
    for (let k = 0; k < 10; k++) rect(ctx, x - 26 + (k % 4) * 15, 110 + ((G.t * 3 + k * 37) % 340), 4, 22, 'rgba(255,255,255,0.7)');
    ctx.globalAlpha = 0.5; ellipse(ctx, x, 440, 80, 26, '#f1f3f5'); ctx.globalAlpha = 1;
    for (let i = 0; i < 5; i++) circle(ctx, x - 120 + i * 60, 110 + hash(i + x) * 30, 28, '#2f9e44');
  }
  function bigTree(ctx, x, i) {
    rect(ctx, x - 22, 60, 44, 410, '#4a3324');
    poly(ctx, [x - 22, 470, x - 56, 470, x - 22, 400], '#4a3324'); poly(ctx, [x + 22, 470, x + 56, 470, x + 22, 400], '#4a3324');
    line(ctx, x - 8, 80, x - 6, 450, '#3b2a1a', 2);
    for (let k = 0; k < 5; k++) circle(ctx, x - 70 + k * 35, 60 + hash(i * 3 + k) * 40, 44, k % 2 ? '#2b8a3e' : '#2f9e44');
  }
  function uluru(ctx, x, y) {
    fillRR(ctx, x - 330, y - 120, 660, 150, 70, '#c2410c');
    fillRR(ctx, x - 300, y - 120, 600, 60, 40, '#d9480f');
    for (let i = 0; i < 9; i++) line(ctx, x - 260 + i * 64, y - 108 + (i % 3) * 6, x - 250 + i * 64, y - 10, 'rgba(120,40,10,0.5)', 3);
  }
  function windmill(ctx, x, y) {
    line(ctx, x - 22, y, x - 4, y - 160, '#495057', 3); line(ctx, x + 22, y, x + 4, y - 160, '#495057', 3);
    for (let k = 0; k < 4; k++) line(ctx, x - 20 + k * 4, y - 30 - k * 36, x + 20 - k * 4, y - 66 - k * 36, '#495057', 1.5);
    const a0 = G.t * 0.05;
    for (let k = 0; k < 12; k++) { const a = a0 + k * Math.PI / 6; line(ctx, x, y - 166, x + Math.cos(a) * 36, y - 166 + Math.sin(a) * 36, '#868e96', 3); }
    circle(ctx, x, y - 166, 5, '#343a40');
    poly(ctx, [x, y - 170, x + 50, y - 176, x + 50, y - 156, x, y - 162], '#868e96');
  }

  // ===================================================================
  // LEVELS
  // ===================================================================
  const NEON = ['#ff4dc4', '#4dd2ff', '#ffe14d', '#7dff6b', '#ff7a4d'];
  const NEON_WORDS = ['RAMEN', 'KARAOKE', 'ARCADE', 'SUSHI', 'NOODLES', 'GAMES', 'HOTEL', 'TEA'];

  const TOKYO = {
    name: 'TOKYO NEON NIGHTS', sub: 'Bob fled to Japan. He keeps bowing to vending machines.',
    length: 5200, music: 'tokyo', goonThrow: 'tk_soda', goonCap: '#e64980',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain'], bobFood: ['tk_sushi', 'tk_soda', 'chicken'], bobSpeed: 1.36,
    platforms: [[450, 365, 170, 'tk_awning'], [720, 320, 150, 'tk_roof'], [1100, 360, 220, 'tk_awning'], [1450, 365, 180, 'tk_awning'],
      [1700, 315, 150, 'tk_roof'], [2150, 360, 220, 'tk_awning'], [2550, 365, 170, 'tk_awning'], [2800, 320, 150, 'tk_roof'],
      [3200, 360, 220, 'tk_awning'], [3550, 365, 170, 'tk_awning'], [3800, 320, 150, 'tk_roof'], [4400, 360, 140, 'tk_awning'], [4860, 330, 140, 'tk_roof']],
    blocks: [[950, 50, 46, 'tk_crate'], [2000, 56, 52, 'tk_cooler'], [3000, 50, 46, 'tk_crate'], [4000, 56, 52, 'tk_cooler']],
    props: [['tk_torii', 230], ['tk_vending', 660], ['tk_sakura', 1000], ['tk_lamp', 1380], ['tk_ramen', 1880], ['tk_sakura', 2450],
      ['tk_vending', 2720], ['tk_torii', 3080], ['tk_lamp', 3500], ['tk_sakura', 3880], ['bobsign', 4290]],
    spawns: [[600, 'ninja', 1], [850, 'rat', 2], [1100, 'vendbot', 1], [1350, 'ninja', 1], [1600, 'fly', 3], [1850, 'sumo', 1],
      [2150, 'ninja', 2], [2400, 'vendbot', 1], [2650, 'rat', 3], [2900, 'sumo', 1], [3150, 'ninja', 2], [3400, 'vendbot', 1],
      [3650, 'fly', 3], [3900, 'sumo', 1], [4050, 'ninja', 1]],
    pickups: [[500, 'ammo'], [1250, 'pie'], [1750, 'nade'], [2300, 'pie'], [2900, 'ammo'], [3450, 'pie'], [3950, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#0b0b2b', '#2a1b5c', '#7b2d6b']);
      for (let i = 0; i < 40; i++) circle(ctx, hash(i) * W, hash(i + 9) * 200, 1.1, 'rgba(255,255,255,0.7)');
      const fx = 640 - camX * 0.02;
      poly(ctx, [fx - 280, 340, fx - 50, 175, fx + 50, 175, fx + 280, 340], '#3b3a6b');
      poly(ctx, [fx - 50, 175, fx + 50, 175, fx + 72, 192, fx + 42, 204, fx + 22, 190, fx, 206, fx - 26, 190, fx - 46, 202, fx - 72, 192], '#e7e9ff');
      repeatX(camX, 0.1, 90, (sx, i) => {
        const h = 50 + hash(i) * 95;
        rect(ctx, sx, 370 - h, 74, h + 100, '#1d1840');
        for (let k = 0; k < 6; k++) if (hash(i * 7 + k) > 0.5) rect(ctx, sx + 8 + (k % 3) * 22, 380 - h + 12 + Math.floor(k / 3) * 20, 10, 6, 'rgba(255,230,150,0.5)');
      });
      repeatX(camX, 0.12, 2200, (sx) => { // a red lattice tower
        const tx = sx + 1300;
        poly(ctx, [tx - 60, 380, tx - 6, 120, tx + 6, 120, tx + 60, 380], 'rgba(224,49,49,0.85)');
        poly(ctx, [tx - 40, 380, tx - 4, 160, tx + 4, 160, tx + 40, 380], '#1d1840');
        rect(ctx, tx - 36, 250, 72, 10, '#f8f9fa'); rect(ctx, tx - 22, 190, 44, 8, '#f8f9fa');
        line(ctx, tx, 120, tx, 80, '#e03131', 3); circle(ctx, tx, 78, 3, G.t % 60 < 30 ? '#ff6b6b' : '#7a1f1f');
      });
      repeatX(camX, 0.35, 230, (sx, i) => {
        const h = 110 + hash(i + 3) * 100, top = 430 - h;
        rect(ctx, sx, top, 196, h + 60, '#2b2350');
        for (let r = 0; r < 6; r++) for (let k = 0; k < 5; k++) if (hash(i * 31 + r * 5 + k) > 0.45) rect(ctx, sx + 12 + k * 36, top + 50 + r * 24, 20, 10, 'rgba(255,212,120,0.45)');
        const col = NEON[((i % 5) + 5) % 5], word = NEON_WORDS[((i % 8) + 8) % 8];
        const on = (G.t + i * 37) % 160 > 4;
        fillRR(ctx, sx + 20, top + 10, 150, 30, 6, '#120d26');
        ctx.globalAlpha = on ? 0.25 : 0.05; fillRR(ctx, sx + 14, top + 4, 162, 42, 10, col); ctx.globalAlpha = 1;
        text(ctx, word, sx + 95, top + 25, { size: 16, color: on ? col : '#3a3358' });
        fillRR(ctx, sx + 170, top + 50, 18, 90, 4, on ? col : '#3a3358');
      });
      repeatX(camX, 0.7, 320, (sx, i) => { // strings of paper lanterns
        ctx.strokeStyle = '#212529'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx, 70); ctx.quadraticCurveTo(sx + 160, 120, sx + 320, 70); ctx.stroke();
        for (let k = 1; k < 6; k++) {
          const lx = sx + k * 53, ly = 70 + Math.sin(k / 6 * Math.PI) * 25 + 10;
          ctx.globalAlpha = 0.25; circle(ctx, lx, ly, 14, '#ffd43b'); ctx.globalAlpha = 1;
          ellipse(ctx, lx, ly, 8, 11, k % 2 ? '#e03131' : '#f08c00'); rect(ctx, lx - 4, ly - 13, 8, 3, '#212529');
        }
      });
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#2b2b36');
      rect(ctx, x0, GROUND_Y, x1 - x0, 5, '#495057');
      for (let i = Math.floor(x0 / 600); i < x1 / 600 + 1; i++) for (let k = 0; k < 6; k++) rect(ctx, i * 600 + 200 + k * 26, GROUND_Y + 14, 16, 50, 'rgba(248,249,250,0.75)');
      for (let i = Math.floor(x0 / 70); i < x1 / 70 + 1; i++) {
        ctx.globalAlpha = 0.18; rect(ctx, i * 70 + hash(i) * 30, GROUND_Y + 20 + hash(i + 1) * 40, 26, 3, NEON[((i % 5) + 5) % 5]); ctx.globalAlpha = 1;
      }
    },
  };

  const GIZA = {
    name: 'PYRAMIDS OF GIZA', sub: 'Bob says he built these. He did not build these.',
    length: 5200, music: 'giza', goonThrow: 'eg_pot', goonCap: '#f08c00',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'rain', 'spray'], bobFood: ['eg_pot', 'eg_spit', 'chicken'], bobSpeed: 1.38,
    platforms: [[430, 365, 180, 'eg_slab'], [700, 320, 150, 'eg_scaffold'], [1080, 360, 220, 'eg_slab'], [1430, 365, 170, 'eg_slab'],
      [1680, 318, 150, 'eg_scaffold'], [2150, 360, 220, 'eg_slab'], [2520, 365, 180, 'eg_slab'], [2790, 320, 150, 'eg_scaffold'],
      [3180, 360, 220, 'eg_slab'], [3540, 365, 170, 'eg_slab'], [3790, 320, 150, 'eg_scaffold'], [4400, 360, 140, 'eg_slab'], [4860, 330, 140, 'eg_scaffold']],
    blocks: [[950, 54, 46, 'eg_stone'], [1960, 44, 56, 'eg_pillar'], [3020, 54, 46, 'eg_stone'], [4010, 44, 56, 'eg_pillar']],
    props: [['eg_palm', 260], ['eg_urns', 640], ['eg_obelisk', 1000], ['eg_tent', 1300], ['eg_foot', 1820], ['eg_palm', 2420],
      ['eg_urns', 2700], ['eg_obelisk', 3100], ['eg_tent', 3420], ['eg_palm', 3920], ['bobsign', 4290]],
    spawns: [[600, 'scarab', 2], [850, 'mummy', 1], [1100, 'snake', 2], [1350, 'camel', 1], [1600, 'scarab', 3], [1850, 'mummy', 2],
      [2150, 'fly', 3], [2400, 'camel', 1], [2650, 'scarab', 3], [2900, 'mummy', 2], [3150, 'snake', 2], [3400, 'camel', 1],
      [3650, 'scarab', 3], [3900, 'mummy', 2]],
    pickups: [[520, 'ammo'], [1200, 'pie'], [1750, 'nade'], [2250, 'pie'], [2850, 'ammo'], [3300, 'pie'], [3850, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#ffa94d', '#ffd8a8', '#fff4e6']);
      ctx.globalAlpha = 0.35; circle(ctx, 760, 110, 80, '#fff3bf'); ctx.globalAlpha = 1; circle(ctx, 760, 110, 46, '#fff9db');
      repeatX(camX, 0.04, 1300, (sx) => {
        pyramid(ctx, sx + 300, 370, 175, '#e0b46a', '#c4924a');
        pyramid(ctx, sx + 580, 370, 130, '#e3ba73', '#c99a52');
        pyramid(ctx, sx + 760, 370, 80, '#e6c07c', '#cda25c');
      });
      ridge(ctx, camX, 0.12, 385, 22, 0.006, '#e9b872', 2);
      repeatX(camX, 0.2, 2200, (sx) => sphinx(ctx, sx + 900, 410));
      ridge(ctx, camX, 0.3, 425, 16, 0.01, '#deaa5f', 5);
      repeatX(camX, 0.45, 420, (sx, i) => { if (hash(i) > 0.35) palm(ctx, sx + 100, 448, 0.85 + hash(i + 3) * 0.3, '#7a5230', '#2b8a3e'); });
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#e2b66d');
      rect(ctx, x0, GROUND_Y, x1 - x0, 5, '#edc483');
      ctx.strokeStyle = '#cf9f55'; ctx.lineWidth = 2;
      for (let i = Math.floor(x0 / 60); i < x1 / 60 + 1; i++) {
        const bx = i * 60 + hash(i) * 20, by = GROUND_Y + 16 + hash(i + 4) * 44;
        ctx.beginPath(); ctx.arc(bx, by + 10, 18, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
      }
    },
  };

  const PETRA = {
    name: 'PETRA CANYON', sub: 'A whole city carved in rose-red rock. Bob is carving his name in it.',
    length: 5200, music: 'petra', goonThrow: 'pt_rock', goonCap: '#c2255c',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain', 'spray'], bobFood: ['pt_rock', 'pt_bone', 'chicken'], bobSpeed: 1.40,
    platforms: [[440, 365, 170, 'pt_ledge'], [700, 318, 160, 'pt_arch'], [1100, 360, 210, 'pt_ledge'], [1450, 365, 170, 'pt_ledge'],
      [1700, 320, 160, 'pt_arch'], [2150, 360, 210, 'pt_ledge'], [2540, 365, 170, 'pt_ledge'], [2800, 318, 160, 'pt_arch'],
      [3200, 360, 210, 'pt_ledge'], [3550, 365, 170, 'pt_ledge'], [3800, 320, 160, 'pt_arch'], [4400, 360, 140, 'pt_ledge'], [4860, 330, 140, 'pt_arch']],
    blocks: [[960, 50, 48, 'pt_boulder'], [2000, 56, 52, 'pt_block'], [3030, 50, 48, 'pt_boulder'], [4010, 56, 52, 'pt_block']],
    props: [['pt_column', 250], ['pt_candle', 620], ['pt_tomb', 1320], ['pt_rocks', 1650], ['pt_column', 1930], ['pt_candle', 2400],
      ['pt_tomb', 2980], ['pt_rocks', 3450], ['pt_column', 3720], ['pt_candle', 4050], ['bobsign', 4290]],
    spawns: [[600, 'vulture', 1, 140], [850, 'ibex', 1], [1100, 'scorpion', 1], [1350, 'snake', 2], [1600, 'vulture', 2, 140],
      [1850, 'ibex', 2], [2150, 'scorpion', 1], [2400, 'goon', 1], [2650, 'vulture', 2, 130], [2900, 'ibex', 1],
      [3150, 'scorpion', 2], [3400, 'snake', 2], [3650, 'ibex', 2], [3900, 'vulture', 2, 140], [4050, 'scorpion', 1]],
    pickups: [[520, 'ammo'], [1250, 'pie'], [1780, 'nade'], [2300, 'pie'], [2880, 'ammo'], [3350, 'pie'], [3880, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#ffb38a', '#ffd8b0', '#ffe9d6']);
      ridge(ctx, camX, 0.05, 165, 45, 0.01, '#d97a5f', 1);
      ctx.globalAlpha = 0.35;
      for (let k = 0; k < 6; k++) {
        ctx.strokeStyle = k % 2 ? '#f0a58c' : '#b85c4a'; ctx.lineWidth = 6; ctx.beginPath();
        for (let sx = 0; sx <= W; sx += 20) ctx.lineTo(sx, 220 + k * 40 + Math.sin((sx + camX * 0.05) * 0.008 + k) * 12);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      repeatX(camX, 0.12, 1700, (sx) => treasury(ctx, sx + 700, 420));
      repeatX(camX, 0.35, 620, (sx, i) => {
        if (hash(i) < 0.45) return;
        const cx = sx + hash(i + 2) * 200, top = 90 + hash(i + 5) * 80;
        poly(ctx, [cx - 80, 470, cx - 70, top + 60, cx - 40, top + 20, cx - 10, top, cx + 30, top + 30, cx + 60, top + 10, cx + 90, 470], '#c4614b');
        for (let k = 0; k < 6; k++) line(ctx, cx - 70, top + 60 + k * 50, cx + 85, top + 70 + k * 50, 'rgba(255,190,160,0.3)', 4);
      });
      ridge(ctx, camX, 0.5, 445, 14, 0.02, '#b85c4a', 3);
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#e0a08a');
      rect(ctx, x0, GROUND_Y, x1 - x0, 5, '#e8b39f');
      for (let i = Math.floor(x0 / 40); i < x1 / 40 + 1; i++) {
        if (hash(i) > 0.55) ellipse(ctx, i * 40 + hash(i + 1) * 20, GROUND_Y + 14 + hash(i + 2) * 50, 4 + hash(i + 3) * 4, 3, '#c97f69');
      }
    },
  };

  const AMAZON = {
    name: 'AMAZON RAINFOREST', sub: "Don't swim in the river. Bob already did. Twice.",
    length: 5200, music: 'amazon', goonThrow: 'am_coconut', goonCap: '#2f9e44',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'rain', 'spray'], bobFood: ['am_coconut', 'banana', 'chicken'], bobSpeed: 1.42,
    mud: [[700, 150], [1600, 150], [2500, 170], [3400, 150]],
    platforms: [[430, 365, 160, 'am_branch'], [660, 365, 230, 'am_log'], [950, 320, 150, 'am_branch'], [1250, 360, 180, 'am_branch'],
      [1560, 365, 230, 'am_log'], [1850, 320, 150, 'am_branch'], [2200, 360, 180, 'am_branch'], [2460, 365, 250, 'am_log'],
      [2770, 320, 150, 'am_branch'], [3100, 360, 180, 'am_branch'], [3360, 365, 230, 'am_log'], [3650, 320, 150, 'am_branch'],
      [4400, 360, 140, 'am_log'], [4860, 330, 140, 'am_branch']],
    blocks: [[1100, 50, 44, 'am_stump'], [2050, 60, 48, 'am_rock'], [2960, 50, 44, 'am_stump'], [3920, 60, 48, 'am_rock']],
    props: [['am_fern', 250], ['am_river', 700, 150], ['am_sign', 600], ['am_flower', 1180], ['am_river', 1600, 150], ['am_fern', 1950],
      ['am_river', 2500, 170], ['am_flower', 2900], ['am_river', 3400, 150], ['am_fern', 3780], ['am_flower', 4100], ['bobsign', 4290]],
    spawns: [[600, 'dartfrog', 2], [740, 'piranha', 2], [990, 'monkey', 1, 282], [1250, 'jaguar', 1], [1500, 'snake', 1],
      [1640, 'piranha', 2], [1890, 'monkey', 1, 282], [2150, 'dartfrog', 3], [2400, 'jaguar', 1], [2540, 'piranha', 3],
      [2800, 'monkey', 2, 282], [3150, 'jaguar', 1], [3440, 'piranha', 2], [3690, 'monkey', 1, 282], [3950, 'dartfrog', 3], [4050, 'jaguar', 1]],
    pickups: [[500, 'ammo'], [1300, 'pie'], [1700, 'nade'], [2250, 'pie'], [2900, 'ammo'], [3300, 'pie'], [3850, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#d3f9d8', '#a9e34b', '#5c940d']);
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 4; i++) { const x = 100 + i * 240 - (camX * 0.03) % 240; poly(ctx, [x, 0, x + 60, 0, x + 200, 470, x + 120, 470], '#fff9db'); }
      ctx.globalAlpha = 1;
      ridge(ctx, camX, 0.05, 250, 40, 0.012, '#94d82d', 4);
      repeatX(camX, 0.15, 1500, (sx) => waterfall(ctx, sx + 600));
      ridge(ctx, camX, 0.25, 330, 30, 0.02, '#5c940d', 2);
      repeatX(camX, 0.4, 340, (sx, i) => bigTree(ctx, sx + hash(i) * 100, i));
      repeatX(camX, 0.6, 140, (sx, i) => {
        const len = 60 + hash(i) * 120, sw = Math.sin(G.t * 0.02 + i) * 6;
        line(ctx, sx, 0, sx + sw, len, '#2b8a3e', 3);
        for (let k = 1; k < 4; k++) ellipse(ctx, sx + sw * k / 4 + (k % 2 ? 6 : -6), len * k / 4, 7, 3, '#37b24d', k % 2 ? 0.5 : -0.5);
      });
      repeatX(camX, 0.7, 90, (sx, i) => circle(ctx, sx, 6 + hash(i) * 20, 40, i % 2 ? '#2b8a3e' : '#237032'));
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#4a3524');
      rect(ctx, x0, GROUND_Y, x1 - x0, 8, '#2f9e44');
      for (let i = Math.floor(x0 / 14); i < x1 / 14 + 1; i++) line(ctx, i * 14, GROUND_Y + 2, i * 14 + 4, GROUND_Y - 6 - hash(i) * 6, '#37b24d', 2);
      for (let i = Math.floor(x0 / 110); i < x1 / 110 + 1; i++) {
        ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(i * 110, GROUND_Y + 12); ctx.quadraticCurveTo(i * 110 + 30, GROUND_Y + 30 + hash(i) * 20, i * 110 + 70, GROUND_Y + 20); ctx.stroke();
      }
    },
  };

  const OUTBACK = {
    name: 'THE OUTBACK', sub: 'Everything out here wants to punch you. Especially Bob.',
    length: 5200, music: 'outback', goonThrow: 'oz_pie', goonCap: '#e8590c',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain', 'spray'], bobFood: ['oz_pie', 'can', 'chicken'], bobSpeed: 1.44,
    platforms: [[440, 365, 170, 'oz_shed'], [700, 320, 150, 'oz_stand'], [1300, 360, 200, 'oz_shed'], [1560, 315, 150, 'oz_stand'],
      [1900, 365, 170, 'oz_shed'], [2450, 360, 200, 'oz_shed'], [2720, 320, 150, 'oz_stand'], [3300, 365, 200, 'oz_shed'],
      [3560, 320, 150, 'oz_stand'], [3850, 365, 160, 'oz_shed'], [4400, 360, 140, 'oz_shed'], [4860, 330, 140, 'oz_stand']],
    blocks: [[960, 52, 46, 'oz_drum'], [2200, 52, 50, 'hay'], [3050, 52, 46, 'oz_drum'], [4080, 52, 50, 'hay']],
    props: [['oz_sign', 260], ['oz_tank', 560], ['oz_gum', 1080], ['oz_skull', 1450], ['oz_gum', 2090], ['oz_sign', 2350],
      ['oz_gum', 3140], ['oz_skull', 3450], ['oz_tank', 3700], ['oz_gum', 4030], ['bobsign', 4290]],
    spawns: [[600, 'kangaroo', 1], [850, 'emu', 3], [1100, 'dropbear', 1, 150], [1350, 'boomer', 1], [1600, 'snake', 2],
      [1850, 'kangaroo', 2], [2100, 'dropbear', 2, 150], [2350, 'emu', 4], [2650, 'boomer', 1], [2900, 'kangaroo', 1],
      [3150, 'dropbear', 2, 150], [3400, 'emu', 3], [3650, 'boomer', 2], [3900, 'kangaroo', 2], [4050, 'dropbear', 1, 150]],
    pickups: [[520, 'ammo'], [1250, 'pie'], [1700, 'nade'], [2300, 'pie'], [2850, 'ammo'], [3350, 'pie'], [3900, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#2b1d4a', '#a61e4d', '#f76707', '#ffd43b']);
      circle(ctx, 300 - camX * 0.01, 330, 70, 'rgba(255,224,102,0.95)');
      repeatX(camX, 0.04, 1800, (sx) => uluru(ctx, sx + 900, 405));
      ridge(ctx, camX, 0.1, 395, 12, 0.01, '#7a2c1a', 3);
      repeatX(camX, 0.3, 1300, (sx) => windmill(ctx, sx + 400, 432));
      repeatX(camX, 0.45, 300, (sx, i) => { if (hash(i + 1) > 0.4) gumTree(ctx, sx, 450, 0.75, '#5a2a1f', 'rgba(70,40,30,0.85)'); });
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#b5482b');
      rect(ctx, x0, GROUND_Y, x1 - x0, 5, '#c75a35');
      for (let i = Math.floor(x0 / 70); i < x1 / 70 + 1; i++) {
        if (hash(i) < 0.45) continue;
        const bx = i * 70 + hash(i + 1) * 30, by = GROUND_Y + 2;
        for (let k = -3; k <= 3; k++) line(ctx, bx, by + 4, bx + k * 4, by - 8 - (3 - Math.abs(k)) * 2, '#c0b050', 1.5);
      }
      for (let i = Math.floor(x0 / 50); i < x1 / 50 + 1; i++) if (hash(i + 7) > 0.6) ellipse(ctx, i * 50, GROUND_Y + 20 + hash(i) * 40, 5, 3, '#9a3a22');
    },
  };

  // Story order: ... Bob's Kitchen, then the world tour.
  LEVELS.push(TOKYO, GIZA, PETRA, AMAZON, OUTBACK);
})();
