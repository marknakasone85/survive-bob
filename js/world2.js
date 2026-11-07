// World tour, part 2: ANTARCTICA, MOUNT EVEREST, THE COLOSSEUM, AREA 51 (story levels 16-19).
// Each level brings its own critters, scenery, Bob snacks and song.
(() => {
  'use strict';
  const R = SFX.raw;
  const { T, bars, two4 } = Music.helpers;
  const say = (e, str, color = '#fff', size = 18) => floatText(e.x + e.w / 2, e.y - 14, str, color, size, 45);

  // ==========================================================================
  // ENEMIES
  // ==========================================================================
  Object.assign(ENEMY_TYPES, {
    // Antarctica
    penguin:    { w: 30, h: 34, hp: 4,  score: 10, wave: 3, bits: ['#212529', '#f8f9fa', '#f08c00'] },
    seal:       { w: 56, h: 26, hp: 12, score: 22, wave: 6, bits: ['#868e96', '#495057', '#a5d8ff'] },
    snowman:    { w: 40, h: 64, hp: 12, score: 22, wave: 5, bits: ['#f8f9fa', '#e03131', '#212529'],
      onDeath(e) { // collapses into an angry rolling snowball
        const s = spawnEnemy('snowball', e.x + 5, e.y + e.h - 30);
        s.vy = -4; s.dir = e.face || -1;
      } },
    snowball:   { w: 30, h: 30, hp: 4,  score: 6, bits: ['#f8f9fa', '#dee2e6'] },
    // Mount Everest
    yeti:       { w: 64, h: 84, hp: 30, score: 45, dmg: 2, wave: 9, bits: ['#f1f3f5', '#74c0fc', '#495057'] },
    icebat:     { w: 36, h: 26, hp: 2,  score: 12, fly: true, wave: 4, bits: ['#4c6ef5', '#d0ebff'] },
    boarder:    { w: 44, h: 58, hp: 10, score: 25, wave: 7, bits: ['#ff922b', '#1c7ed6', '#f8f9fa'] },
    // The Colosseum
    gladiator:  { w: 46, h: 64, hp: 16, score: 35, wave: 8, bits: ['#c92a2a', '#ffd43b', '#868e96'],
      // The big shield stops shots from the front. Shots from behind or from above get through; explosions always do.
      block(e, b) {
        if (b.type === 'rocket' || b.type === 'lob') return false;
        const steep = Math.abs(b.vy) > Math.abs(b.vx) * 1.3;
        return Math.sign(b.vx) === -e.face && !steep;
      } },
    lion:       { w: 66, h: 40, hp: 16, score: 30, wave: 6, bits: ['#e8a33d', '#8a4b14'] },
    chariot:    { w: 90, h: 56, hp: 22, score: 40, dmg: 2, wave: 10, bits: ['#ffd43b', '#8b5e3c', '#c92a2a'] },
    archer:     { w: 40, h: 62, hp: 10, score: 25, wave: 8, bits: ['#e03131', '#ffd43b', '#8b5e3c'] },
    // Area 51
    alien:      { w: 30, h: 44, hp: 6,  score: 20, wave: 5, bits: ['#c8ccd0', '#69db7c'] },
    ufo:        { w: 80, h: 34, hp: 14, score: 35, fly: true, wave: 9, bits: ['#adb5bd', '#69db7c', '#ffd43b'] },
    mutant:     { w: 46, h: 44, hp: 12, score: 25, wave: 7, bits: ['#69db7c', '#2b8a3e', '#d8f5a2'],
      onDeath(e) { // splits into two little ones (they don't split again)
        for (const s of [-1, 1]) {
          const m = spawnEnemy('minimutant', e.x + e.w / 2 - 12 + s * 12, e.y + e.h - 22);
          m.vx = s * 3; m.vy = -6; m.timer = randi(20, 40);
        }
      } },
    minimutant: { w: 24, h: 22, hp: 3,  score: 8, bits: ['#69db7c', '#2b8a3e'] },
    robodog:    { w: 52, h: 34, hp: 12, score: 30, wave: 9, bits: ['#ced4da', '#495057', '#ff6b6b'] },
  });

  Object.assign(ENEMY_AI, {
    // Waddles over, then flops on its belly and slides at you.
    penguin(e, p, dx) {
      if (e.slide > 0) {
        e.slide--; e.vx = e.dir * 6.5;
        if (e.t % 4 === 0) particles(e.x + e.w / 2, e.y + e.h, 1, ['#f8f9fa', '#d0ebff'], { speed: 1.5 });
        if (e.hitWall) { e.slide = 0; e.vy = -5; }
        if (e.slide === 0) e.timer = randi(60, 110);
      } else {
        e.dir = Math.sign(dx) || -1; e.vx = e.dir * 1.1;
        if (--e.timer <= 0 && Math.abs(dx) < 420 && e.onGround) {
          e.slide = 60; e.vy = -3;
          if (onScreen(e)) R.tone('square', 700, 1100, 0.08, 0.05);
        }
      }
      e.face = e.dir; moveActor(e);
    },
    // Hides in an ice hole (eyes peeking), bursts out to bite, then slides back home.
    seal(e, p, dx) {
      if (!e.state) {
        e.home = G.arenaLocked ? clamp(e.x, G.camX + 80, G.camX + W - 140) : e.x; // in Waves, dig the hole on screen
        e.state = e.home === e.x ? 'hide' : 'slide';
      }
      if (e.state === 'hide') {
        e.vx = 0; e.vy = 0; e.x = e.home; e.y = GROUND_Y - 10; e.face = Math.sign(dx) || -1;
        if (e.t % 50 === 0 && onScreen(e)) particles(e.x + e.w / 2, GROUND_Y - 2, 2, ['#a5d8ff', '#e7f5ff'], { speed: 1, up: 1 });
        if (--e.timer <= 0 && Math.abs(dx) < 220 && !p.dead) {
          e.state = 'burst'; e.onGround = false; e.y = GROUND_Y - e.h - 2; e.vy = -9.5; e.vx = clamp(dx / 32, -6.5, 6.5); e.dir = Math.sign(dx) || 1;
          particles(e.x + e.w / 2, GROUND_Y - 4, 14, ['#a5d8ff', '#e7f5ff', '#4dabf7'], { speed: 4, up: 3 });
          SFX.splash(); R.tone('sawtooth', 380, 240, 0.25, 0.08);
          say(e, 'ARF!', '#a5d8ff');
        }
        return;
      }
      if (e.state === 'burst') {
        e.face = e.dir;
        if (e.onGround) e.state = 'slide';
      } else if (e.state === 'slide') {
        const back = e.home - e.x;
        e.dir = Math.sign(back) || 1; e.face = e.dir; e.vx = e.dir * 3.2;
        if (Math.abs(back) < 5) { e.state = 'hide'; e.timer = randi(70, 120); e.x = e.home; if (onScreen(e)) SFX.splash(); return; }
        if (e.hitWall) e.home = e.x; // blocked: dig a new hole right here
      }
      moveActor(e);
    },
    // Throws snowballs; slides along slowly.
    snowman(e, p, dx) {
      const d = Math.abs(dx);
      e.vx = d > 420 ? Math.sign(dx) * 0.8 : 0;
      if (d < 560 && --e.timer <= 0 && !p.dead && !e.wind) { e.wind = 20; e.timer = randi(90, 130); }
      if (e.wind > 0 && --e.wind === 0) {
        throwArc(e.x + e.w / 2 + e.face * 14, e.y + 18, p.x + p.w / 2 + p.vx * 18, p.y + p.h / 2, 'an_snowball', 38 + randi(0, 10));
        SFX.throwIt();
      }
      moveActor(e);
    },
    // What's left of a snowman: rolls at you and bounces off walls.
    snowball(e, p, dx) {
      if (!e.dir) e.dir = Math.sign(dx) || -1;
      if (e.hitWall) e.dir = -e.hitWall;
      if (e.t % 80 === 0) e.dir = Math.sign(dx) || e.dir;
      e.vx += (e.dir * 3.4 - e.vx) * 0.06; e.rot += e.vx * 0.07;
      moveActor(e);
    },
    // Roars, lifts a giant snowball over its head, and bowls it along the ground.
    yeti(e, p, dx) {
      const d = Math.abs(dx);
      if (e.state === 'roar') {
        e.vx = 0;
        if (e.st === 40 && onScreen(e)) { R.gross(120, 60, 0.8, 30, 14, 0.35); shake(5); say(e, 'RAAAWR!', '#a5d8ff', 22); }
        if (--e.st <= 0) { e.state = 'lift'; e.st = 28; }
      } else if (e.state === 'lift') {
        e.vx = 0;
        if (--e.st <= 0) {
          G.ebullets.push({ kind: 'hi_bigball', x: e.x + e.w / 2 + e.face * 44, y: GROUND_Y - 22, vx: e.face * 5, vy: 0, g: 0, r: 22, dmg: 2, life: 260, roll: true, spin: 0 });
          R.noise(0.4, 0.3, 500); shake(4);
          e.state = 'rest'; e.st = 50;
        }
      } else if (e.state === 'rest') {
        e.vx *= 0.8; if (--e.st <= 0) e.state = null;
      } else {
        e.vx = d > 260 ? (Math.sign(dx) || -1) * 1.0 : 0;
        if (d < 560 && --e.timer <= 0 && !p.dead) { e.state = 'roar'; e.st = 45; e.timer = randi(150, 200); }
      }
      if (e.onGround && Math.abs(e.vx) > 0.2 && e.t % 26 === 0 && onScreen(e)) { SFX.bobStep(); shake(1); }
      moveActor(e);
    },
    // Hangs upside down near the top of the screen, then swoops down at you.
    icebat(e, p, dx) {
      const px = p.x + p.w / 2;
      const newSpot = () => { e.state = 'rise'; e.hangX = clamp(px + rand(-240, 240), G.camX + 40, G.camX + W - 40); e.hangY = rand(36, 70); };
      if (!e.state) newSpot();
      if (e.state === 'rise') {
        const tx = e.hangX - e.w / 2;
        e.x += clamp((tx - e.x) * 0.05, -3.5, 3.5); e.y += clamp((e.hangY - e.y) * 0.06, -4, 4);
        if (Math.abs(e.x - tx) < 4 && Math.abs(e.y - e.hangY) < 3) { e.state = 'hang'; e.y = e.hangY; e.timer = randi(50, 110); }
      } else if (e.state === 'hang') {
        if (--e.timer <= 0) {
          if (Math.abs(dx) < 300 && !p.dead) {
            e.state = 'swoop'; e.st = 0;
            e.vx = clamp((px - (e.x + e.w / 2)) / 34, -6.5, 6.5); e.vy = (p.y + p.h * 0.4 - (e.y + e.h / 2)) / 34;
            if (onScreen(e)) { R.tone('sine', 3000, 4400, 0.15, 0.05); R.tone('sine', 4200, 2600, 0.15, 0.04, 0.12); }
          } else if (e.timer < -120) newSpot();
        }
      } else if (e.state === 'swoop') {
        e.st++;
        if (e.st > 34) e.vy = Math.max(e.vy - 0.45, -5);
        e.x += e.vx; e.y = Math.min(e.y + e.vy, GROUND_Y - e.h);
        if (e.st > 34 && e.y <= e.hangY + 40) newSpot();
      }
    },
    // A cousin on a snowboard: carves back and forth and jumps over you, dropping snow bombs.
    boarder(e, p, dx) {
      if (!e.dir) e.dir = Math.sign(dx) || -1;
      const d = Math.abs(dx), ahead = Math.sign(dx) === e.dir;
      if (e.onGround && !ahead && d > 240) e.dir = -e.dir; // carve around and come back
      e.vx += (e.dir * 5 - e.vx) * 0.06;
      if (e.jumpCd > 0) e.jumpCd--;
      if (e.onGround && ahead && d < 125 && !e.jumpCd && !p.dead) {
        e.vy = -11.5; e.jumpCd = 80; e.bomb = true;
        if (onScreen(e)) { say(e, 'WOOO!', '#ffd43b'); R.gross(240, 340, 0.3, 20, 12, 0.2); }
      }
      if (e.bomb && !e.onGround && d < 26) {
        e.bomb = false;
        G.ebullets.push({ kind: 'hi_snowbomb', x: e.x + e.w / 2, y: e.y + e.h, vx: e.vx * 0.2, vy: 1, g: 0.35, r: 10, dmg: 1, life: 120 });
        SFX.throwIt();
      }
      if (e.onGround) e.bomb = false;
      if (e.hitWall) { e.dir = -e.hitWall; if (e.onGround) e.vy = -7; }
      if (e.onGround && Math.abs(e.vx) > 3 && e.t % 3 === 0) particles(e.x + e.w / 2 - e.dir * 20, e.y + e.h, 2, ['#f8f9fa', '#d0ebff'], { speed: 2, up: 1.5 });
      e.face = e.dir; moveActor(e);
    },
    // Hides behind a big shield that turns slowly; winds up and shield-bashes.
    gladiator(e, p, dx) {
      if (!e.look) e.look = Math.sign(dx) || -1;
      if (Math.sign(dx) !== e.look && e.state !== 'bash') { e.turn = (e.turn || 0) + 1; if (e.turn > 35) { e.look = -e.look; e.turn = 0; } } else e.turn = 0;
      e.face = e.look; e.dmg = e.state === 'bash' ? 2 : 1;
      const d = Math.abs(dx);
      if (e.state === 'wind') {
        e.vx = 0;
        if (--e.st <= 0) { e.state = 'bash'; e.st = 22; SFX.grunt(); }
      } else if (e.state === 'bash') {
        e.vx = e.look * 7;
        if (e.t % 3 === 0) particles(e.x + e.w / 2, e.y + e.h, 1, ['#d9b38c'], { speed: 2 });
        if (--e.st <= 0 || e.hitWall) { e.state = 'rest'; e.st = 40; }
      } else if (e.state === 'rest') {
        e.vx *= 0.7; if (--e.st <= 0) e.state = null;
      } else {
        e.vx = Math.sign(dx) === e.look && d > 60 ? e.look * 1.0 : 0;
        if (d < 200 && Math.sign(dx) === e.look && Math.abs(p.y + p.h - (e.y + e.h)) < 50 && --e.timer <= 0 && !p.dead) {
          e.state = 'wind'; e.st = 24; e.timer = randi(70, 110);
          if (onScreen(e)) { SFX.clink(); say(e, 'HUAH!', '#ffd43b'); }
        }
      }
      moveActor(e);
    },
    // Prowls, stalks low when close, roars... then pounces.
    lion(e, p, dx) {
      const d = Math.abs(dx);
      if (e.state === 'roar') {
        e.vx *= 0.7;
        if (e.st === 28 && onScreen(e)) { R.gross(120, 70, 0.6, 30, 8, 0.3); say(e, 'ROAR!', '#ffd43b'); }
        if (--e.st <= 0) { e.state = 'pounce'; e.vy = -9.5; e.vx = clamp(dx / 24, -8.5, 8.5); }
      } else if (e.state === 'pounce') {
        if (e.onGround) { e.state = 'rest'; e.st = 50; e.vx = 0; }
      } else if (e.state === 'rest') {
        e.vx *= 0.8; if (--e.st <= 0) e.state = null;
      } else {
        const dir = Math.sign(dx) || -1;
        e.vx = d > 320 ? dir * 2.0 : dir * 0.6;
        if (d < 300 && --e.timer <= 0 && !p.dead) { e.state = 'roar'; e.st = 34; e.timer = randi(80, 130); }
      }
      e.face = e.state === 'pounce' ? (Math.sign(e.vx) || e.face) : (Math.sign(dx) || e.face);
      moveActor(e);
    },
    // Keeps its distance, the horse rears up... then it charges right across the screen.
    chariot(e, p, dx) {
      const d = Math.abs(dx);
      if (!e.dir) e.dir = Math.sign(dx) || -1;
      if (e.state === 'rear') {
        e.vx *= 0.8;
        if (--e.st <= 0) { e.state = 'charge'; e.st = 150; }
      } else if (e.state === 'charge') {
        e.vx += (e.dir * 9 - e.vx) * 0.15;
        if (e.t % 2 === 0) particles(e.x + e.w / 2 - e.dir * 30, e.y + e.h, 2, ['#d9b38c', '#c9a36a'], { speed: 2, up: 1 });
        const past = Math.sign(dx) === -e.dir && d > 320;
        if (past || --e.st <= 0 || e.hitWall) {
          e.state = 'turn'; e.st = 40;
          if (e.hitWall) { shake(6); R.noise(0.4, 0.35, 600); }
        }
      } else if (e.state === 'turn') {
        e.vx *= 0.9;
        if (--e.st <= 0) { e.dir = Math.sign(dx) || -e.dir; e.state = null; e.timer = randi(40, 80); }
      } else {
        e.dir = Math.sign(dx) || e.dir;
        const want = d > 460 ? e.dir * 1.6 : d < 300 ? -e.dir * 1.2 : 0;
        e.vx += (want - e.vx) * 0.1;
        if (--e.timer <= 0 && d < 620 && !p.dead && Math.abs(p.y + p.h - (e.y + e.h)) < 120) {
          e.state = 'rear'; e.st = 40;
          if (onScreen(e)) { say(e, 'HYAAH!', '#ffd43b', 20); R.tone('sawtooth', 900, 1500, 0.25, 0.05); R.tone('sawtooth', 1500, 800, 0.3, 0.05, 0.25); }
        }
      }
      e.rot = (e.rot || 0) + e.vx * 0.08; // wheel spin
      e.face = e.dir; moveActor(e);
    },
    // Stays back and fires arrow volleys high into the air; they rain down where you stand (watch the shadows).
    archer(e, p, dx) {
      const d = Math.abs(dx);
      e.face = Math.sign(dx) || 1;
      let want = d > 480 ? Math.sign(dx) * 1.2 : d < 300 ? -Math.sign(dx) * 1.3 : 0;
      if (e.x < G.camX + 10) want = 1.2; else if (e.x + e.w > G.camX + W - 10) want = -1.2; // never hide off screen
      if (e.drawT > 0) want = 0;
      e.vx = want;
      if (d < 700 && --e.timer <= 0 && !p.dead && !e.drawT) { e.drawT = 34; e.timer = randi(150, 200); }
      if (e.drawT > 0 && --e.drawT === 0) {
        for (let i = 0; i < 4; i++) {
          const tx = p.x + p.w / 2 + p.vx * 18 + (i - 1.5) * 64 + rand(-12, 12);
          G.ebullets.push({ kind: 'ro_arrow', x: tx - e.face * 30, y: -40 - i * 45, vx: e.face * 0.5, vy: 4.5, g: 0.1, r: 7, dmg: 1, life: 260,
            warn: true, spin: 0, rot: Math.atan2(4.5, e.face * 0.5) });
        }
        particles(e.x + e.w / 2 + e.face * 14, e.y + 10, 6, ['#8b5e3c', '#ffd43b'], { speed: 3, up: 4, grav: 0.05 });
        if (onScreen(e)) { R.tone('triangle', 300, 120, 0.15, 0.08); SFX.whistle(); }
      }
      moveActor(e);
    },
    // Teleports near you in a shimmer, charges its ray gun, zaps.
    alien(e, p, dx) {
      const d = Math.abs(dx);
      if (e.state === 'out') {
        e.vx = 0;
        if (--e.st <= 0) {
          const side = Math.random() < 0.5 ? -1 : 1;
          e.x = clamp(p.x + side * rand(180, 300), G.camX + 20, G.camX + W - 50); e.y = GROUND_Y - e.h; e.vy = 0;
          e.state = 'in'; e.st = 20;
          if (onScreen(e)) R.tone('sine', 300, 1600, 0.25, 0.05);
        }
      } else if (e.state === 'in') {
        if (--e.st <= 0) { e.state = 'aim'; e.st = 26; }
      } else if (e.state === 'aim') {
        e.vx = 0;
        if (--e.st <= 0) {
          const sx = e.x + e.w / 2 + e.face * 16, sy = e.y + 18, a = Math.atan2(p.y + 24 - sy, p.x + p.w / 2 - sx);
          G.ebullets.push({ kind: 'a51_zap', x: sx, y: sy, vx: Math.cos(a) * 6.5, vy: Math.sin(a) * 6.5, g: 0, r: 7, dmg: 1, life: 140, spin: 0, rot: a });
          if (onScreen(e)) { R.tone('square', 1800, 500, 0.18, 0.05); R.tone('sine', 2400, 900, 0.18, 0.04); }
          e.state = null; e.timer = randi(90, 130);
        }
      } else {
        e.vx = d > 250 ? Math.sign(dx) * 1.2 : 0;
        if (--e.timer <= 0 && d < 600 && !p.dead) {
          if (d > 380 || Math.random() < 0.6) { e.state = 'out'; e.st = 20; if (onScreen(e)) R.tone('sine', 1600, 300, 0.25, 0.05); }
          else { e.state = 'aim'; e.st = 26; }
        }
      }
      moveActor(e);
    },
    // Follows you overhead; its tractor beam lifts you toward the saucer. Get out of the light!
    ufo(e, p, dx) {
      if (!e.init) { e.init = true; e.baseY = clamp(e.y, 90, 150); e.beam = 0; }
      const cx = e.x + e.w / 2, px = p.x + p.w / 2;
      if (e.beam > 0) {
        e.beam--; e.vx *= 0.92;
        if (e.beam < 100) {
          const halfW = 16 + (p.y + p.h - (e.y + e.h)) * 0.1;
          if (!p.dead && Math.abs(px - cx) < halfW && p.y + p.h > e.y + e.h) {
            p.vy = Math.max(p.vy - 1.2, -4.4);
            if (G.t % 6 === 0) particles(px, p.y + p.h, 2, ['#b2f2bb', '#d8f5a2'], { speed: 1, grav: -0.05 });
            if (p.y < e.y + e.h + 6) { hurtPlayer(1, cx); e.beam = 0; } // sucked all the way up: ZAP
          }
          if (e.beam % 14 === 0 && onScreen(e)) R.tone('sine', 220, 260, 0.2, 0.04);
        }
        if (e.beam === 0) e.timer = randi(130, 180);
      } else {
        e.vx += (Math.sign(dx) * 2.4 - e.vx) * 0.04;
        if (--e.timer <= 0 && Math.abs(dx) < 60 && !p.dead) {
          e.beam = 130;
          if (onScreen(e)) { R.tone('sine', 400, 900, 0.5, 0.05); R.tone('sine', 900, 400, 0.5, 0.04, 0.5); }
        }
      }
      e.x += e.vx; e.y = e.baseY + Math.sin(e.t * 0.04) * 8;
    },
    // A wobbly pile of glowing goo: hops at you and spits goo.
    mutant(e, p, dx) {
      const d = Math.abs(dx);
      if (e.onGround) {
        e.vx *= 0.75;
        if (--e.timer <= 0) {
          if (d < 420 && Math.random() < 0.45 && !p.dead) {
            throwArc(e.x + e.w / 2, e.y + 8, p.x + p.w / 2, p.y + p.h / 2, 'a51_goo', 40 + randi(0, 10));
            if (onScreen(e)) SFX.squirt();
            e.timer = randi(70, 100); e.spit = 14;
          } else {
            e.vy = -rand(6, 8); e.vx = Math.sign(dx) * rand(1.8, 2.8); e.timer = randi(35, 60);
            if (onScreen(e)) SFX.squish();
          }
        }
      }
      if (e.spit > 0) e.spit--;
      moveActor(e);
    },
    minimutant(e, p, dx) {
      if (e.onGround) {
        e.vx *= 0.8;
        if (--e.timer <= 0) { e.vy = -rand(5, 7.5); e.vx = Math.sign(dx) * rand(2.5, 4); e.timer = randi(20, 40); }
      }
      moveActor(e);
    },
    // Security robot dog: sprints in, paints you with a laser dot, then fires a beam along the ground. Jump it!
    robodog(e, p, dx) {
      const d = Math.abs(dx);
      if (e.state === 'aim') {
        e.vx = 0; e.face = e.look;
        if (e.st % 10 === 0 && onScreen(e)) R.tone('square', 1800, 1800, 0.04, 0.03);
        if (--e.st <= 0) { e.state = 'fire'; e.st = 16; if (onScreen(e)) { R.tone('sawtooth', 900, 200, 0.35, 0.06); R.noise(0.3, 0.15, 3000, 0, 'bandpass'); } }
      } else if (e.state === 'fire') {
        e.vx = 0; e.face = e.look;
        const y = e.y + 10, x0 = e.look > 0 ? e.x + e.w : e.x - 640, x1 = e.look > 0 ? e.x + e.w + 640 : e.x;
        if (!p.dead && p.x + p.w > x0 && p.x < x1 && p.y < y + 4 && p.y + p.h > y - 4) hurtPlayer(1, e.x + e.w / 2);
        if (--e.st <= 0) { e.state = 'rest'; e.st = 30; }
      } else if (e.state === 'rest') {
        e.vx *= 0.8; if (--e.st <= 0) e.state = null;
      } else {
        e.vx += ((Math.sign(dx) || 1) * (d > 300 ? 4.5 : 1.5) - e.vx) * 0.1;
        if (d < 520 && d > 120 && --e.timer <= 0 && e.onGround && !p.dead) {
          e.state = 'aim'; e.st = 45; e.look = Math.sign(dx) || 1; e.timer = randi(110, 150);
        }
      }
      moveActor(e);
    },
  });

  SFX.addKill({
    penguin:    () => { R.tone('square', 900, 500, 0.12, 0.06); R.tone('square', 700, 300, 0.12, 0.05, 0.1); },
    seal:       () => { R.tone('sawtooth', 500, 300, 0.12, 0.08); R.tone('sawtooth', 520, 280, 0.14, 0.08, 0.16); },
    snowman:    () => { R.noise(0.3, 0.35, 1200, 0, 'bandpass'); R.noise(0.2, 0.2, 600, 0.1); },
    snowball:   () => R.noise(0.2, 0.3, 1500, 0, 'bandpass'),
    yeti:       () => R.gross(140, 50, 1.0, 40, 9, 0.35),
    icebat:     () => { R.tone('sine', 3000, 4200, 0.08, 0.05); R.tone('sine', 3600, 2000, 0.12, 0.05, 0.08); },
    boarder:    () => R.gross(220, 110, 0.4, 25, 14, 0.25),
    gladiator:  () => { R.tone('square', 1400, 1100, 0.12, 0.06); R.noise(0.15, 0.3, 3000, 0, 'bandpass'); R.gross(150, 80, 0.35, 15, 12, 0.25, 0.05); },
    lion:       () => R.gross(110, 60, 0.7, 30, 7, 0.3),
    chariot:    () => { R.noise(0.5, 0.4, 500); R.tone('sawtooth', 900, 1500, 0.3, 0.05, 0.1); R.tone('sawtooth', 1400, 700, 0.3, 0.05, 0.4); },
    archer:     () => R.gross(170, 90, 0.3, 15, 12, 0.25),
    alien:      () => { R.tone('sine', 1200, 300, 0.4, 0.08); R.tone('square', 2000, 2400, 0.06, 0.03, 0.05); },
    ufo:        () => { R.tone('sine', 900, 120, 0.8, 0.1); R.noise(0.6, 0.35, 700, 0.3, 'lowpass', 0.4); },
    mutant:     () => { R.noise(0.3, 0.35, 500); R.tone('sine', 200, 50, 0.3, 0.2); },
    minimutant: () => { R.noise(0.15, 0.25, 900); R.tone('sine', 400, 120, 0.15, 0.12); },
    robodog:    () => { for (let i = 0; i < 4; i++) R.tone('square', 1600 - i * 300, 1500 - i * 300, 0.05, 0.04, i * 0.06); R.noise(0.3, 0.3, 2000, 0.25, 'bandpass'); },
  });

  // ---- Enemy art ------------------------------------------------------------
  Object.assign(ENEMY_ART, {
    penguin(ctx, e, c, cx, by, f) {
      if (e.slide > 0) { // belly slide
        ellipse(ctx, cx - f * 20, by - 5, 4, 3, '#f08c00');
        ellipse(ctx, cx, by - 9, 20, 9, c('#212529'));
        ellipse(ctx, cx + f * 2, by - 6, 15, 5, c('#f8f9fa'));
        ellipse(ctx, cx - f * 6, by - 15, 8, 3, c('#343a40'), -f * 0.3);
        circle(ctx, cx + f * 17, by - 11, 7, c('#212529'));
        circle(ctx, cx + f * 20, by - 12, 2, '#fff'); circle(ctx, cx + f * 20.6, by - 12, 1, '#111');
        poly(ctx, [cx + f * 23, by - 12, cx + f * 30, by - 10, cx + f * 23, by - 8], '#f08c00');
        return;
      }
      ctx.save(); ctx.translate(cx, by); ctx.rotate(Math.sin(e.t * 0.3) * 0.15);
      ellipse(ctx, -5, -1, 5, 2.5, '#f08c00'); ellipse(ctx, 5, -1, 5, 2.5, '#f08c00');
      ellipse(ctx, 0, -16, 13, 16, c('#212529'));
      ellipse(ctx, f * 2, -13, 9, 12, c('#f8f9fa'));
      ellipse(ctx, -f * 10, -17, 4, 9, c('#343a40'), f * 0.3);
      circle(ctx, f, -31, 9, c('#212529'));
      poly(ctx, [f * -3, -24, f * 7, -24, f * 2, -20], '#e03131'); // tiny bow tie
      circle(ctx, f * 4, -33, 2.4, '#fff'); circle(ctx, f * 4.6, -33, 1.2, '#111');
      poly(ctx, [f * 8, -31, f * 15, -29, f * 8, -27], '#f08c00');
      ctx.restore();
    },
    seal(ctx, e, c, cx, by, f) {
      const hx = (e.home ?? e.x) + e.w / 2;
      ellipse(ctx, hx, GROUND_Y + 3, 34, 8, '#d0ebff');
      ellipse(ctx, hx, GROUND_Y + 3, 29, 6, '#0b2545');
      if (e.state === 'hide' || !e.state) {
        const peek = Math.sin(e.t * 0.08) * 2 - 2;
        ctx.save(); ctx.beginPath(); ctx.rect(hx - 40, GROUND_Y - 40, 80, 42); ctx.clip();
        ellipse(ctx, hx, GROUND_Y + 6 + peek, 15, 12, c('#868e96'));
        for (const s of [-1, 1]) { circle(ctx, hx + s * 5, GROUND_Y - 1 + peek, 3.2, '#111'); circle(ctx, hx + s * 5 - 1, GROUND_Y - 2 + peek, 1, '#fff'); }
        ctx.restore();
        if (e.t % 70 < 35) { ctx.strokeStyle = 'rgba(208,235,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(hx, GROUND_Y + 3, 20 + (e.t % 70) * 0.4, 5, 0, 0, Math.PI * 2); ctx.stroke(); }
        return;
      }
      const open = e.state === 'burst';
      ctx.save(); ctx.translate(cx, by); ctx.scale(f, 1);
      poly(ctx, [-26, -8, -38, -16, -36, 0], c('#6c757d'));
      ellipse(ctx, 0, -12, 26, 12, c('#868e96'));
      ellipse(ctx, 4, -6, 20, 5, c('#ced4da'));
      for (const [sx, sy, r] of [[-10, -17, 2.5], [-2, -19, 2], [-16, -11, 2], [6, -16, 1.8]]) circle(ctx, sx, sy, r, '#495057');
      ellipse(ctx, 6, -4, 7, 3, c('#6c757d'), 0.4);
      ellipse(ctx, 22, -16, 12, 10, c('#868e96'));
      if (open) {
        ellipse(ctx, 30, -12, 9, 5, '#a61e4d');
        for (let i = 0; i < 4; i++) { poly(ctx, [24 + i * 4, -16, 26 + i * 4, -12, 28 + i * 4, -16], '#fff'); poly(ctx, [24 + i * 4, -8, 26 + i * 4, -12, 28 + i * 4, -8], '#fff'); }
      } else line(ctx, 26, -12, 33, -12, '#343a40', 1.5);
      circle(ctx, 24, -21, 2.6, '#111'); circle(ctx, 23.5, -21.8, 0.9, '#fff');
      line(ctx, 30, -15, 38, -18, '#dee2e6', 1); line(ctx, 30, -14, 38, -13, '#dee2e6', 1);
      ctx.restore();
    },
    snowman(ctx, e, c, cx, by, f) {
      circle(ctx, cx, by - 16, 17, c('#f8f9fa'));
      ellipse(ctx, cx - 4, by - 8, 12, 5, c('#e9ecef'));
      circle(ctx, cx, by - 41, 13, c('#f1f3f5'));
      circle(ctx, cx + f, by - 61, 10, c('#f8f9fa'));
      circle(ctx, cx + f * 3, by - 44, 1.8, '#212529'); circle(ctx, cx + f * 3, by - 37, 1.8, '#212529');
      // back arm
      line(ctx, cx - f * 12, by - 44, cx - f * 26, by - 54, '#6b4423', 2.5); line(ctx, cx - f * 22, by - 51, cx - f * 26, by - 46, '#6b4423', 1.5);
      // scarf
      rect(ctx, cx - 11, by - 54, 22, 5, c('#e03131')); rect(ctx, cx - f * 8 - 2, by - 53, 5, 13, c('#e03131'));
      // face: mean little eyes, carrot, coal smile
      circle(ctx, cx + f * 3, by - 64, 1.7, '#111'); circle(ctx, cx + f * 8, by - 64, 1.7, '#111');
      line(ctx, cx + f * 0.5, by - 69, cx + f * 5, by - 66.5, '#111', 1.5); line(ctx, cx + f * 10.5, by - 69, cx + f * 6, by - 66.5, '#111', 1.5);
      poly(ctx, [cx + f * 8, by - 62, cx + f * 21, by - 60, cx + f * 8, by - 58], '#f76707');
      for (let i = 0; i < 4; i++) circle(ctx, cx + f * (1 + i * 2.5), by - 55.5 + Math.abs(i - 1.5) * -0.8, 1, '#111');
      // trucker cap
      ctx.fillStyle = c('#1c7ed6'); ctx.beginPath(); ctx.arc(cx + f, by - 67, 10, Math.PI, 0); ctx.fill();
      rect(ctx, cx + f, by - 68, f * 14, 3, c('#1864ab'));
      // front arm: raised with a snowball while winding up
      if (e.wind > 0) { line(ctx, cx + f * 12, by - 44, cx + f * 18, by - 70, '#6b4423', 2.5); circle(ctx, cx + f * 19, by - 74, 6, '#fff'); }
      else { line(ctx, cx + f * 12, by - 44, cx + f * 26, by - 36, '#6b4423', 2.5); line(ctx, cx + f * 22, by - 38, cx + f * 25, by - 44, '#6b4423', 1.5); }
    },
    snowball(ctx, e, c, cx, by, f) {
      const cy = by - 15;
      circle(ctx, cx, cy, 15, c('#f8f9fa'));
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(e.rot);
      for (let i = 0; i < 3; i++) ellipse(ctx, Math.cos(i * 2.1) * 8, Math.sin(i * 2.1) * 8, 4, 2.5, '#dee2e6', i);
      rect(ctx, 6, -2, 9, 2, '#6b4423');
      ctx.restore();
      circle(ctx, cx + f * 3, cy - 3, 1.8, '#111'); circle(ctx, cx + f * 8, cy - 3, 1.8, '#111');
      line(ctx, cx + f * 1, cy - 7, cx + f * 5, cy - 5, '#111', 1.5); line(ctx, cx + f * 10, cy - 7, cx + f * 6, cy - 5, '#111', 1.5);
      poly(ctx, [cx + f * 6, cy, cx + f * 13, cy + 1, cx + f * 6, cy + 2], '#f76707');
    },
    yeti(ctx, e, c, cx, by, f) {
      const walk = Math.abs(e.vx) > 0.2 ? Math.sin(e.t * 0.18) * 4 : 0;
      const roar = e.state === 'roar', lift = e.state === 'lift';
      fillRR(ctx, cx - 24 + walk * 0.5, by - 28, 20, 28, 8, c('#e9ecef'));
      fillRR(ctx, cx + 4 - walk * 0.5, by - 28, 20, 28, 8, c('#e9ecef'));
      ellipse(ctx, cx - 14 + walk * 0.5, by - 3, 14, 5, c('#4dabf7')); ellipse(ctx, cx + 14 - walk * 0.5, by - 3, 14, 5, c('#4dabf7'));
      ellipse(ctx, cx, by - 50, 33, 31, c('#f1f3f5'));
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + i * 0.09); poly(ctx, [cx + Math.cos(a) * 30, by - 50 + Math.sin(a) * 28, cx + Math.cos(a + 0.08) * 38, by - 46 + Math.sin(a + 0.08) * 30, cx + Math.cos(a + 0.16) * 30, by - 50 + Math.sin(a + 0.16) * 28], c('#dee2e6')); }
      ellipse(ctx, cx + f * 5, by - 46, 18, 20, c('#dbe4ff'));
      if (roar || lift) {
        ellipse(ctx, cx - 28, by - 80, 10, 24, c('#e9ecef'), -0.35); ellipse(ctx, cx + 28, by - 80, 10, 24, c('#e9ecef'), 0.35);
        circle(ctx, cx - 35, by - 102, 9, c('#74c0fc')); circle(ctx, cx + 35, by - 102, 9, c('#74c0fc'));
      } else {
        ellipse(ctx, cx - f * 31, by - 44 + walk, 10, 24, c('#e9ecef'), f * 0.15); ellipse(ctx, cx + f * 31, by - 44 - walk, 10, 24, c('#e9ecef'), -f * 0.15);
        circle(ctx, cx - f * 33, by - 22 + walk, 8, c('#74c0fc')); circle(ctx, cx + f * 33, by - 22 - walk, 8, c('#74c0fc'));
      }
      circle(ctx, cx + f * 4, by - 80, 18, c('#f8f9fa'));
      poly(ctx, [cx - 8, by - 92, cx - 18, by - 108, cx - 2, by - 96], c('#ced4da')); poly(ctx, [cx + 14, by - 94, cx + 22, by - 110, cx + 20, by - 92], c('#ced4da'));
      ellipse(ctx, cx + f * 8, by - 77, 12, 11, c('#74c0fc'));
      for (const ex of [3, 13]) { circle(ctx, cx + f * ex, by - 81, 3, '#fff'); circle(ctx, cx + f * (ex + 1), by - 81, 1.5, '#111'); }
      line(ctx, cx + f * 0, by - 87, cx + f * 6, by - 84, '#1c3d5a', 2.5); line(ctx, cx + f * 16, by - 87, cx + f * 10, by - 84, '#1c3d5a', 2.5);
      if (roar) {
        ellipse(ctx, cx + f * 8, by - 70, 8, 7, '#3b0d0d');
        poly(ctx, [cx + f * 3, by - 76, cx + f * 5, by - 71, cx + f * 7, by - 76], '#fff'); poly(ctx, [cx + f * 9, by - 76, cx + f * 11, by - 71, cx + f * 13, by - 76], '#fff');
      } else line(ctx, cx + f * 3, by - 71, cx + f * 13, by - 72, '#1c3d5a', 2);
      if (lift) { circle(ctx, cx, by - 124, 24, '#f8f9fa'); ellipse(ctx, cx - 8, by - 132, 9, 6, '#ffffff'); ellipse(ctx, cx + 6, by - 114, 14, 6, '#dee2e6'); }
    },
    icebat(ctx, e, c, cx, by, f) {
      const cy = e.y + e.h / 2;
      if (e.state === 'hang') {
        poly(ctx, [cx - 14, e.y - 8, cx + 14, e.y - 8, cx + 6, e.y - 2, cx, e.y + 4, cx - 6, e.y - 2], '#d0ebff');
        line(ctx, cx - 3, e.y - 2, cx - 3, e.y + 3, '#1c3d5a', 2); line(ctx, cx + 3, e.y - 2, cx + 3, e.y + 3, '#1c3d5a', 2);
        ellipse(ctx, cx, cy + 2, 9, 12, c('#4c6ef5'));
        ellipse(ctx, cx - 6, cy + 2, 6, 12, c('#364fc7')); ellipse(ctx, cx + 6, cy + 2, 6, 12, c('#364fc7'));
        poly(ctx, [cx - 6, cy + 13, cx - 3, cy + 20, cx - 1, cy + 13], c('#4c6ef5')); poly(ctx, [cx + 1, cy + 13, cx + 3, cy + 20, cx + 6, cy + 13], c('#4c6ef5'));
        circle(ctx, cx - 3, cy + 9, 2, '#e7f5ff'); circle(ctx, cx + 3, cy + 9, 2, '#e7f5ff');
        return;
      }
      const flap = Math.sin(e.t * 0.6) * 9;
      for (const s of [-1, 1]) {
        poly(ctx, [cx + s * 4, cy - 2, cx + s * 24, cy - 10 - flap, cx + s * 20, cy + 2, cx + s * 14, cy - 2, cx + s * 10, cy + 5], c('#364fc7'));
        poly(ctx, [cx + s * 4, cy - 6, cx + s * 8, cy - 15, cx + s * 9, cy - 4], c('#4c6ef5'));
      }
      ellipse(ctx, cx, cy, 9, 8, c('#4c6ef5'));
      circle(ctx, cx + f * 3 - 3, cy - 2, 2, '#e7f5ff'); circle(ctx, cx + f * 3 + 3, cy - 2, 2, '#e7f5ff');
      poly(ctx, [cx - 3, cy + 3, cx - 1.5, cy + 8, cx, cy + 3], '#fff'); poly(ctx, [cx, cy + 3, cx + 1.5, cy + 8, cx + 3, cy + 3], '#fff');
    },
    boarder(ctx, e, c, cx, by, f) {
      const tilt = e.onGround ? 0 : clamp(e.vy * 0.04, -0.4, 0.4) * f;
      ctx.save(); ctx.translate(cx, by); ctx.rotate(tilt); ctx.translate(-cx, -by);
      fillRR(ctx, cx - 30, by - 7, 60, 7, 3, '#1c7ed6');
      rect(ctx, cx - 20, by - 6, 40, 2, '#ffd43b');
      cousin(ctx, { t: e.t, vx: 0 }, c, cx, by - 6, f, { pants: '#495057', shirt: '#ff922b', stripes: '#1c7ed6', hat: 'beanie', hatColor: '#e64980', glasses: true, beard: '#9a9a9a' });
      line(ctx, cx - f * 12, by - 42, cx - f * 30, by - 50, c('#ff922b'), 6); line(ctx, cx + f * 12, by - 42, cx + f * 28, by - 34, c('#ff922b'), 6);
      ctx.restore();
    },
    gladiator(ctx, e, c, cx, by, f) {
      const bash = e.state === 'bash', wind = e.state === 'wind';
      cousin(ctx, e, c, cx, by, f, { pants: '#8b5e3c', shirt: '#c92a2a', hat: 'none', hatColor: '#ffd43b', beard: '#6b3e1f' });
      // armor plate + belt
      fillRR(ctx, cx - 14, by - 44, 28, 18, 5, c('#adb5bd')); rect(ctx, cx - 16, by - 24, 32, 4, c('#5c3d22'));
      // helmet with crest
      ctx.fillStyle = c('#ffd43b'); ctx.beginPath(); ctx.arc(cx + f * 2, by - 54, 12, Math.PI, 0); ctx.fill();
      rect(ctx, cx + f * 2 - 12, by - 55, 24, 3, c('#e67700'));
      for (let i = 0; i < 6; i++) circle(ctx, cx + f * 2 - f * (i * 3 - 6), by - 68 - Math.sin(i * 0.5) * 2, 4, c('#e03131'));
      // sword in the back hand
      line(ctx, cx - f * 14, by - 34, cx - f * 22, by - 50, '#f8f9fa', 3); rect(ctx, cx - f * 16 - 3, by - 37, 6, 3, '#5c3d22');
      // big shield out front
      const sx = cx + f * (bash ? 26 : wind ? 12 : 18);
      fillRR(ctx, sx - 10, by - 58, 20, 48, 5, c('#ffd43b'));
      fillRR(ctx, sx - 8, by - 56, 16, 44, 4, c('#c92a2a'));
      circle(ctx, sx, by - 34, 5, c('#ffd43b'));
      text(ctx, 'B', sx, by - 47, { size: 9, color: '#ffd43b' });
    },
    lion(ctx, e, c, cx, by, f) {
      const crouch = e.state === 'roar' ? 6 : e.state === 'rest' ? 3 : 0, air = e.state === 'pounce';
      const run = Math.abs(e.vx) > 0.3 && !air ? Math.sin(e.t * 0.35) * 4 : 0;
      ctx.save(); ctx.translate(cx, by); ctx.scale(f, 1);
      ctx.strokeStyle = c('#c98a2e'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-28, -24 + crouch);
      ctx.quadraticCurveTo(-42, -24 + Math.sin(e.t * 0.1) * 6, -46, -36); ctx.stroke();
      circle(ctx, -47, -37, 4.5, '#8a4b14');
      if (air) {
        rect(ctx, 14, -22, 20, 7, c('#d4892a')); rect(ctx, -36, -20, 20, 7, c('#d4892a'));
      } else {
        for (const [lx, s] of [[-22, 1], [-13, -1], [12, 1], [20, -1]]) rect(ctx, lx + run * s, -14, 7, 14, c('#d4892a'));
      }
      ellipse(ctx, -2, -22 + crouch, 28, 13, c('#e8a33d'));
      ellipse(ctx, 0, -15 + crouch, 20, 5, c('#f4c27a'));
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; poly(ctx, [20 + Math.cos(a) * 12, -28 + crouch + Math.sin(a) * 12, 20 + Math.cos(a + 0.3) * 19, -28 + crouch + Math.sin(a + 0.3) * 19, 20 + Math.cos(a + 0.6) * 12, -28 + crouch + Math.sin(a + 0.6) * 12], c('#8a4b14')); }
      circle(ctx, 20, -28 + crouch, 14, c('#a0571a'));
      circle(ctx, 23, -27 + crouch, 9, c('#e8a33d'));
      circle(ctx, 19, -35 + crouch, 3, c('#e8a33d'));
      circle(ctx, 26, -30 + crouch, 1.9, '#111');
      line(ctx, 23, -33 + crouch, 28, -32 + crouch, '#5c2e0a', 1.5);
      poly(ctx, [30, -27 + crouch, 33, -26 + crouch, 31, -23 + crouch], '#5c2e0a');
      if (e.state === 'roar' || air) {
        ellipse(ctx, 29, -20 + crouch, 5, 4, '#7a1f1f');
        poly(ctx, [26, -23 + crouch, 27, -19 + crouch, 28, -23 + crouch], '#fff'); poly(ctx, [30, -23 + crouch, 31, -19 + crouch, 32, -23 + crouch], '#fff');
      } else line(ctx, 27, -21 + crouch, 32, -21 + crouch, '#5c2e0a', 1.5);
      ctx.restore();
    },
    chariot(ctx, e, c, cx, by, f) {
      const charge = e.state === 'charge', rear = e.state === 'rear';
      const gal = charge ? Math.sin(e.t * 0.7) * 6 : Math.abs(e.vx) > 0.3 ? Math.sin(e.t * 0.3) * 3 : 0;
      ctx.save(); ctx.translate(cx, by); ctx.scale(f, 1);
      // chariot + driver (Bob's cousin) at the back
      poly(ctx, [-46, -42, -14, -42, -10, -18, -46, -18], c('#ffd43b'));
      rect(ctx, -46, -44, 32, 4, c('#e67700'));
      ellipse(ctx, -32, -47, 8, 9, c('#c92a2a'));
      circle(ctx, -30, -59, 7, c('#f1c9a5'));
      ellipse(ctx, -28, -54, 6, 4, c('#6b3e1f'));
      ctx.fillStyle = c('#ffd43b'); ctx.beginPath(); ctx.arc(-30, -62, 7.5, Math.PI, 0); ctx.fill();
      for (let i = 0; i < 4; i++) circle(ctx, -34 + i * 3, -70, 3, '#e03131');
      circle(ctx, -26, -60, 1.6, '#111');
      line(ctx, -26, -48, 34, -38, '#5c3d22', 1.5);
      circle(ctx, -30, -14, 14, '#5c3d22'); circle(ctx, -30, -14, 11, c('#8b5e3c'));
      for (let i = 0; i < 4; i++) { const a = (e.rot || 0) + i * Math.PI / 4; line(ctx, -30 - Math.cos(a) * 10, -14 - Math.sin(a) * 10, -30 + Math.cos(a) * 10, -14 + Math.sin(a) * 10, '#5c3d22', 2); }
      circle(ctx, -30, -14, 3, '#ffd43b');
      line(ctx, -12, -24, 10, -28, '#8b5e3c', 3);
      // the horse
      ctx.save(); if (rear) { ctx.translate(10, -6); ctx.rotate(-0.35); ctx.translate(-10, 6); }
      for (const [lx, s, front] of [[6, 1, 0], [14, -1, 0], [30, -1, 1], [38, 1, 1]]) {
        const sw = rear && front ? -8 : gal * s;
        line(ctx, lx, -26, lx + sw, -4, c('#6b4423'), 5); rect(ctx, lx + sw - 3, -5, 7, 5, '#2b1b10');
      }
      line(ctx, 2, -34, -8, -22 + gal * 0.5, '#3b2a1a', 4);
      ellipse(ctx, 22, -32, 20, 10, c('#8b5e3c'));
      poly(ctx, [34, -38, 44, -56, 52, -52, 42, -30], c('#8b5e3c'));
      ellipse(ctx, 52, -54, 10, 6, c('#8b5e3c'), 0.4);
      line(ctx, 36, -42, 44, -58, '#3b2a1a', 4);
      circle(ctx, 51, -57, 1.6, '#111');
      for (let i = 0; i < 3; i++) circle(ctx, 45 + i * 2, -62 - i * 3, 3, '#e03131');
      ctx.restore();
      ctx.restore();
    },
    archer(ctx, e, c, cx, by, f) {
      cousin(ctx, e, c, cx, by, f, { pants: '#8b5e3c', shirt: '#e03131', stripes: '#ffd43b', hat: 'band', hatColor: '#2b8a3e', beard: '#c0841a' });
      rect(ctx, cx - f * 16 - 4, by - 50, 8, 22, '#5c3d22');
      for (let i = 0; i < 3; i++) line(ctx, cx - f * (14 + i * 2), by - 50, cx - f * (14 + i * 2), by - 58, '#f8f9fa', 1.5);
      const aiming = e.drawT > 0, a = aiming ? -1.05 : -0.2;
      ctx.save(); ctx.translate(cx + f * 14, by - 38); ctx.scale(f, 1); ctx.rotate(a);
      ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 16, -1.2, 1.2); ctx.stroke();
      const pull = aiming ? (34 - e.drawT) * 0.3 : 0;
      line(ctx, Math.cos(-1.2) * 16, Math.sin(-1.2) * 16, -pull, 0, '#dee2e6', 1);
      line(ctx, -pull, 0, Math.cos(1.2) * 16, Math.sin(1.2) * 16, '#dee2e6', 1);
      if (aiming) { line(ctx, -pull, 0, 20, 0, '#8b5e3c', 2); poly(ctx, [20, -3, 26, 0, 20, 3], '#adb5bd'); }
      ctx.restore();
    },
    alien(ctx, e, c, cx, by, f) {
      let a = 1;
      if (e.state === 'out') a = e.st / 20; else if (e.state === 'in') a = 1 - e.st / 20;
      if (a < 1) for (let i = 0; i < 8; i++) rect(ctx, cx + rand(-16, 16), by - rand(0, 50), 2, 6, 'rgba(216,245,162,0.8)');
      ctx.save(); ctx.globalAlpha = Math.max(0.05, a);
      line(ctx, cx - 4, by - 14, cx - 6, by, c('#adb5bd'), 3); line(ctx, cx + 4, by - 14, cx + 6, by, c('#adb5bd'), 3);
      ellipse(ctx, cx, by - 20, 8, 10, c('#c8ccd0'));
      line(ctx, cx - f * 6, by - 24, cx - f * 12, by - 13, c('#c8ccd0'), 2.5);
      line(ctx, cx + f * 6, by - 24, cx + f * 14, by - 25, c('#c8ccd0'), 2.5);
      rect(ctx, cx + f * 12 - (f < 0 ? 12 : 0), by - 29, 12, 6, '#868e96');
      const glow = e.state === 'aim' && e.t % 6 < 3;
      circle(ctx, cx + f * 25, by - 26, glow ? 4 : 2.5, glow ? '#d8f5a2' : '#69db7c');
      ellipse(ctx, cx + f, by - 37, 13, 12, c('#d5d9dd'));
      for (const s of [-1, 1]) ellipse(ctx, cx + f + s * 5 + f * 1.5, by - 37, 4.5, 2.6, '#111', s * 0.5);
      line(ctx, cx + f * 2, by - 48, cx + f * 5, by - 56, '#adb5bd', 1.5);
      circle(ctx, cx + f * 5, by - 57, 2.5, e.t % 30 < 15 ? '#ff6b6b' : '#ffd43b');
      ctx.restore();
    },
    ufo(ctx, e, c, cx, by, f) {
      const top = e.y + e.h;
      if (e.beam > 0) {
        const warm = e.beam >= 100, hw = 16 + (GROUND_Y - top) * 0.1;
        ctx.save();
        ctx.globalAlpha = warm ? (e.t % 6 < 3 ? 0.12 : 0.04) : 0.22 + Math.sin(e.t * 0.3) * 0.05;
        poly(ctx, [cx - 16, top, cx + 16, top, cx + hw, GROUND_Y, cx - hw, GROUND_Y], '#b2f2bb');
        if (!warm) {
          ctx.globalAlpha = 0.5; ctx.strokeStyle = '#d8f5a2'; ctx.lineWidth = 2;
          for (let k = 0; k < 4; k++) {
            const yy = GROUND_Y - ((e.t * 3 + k * 70) % (GROUND_Y - top)), w2 = 16 + (yy - top) * 0.1;
            ctx.beginPath(); ctx.ellipse(cx, yy, w2, 4, 0, 0, Math.PI * 2); ctx.stroke();
          }
        }
        ctx.restore();
      }
      ellipse(ctx, cx, e.y + 10, 17, 13, 'rgba(165,216,255,0.75)');
      ellipse(ctx, cx + 2, e.y + 12, 5, 6, '#c8ccd0'); circle(ctx, cx, e.y + 11, 1.5, '#111'); circle(ctx, cx + 4, e.y + 11, 1.5, '#111');
      ellipse(ctx, cx, e.y + 22, 40, 11, c('#adb5bd'));
      ellipse(ctx, cx, e.y + 19, 40, 5, c('#ced4da'));
      ellipse(ctx, cx, e.y + 28, 22, 5, c('#868e96'));
      for (let i = 0; i < 6; i++) circle(ctx, cx - 30 + i * 12, e.y + 23, 2.5, (Math.floor(e.t / 6) + i) % 3 === 0 ? '#ffd43b' : '#69db7c');
    },
    mutant(ctx, e, c, cx, by, f) {
      const sq = e.onGround ? 1 + Math.sin(e.t * 0.15) * 0.07 : 0.85, hh = e.h * sq;
      ellipse(ctx, cx, by - hh / 2, e.w / 2 * (2 - sq), hh / 2, c('#69db7c'));
      ellipse(ctx, cx, by - 4, e.w / 2 + 4, 6, c('#51cf66'));
      for (let i = 0; i < 3; i++) { const dx2 = -14 + i * 14, drip = (e.t * 0.3 + i * 7) % 12; ellipse(ctx, cx + dx2, by - hh * 0.3 + drip, 3, 5, c('#40c057')); }
      ellipse(ctx, cx - 8, by - hh + 8, 7, 3, 'rgba(255,255,255,0.45)');
      for (const [ex, ey, r] of [[-8, 0.62, 5], [6, 0.68, 6], [-1, 0.84, 3.5], [14, 0.5, 3]]) {
        circle(ctx, cx + ex + f * 2, by - hh * ey, r, '#f8f9fa'); circle(ctx, cx + ex + f * (2 + r * 0.4), by - hh * ey + 1, r * 0.5, '#111');
      }
      if (e.spit > 0) ellipse(ctx, cx + f * 4, by - hh * 0.32, 7, 5, '#2b8a3e');
      else line(ctx, cx - 6 + f * 3, by - hh * 0.3, cx + 8 + f * 3, by - hh * 0.32, '#2b8a3e', 2);
    },
    minimutant(ctx, e, c, cx, by, f) {
      const sq = e.onGround ? 1 : 0.85, hh = e.h * sq;
      ellipse(ctx, cx, by - hh / 2, e.w / 2 * (2 - sq), hh / 2, c('#8ce99a'));
      circle(ctx, cx - 4 + f * 2, by - hh * 0.6, 3.5, '#fff'); circle(ctx, cx + 4 + f * 2, by - hh * 0.6, 3.5, '#fff');
      circle(ctx, cx - 4 + f * 3, by - hh * 0.6, 1.6, '#111'); circle(ctx, cx + 4 + f * 3, by - hh * 0.6, 1.6, '#111');
      line(ctx, cx - 3 + f * 2, by - hh * 0.3, cx + 4 + f * 2, by - hh * 0.3, '#2b8a3e', 1.5);
    },
    robodog(ctx, e, c, cx, by, f) {
      const run = Math.abs(e.vx) > 0.5 ? Math.sin(e.t * 0.6) * 4 : 0;
      const ey = e.y + 10, hx = cx + f * 22;
      if (e.state === 'aim') {
        ctx.save(); ctx.globalAlpha = 0.6; ctx.setLineDash([6, 6]);
        line(ctx, hx, ey, hx + f * 640, ey, '#ff6b6b', 1.5); ctx.restore();
        const p = G.player;
        if (p && e.t % 8 < 5 && p.y < ey && p.y + p.h > ey && Math.sign(p.x + p.w / 2 - cx) === f) circle(ctx, p.x + p.w / 2 - f * 10, ey, 4, '#ff2d2d');
      } else if (e.state === 'fire') {
        ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(e.t) * 0.2;
        line(ctx, hx, ey, hx + f * 640, ey, '#ff6b6b', 10); line(ctx, hx, ey, hx + f * 640, ey, '#fff', 3); ctx.restore();
      }
      ctx.save(); ctx.translate(cx, by); ctx.scale(f, 1);
      for (const [lx, s] of [[-16, 1], [-8, -1], [8, 1], [16, -1]]) { line(ctx, lx, -14, lx + run * s, -2, c('#868e96'), 4); rect(ctx, lx + run * s - 3, -3, 6, 3, '#343a40'); }
      line(ctx, -22, -20, -32, -30 + Math.sin(e.t * 0.3) * 3, c('#868e96'), 3);
      fillRR(ctx, -22, -26, 40, 14, 5, c('#ced4da'));
      rect(ctx, -14, -24, 18, 3, '#ffd43b'); rect(ctx, -14, -18, 18, 3, '#343a40');
      fillRR(ctx, 12, -34, 20, 16, 5, c('#adb5bd'));
      rect(ctx, 18, -30, 12, 5, '#212529'); rect(ctx, 22, -29, 6, 3, e.state ? '#ff2d2d' : '#ff8787');
      poly(ctx, [14, -34, 16, -42, 20, -34], c('#868e96'));
      line(ctx, 0, -26, 0, -36, '#495057', 1.5); circle(ctx, 0, -37, 2, e.t % 20 < 10 ? '#ff6b6b' : '#69db7c');
      ctx.restore();
    },
  });

  // ---- Things that get thrown --------------------------------------------------
  Object.assign(THROWN_ART, {
    an_snowball(ctx) { circle(ctx, 0, 0, 8, '#f8f9fa'); ellipse(ctx, 2, 3, 5, 3, '#dee2e6'); circle(ctx, -3, -3, 2, '#fff'); },
    an_fish(ctx) {
      ellipse(ctx, 0, 0, 11, 5, '#74c0fc'); poly(ctx, [-9, 0, -16, -6, -16, 6], '#4dabf7');
      circle(ctx, 6, -1, 1.5, '#111'); line(ctx, 0, -4, 0, 4, '#a5d8ff', 1);
      ctx.globalAlpha = 0.45; fillRR(ctx, -14, -8, 28, 16, 4, '#e7f5ff'); ctx.globalAlpha = 1;
    },
    hi_bigball(ctx) {
      circle(ctx, 0, 0, 22, '#f8f9fa'); ellipse(ctx, 4, 8, 15, 8, '#dee2e6');
      circle(ctx, -8, -6, 3, '#868e96'); rect(ctx, 10, -12, 12, 3, '#6b4423'); circle(ctx, 6, 10, 2.5, '#868e96');
    },
    hi_snowbomb(ctx) {
      circle(ctx, 0, 2, 10, '#f8f9fa'); ellipse(ctx, 2, 5, 6, 4, '#dee2e6');
      line(ctx, 0, -8, 4, -15, '#5c3d1e', 2); circle(ctx, 4, -16, 2.5 + Math.random() * 1.5, pick(['#ffd43b', '#ff922b']));
    },
    hi_boot(ctx) {
      fillRR(ctx, -6, -12, 10, 16, 3, '#8b5e3c'); fillRR(ctx, -6, 0, 18, 8, 3, '#8b5e3c'); rect(ctx, -6, 6, 18, 3, '#343a40');
      for (let i = 0; i < 3; i++) line(ctx, -5, -9 + i * 4, 3, -9 + i * 4, '#e03131', 1);
    },
    ro_arrow(ctx) {
      line(ctx, -16, 0, 10, 0, '#8b5e3c', 2); poly(ctx, [10, -4, 18, 0, 10, 4], '#adb5bd');
      poly(ctx, [-16, 0, -21, -5, -12, 0], '#e03131'); poly(ctx, [-16, 0, -21, 5, -12, 0], '#e03131');
    },
    ro_grapes(ctx) {
      for (const [x, y] of [[-6, -4], [0, -4], [6, -4], [-3, 1], [3, 1], [0, 6]]) circle(ctx, x, y, 3.5, '#7048e8');
      line(ctx, 0, -8, 2, -13, '#5c3d1e', 2); ellipse(ctx, 6, -11, 5, 3, '#2b8a3e', -0.4);
    },
    ro_amphora(ctx) {
      ellipse(ctx, 0, 2, 8, 10, '#c2622d'); rect(ctx, -3, -12, 6, 6, '#c2622d'); rect(ctx, -5, -13, 10, 2, '#a34e1f');
      line(ctx, -3, -8, -9, -3, '#a34e1f', 2); line(ctx, 3, -8, 9, -3, '#a34e1f', 2); rect(ctx, -8, 1, 16, 2, '#212529');
    },
    ro_helmet(ctx) {
      ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(0, 2, 10, Math.PI, 0); ctx.fill();
      rect(ctx, -11, 1, 22, 3, '#e67700');
      for (let i = 0; i < 5; i++) circle(ctx, -6 + i * 3, -9 - Math.sin(i * 0.7) * 2, 3, '#e03131');
    },
    a51_zap(ctx) {
      ctx.globalAlpha = 0.5; ellipse(ctx, 0, 0, 14, 6, '#69db7c'); ctx.globalAlpha = 1;
      ellipse(ctx, 0, 0, 9, 3, '#d8f5a2'); ellipse(ctx, 2, 0, 4, 1.5, '#fff');
    },
    a51_goo(ctx) { circle(ctx, 0, 0, 8, '#51cf66'); circle(ctx, -5, 5, 4, '#40c057'); circle(ctx, -2, -3, 2, '#d8f5a2'); },
    a51_probe(ctx) {
      fillRR(ctx, -8, -6, 16, 12, 3, '#adb5bd'); rect(ctx, -6, -4, 12, 3, '#212529');
      line(ctx, 0, -6, 0, -12, '#868e96', 1.5); circle(ctx, 0, -13, 2.2, Math.random() < 0.5 ? '#ff6b6b' : '#69db7c');
    },
    a51_cow(ctx) {
      for (const lx of [-7, -3, 3, 7]) rect(ctx, lx - 1, 3, 2, 6, '#f8f9fa');
      ellipse(ctx, 0, 0, 10, 6, '#f8f9fa'); circle(ctx, -3, -1, 2.5, '#212529'); circle(ctx, 4, 1, 2, '#212529');
      circle(ctx, 10, -3, 4, '#f8f9fa'); ellipse(ctx, 12, -2, 2.5, 2, '#ffa8a8'); circle(ctx, 9, -5, 1, '#111');
    },
  });

  Object.assign(SPLAT_COLS, {
    an_snowball: ['#f8f9fa', '#dee2e6'], an_fish: ['#74c0fc', '#e7f5ff'], hi_bigball: ['#f8f9fa', '#dee2e6'],
    hi_snowbomb: ['#f8f9fa', '#ffd43b', '#ff922b'], hi_boot: ['#8b5e3c', '#e03131'], ro_arrow: ['#8b5e3c', '#e03131'],
    ro_grapes: ['#7048e8', '#9775fa'], ro_amphora: ['#c2622d', '#a34e1f'], ro_helmet: ['#ffd43b', '#e03131'],
    a51_zap: ['#69db7c', '#d8f5a2'], a51_goo: ['#51cf66', '#2b8a3e'], a51_probe: ['#adb5bd', '#ff6b6b'], a51_cow: ['#f8f9fa', '#212529'],
  });

  // Shooting through these blocks throws matching chips.
  if (typeof SPLINTERS !== 'undefined') Object.assign(SPLINTERS, {
    an_iceblock: ['#d0ebff', '#ffffff'], an_drum: ['#e8590c', '#f8f9fa'], hi_boulder: ['#868e96', '#f8f9fa'], hi_crate: ['#4263eb', '#c9a46b'],
    ro_stone: ['#d9b38c', '#b08968'], a51_crate: ['#5c6b3a', '#c9a46b'], a51_tank: ['#69db7c', '#adb5bd'],
  });

  // ==========================================================================
  // SCENERY
  // ==========================================================================
  Object.assign(Props, {
    // Antarctica
    an_hut(ctx, x) {
      const y = GROUND_Y;
      for (const lx of [x + 12, x + 100]) rect(ctx, lx, y - 34, 8, 34, '#495057');
      fillRR(ctx, x, y - 84, 120, 52, 8, '#f76707'); rect(ctx, x, y - 84, 120, 8, '#f8f9fa');
      for (let i = 0; i < 3; i++) fillRR(ctx, x + 12 + i * 34, y - 68, 22, 16, 3, '#1c3d5a');
      rect(ctx, x + 96, y - 112, 3, 30, '#868e96'); ellipse(ctx, x + 98, y - 114, 10, 4, '#ced4da', -0.4);
      fillRR(ctx, x + 20, y - 40, 80, 10, 3, '#fff'); text(ctx, "BOB'S NOW", x + 60, y - 35, { size: 8, color: '#c92a2a' });
    },
    an_igloo(ctx, x) {
      const y = GROUND_Y;
      ctx.fillStyle = '#f8f9fa'; ctx.beginPath(); ctx.ellipse(x, y, 62, 50, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#ced4da'; ctx.lineWidth = 1.5;
      for (let r = 1; r < 4; r++) { ctx.beginPath(); ctx.ellipse(x, y, 62, 50 - r * 0.1, 0, Math.PI, 0); ctx.stroke(); line(ctx, x - 62 + r * 4, y - r * 13, x + 62 - r * 4, y - r * 13, '#ced4da', 1.5); }
      ctx.fillStyle = '#1c3d5a'; ctx.beginPath(); ctx.ellipse(x + 30, y, 14, 18, 0, Math.PI, 0); ctx.fill();
    },
    an_pole(ctx, x) {
      const y = GROUND_Y;
      for (let i = 0; i < 9; i++) rect(ctx, x - 3, y - 78 + i * 8.7, 6, 8.7, i % 2 ? '#fff' : '#e03131');
      circle(ctx, x, y - 86, 10, '#ced4da'); circle(ctx, x - 3, y - 89, 3, '#fff');
      fillRR(ctx, x + 10, y - 40, 60, 16, 3, '#1c3d5a'); text(ctx, 'BOTTOM!', x + 40, y - 32, { size: 8, color: '#fff' });
    },
    an_sled(ctx, x) {
      const y = GROUND_Y;
      line(ctx, x - 6, y - 3, x + 80, y - 3, '#343a40', 3); line(ctx, x - 6, y - 3, x - 12, y - 10, '#343a40', 3);
      poly(ctx, [x, y - 10, x + 70, y - 10, x + 82, y - 30, x + 50, y - 38, x + 14, y - 30], '#fab005');
      fillRR(ctx, x + 14, y - 44, 30, 10, 4, '#212529'); line(ctx, x + 56, y - 38, x + 66, y - 52, '#495057', 3);
      rect(ctx, x + 60, y - 54, 14, 3, '#495057');
    },
    // Everest
    hi_tent(ctx, x) {
      const y = GROUND_Y;
      line(ctx, x - 70, y, x - 20, y - 50, '#adb5bd', 1); line(ctx, x + 70, y, x + 20, y - 50, '#adb5bd', 1);
      ctx.fillStyle = '#fab005'; ctx.beginPath(); ctx.ellipse(x, y, 54, 48, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#f08c00'; ctx.beginPath(); ctx.ellipse(x, y, 54, 48, 0, Math.PI, Math.PI * 1.25); ctx.lineTo(x, y); ctx.fill();
      ellipse(ctx, x, y - 46, 30, 6, '#f8f9fa');
      ctx.fillStyle = '#1c3d5a'; ctx.beginPath(); ctx.ellipse(x + 14, y, 14, 26, 0, Math.PI, 0); ctx.fill();
    },
    hi_flags(ctx, x) {
      const y = GROUND_Y, cols = ['#1c7ed6', '#f8f9fa', '#e03131', '#2b8a3e', '#fab005'];
      rect(ctx, x, y - 118, 4, 118, '#6b4423'); rect(ctx, x + 256, y - 100, 4, 100, '#6b4423');
      for (let i = 0; i < 13; i++) {
        const k = (i + 0.5) / 13, fx = x + 2 + k * 256, fy = y - 116 + k * 18 + Math.sin(k * Math.PI) * 30;
        const wav = Math.sin(G.t * 0.1 + i) * 2;
        rect(ctx, fx - 7, fy, 14, 15 + wav, cols[i % 5]);
      }
      ctx.strokeStyle = '#495057'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 2, y - 116);
      ctx.quadraticCurveTo(x + 130, y - 50, x + 258, y - 98); ctx.stroke();
    },
    hi_cairn(ctx, x) {
      const y = GROUND_Y;
      [[0, 26, 12], [2, 21, 10], [-1, 16, 9], [1, 11, 8], [0, 7, 6]].reduce((yy, [dx, rx, ry]) => {
        ellipse(ctx, x + dx, yy - ry, rx, ry, '#868e96'); ellipse(ctx, x + dx - 3, yy - ry - 3, rx * 0.5, ry * 0.4, '#adb5bd');
        return yy - ry * 1.8;
      }, y);
    },
    hi_oxygen(ctx, x) {
      const y = GROUND_Y;
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(x + i * 14, y); ctx.rotate(-0.15 + i * 0.12);
        fillRR(ctx, -6, -46, 12, 46, 6, '#f76707'); rect(ctx, -3, -52, 6, 7, '#adb5bd'); rect(ctx, -6, -30, 12, 4, '#fff');
        ctx.restore();
      }
    },
    // Colosseum
    ro_column(ctx, x) {
      const y = GROUND_Y;
      rect(ctx, x - 22, y - 12, 44, 12, '#d9c7a8');
      rect(ctx, x - 16, y - 120, 32, 108, '#e9dcc3');
      for (let i = 0; i < 4; i++) rect(ctx, x - 12 + i * 8, y - 118, 2, 104, '#cbb894');
      poly(ctx, [x - 18, y - 120, x - 10, y - 128, x - 2, y - 122, x + 6, y - 132, x + 16, y - 124, x + 18, y - 120], '#e9dcc3');
    },
    ro_statue(ctx, x) {
      const y = GROUND_Y, m = '#e9ecef', d = '#ced4da';
      fillRR(ctx, x - 34, y - 40, 68, 40, 3, '#d9c7a8'); text(ctx, 'BOBVS', x, y - 22, { size: 11, color: '#8b6f47' });
      fillRR(ctx, x - 14, y - 64, 12, 24, 4, d); fillRR(ctx, x + 2, y - 64, 12, 24, 4, d);
      ellipse(ctx, x, y - 92, 28, 30, m); poly(ctx, [x - 26, y - 104, x + 24, y - 72, x + 20, y - 64, x - 28, y - 96], d);
      circle(ctx, x + 2, y - 128, 13, m); ellipse(ctx, x + 2, y - 116, 12, 9, d);
      ctx.fillStyle = d; ctx.beginPath(); ctx.arc(x + 2, y - 132, 13, Math.PI, 0); ctx.fill();
      ellipse(ctx, x + 30, y - 110, 7, 18, m, -0.5); circle(ctx, x + 38, y - 126, 6, m);
      ctx.strokeStyle = '#2b8a3e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 2, y - 134, 12, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
    },
    ro_banner(ctx, x) {
      const y = GROUND_Y, wave = Math.sin(G.t * 0.06) * 3;
      rect(ctx, x - 2, y - 150, 4, 150, '#8b6f47'); rect(ctx, x - 26, y - 146, 52, 4, '#8b6f47');
      poly(ctx, [x - 22, y - 142, x + 22, y - 142, x + 22 + wave, y - 70, x + wave, y - 82, x - 22 + wave, y - 70], '#c92a2a');
      text(ctx, 'B', x + wave * 0.5, y - 114, { size: 22, color: '#ffd43b' });
      ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + wave * 0.5, y - 114, 17, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    },
    ro_rack(ctx, x) {
      const y = GROUND_Y;
      rect(ctx, x, y - 60, 70, 5, '#8b5e3c'); rect(ctx, x + 4, y - 60, 5, 60, '#8b5e3c'); rect(ctx, x + 61, y - 60, 5, 60, '#8b5e3c');
      for (let i = 0; i < 3; i++) { line(ctx, x + 18 + i * 16, y, x + 22 + i * 16, y - 92, '#8b5e3c', 3); poly(ctx, [x + 18 + i * 16, y - 92, x + 22 + i * 16, y - 104, x + 26 + i * 16, y - 92], '#adb5bd'); }
      circle(ctx, x + 35, y - 30, 16, '#c92a2a'); circle(ctx, x + 35, y - 30, 5, '#ffd43b');
    },
    ro_amphora(ctx, x) {
      const y = GROUND_Y;
      for (const [dx, s] of [[0, 1], [26, 0.8]]) {
        ellipse(ctx, x + dx, y - 26 * s, 14 * s, 24 * s, '#c2622d'); rect(ctx, x + dx - 5 * s, y - 56 * s, 10 * s, 10 * s, '#c2622d');
        rect(ctx, x + dx - 14 * s, y - 30 * s, 28 * s, 4 * s, '#212529');
      }
    },
    // Area 51
    a51_sign(ctx, x) {
      const y = GROUND_Y;
      rect(ctx, x - 40, y - 60, 5, 60, '#868e96'); rect(ctx, x + 35, y - 60, 5, 60, '#868e96');
      rect(ctx, x - 56, y - 104, 112, 54, '#f8f9fa'); rect(ctx, x - 56, y - 104, 112, 16, '#e03131');
      text(ctx, 'RESTRICTED', x, y - 96, { size: 10, color: '#fff' });
      text(ctx, 'NO BOBS', x, y - 78, { size: 12, color: '#212529' });
      text(ctx, 'BEYOND THIS POINT', x, y - 62, { size: 7, color: '#212529' });
    },
    a51_tower(ctx, x) {
      const y = GROUND_Y;
      line(ctx, x - 26, y, x - 14, y - 130, '#495057', 4); line(ctx, x + 26, y, x + 14, y - 130, '#495057', 4);
      for (let i = 0; i < 3; i++) { line(ctx, x - 24 + i * 4, y - 20 - i * 40, x + 20 - i * 4, y - 60 - i * 40, '#495057', 2); line(ctx, x + 24 - i * 4, y - 20 - i * 40, x - 20 + i * 4, y - 60 - i * 40, '#495057', 2); }
      rect(ctx, x - 26, y - 160, 52, 32, '#343a40'); rect(ctx, x - 20, y - 154, 40, 12, '#ffe066');
      const a = Math.sin(G.t * 0.02 + x) * 0.5 + Math.PI / 2;
      ctx.save(); ctx.globalAlpha = 0.12;
      poly(ctx, [x, y - 150, x + Math.cos(a - 0.15) * 420, y - 150 + Math.sin(a - 0.15) * 420, x + Math.cos(a + 0.15) * 420, y - 150 + Math.sin(a + 0.15) * 420], '#fff9db');
      ctx.restore();
    },
    a51_dish(ctx, x) {
      const y = GROUND_Y, s = Math.cos(G.t * 0.02 + x * 0.01);
      rect(ctx, x - 4, y - 60, 8, 60, '#868e96'); fillRR(ctx, x - 20, y - 14, 40, 14, 3, '#495057');
      ctx.save(); ctx.translate(x, y - 70); ctx.scale(Math.max(0.15, Math.abs(s)), 1);
      ellipse(ctx, 0, 0, 40, 36, '#dee2e6'); ellipse(ctx, 0, 0, 30, 27, '#ced4da'); line(ctx, 0, 0, s >= 0 ? 34 : -34, -10, '#868e96', 2);
      ctx.restore();
    },
    a51_barrel(ctx, x) {
      const y = GROUND_Y;
      for (let i = 0; i < 3; i++) {
        const bx = x + i * 30 - (i === 2 ? 15 : 0), byy = i === 2 ? y - 44 : y;
        fillRR(ctx, bx, byy - 44, 26, 44, 4, '#2f9e44'); rect(ctx, bx, byy - 32, 26, 3, '#2b8a3e'); rect(ctx, bx, byy - 14, 26, 3, '#2b8a3e');
        circle(ctx, bx + 13, byy - 23, 6, '#ffd43b'); circle(ctx, bx + 13, byy - 23, 2, '#212529');
      }
      ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(G.t * 0.08) * 0.1; ellipse(ctx, x + 30, y - 2, 46, 6, '#b2f2bb'); ctx.restore();
    },
    a51_crashed(ctx, x) {
      const y = GROUND_Y;
      ctx.save(); ctx.translate(x, y - 10); ctx.rotate(-0.25);
      ellipse(ctx, 0, -14, 30, 20, 'rgba(165,216,255,0.6)');
      ellipse(ctx, 0, 0, 86, 18, '#adb5bd'); ellipse(ctx, 0, -4, 86, 8, '#ced4da');
      for (let i = 0; i < 7; i++) circle(ctx, -60 + i * 20, 4, 3, (Math.floor(G.t / 20) + i) % 4 === 0 ? '#ff6b6b' : '#495057');
      ctx.restore();
      rect(ctx, x - 100, y - 4, 200, 8, '#5c4a3d');
      ctx.save(); ctx.globalAlpha = 0.25;
      for (let i = 0; i < 3; i++) circle(ctx, x + 40 + i * 6, y - 50 - ((G.t * 0.5 + i * 20) % 60), 8 + i * 2, '#ced4da');
      ctx.restore();
    },
  });

  Object.assign(SolidArt, {
    an_ice(ctx, s) {
      for (const px of [s.x + 10, s.x + s.w - 24]) { ctx.globalAlpha = 0.85; rect(ctx, px, s.y + 12, 14, GROUND_Y - s.y - 12, '#a5d8ff'); ctx.globalAlpha = 1; rect(ctx, px + 3, s.y + 14, 3, GROUND_Y - s.y - 16, '#e7f5ff'); }
      fillRR(ctx, s.x, s.y, s.w, 15, 4, '#d0ebff'); rect(ctx, s.x + 4, s.y + 2, s.w - 8, 3, '#ffffff');
      for (let i = 8; i < s.w - 6; i += 14) { const len = 6 + hash(s.x + i) * 12; poly(ctx, [s.x + i - 4, s.y + 14, s.x + i + 4, s.y + 14, s.x + i, s.y + 14 + len], '#a5d8ff'); }
    },
    an_iceblock(ctx, s) {
      ctx.globalAlpha = 0.92; rect(ctx, s.x, s.y, s.w, s.h, '#a5d8ff'); ctx.globalAlpha = 1;
      poly(ctx, [s.x, s.y, s.x + s.w, s.y, s.x + s.w - 8, s.y + 8, s.x + 8, s.y + 8], '#d0ebff');
      line(ctx, s.x + s.w * 0.3, s.y + 12, s.x + s.w * 0.5, s.y + s.h * 0.6, '#e7f5ff', 1.5); line(ctx, s.x + s.w * 0.5, s.y + s.h * 0.6, s.x + s.w * 0.4, s.y + s.h - 4, '#e7f5ff', 1.5);
      rect(ctx, s.x + 6, s.y + 12, 4, s.h - 18, 'rgba(255,255,255,0.5)');
    },
    an_drum(ctx, s) {
      const n = Math.max(1, Math.round(s.w / 30)), bw = s.w / n;
      for (let i = 0; i < n; i++) {
        fillRR(ctx, s.x + i * bw + 1, s.y + 4, bw - 2, s.h - 4, 4, '#e8590c');
        rect(ctx, s.x + i * bw + 1, s.y + s.h * 0.35, bw - 2, 3, '#c2410c'); rect(ctx, s.x + i * bw + 1, s.y + s.h * 0.7, bw - 2, 3, '#c2410c');
      }
      fillRR(ctx, s.x - 2, s.y, s.w + 4, 8, 4, '#f8f9fa');
    },
    hi_ledge(ctx, s) {
      poly(ctx, [s.x + 14, s.y + 10, s.x + s.w - 14, s.y + 10, s.x + s.w * 0.7, GROUND_Y, s.x + s.w * 0.3, GROUND_Y], '#5c636a');
      poly(ctx, [s.x + 24, s.y + 14, s.x + s.w * 0.45, s.y + 14, s.x + s.w * 0.38, GROUND_Y, s.x + s.w * 0.32, GROUND_Y], '#495057');
      fillRR(ctx, s.x, s.y, s.w, 16, 6, '#6c757d');
      for (let i = 0; i < s.w; i += 18) ellipse(ctx, s.x + i + 9, s.y + 1, 11, 4 + hash(s.x + i) * 2, '#f8f9fa');
    },
    hi_bridge(ctx, s) {
      for (const px of [s.x, s.x + s.w - 6]) { rect(ctx, px, s.y - 26, 6, GROUND_Y - s.y + 26, '#6b4423'); circle(ctx, px + 3, s.y - 27, 4, '#8b5e3c'); }
      for (let i = 4; i < s.w - 4; i += 12) rect(ctx, s.x + i, s.y, 10, 12, i % 24 ? '#a0703c' : '#8b5e3c');
      ctx.strokeStyle = '#c9a46b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.x + 3, s.y - 24); ctx.quadraticCurveTo(s.x + s.w / 2, s.y - 4, s.x + s.w - 3, s.y - 24); ctx.stroke();
      for (let i = 20; i < s.w - 10; i += 26) line(ctx, s.x + i, s.y, s.x + i, s.y - 24 + Math.sin(i / s.w * Math.PI) * 18, '#c9a46b', 1);
      line(ctx, s.x + 3, s.y + 12, s.x + s.w - 3, s.y + 12, '#c9a46b', 2);
    },
    hi_boulder(ctx, s) {
      fillRR(ctx, s.x, s.y + 4, s.w, s.h - 4, 14, '#6c757d'); ellipse(ctx, s.x + s.w * 0.35, s.y + s.h * 0.45, s.w * 0.2, s.h * 0.15, '#868e96');
      ellipse(ctx, s.x + s.w / 2, s.y + 6, s.w / 2 + 2, 8, '#f8f9fa');
    },
    hi_crate(ctx, s) {
      fillRR(ctx, s.x, s.y, s.w, s.h, 4, '#4263eb'); line(ctx, s.x + 4, s.y + s.h / 2, s.x + s.w - 4, s.y + s.h / 2, '#c9a46b', 3);
      line(ctx, s.x + s.w / 2, s.y + 3, s.x + s.w / 2, s.y + s.h - 3, '#c9a46b', 3); ellipse(ctx, s.x + s.w / 2, s.y + 3, s.w / 2, 4, '#f8f9fa');
    },
    ro_ledge(ctx, s) {
      for (const px of [s.x + 14, s.x + s.w - 34]) {
        rect(ctx, px - 2, GROUND_Y - 8, 24, 8, '#cbb894');
        rect(ctx, px, s.y + 14, 20, GROUND_Y - s.y - 22, '#e9dcc3');
        for (let i = 0; i < 3; i++) rect(ctx, px + 4 + i * 6, s.y + 16, 2, GROUND_Y - s.y - 26, '#cbb894');
      }
      fillRR(ctx, s.x, s.y, s.w, 15, 2, '#e9dcc3'); rect(ctx, s.x, s.y + 11, s.w, 4, '#cbb894');
      for (let i = 10; i < s.w; i += 20) rect(ctx, s.x + i, s.y + 3, 8, 3, '#d9c7a8');
    },
    ro_scaffold(ctx, s) {
      for (const px of [s.x + 4, s.x + s.w / 2 - 3, s.x + s.w - 10]) rect(ctx, px, s.y + 10, 6, GROUND_Y - s.y - 10, '#8b5e3c');
      line(ctx, s.x + 7, s.y + 14, s.x + s.w / 2, GROUND_Y - 6, '#a0703c', 3); line(ctx, s.x + s.w / 2, s.y + 14, s.x + s.w - 7, GROUND_Y - 6, '#a0703c', 3);
      fillRR(ctx, s.x, s.y, s.w, 13, 3, '#b08968');
      for (let i = 0; i < s.w; i += 22) line(ctx, s.x + i, s.y + 1, s.x + i, s.y + 12, '#8b5e3c', 1.5);
    },
    ro_stone(ctx, s) {
      rect(ctx, s.x, s.y, s.w, s.h, '#d9b38c'); rect(ctx, s.x, s.y, s.w, 6, '#e9cba7');
      line(ctx, s.x + 8, s.y + s.h * 0.5, s.x + s.w * 0.4, s.y + s.h * 0.45, '#b08968', 2); line(ctx, s.x + s.w * 0.4, s.y + s.h * 0.45, s.x + s.w * 0.55, s.y + s.h - 4, '#b08968', 2);
      rect(ctx, s.x + s.w - 14, s.y + 10, 6, 6, '#b08968');
    },
    a51_catwalk(ctx, s) {
      for (const px of [s.x + 8, s.x + s.w - 16]) rect(ctx, px, s.y + 12, 8, GROUND_Y - s.y - 12, '#495057');
      line(ctx, s.x + 12, s.y + 16, s.x + s.w - 12, GROUND_Y - 4, '#495057', 2); line(ctx, s.x + s.w - 12, s.y + 16, s.x + 12, GROUND_Y - 4, '#495057', 2);
      rect(ctx, s.x, s.y, s.w, 13, '#868e96');
      for (let i = 4; i < s.w - 2; i += 8) line(ctx, s.x + i, s.y + 2, s.x + i, s.y + 8, '#495057', 1);
      for (let i = 0; i < s.w; i += 16) { rect(ctx, s.x + i, s.y + 9, 8, 4, '#ffd43b'); rect(ctx, s.x + i + 8, s.y + 9, 8, 4, '#212529'); }
    },
    a51_crate(ctx, s) {
      rect(ctx, s.x, s.y, s.w, s.h, '#5c6b3a'); ctx.strokeStyle = '#3f4a27'; ctx.lineWidth = 3; ctx.strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
      line(ctx, s.x + 4, s.y + 4, s.x + s.w - 4, s.y + s.h - 4, '#3f4a27', 2);
      text(ctx, '51', s.x + s.w / 2, s.y + s.h / 2, { size: 14, color: '#d8d0a8' });
    },
    a51_tank(ctx, s) {
      fillRR(ctx, s.x, s.y, s.w, s.h, 10, '#868e96');
      fillRR(ctx, s.x + 8, s.y + 10, s.w - 16, s.h - 20, 8, '#2b8a3e');
      for (let i = 0; i < 3; i++) circle(ctx, s.x + 14 + i * 10, s.y + s.h - 14 - ((G.t * 0.6 + i * 9) % (s.h - 24)), 2.5, '#d8f5a2');
      rect(ctx, s.x - 2, s.y + 4, s.w + 4, 4, '#495057');
    },
  });

  // ---- Background helpers ----------------------------------------------------------
  function stars(ctx, n, maxY, seed) {
    for (let i = 0; i < n; i++) circle(ctx, hash(i + seed) * W, hash(i + seed + 99) * maxY, 0.8 + hash(i + seed + 7) * 1.2, `rgba(255,255,255,${0.4 + hash(i + seed + 3) * 0.5})`);
  }
  // A big snowy mountain: tip at (x, top), base on y = base, half-width hw.
  function mountain(ctx, x, top, base, hw, col, snow) {
    const h = base - top;
    poly(ctx, [x - hw, base, x - hw * 0.3, top + h * 0.35, x, top, x + hw * 0.25, top + h * 0.3, x + hw, base], col);
    poly(ctx, [x, top, x + hw * 0.25, top + h * 0.3, x + hw * 0.38, top + h * 0.42, x + hw * 0.2, top + h * 0.36, x + hw * 0.05, top + h * 0.46,
      x - hw * 0.12, top + h * 0.37, x - hw * 0.3, top + h * 0.35], snow);
  }

  // ==========================================================================
  // LEVELS
  // ==========================================================================
  const ANTARCTICA = {
    name: 'ANTARCTICA', sub: 'Bob stole a research hut. The penguins are on his side.',
    length: 5200, music: 'antarctica', goonThrow: 'an_fish', goonCap: '#1c7ed6',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'rain', 'spray'], bobFood: ['an_snowball', 'an_fish', 'chicken'], bobSpeed: 1.46,
    platforms: [[460, 365, 170, 'an_ice'], [720, 315, 150, 'an_ice'], [1080, 360, 220, 'an_ice'], [1500, 370, 170, 'an_ice'],
      [1760, 320, 150, 'an_ice'], [2150, 360, 240, 'an_ice'], [2650, 365, 170, 'an_ice'], [2920, 315, 150, 'an_ice'],
      [3350, 360, 220, 'an_ice'], [3750, 370, 160, 'an_ice'], [4400, 360, 140, 'an_ice'], [4860, 355, 140, 'an_ice']],
    blocks: [[960, 56, 50, 'an_iceblock'], [1950, 60, 44, 'an_drum'], [2500, 56, 50, 'an_iceblock'], [3150, 60, 44, 'an_drum'], [4000, 56, 50, 'an_iceblock']],
    props: [['an_hut', 200], ['sign', 640, 'SOUTH POLE'], ['an_igloo', 1340], ['an_pole', 2060], ['an_sled', 2300], ['an_hut', 3020],
      ['an_igloo', 3620], ['bobsign', 4290]],
    spawns: [[580, 'penguin', 1], [820, 'penguin', 3], [1100, 'snowman', 1], [1350, 'seal', 1], [1600, 'penguin', 4], [1850, 'goon', 1],
      [2100, 'snowman', 1], [2350, 'seal', 1], [2600, 'bird', 2], [2850, 'penguin', 3], [3100, 'snowman', 2], [3350, 'seal', 2],
      [3600, 'goon', 2], [3850, 'penguin', 4], [4000, 'snowman', 1]],
    pickups: [[540, 'ammo'], [1150, 'pie'], [1700, 'nade'], [2300, 'pie'], [2900, 'ammo'], [3400, 'pie'], [3900, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#0b1d3a', '#1d4e6e', '#6fa8bd', '#d8eef2']);
      stars(ctx, 40, 170, 300);
      // the southern lights
      ctx.save();
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = 0.16; ctx.fillStyle = ['#69db7c', '#38d9a9', '#b197fc'][k];
        ctx.beginPath();
        for (let x = 0; x <= W; x += 16) { const y = 50 + k * 24 + Math.sin(x * 0.008 + G.t * 0.01 + k * 2 - camX * 0.0005) * 26; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        for (let x = W; x >= 0; x -= 16) ctx.lineTo(x, 100 + k * 24 + Math.sin(x * 0.01 + G.t * 0.013 + k) * 20);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ridge(ctx, camX, 0.05, 300, 40, 0.01, '#b9d3df', 7);
      rect(ctx, 0, 318, W, 80, '#1b3a52');
      repeatX(camX, 0.18, 520, (sx, i) => {
        const bx = sx + 200, s = 0.7 + hash(i) * 0.6;
        poly(ctx, [bx - 70 * s, 352, bx - 40 * s, 300 - 30 * s, bx - 5 * s, 288 - 40 * s, bx + 30 * s, 310 - 20 * s, bx + 80 * s, 352], '#f1f8fb');
        poly(ctx, [bx - 5 * s, 288 - 40 * s, bx + 30 * s, 310 - 20 * s, bx + 80 * s, 352, bx + 10 * s, 352], '#c5dbe6');
        rect(ctx, bx - 74 * s, 350, 158 * s, 4, '#2c5a7a');
      });
      repeatX(camX, 0.3, 300, (sx, i) => { if (hash(i + 4) > 0.5) { ellipse(ctx, sx + 120, 372, 6, 9, '#212529'); ellipse(ctx, sx + 121, 374, 3.5, 6, '#f8f9fa'); circle(ctx, sx + 120, 362, 4, '#212529'); } });
      ridge(ctx, camX, 0.45, 418, 16, 0.02, '#e7f5ff', 3);
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#e3eef5');
      rect(ctx, x0, GROUND_Y, x1 - x0, 6, '#ffffff');
      for (let i = Math.floor(x0 / 70); i < x1 / 70 + 1; i++) {
        const bx = i * 70 + hash(i) * 30;
        if (hash(i + 3) > 0.5) line(ctx, bx, GROUND_Y + 14, bx + 26, GROUND_Y + 20 + hash(i) * 10, '#a5d8ff', 1.5);
        if (hash(i + 9) > 0.6) ellipse(ctx, bx + 30, GROUND_Y + 40, 20, 4, '#cfe0eb');
      }
    },
  };

  const HIMALAYA = {
    name: 'MOUNT EVEREST', sub: 'Bob climbed it in flip-flops. The yeti is his roommate.',
    length: 5200, music: 'himalaya', goonThrow: 'hi_boot', goonCap: '#e8590c',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain'], bobFood: ['hi_snowbomb', 'hi_boot', 'egg'], bobSpeed: 1.48,
    platforms: [[450, 365, 160, 'hi_ledge'], [690, 315, 200, 'hi_bridge'], [1120, 360, 180, 'hi_ledge'], [1380, 310, 220, 'hi_bridge'],
      [1800, 365, 170, 'hi_ledge'], [2250, 360, 200, 'hi_ledge'], [2520, 310, 220, 'hi_bridge'], [2950, 365, 170, 'hi_ledge'],
      [3300, 360, 200, 'hi_ledge'], [3570, 315, 200, 'hi_bridge'], [4400, 360, 140, 'hi_ledge'], [4860, 355, 140, 'hi_ledge']],
    blocks: [[980, 60, 52, 'hi_boulder'], [2050, 50, 46, 'hi_crate'], [2780, 60, 52, 'hi_boulder'], [3950, 50, 46, 'hi_crate']],
    props: [['hi_tent', 200], ['hi_flags', 300], ['hi_oxygen', 1660], ['hi_cairn', 1740], ['hi_tent', 2170], ['hi_cairn', 2700],
      ['hi_flags', 3060], ['sign', 3780, 'SUMMIT >>'], ['bobsign', 4290]],
    spawns: [[580, 'icebat', 1], [800, 'boarder', 1], [1050, 'icebat', 2], [1300, 'yeti', 1], [1600, 'goon', 1], [1850, 'boarder', 1],
      [2100, 'icebat', 3], [2400, 'snowman', 1], [2650, 'yeti', 1], [2900, 'boarder', 2], [3150, 'icebat', 2], [3400, 'goon', 2],
      [3650, 'yeti', 1], [3900, 'boarder', 1], [4050, 'icebat', 2]],
    pickups: [[520, 'ammo'], [1200, 'pie'], [1750, 'nade'], [2300, 'pie'], [2950, 'ammo'], [3450, 'pie'], [3900, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#14316e', '#3f6cb5', '#9fbfe6', '#e3edf7']);
      circle(ctx, 820 - camX * 0.01, 90, 30, 'rgba(255,250,220,0.85)');
      repeatX(camX, 0.04, 1100, (sx) => {
        mountain(ctx, sx + 520, 60, 380, 330, '#7d93b5', '#f8f9fa');
        ctx.save(); ctx.globalAlpha = 0.35;
        for (let i = 0; i < 4; i++) ellipse(ctx, sx + 560 + i * 40 + (G.t * 0.3) % 40, 70 + i * 6, 30 + i * 8, 8, '#ffffff');
        ctx.restore();
        mountain(ctx, sx + 170, 150, 380, 220, '#8ea3c2', '#f1f3f5');
        mountain(ctx, sx + 900, 170, 380, 200, '#8ea3c2', '#f1f3f5');
      });
      repeatX(camX, 0.12, 420, (sx, i) => cloud(ctx, sx + 60, 300 + hash(i) * 30, 1.1 + hash(i + 1) * 0.5));
      ridge(ctx, camX, 0.25, 380, 50, 0.012, '#5f7598', 5);
      repeatX(camX, 0.3, 700, (sx) => {
        const cols = ['#1c7ed6', '#f8f9fa', '#e03131', '#2b8a3e', '#fab005'];
        line(ctx, sx + 50, 300, sx + 50, 380, '#3b4a63', 3); line(ctx, sx + 380, 320, sx + 380, 380, '#3b4a63', 3);
        for (let i = 0; i < 14; i++) { const k = (i + 0.5) / 14; rect(ctx, sx + 50 + k * 330 - 5, 300 + k * 20 + Math.sin(k * Math.PI) * 26, 10, 11, cols[i % 5]); }
      });
      ridge(ctx, camX, 0.5, 425, 22, 0.02, '#e9f1fa', 9);
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#dfe7ef');
      rect(ctx, x0, GROUND_Y, x1 - x0, 6, '#ffffff');
      for (let i = Math.floor(x0 / 60); i < x1 / 60 + 1; i++) {
        const bx = i * 60 + hash(i) * 30;
        if (hash(i + 2) > 0.55) { ellipse(ctx, bx, GROUND_Y + 26, 12, 7, '#868e96'); ellipse(ctx, bx, GROUND_Y + 21, 12, 3, '#ffffff'); }
        if (hash(i + 6) > 0.6) { ellipse(ctx, bx + 20, GROUND_Y + 8, 3, 2, '#c5d3e0'); ellipse(ctx, bx + 32, GROUND_Y + 12, 3, 2, '#c5d3e0'); }
      }
    },
  };

  const COLOSSEUM = {
    name: 'THE COLOSSEUM', sub: 'Rome, Italy. Bob bought the whole arena with coupons.',
    length: 5200, music: 'colosseum', goonThrow: 'ro_grapes', goonCap: '#c92a2a',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain', 'spray'], bobFood: ['ro_grapes', 'ro_amphora', 'ro_helmet'], bobSpeed: 1.5,
    platforms: [[470, 365, 180, 'ro_ledge'], [720, 315, 160, 'ro_ledge'], [1150, 360, 200, 'ro_scaffold'], [1600, 365, 180, 'ro_ledge'],
      [1850, 315, 160, 'ro_ledge'], [2300, 360, 220, 'ro_scaffold'], [2800, 365, 180, 'ro_ledge'], [3050, 315, 160, 'ro_ledge'],
      [3450, 360, 220, 'ro_scaffold'], [3850, 370, 150, 'ro_ledge'], [4400, 360, 140, 'ro_ledge'], [4860, 355, 140, 'ro_ledge']],
    blocks: [[1000, 60, 50, 'ro_stone'], [2100, 46, 46, 'crate'], [2650, 60, 50, 'ro_stone'], [3300, 46, 46, 'crate'], [4050, 60, 50, 'ro_stone']],
    props: [['ro_statue', 230], ['ro_column', 640], ['ro_amphora', 900], ['ro_banner', 1420], ['ro_rack', 1980], ['ro_column', 2500],
      ['ro_statue', 3200], ['ro_banner', 3720], ['bobsign', 4290]],
    spawns: [[600, 'lion', 1], [850, 'gladiator', 1], [1100, 'archer', 1], [1350, 'goose', 2], [1600, 'chariot', 1], [1850, 'lion', 1],
      [2100, 'gladiator', 2], [2350, 'archer', 1], [2600, 'goon', 1], [2850, 'chariot', 1], [3100, 'lion', 2], [3350, 'archer', 2],
      [3600, 'gladiator', 1], [3850, 'goose', 2], [4050, 'chariot', 1]],
    pickups: [[540, 'ammo'], [1200, 'pie'], [1700, 'nade'], [2350, 'pie'], [2900, 'ammo'], [3500, 'pie'], [3900, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#f08c4f', '#ffb878', '#ffe2bd']);
      circle(ctx, 760 - camX * 0.01, 110, 46, 'rgba(255,243,191,0.9)');
      ridge(ctx, camX, 0.05, 260, 24, 0.008, '#c99a6e', 2);
      repeatX(camX, 0.08, 90, (sx, i) => { if (hash(i) > 0.4) ellipse(ctx, sx, 250 - hash(i + 1) * 20, 7, 28 + hash(i + 2) * 12, '#3f5a2a'); });
      // the outer wall of the arena: three rows of arches
      rect(ctx, 0, 92, W, 300, '#d8b48a');
      repeatX(camX, 0.18, 64, (sx, i) => {
        for (let tier = 0; tier < 3; tier++) {
          const ty = 104 + tier * 92;
          rect(ctx, sx + 8, ty + 24, 48, 58, '#7a5230'); circle(ctx, sx + 32, ty + 24, 24, '#7a5230');
          rect(ctx, sx - 2, ty + 80, 66, 8, '#c9a174');
          if (tier < 2) for (let k = 0; k < 3; k++) {
            const hop = Math.max(0, Math.sin(G.t * 0.12 + i * 1.3 + k * 2 + tier)) * 3;
            circle(ctx, sx + 20 + k * 12, ty + 60 - hop, 5, ['#e03131', '#1c7ed6', '#fab005', '#f8f9fa'][(i + k + tier) % 4]);
            rect(ctx, sx + 15 + k * 12, ty + 64 - hop, 10, 16, '#5c3d22');
          }
        }
        rect(ctx, sx + 30, 70, 4, 26, '#8b6f47');
        if (i % 3 === 0) poly(ctx, [sx + 34, 72, sx + 56, 78 + Math.sin(G.t * 0.1 + i) * 3, sx + 34, 84], '#c92a2a');
      });
      rect(ctx, 0, 88, W, 6, '#c9a174');
      // inner arena wall with the crowd going wild
      repeatX(camX, 0.45, 18, (sx, i) => {
        const jump = Math.max(0, Math.sin(G.t * 0.15 + i * 1.7)) * 5;
        rect(ctx, sx - 6, 374 - jump - (i % 2) * 6, 12, 20, ['#c92a2a', '#1c7ed6', '#fab005', '#e9ecef', '#2b8a3e'][((i % 5) + 5) % 5]);
        circle(ctx, sx, 368 - jump - (i % 2) * 6, 6, '#e0ac7e');
      });
      rect(ctx, 0, 392, W, 40, '#b08968');
      repeatX(camX, 0.45, 220, (sx) => { rect(ctx, sx, 392, 220, 6, '#9c7656'); poly(ctx, [sx + 100, 398, sx + 140, 398, sx + 134, 426, sx + 120, 418, sx + 106, 426], '#c92a2a'); });
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#e0c08a');
      rect(ctx, x0, GROUND_Y, x1 - x0, 5, '#c9a36a');
      for (let i = Math.floor(x0 / 40); i < x1 / 40 + 1; i++) {
        const bx = i * 40 + hash(i) * 20;
        if (hash(i + 1) > 0.5) circle(ctx, bx, GROUND_Y + 12 + hash(i + 2) * 50, 1.5, '#b8955d');
        if (hash(i + 4) > 0.8) { ellipse(ctx, bx, GROUND_Y + 22, 5, 3, '#cdaa72'); ellipse(ctx, bx + 12, GROUND_Y + 26, 5, 3, '#cdaa72'); }
      }
    },
  };

  const AREA51 = {
    name: 'AREA 51', sub: 'Nevada. Bob says the aliens are his cousins. They might be.',
    length: 5200, music: 'area51', goonThrow: 'a51_probe', goonCap: '#2b8a3e',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain', 'spray'], bobFood: ['a51_goo', 'a51_probe', 'a51_cow', 'chicken'], bobSpeed: 1.52,
    platforms: [[450, 365, 180, 'a51_catwalk'], [700, 315, 170, 'a51_catwalk'], [1100, 360, 220, 'a51_catwalk'], [1550, 365, 170, 'a51_catwalk'],
      [1800, 315, 180, 'a51_catwalk'], [2250, 360, 220, 'a51_catwalk'], [2700, 365, 170, 'a51_catwalk'], [2950, 315, 170, 'a51_catwalk'],
      [3400, 360, 220, 'a51_catwalk'], [3800, 370, 160, 'a51_catwalk'], [4400, 360, 140, 'a51_catwalk'], [4860, 355, 140, 'a51_catwalk']],
    blocks: [[950, 56, 48, 'a51_crate'], [2000, 50, 60, 'a51_tank'], [2550, 56, 48, 'a51_crate'], [3250, 50, 60, 'a51_tank'], [4000, 56, 48, 'a51_crate']],
    props: [['a51_sign', 240], ['a51_tower', 600], ['a51_dish', 1420], ['a51_crashed', 1700], ['a51_tower', 2450], ['a51_barrel', 3040],
      ['a51_dish', 3640], ['bobsign', 4290]],
    spawns: [[580, 'alien', 1], [820, 'robodog', 1], [1080, 'alien', 2], [1330, 'ufo', 1, 130], [1600, 'mutant', 1], [1850, 'robodog', 1],
      [2100, 'alien', 3], [2350, 'blob', 3], [2600, 'ufo', 1, 120], [2850, 'mutant', 2], [3100, 'robodog', 2], [3350, 'alien', 2],
      [3600, 'ufo', 1, 140], [3850, 'mutant', 1], [4050, 'fly', 3]],
    pickups: [[540, 'ammo'], [1150, 'pie'], [1700, 'nade'], [2300, 'pie'], [2900, 'ammo'], [3450, 'pie'], [3900, 'nade'], [4150, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#0d0221', '#24104a', '#3d2a6b', '#6b4f8a']);
      stars(ctx, 60, 260, 700);
      circle(ctx, 180 - camX * 0.01, 90, 30, '#f1f3f5'); circle(ctx, 170 - camX * 0.01, 84, 6, '#dee2e6'); circle(ctx, 192 - camX * 0.01, 100, 4, '#dee2e6');
      // a UFO sneaking across the sky
      const ux = (G.t * 0.7) % (W + 300) - 150, uy = 130 + Math.sin(G.t * 0.03) * 12;
      ctx.save(); ctx.globalAlpha = 0.25; ellipse(ctx, ux, uy, 50, 20, '#b2f2bb'); ctx.restore();
      ellipse(ctx, ux, uy, 24, 6, '#adb5bd'); ellipse(ctx, ux, uy - 5, 9, 6, 'rgba(165,216,255,0.8)');
      for (let i = 0; i < 4; i++) circle(ctx, ux - 15 + i * 10, uy + 1, 1.6, (Math.floor(G.t / 8) + i) % 2 ? '#ffd43b' : '#69db7c');
      ridge(ctx, camX, 0.05, 320, 36, 0.01, '#2b1d4a', 4);
      // hangars
      repeatX(camX, 0.2, 560, (sx, i) => {
        const hx = sx + 120;
        rect(ctx, hx, 300, 260, 90, '#3b3355');
        ctx.fillStyle = '#463d63'; ctx.beginPath(); ctx.ellipse(hx + 130, 300, 130, 46, 0, Math.PI, 0); ctx.fill();
        rect(ctx, hx + 60, 320, 140, 70, '#2a2440');
        for (let k = 0; k < 6; k++) rect(ctx, hx + 60 + k * 23.3, 320, 2, 70, '#3b3355');
        text(ctx, `HANGAR ${18 + (((i % 7) + 7) % 7)}`, hx + 130, 310, { size: 11, color: '#ffd43b' });
        circle(ctx, hx + 10, 296, 3, G.t % 60 < 30 ? '#ff6b6b' : '#5c1a1a');
      });
      // searchlights sweeping the sky
      repeatX(camX, 0.3, 480, (sx, i) => {
        const a = -Math.PI / 2 + Math.sin(G.t * 0.015 + i * 2) * 0.6;
        ctx.save(); ctx.globalAlpha = 0.1;
        poly(ctx, [sx + 200, 392, sx + 200 + Math.cos(a - 0.08) * 500, 392 + Math.sin(a - 0.08) * 500, sx + 200 + Math.cos(a + 0.08) * 500, 392 + Math.sin(a + 0.08) * 500], '#fff9db');
        ctx.restore();
      });
      rect(ctx, 0, 390, W, 80, '#2b2338');
      fence(ctx, camX, 0.7, 380, '#adb5bd');
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#3d3a3a');
      rect(ctx, x0, GROUND_Y, x1 - x0, 5, '#57524c');
      for (let i = Math.floor(x0 / 120); i < x1 / 120 + 1; i++) {
        rect(ctx, i * 120 + 20, GROUND_Y + 30, 60, 5, '#ffd43b');
        if (hash(i) > 0.6) ellipse(ctx, i * 120 + 90, GROUND_Y + 50, 18, 4, '#2f2c2c');
      }
    },
  };

  // ==========================================================================
  // MUSIC
  // ==========================================================================
  Music.add('antarctica', { bpm: 96, tracks: [
    T('bell', 0.07, bars('E5:4 . . . B4:4 . . . G5:6 . . . . . F#5:2 .', 'E5:4 . . . D5:4 . . . B4:8 . . . . . . .',
      'C5:4 . . . E5:4 . . . A5:6 . . . . . G5:2 .', 'F#5:4 . . . D#5:4 . . . B4:8 . . . . . . .')),
    T('marimba', 0.06, bars('E4 G4 B4 E5 B4 G4 E4 G4 B4 E5 B4 G4 E4 G4 B4 G4', 'D4 G4 B4 D5 B4 G4 D4 G4 B4 D5 B4 G4 D4 G4 B4 G4',
      'C4 E4 A4 C5 A4 E4 C4 E4 A4 C5 A4 E4 C4 E4 A4 E4', 'B3 D#4 F#4 B4 F#4 D#4 B3 D#4 F#4 B4 F#4 D#4 B3 D#4 F#4 D#4')),
    T('bass', 0.2, bars('E2:8 . . . . . . . E2:8 . . . . . . .', 'G2:8 . . . . . . . G2:8 . . . . . . .',
      'A2:8 . . . . . . . A2:8 . . . . . . .', 'B1:8 . . . . . . . B1:8 . . . . . . .')),
    T('shaker', 0.05, '. . x . . . x . . . x . . . x x'),
    T('kick', 0.25, 'x . . . . . . . x . . . . . . .'),
  ] });

  Music.add('himalaya', { bpm: 84, tracks: [
    T('organ', 0.035, bars('D3+A3:16 . . . . . . . . . . . . . . .', 'D3+A3:16 . . . . . . . . . . . . . . .',
      'C3+G3:16 . . . . . . . . . . . . . . .', 'D3+A3:16 . . . . . . . . . . . . . . .')),
    T('flute', 0.11, bars('A4:3 . . C5 D5:4 . . . E5:2 . D5 C5 A4:3 . . .', 'G4:3 . . A4 C5:4 . . . D5:2 . C5 A4 G4:3 . . .',
      'E5:3 . . G5 E5:4 . . . D5:2 . C5 D5 E5:3 . . .', 'D5:8 . . . . . . . A4:4 . . . C5:2 . D5 .')),
    T('bell', 0.05, bars('D6 . . . . . . . . . . . . . . .', '. . . . . . . . A5 . . . . . . .')),
    T('bass', 0.2, bars('D2:8 . . . . . . . A1:8 . . . . . . .', 'C2:8 . . . . . . . G1:8 . . . . . . .')),
    T('taiko', 0.3, 'X . . . . . . . x . . x . . . .'),
  ] });

  Music.add('colosseum', { bpm: 116, tracks: [
    T('brass', 0.07, bars('C5:2 . C5 C5 G5:4 . . . E5:2 . C5:2 . G4:4 . . .', 'A4:2 . B4 C5 D5:4 . . . F5:2 . E5:2 . D5:4 . . .',
      'E5:2 . E5 F5 G5:4 . . . A5:2 . G5:2 . E5:4 . . .', 'F5:2 . E5 D5 C5:4 . . . G4:2 . B4:2 . C5:4 . . .')),
    T('stab', 0.05, bars(two4('C4+E4+G4'), two4('F4+A4+C5'), two4('C4+E4+G4'), two4('G3+B3+D4'))),
    T('tuba', 0.36, bars('C2:2 . . . G2:2 . . . C2:2 . . . G2:2 . . .', 'F2:2 . . . C2:2 . . . G2:2 . . . D2:2 . . .',
      'C2:2 . . . G2:2 . . . A2:2 . . . E2:2 . . .', 'F2:2 . . . G2:2 . . . C2:2 . . . G1:2 . . .')),
    T('snare', 0.1, 'x . x x x . x . x . x x X . . .'),
    T('taiko', 0.3, 'X . . . . . . . X . . . x . x .'),
  ] });

  Music.add('area51', { bpm: 104, tracks: [
    T('theremin', 0.09, bars('E5:6 . . . . . F5:2 . E5:8 . . . . . . .', 'C5:6 . . . . . D5:2 . B4:8 . . . . . . .',
      'A4:6 . . . . . C5:2 . E5:8 . . . . . . .', 'G#4:8 . . . . . . . B4:8 . . . . . . .')),
    T('synth', 0.035, bars('A3 C4 E4 A4 E4 C4 A3 C4 E4 A4 E4 C4 A3 C4 E4 C4', 'F3 A3 C4 F4 C4 A3 F3 A3 C4 F4 C4 A3 F3 A3 C4 A3',
      'D3 F3 A3 D4 A3 F3 D3 F3 A3 D4 A3 F3 D3 F3 A3 F3', 'E3 G#3 B3 E4 B3 G#3 E3 G#3 B3 E4 B3 G#3 E3 G#3 B3 G#3')),
    T('bass', 0.26, bars('A1:3 . . A1 . . A2 . A1:3 . . A1 . . G2 .', 'F1:3 . . F1 . . F2 . F1:3 . . F1 . . E2 .',
      'D2:3 . . D2 . . D3 . D2:3 . . D2 . . C3 .', 'E2:3 . . E2 . . E3 . E2:3 . . E2 . . D3 .')),
    T('kick', 0.38, 'x . . . . . . . x . . x . . . .'),
    T('hat', 0.035, '. . x . . . x . . . x . . . x .'),
    T('clap', 0.1, '. . . . x . . . . . . . x . . .'),
  ] });

  // Story order: ... (world1.js levels 11-15), ANTARCTICA, MOUNT EVEREST, THE COLOSSEUM, AREA 51, then the finale.
  LEVELS.push(ANTARCTICA, HIMALAYA, COLOSSEUM, AREA51);
})();
