// Level 20, the finale: Washington, D.C. Bob's last stand on the National Mall.
// New enemies: pigeon (dive-bombs and drops "presents"), squirrel (twitchy acorn sniper),
// tourist (one of Bob's cousins: camera flash blinds you), segway (cousin on mall-cop duty: rams you, throws donuts).
(() => {
  'use strict';
  const { tone, noise, gross } = SFX.raw;
  const coo = () => { tone('sine', 420, 330, 0.12, 0.06); tone('sine', 380, 300, 0.18, 0.05, 0.14); };
  const chitter = () => { for (let i = 0; i < 3; i++) tone('square', 2200 + i * 200, 2600, 0.03, 0.03, i * 0.05); };

  // ---- Decoration ----
  Object.assign(Props, {
    dc_lamp(ctx, x) {
      const y = GROUND_Y;
      rect(ctx, x - 3, y - 118, 6, 118, '#212529'); fillRR(ctx, x - 8, y - 8, 16, 8, 2, '#212529');
      ctx.globalAlpha = 0.25; circle(ctx, x, y - 126, 20, '#ffe8a3'); ctx.globalAlpha = 1;
      poly(ctx, [x - 9, y - 118, x + 9, y - 118, x + 6, y - 136, x - 6, y - 136], '#fff3bf');
      poly(ctx, [x - 10, y - 136, x + 10, y - 136, x, y - 146], '#212529');
    },
    dc_bench(ctx, x) {
      const y = GROUND_Y;
      for (let i = 0; i < 3; i++) rect(ctx, x, y - 44 + i * 7, 96, 4, '#2b8a3e');
      rect(ctx, x - 2, y - 22, 100, 5, '#2b8a3e');
      for (const lx of [x + 6, x + 84]) { rect(ctx, lx, y - 22, 5, 22, '#343a40'); rect(ctx, lx, y - 46, 4, 26, '#343a40'); }
    },
    dc_cherry(ctx, x) {
      const y = GROUND_Y;
      poly(ctx, [x - 6, y, x - 3, y - 70, x + 3, y - 70, x + 7, y], '#5c3d2e');
      line(ctx, x, y - 60, x - 28, y - 92, '#5c3d2e', 4); line(ctx, x, y - 64, x + 26, y - 96, '#5c3d2e', 4);
      for (let i = 0; i < 9; i++) circle(ctx, x - 40 + hash(x + i) * 80, y - 96 - hash(i + x * 3) * 40, 16 + hash(i * 5) * 8, i % 3 ? '#fcc2d7' : '#f783ac');
      for (let i = 0; i < 5; i++) {
        const k = (G.t * 0.6 + i * 47 + x) % 120;
        circle(ctx, x - 30 + i * 15 + Math.sin(G.t * 0.03 + i) * 8, y - 90 + k, 2.2, '#fcc2d7'); // falling petals
      }
    },
    dc_trash(ctx, x) {
      const y = GROUND_Y;
      poly(ctx, [x - 15, y - 42, x + 15, y - 42, x + 12, y, x - 12, y], '#343a40');
      for (let i = -10; i <= 10; i += 5) line(ctx, x + i, y - 40, x + i * 0.8, y - 2, '#495057', 1.5);
      ellipse(ctx, x - 4, y - 46, 9, 6, '#e9c46a'); rect(ctx, x + 2, y - 54, 8, 12, '#e63946'); ellipse(ctx, x + 10, y - 45, 6, 4, '#f8f9fa');
    },
    dc_flag(ctx, x) {
      const y = GROUND_Y, wv = t => Math.sin(G.t * 0.1 + t) * 3;
      rect(ctx, x, y - 160, 4, 160, '#ced4da'); circle(ctx, x + 2, y - 162, 4, '#ffd43b');
      for (let i = 0; i < 7; i++) {
        const sy = y - 156 + i * 6;
        poly(ctx, [x + 4, sy, x + 74, sy + wv(i), x + 74, sy + 6 + wv(i), x + 4, sy + 6], i % 2 ? '#f8f9fa' : '#c92a2a');
      }
      poly(ctx, [x + 4, y - 156, x + 34, y - 156 + wv(0) * 0.5, x + 34, y - 132 + wv(2) * 0.5, x + 4, y - 132], '#1c3a8a');
      for (let i = 0; i < 9; i++) circle(ctx, x + 9 + (i % 3) * 9, y - 151 + Math.floor(i / 3) * 8, 1.4, '#fff');
    },
    dc_cart(ctx, x) {
      const y = GROUND_Y;
      fillRR(ctx, x, y - 56, 90, 40, 5, '#f8f9fa'); rect(ctx, x, y - 40, 90, 8, '#e03131');
      text(ctx, 'HOT DOGS', x + 45, y - 48, { size: 10, color: '#c92a2a' });
      circle(ctx, x + 18, y - 10, 10, '#343a40'); circle(ctx, x + 72, y - 10, 10, '#343a40');
      rect(ctx, x + 44, y - 110, 3, 54, '#adb5bd');
      for (let i = 0; i < 6; i++) poly(ctx, [x + 45, y - 122, x + 45 + (i - 3) * 16, y - 104, x + 45 + (i - 2) * 16, y - 104], i % 2 ? '#ffd43b' : '#1c7ed6');
    },
    dc_cones(ctx, x) {
      const y = GROUND_Y;
      for (const dx of [0, 26, 52]) { poly(ctx, [x + dx - 9, y, x + dx + 9, y, x + dx + 2, y - 28, x + dx - 2, y - 28], '#fd7e14'); rect(ctx, x + dx - 6, y - 16, 12, 4, '#fff'); }
    },
    // Bob built himself a monument. Of course he did.
    dc_bobstatue(ctx, x) {
      const y = GROUND_Y, gold = '#e0b23a', dark = '#a8801f';
      rect(ctx, x - 50, y - 70, 100, 70, '#ced4da'); rect(ctx, x - 58, y - 78, 116, 10, '#e9ecef'); rect(ctx, x - 58, y - 8, 116, 8, '#adb5bd');
      text(ctx, 'BOB', x, y - 52, { size: 16, color: '#495057' });
      text(ctx, 'AMERICA’S HERO', x, y - 34, { size: 8, color: '#495057' });
      text(ctx, '(SELF-NOMINATED)', x, y - 22, { size: 7, color: '#868e96' });
      ellipse(ctx, x, y - 130, 40, 46, gold); ellipse(ctx, x + 6, y - 126, 26, 38, dark);
      rect(ctx, x - 26, y - 92, 18, 14, gold); rect(ctx, x + 8, y - 92, 18, 14, gold);
      circle(ctx, x + 4, y - 186, 20, gold); ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(x + 4, y - 192, 20, Math.PI, 0); ctx.fill();
      ellipse(ctx, x + 6, y - 166, 20, 14, dark);
      line(ctx, x + 34, y - 140, x + 58, y - 196, gold, 12); fillRR(ctx, x + 46, y - 236, 22, 40, 6, dark); // raising a syrup bottle
      ctx.globalAlpha = 0.5 + Math.sin(G.t * 0.1) * 0.3; circle(ctx, x - 20, y - 160, 3, '#fff'); ctx.globalAlpha = 1;
    },
  });

  // ---- Platforms and blocks ----
  Object.assign(SolidArt, {
    // Open-top sightseeing bus: stand on the top deck.
    dc_bus(ctx, s) {
      const bot = GROUND_Y - 12;
      fillRR(ctx, s.x, s.y + 8, s.w, bot - s.y - 8, 8, '#c92a2a');
      rect(ctx, s.x, s.y, s.w, 6, '#868e96');
      for (let i = s.x + 8; i < s.x + s.w - 4; i += 18) rect(ctx, i, s.y + 6, 3, 10, '#868e96');
      for (let i = s.x + 10; i < s.x + s.w - 30; i += 34) rect(ctx, i, s.y + 44, 26, 22, '#a5d8ff');
      rect(ctx, s.x + s.w - 30, s.y + 44, 22, 44, '#74c0fc');
      rect(ctx, s.x, s.y + 26, s.w, 10, '#ffd43b');
      text(ctx, 'SIGHTSEEING', s.x + s.w / 2, s.y + 31, { size: 9, color: '#c92a2a' });
      for (const wx of [s.x + 34, s.x + s.w - 40]) { circle(ctx, wx, bot, 14, '#212529'); circle(ctx, wx, bot, 6, '#adb5bd'); }
    },
    // White marble steps.
    dc_steps(ctx, s) {
      for (let yy = s.y, k = 0; yy < GROUND_Y; yy += 14, k++) {
        rect(ctx, s.x - k * 6, yy, s.w + k * 12, 14, k % 2 ? '#e9e2d0' : '#f1ebdd');
        rect(ctx, s.x - k * 6, yy + 12, s.w + k * 12, 2, '#cfc6b0');
      }
    },
    // Construction scaffolding (someone's always fixing something).
    dc_scaffold(ctx, s) {
      for (const px of [s.x + 6, s.x + s.w - 10]) rect(ctx, px, s.y + 8, 4, GROUND_Y - s.y - 8, '#adb5bd');
      for (let yy = s.y + 30; yy < GROUND_Y - 10; yy += 40) {
        line(ctx, s.x + 8, yy, s.x + s.w - 8, yy + 36, '#868e96', 2); rect(ctx, s.x + 6, yy, s.w - 12, 3, '#868e96');
      }
      fillRR(ctx, s.x, s.y, s.w, 12, 3, '#9b6b3f');
      ctx.globalAlpha = 0.35; rect(ctx, s.x + 10, s.y + 14, s.w - 20, 40, '#fd7e14'); ctx.globalAlpha = 1;
    },
    // Concrete barrier.
    dc_barrier(ctx, s) {
      poly(ctx, [s.x, GROUND_Y, s.x + s.w, GROUND_Y, s.x + s.w - 10, s.y + 12, s.x + s.w - 18, s.y, s.x + 18, s.y, s.x + 10, s.y + 12], '#ced4da');
      rect(ctx, s.x + 14, s.y + 4, s.w - 28, 4, '#e9ecef');
      for (let i = s.x + 16; i < s.x + s.w - 16; i += 22) poly(ctx, [i, s.y + 18, i + 10, s.y + 18, i + 4, s.y + 30, i - 6, s.y + 30], '#fd7e14');
    },
  });

  // ---- Enemies ----
  Object.assign(ENEMY_TYPES, {
    pigeon:   { w: 38, h: 30, hp: 2,  score: 8,  fly: true, wave: 3, bits: ['#adb5bd', '#2f9e44', '#9c36b5'] },
    squirrel: { w: 30, h: 26, hp: 4,  score: 12, wave: 4, bits: ['#a0522d', '#e9c8a0'] },
    tourist:  { w: 40, h: 62, hp: 10, score: 25, wave: 6, bits: ['#22b8cf', '#ffd43b', '#e9d8a6'] },
    segway:   { w: 44, h: 72, hp: 14, score: 30, wave: 8, bits: ['#1864ab', '#495057', '#ffd43b'] },
  });

  Object.assign(ENEMY_AI, {
    // Flocks overhead, drops "presents" right on you (watch the shadow), and dive-bombs now and then.
    pigeon(e, p, dx) {
      if (!e.init) { e.init = true; e.baseY = clamp(e.baseY, 130, 230); e.ph = rand(0, 6); }
      if (e.dive > 0) {
        e.dive--; e.vy += 0.4;
        if (e.y > GROUND_Y - 70) { e.vy = -6; e.dive = 0; }
      } else {
        const ty = e.baseY + Math.sin(e.t * 0.06 + e.ph) * 24;
        e.vy = (e.vy + (ty - e.y) * 0.02) * 0.9;
        if (Math.abs(dx) < 120 && p.y > e.y && e.t % 160 === 0) { e.dive = 26; e.vy = 2.5; coo(); }
      }
      e.vx += (Math.sign(dx + Math.sin(e.t * 0.03 + e.ph) * 90) * 2.3 - e.vx) * 0.04;
      if (Math.abs(dx) < 50 && p.y > e.y + 40 && --e.timer <= 0 && !p.dead) {
        G.ebullets.push({ kind: 'dc_poop', x: e.x + e.w / 2, y: e.y + e.h - 4, vx: e.vx * 0.4, vy: 1.5, g: 0.28, r: 7, dmg: 1, life: 200, warn: true, spin: 0 });
        e.timer = randi(80, 130); coo();
      }
      e.face = e.vx < 0 ? -1 : 1;
      e.x += e.vx; e.y = clamp(e.y + e.vy, 40, GROUND_Y - e.h);
    },
    // Dash, freeze, dash. Every so often it stops and pelts you with acorns.
    squirrel(e, p, dx) {
      if (e.throwing > 0) {
        e.throwing--; e.vx *= 0.7;
        if (e.throwing % 10 === 0 && !p.dead) {
          throwArc(e.x + e.w / 2, e.y + 4, p.x + p.w / 2 + rand(-20, 20), p.y + p.h / 2, 'dc_acorn', randi(26, 34));
          tone('square', 1800, 2400, 0.04, 0.04);
        }
      } else if (e.dash > 0) {
        e.dash--; e.vx = e.dir * 6;
        if (e.onGround && e.hitWall) e.vy = -9;
      } else {
        e.vx *= 0.6;
        if (--e.timer <= 0) {
          if (Math.abs(dx) < 420 && Math.random() < 0.35) { e.throwing = 31; e.timer = randi(50, 80); }
          else {
            const toward = Math.sign(dx) || 1;
            e.dir = Math.random() < 0.8 ? toward : -toward; e.dash = randi(14, 26); e.timer = randi(12, 30);
            if (e.onGround && Math.random() < 0.4) e.vy = -rand(6, 10);
            if (onScreen(e) && Math.random() < 0.5) chitter();
          }
        }
      }
      e.face = e.dash > 0 ? e.dir : (Math.sign(dx) || 1);
      moveActor(e);
    },
    // Keeps its distance, yells "SAY CHEESE!", and fires a camera flash. If it hits, you're blinded for a second.
    tourist(e, p, dx) {
      const d = Math.abs(dx);
      if (e.flashT > 0) e.flashT--;
      if (e.aim > 0) {
        e.aim--; e.vx = 0;
        if (e.aim === 0 && !p.dead) {
          const sx = e.x + e.w / 2 + e.face * 18, sy = e.y + 10;
          const a = Math.atan2(p.y + p.h / 2 - sy, p.x + p.w / 2 - sx);
          G.ebullets.push({ kind: 'dc_flash', x: sx, y: sy, vx: Math.cos(a) * 8.5, vy: Math.sin(a) * 8.5, g: 0, r: 13, dmg: 1, life: 90, spin: 0.3,
            onHit: () => { G.flash = 0.85; } });
          particles(sx, sy, 10, ['#fff', '#fff3bf'], { speed: 4, grav: 0 });
          noise(0.04, 0.3, 4000, 0, 'highpass'); tone('sine', 3000, 5000, 0.15, 0.04, 0.02);
          e.flashT = 6;
        }
      } else {
        e.vx = d > 420 ? Math.sign(dx) * 1.2 : d < 240 ? -Math.sign(dx) * 0.9 : 0;
        if (d < 640 && --e.timer <= 0 && !p.dead) {
          e.aim = 42; e.timer = randi(120, 170);
          floatText(e.x + e.w / 2, e.y - 14, pick(['SAY CHEESE!', 'SMILE!', 'SELFIE!', 'LOOK HERE!', 'NOW ONE WITH BOB!']), '#fff', 13, 40);
        }
      }
      moveActor(e);
    },
    // Rolls around throwing donuts; if you're close and level with it, it whistles, revs and rams you.
    segway(e, p, dx) {
      const d = Math.abs(dx);
      if (e.rev > 0) {
        e.rev--; e.vx *= 0.8;
        if (e.rev === 0) e.zoom = 55;
      } else if (e.zoom > 0) {
        e.zoom--; e.vx += (e.dir * 7.5 - e.vx) * 0.15;
        if (e.t % 4 === 0) particles(e.x + e.w / 2 - e.dir * 20, e.y + e.h, 1, ['#adb5bd'], { speed: 1.5 });
        if (e.hitWall) { e.zoom = 0; e.dizzy = 50; shake(3); SFX.boom(); }
      } else if (e.dizzy > 0) {
        e.dizzy--; e.vx *= 0.85;
      } else {
        e.dir = Math.sign(dx) || -1;
        e.vx += (e.dir * (d > 320 ? 2.2 : 0) - e.vx) * 0.08;
        if (--e.timer <= 0 && !p.dead) {
          if (d < 380 && Math.abs(p.y + p.h - (e.y + e.h)) < 50) {
            e.rev = 26; e.timer = randi(110, 150); SFX.whistle();
            floatText(e.x + e.w / 2, e.y - 14, pick(['HALT!', 'STOP RIGHT THERE!', 'NO RUNNING!']), '#ffd43b', 13, 40);
          } else if (d < 620) {
            throwArc(e.x + e.w / 2, e.y + 10, p.x + p.w / 2, p.y + p.h / 2, 'dc_donut', randi(40, 50)); SFX.throwIt(); e.timer = randi(70, 100);
          }
        }
      }
      e.face = e.zoom > 0 || e.rev > 0 ? e.dir : (Math.sign(dx) || 1);
      moveActor(e);
    },
  });

  Object.assign(ENEMY_ART, {
    pigeon(ctx, e, c, cx, by, f) {
      const y = e.y + 16, flap = Math.sin(e.t * 0.9) * 9;
      poly(ctx, [cx - f * 10, y, cx - f * 24, y - 3, cx - f * 22, y + 6], c('#495057'));
      poly(ctx, [cx - f * 2, y - 4, cx - f * 16, y - 14 - flap, cx + f * 6, y - 2], c('#868e96'));
      ellipse(ctx, cx, y + 1, 13, 9, c('#adb5bd'));
      ellipse(ctx, cx + f * 8, y - 5, 6, 7, c('#2f9e44')); ellipse(ctx, cx + f * 8, y - 2, 5, 4, c('#9c36b5'));
      circle(ctx, cx + f * 11, y - 10, 5.5, c('#868e96'));
      circle(ctx, cx + f * 13, y - 11, 1.9, '#f76707'); circle(ctx, cx + f * 13.4, y - 11, 0.9, '#111');
      poly(ctx, [cx + f * 15, y - 10, cx + f * 20, y - 8, cx + f * 15, y - 7], '#495057');
      poly(ctx, [cx - f * 4, y - 2, cx - f * 6, y - 18 - flap, cx + f * 8, y - 1], c('#ced4da'));
      line(ctx, cx - f * 7, y + 3, cx + f * 2, y + 3, '#343a40', 1.5);
      line(ctx, cx - 2, y + 9, cx - 3, y + 13, '#e8590c', 1.5); line(ctx, cx + 3, y + 9, cx + 4, y + 13, '#e8590c', 1.5);
    },
    squirrel(ctx, e, c, cx, by, f) {
      const run = e.dash > 0 ? Math.sin(e.t * 0.9) * 3 : 0, flick = Math.sin(e.t * (e.dash > 0 ? 0.6 : 0.2)) * 4;
      ellipse(ctx, cx - f * 12, by - 22 + flick * 0.3, 9, 15, c('#a0522d'), -f * 0.4);
      ellipse(ctx, cx - f * 16, by - 33 + flick * 0.5, 7, 9, c('#b5651d'), -f * 0.8);
      ellipse(ctx, cx - f * 12, by - 22, 4, 10, c('#c47a3a'), -f * 0.4);
      rect(ctx, cx - 6 + run, by - 5, 4, 5, c('#7a3e1d')); rect(ctx, cx + 3 - run, by - 5, 4, 5, c('#7a3e1d'));
      ellipse(ctx, cx + f * 1, by - 10, 10, 8, c('#a0522d'));
      ellipse(ctx, cx + f * 3, by - 8, 5, 5, c('#e9c8a0'));
      circle(ctx, cx + f * 9, by - 17, 7, c('#a0522d'));
      poly(ctx, [cx + f * 6, by - 22, cx + f * 7, by - 29, cx + f * 10, by - 23], c('#7a3e1d'));
      circle(ctx, cx + f * 11, by - 18, 2.4, '#111'); circle(ctx, cx + f * 11.6, by - 18.6, 0.8, '#fff');
      circle(ctx, cx + f * 15.5, by - 15.5, 1.5, '#3b1f0e');
      rect(ctx, cx + f * 13 - 1, by - 13, 3, 3, '#fff');
      if (e.throwing > 0) { circle(ctx, cx + f * 10, by - 9, 3.5, '#8b5a2b'); ellipse(ctx, cx + f * 10, by - 12, 4, 2, '#5c3d1e'); }
    },
    tourist(ctx, e, c, cx, by, f) {
      cousin(ctx, e, c, cx, by, f, { pants: '#e9d8a6', shirt: '#22b8cf', hat: 'straw', glasses: true, beard: '#868e96' });
      for (const [hx, hy] of [[-8, -36], [6, -28], [-2, -22], [10, -40], [-12, -26]]) circle(ctx, cx + hx, by + hy, 2.6, '#ffd43b');
      fillRR(ctx, cx - 10, by - 19, 20, 7, 3, c('#e64980'));
      if (e.aim > 0) {
        line(ctx, cx + f * 10, by - 36, cx + f * 14, by - 52, c('#f1c9a5'), 5);
        fillRR(ctx, f > 0 ? cx + 8 : cx - 26, by - 62, 18, 13, 3, '#343a40');
        circle(ctx, cx + f * 20, by - 56, 4.5, '#74c0fc');
        if (e.aim % 10 < 5) circle(ctx, cx + f * 11, by - 60, 2, '#ff2d2d');
      } else {
        line(ctx, cx - 8, by - 46, cx, by - 40, '#212529', 1.5); line(ctx, cx + 8, by - 46, cx, by - 40, '#212529', 1.5);
        fillRR(ctx, cx - 7, by - 42, 14, 10, 2, '#343a40'); circle(ctx, cx + f * 2, by - 37, 3, '#74c0fc');
      }
      if (e.flashT > 0) { ctx.globalAlpha = e.flashT / 6; circle(ctx, cx + f * 22, by - 56, 24, '#fff'); ctx.globalAlpha = 1; }
    },
    segway(ctx, e, c, cx, by, f) {
      const lean = clamp(e.vx * 0.04, -0.25, 0.25) + (e.dizzy > 0 ? Math.sin(e.t * 0.5) * 0.15 : 0) + (e.rev > 0 ? Math.sin(e.t * 1.3) * 0.06 : 0);
      circle(ctx, cx, by - 9, 9, '#212529'); circle(ctx, cx, by - 9, 4, '#868e96');
      ctx.save(); ctx.translate(cx, by - 12); ctx.rotate(lean); ctx.translate(-cx, -(by - 12));
      fillRR(ctx, cx - 16, by - 16, 32, 6, 3, '#495057');
      cousin(ctx, { vx: 0, t: e.t }, c, cx, by - 14, f, { pants: '#1c3a5e', shirt: '#1864ab', hat: 'cap', hatColor: '#1c3a5e', glasses: true });
      circle(ctx, cx + f * 6, by - 52, 3.5, '#ffd43b'); // badge
      line(ctx, cx + f * 12, by - 14, cx + f * 16, by - 52, '#868e96', 3); rect(ctx, cx + f * 16 - 7, by - 55, 14, 4, '#343a40');
      line(ctx, cx + f * 8, by - 46, cx + f * 15, by - 53, c('#f1c9a5'), 5);
      if (e.rev > 0) { circle(ctx, cx + f * 9, by - 61, 3, '#adb5bd'); }
      ctx.restore();
      if (e.dizzy > 0) for (let i = 0; i < 3; i++) circle(ctx, cx + Math.cos(e.t * 0.2 + i * 2.1) * 14, by - 86 + Math.sin(e.t * 0.2 + i * 2.1) * 4, 3, '#ffd43b');
    },
  });

  Object.assign(THROWN_ART, {
    dc_poop(ctx) { ellipse(ctx, 0, 0, 6, 7, '#f8f9fa'); circle(ctx, 1, 2, 2.4, '#495057'); circle(ctx, -2, -2, 1.4, '#ced4da'); },
    dc_acorn(ctx) { ellipse(ctx, 0, 2, 5, 6, '#8b5a2b'); ellipse(ctx, 0, -3, 6, 3.5, '#5c3d1e'); rect(ctx, -1, -8, 2, 3, '#5c3d1e'); },
    dc_flash(ctx) {
      ctx.globalAlpha = 0.5; circle(ctx, 0, 0, 16, '#fff3bf'); ctx.globalAlpha = 1;
      for (let i = 0; i < 4; i++) poly(ctx, [0, 0, Math.cos(i * 1.57) * 18, Math.sin(i * 1.57) * 18, Math.cos(i * 1.57 + 0.3) * 6, Math.sin(i * 1.57 + 0.3) * 6], '#fff');
      circle(ctx, 0, 0, 7, '#fff');
    },
    dc_donut(ctx) {
      circle(ctx, 0, 0, 10, '#d9a441'); circle(ctx, 0, 0, 8, '#f783ac'); circle(ctx, 0, 0, 3.5, '#9c6a2a');
      for (let i = 0; i < 6; i++) rect(ctx, Math.cos(i) * 6 - 1, Math.sin(i) * 6 - 1, 2.5, 1.2, ['#4dabf7', '#ffd43b', '#fff'][i % 3]);
    },
    dc_hotdog(ctx) {
      ellipse(ctx, 0, 2, 13, 5, '#e9b872'); ellipse(ctx, 0, -1, 14, 3.5, '#c0392b');
      ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = -10; i <= 10; i += 4) ctx.lineTo(i, -2 + (i % 8 ? 1.5 : -1.5)); ctx.stroke();
    },
  });

  Object.assign(SPLAT_COLS, {
    dc_poop: ['#f8f9fa', '#ced4da', '#495057'], dc_acorn: ['#8b5a2b', '#5c3d1e'], dc_flash: ['#fff', '#fff3bf'],
    dc_donut: ['#f783ac', '#e9c46a', '#fff'], dc_hotdog: ['#d9a441', '#c92a2a', '#ffd43b'],
  });

  SFX.addKill({
    pigeon: () => { noise(0.15, 0.25, 1500, 0, 'bandpass'); coo(); },
    squirrel: () => { tone('square', 2400, 3200, 0.06, 0.05); tone('square', 3000, 1800, 0.1, 0.05, 0.06); },
    tourist: () => { noise(0.03, 0.3, 4000, 0, 'highpass'); gross(160, 80, 0.35, 15, 12, 0.25, 0.05); },
    segway: () => { tone('sawtooth', 900, 200, 0.4, 0.06); noise(0.3, 0.3, 900, 0.1); gross(140, 70, 0.3, 15, 12, 0.2, 0.15); },
  });

  // ---- Music: an original brassy march for the finale ----
  const { T, bars, off } = Music.helpers;
  Music.add('dc', { bpm: 118, tracks: [
    T('tuba', 0.38, bars('Bb1:2 . . . F2:2 . . . Bb1:2 . . . F2:2 . . .', 'Eb2:2 . . . Bb1:2 . . . F2:2 . . . C2:2 . . .',
      'Bb1:2 . . . F2:2 . . . G1:2 . . . D2:2 . . .', 'F1:2 . . . C2:2 . . . Bb1:2 . . . F1:2 . . .')),
    T('brass', 0.045, bars(off('D4+F4+Bb4'), off('Eb4+G4+C5'), off('D4+F4+Bb4'), off('C4+Eb4+A4'))),
    T('flute', 0.13, bars('F5:2 . D5 . F5 . Bb5:4 . . . A5 . G5 . F5 .', 'G5:2 . Eb5 . G5 . C6:4 . . . Bb5 . A5 . G5 .',
      'F5 . D5 . Bb4 . D5 . F5 . G5 . A5 . Bb5 .', 'C6:3 . . A5 . F5 . Eb5:2 . D5:2 . Bb4:4 . . . .')),
    T('snare', 0.11, 'x . x x x . x . x . x x X . . .'),
    T('kick', 0.35, 'x . . . . . . . x . . . . . . .'),
    T('ohat', 0.035, 'X . . . . . . . . . . . . . . .'),
  ] });

  // ---- Background landmarks ----
  function obelisk(ctx, x, base, top, col, shade) {
    poly(ctx, [x - 22, base, x + 22, base, x + 15, top, x - 15, top], col);
    poly(ctx, [x, base, x + 22, base, x + 15, top, x, top], shade);
    poly(ctx, [x - 15, top, x + 15, top, x, top - 28], col);
    if (Math.floor(G.t / 40) % 2) circle(ctx, x, top - 4, 2.5, '#ff6b6b'); // the little red lights on top
  }
  function memorial(ctx, x, base) { // a temple with columns
    rect(ctx, x - 130, base - 16, 260, 16, '#e6dccb'); rect(ctx, x - 120, base - 26, 240, 10, '#efe6d6');
    for (let i = 0; i < 10; i++) rect(ctx, x - 112 + i * 24, base - 96, 10, 70, '#f4ede0');
    rect(ctx, x - 124, base - 116, 248, 20, '#efe6d6'); rect(ctx, x - 116, base - 128, 232, 12, '#e6dccb');
    rect(ctx, x - 20, base - 92, 40, 66, 'rgba(60,50,40,0.35)');
  }
  function capitol(ctx, x, base) {
    const c1 = '#f1e9da', c2 = '#d8ccb8';
    rect(ctx, x - 230, base - 60, 460, 60, c1); rect(ctx, x - 230, base - 66, 460, 6, c2);
    for (let i = 0; i < 18; i++) rect(ctx, x - 220 + i * 25, base - 56, 8, 48, c2);
    poly(ctx, [x - 70, base - 66, x + 70, base - 66, x, base - 96], c1);
    rect(ctx, x - 80, base - 130, 160, 34, c1);
    for (let i = 0; i < 9; i++) rect(ctx, x - 74 + i * 18, base - 126, 6, 28, c2);
    ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(x, base - 130, 76, 78, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(x + 20, base - 130, 50, 74, 0, Math.PI * 1.5, 0); ctx.fill();
    for (let i = -3; i <= 3; i++) line(ctx, x + i * 18, base - 132, x + i * 13, base - 196, 'rgba(160,145,120,0.5)', 1.5);
    rect(ctx, x - 12, base - 230, 24, 26, c1); poly(ctx, [x - 14, base - 230, x + 14, base - 230, x, base - 246], c2);
    rect(ctx, x - 2, base - 262, 4, 18, c2);
  }

  const DC = {
    name: 'WASHINGTON, D.C.', sub: 'The final showdown. Bob wants his face on a monument.',
    length: 5600, final: true, music: 'dc', goonThrow: 'dc_hotdog', goonCap: '#c92a2a', summonType: 'pigeon',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain', 'spray'], bobFood: ['dc_hotdog', 'dc_donut', 'chicken', 'egg'], bobSpeed: 1.55,
    platforms: [[420, 362, 200, 'dc_bus'], [760, 318, 140, 'dc_scaffold'], [1100, 360, 160, 'dc_steps'], [1450, 362, 200, 'dc_bus'],
      [1780, 315, 140, 'dc_scaffold'], [2150, 360, 180, 'dc_steps'], [2500, 362, 200, 'dc_bus'], [2830, 320, 140, 'dc_scaffold'],
      [3200, 360, 160, 'dc_steps'], [3550, 362, 200, 'dc_bus'], [3900, 318, 140, 'dc_scaffold'], [4250, 360, 160, 'dc_steps'],
      [4800, 360, 140, 'dc_steps'], [5260, 330, 140, 'dc_steps']],
    blocks: [[980, 110, 40, 'dc_barrier'], [2000, 110, 40, 'dc_barrier'], [3060, 46, 46, 'crate'], [4080, 110, 40, 'dc_barrier']],
    props: [['dc_flag', 250], ['dc_lamp', 700], ['dc_cherry', 920], ['dc_bench', 1300], ['dc_cart', 1700], ['dc_trash', 1960],
      ['dc_cherry', 2400], ['dc_lamp', 2780], ['dc_cones', 2960], ['dc_bench', 3380], ['dc_cherry', 3800], ['dc_trash', 4180],
      ['dc_flag', 4520], ['dc_bobstatue', 4700], ['dc_lamp', 5120]],
    spawns: [[600, 'pigeon', 3, 180], [850, 'squirrel', 2], [1100, 'goon', 1], [1300, 'tourist', 1], [1550, 'pigeon', 4, 170],
      [1750, 'squirrel', 3], [2000, 'segway', 1], [2250, 'tourist', 1], [2450, 'raccoon', 2], [2700, 'pigeon', 4, 190],
      [2900, 'segway', 1], [3100, 'squirrel', 3], [3350, 'tourist', 2], [3600, 'goose', 2], [3850, 'segway', 1],
      [4050, 'pigeon', 5, 180], [4300, 'goon', 2]],
    pickups: [[500, 'ammo'], [1200, 'pie'], [1700, 'nade'], [2300, 'pie'], [2800, 'ammo'], [3300, 'pie'], [3800, 'nade'], [4200, 'pie'], [4450, 'ammo']],
    drawBg(ctx, camX) {
      sky(ctx, ['#1f2a5a', '#7b3f7a', '#f08a5d', '#ffd8a8']);
      circle(ctx, 620 - camX * 0.01, 330, 50, 'rgba(255,214,140,0.85)');
      repeatX(camX, 0.05, 130, (sx, i) => rect(ctx, sx, 360 - hash(i) * 50, 110, 120, '#5a4a78'));
      obelisk(ctx, 420 - camX * 0.06, 425, 110, '#efe4d2', '#d6c8b1');
      memorial(ctx, 700 - camX * 0.2, 425);
      capitol(ctx, 1500 - camX * 0.15, 425);
      // The Reflecting Pool, with the Monument upside down in it.
      rect(ctx, 0, 425, W, 22, '#6d7fc4');
      ctx.globalAlpha = 0.35; const mx = 420 - camX * 0.06;
      poly(ctx, [mx - 22, 425, mx + 22, 425, mx + 18, 447, mx - 18, 447], '#efe4d2'); ctx.globalAlpha = 1;
      for (let i = 0; i < 8; i++) rect(ctx, (((i * 140 + G.t * 0.4 - camX * 0.3) % (W + 140)) + W + 140) % (W + 140) - 70, 432 + (i % 3) * 5, 40, 1.5, 'rgba(255,255,255,0.35)');
      repeatX(camX, 0.35, 240, (sx, i) => {
        rect(ctx, sx + 118, 420, 6, 30, '#4a3a3a');
        for (let k = 0; k < 5; k++) circle(ctx, sx + 104 + hash(i * 7 + k) * 36, 404 + hash(i + k) * 20, 15, k % 2 ? '#f3a6c4' : '#e889ad');
      });
      rect(ctx, 0, 450, W, 18, '#3f7a2a');
      repeatX(camX, 0.6, 46, (sx) => ellipse(ctx, sx, 452, 26, 9, '#4b8a32'));
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#5c940d');
      rect(ctx, x0, GROUND_Y, x1 - x0, 34, '#cdb891');
      rect(ctx, x0, GROUND_Y, x1 - x0, 5, '#e0cfa9');
      rect(ctx, x0, GROUND_Y + 34, x1 - x0, 4, '#74b816');
      for (let i = Math.floor(x0 / 30); i < x1 / 30 + 1; i++) {
        if (hash(i) > 0.4) circle(ctx, i * 30 + hash(i + 1) * 20, GROUND_Y + 10 + hash(i + 2) * 20, 1.6, '#a8956e');
        if (hash(i + 9) > 0.6) line(ctx, i * 30, GROUND_Y + 44 + hash(i) * 30, i * 30 + 4, GROUND_Y + 38 + hash(i) * 30, '#82c91e', 2);
      }
    },
  };
  LEVELS.push(DC);

  // How Bob gets away at the end of each world-tour level (shown on the "BOB GOT AWAY!" screen).
  const EXITS = {
    'TOKYO NEON NIGHTS': 'He rode a bullet train... somehow to Egypt!',
    'PYRAMIDS OF GIZA': 'He stole a camel and galloped off to Jordan!',
    'PETRA CANYON': 'He snuck onto a cargo plane to Brazil!',
    'AMAZON RAINFOREST': 'He floated down the river... all the way to Australia?!',
    'THE OUTBACK': 'He hid in a kangaroo pouch, then caught a boat south!',
    'ANTARCTICA': 'He belly-slid off with the penguins, toward the Himalayas!',
    'MOUNT EVEREST': 'He snowboarded down the mountain and kept going to Rome!',
    'THE COLOSSEUM': 'He stole a chariot and drove it to Nevada!',
    'AREA 51': 'He stole a UFO and flew it to Washington, D.C.!',
  };
  for (const L of LEVELS) if (EXITS[L.name] && !L.doneText) L.doneText = EXITS[L.name];
})();
