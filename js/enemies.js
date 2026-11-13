'use strict';
// Bob's minions and every gross thing that gets thrown at the player.

const ENEMY_TYPES = {
  blob:     { w: 38, h: 30, hp: 6,  score: 10 },
  fly:      { w: 38, h: 32, hp: 1,  score: 10 },   // one hit, and a big hitbox so they're easy to tag
  bird:     { w: 38, h: 32, hp: 1,  score: 10 },
  goon:     { w: 40, h: 62, hp: 12, score: 25 },
  meatball: { w: 36, h: 36, hp: 9,  score: 15 },
  gator:    { w: 70, h: 26, hp: 14, score: 20 },
  tumbleweed: { w: 40, h: 40, hp: 5, score: 10 },
  rat:      { w: 34, h: 18, hp: 3,  score: 10 },
};

function spawnEnemy(type, x, y) {
  const t = ENEMY_TYPES[type];
  const flying = t.fly || type === 'fly' || type === 'bird';
  const e = {
    type, x, w: t.w, h: t.h, vx: 0, vy: 0, hp: t.hp, maxHp: t.hp, score: t.score, dmg: t.dmg || 1,
    face: -1, timer: randi(20, 80), flash: 0, t: randi(0, 100), onGround: false, rot: 0, dir: 0, dive: 0, // whole-number t so "every N frames" checks work
  };
  e.baseY = y ?? rand(170, 300);
  e.y = flying ? (y ?? e.baseY) : (y ?? GROUND_Y - t.h);
  G.enemies.push(e);
  return e;
}

function throwArc(sx, sy, tx, ty, kind, T, g = 0.3) {
  const b = { x: sx, y: sy, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * g * T * T) / T, g, r: 10, kind, dmg: 1, life: 240, rot: 0 };
  if (kind === 'record') { b.g = 0.02; b.vy = (ty - sy) / T * 0.6; b.vx *= 1.4; b.spin = 0.5; }
  G.ebullets.push(b);
  return b;
}

const onScreen = e => e.x + e.w > G.camX - 20 && e.x < G.camX + W + 20;

function updateEnemies() {
  const p = G.player, px = p.x + p.w / 2;
  for (const e of G.enemies) {
    e.t++;
    if (e.flash > 0) e.flash--;
    const dx = px - (e.x + e.w / 2);
    e.face = dx < 0 ? -1 : 1;
    switch (e.type) {
      case 'blob':
        if (e.onGround) {
          e.vx *= 0.8;
          if (--e.timer <= 0) {
            e.vy = -rand(7, 10); e.vx = Math.sign(dx) * rand(2, 3.5); e.timer = randi(40, 80);
            if (onScreen(e)) SFX.squish();
          }
        }
        moveActor(e);
        break;
      case 'fly': case 'bird':
        e.vx = clamp(e.vx + Math.sign(dx) * 0.08, -1.9, 1.9);
        if (e.dive > 0) {
          e.dive--; e.vy += 0.35;
          if (e.y > GROUND_Y - 70) e.vy = -5;
        } else {
          const ty = e.baseY + Math.sin(e.t * 0.05) * 32;
          e.vy = (e.vy + (ty - e.y) * 0.01) * 0.95;
          if (Math.abs(dx) < 140 && --e.timer <= 0 && p.y > e.y) { e.dive = 30; e.vy = 2; e.timer = randi(150, 240); }
        }
        if (e.type === 'fly' && e.t % 45 === 0 && Math.abs(dx) < 320) SFX.buzz();
        e.x += e.vx; e.y = clamp(e.y + e.vy, 40, GROUND_Y - e.h);
        break;
      case 'goon': {
        const dist = Math.abs(dx);
        e.vx = dist > 360 ? Math.sign(dx) * 1.3 : e.vx * 0.7;
        if (dist < 560 && --e.timer <= 0 && !p.dead) {
          throwArc(e.x + e.w / 2, e.y + 10, px, p.y + p.h / 2, G.level.goonThrow, 46 + randi(0, 12));
          e.throwAnim = 15; e.timer = randi(110, 150); SFX.throwIt(); SFX.grunt();
        }
        if (e.throwAnim > 0) e.throwAnim--;
        moveActor(e);
        break;
      }
      case 'meatball':
        if (!e.dir) e.dir = Math.sign(dx) || -1;
        if (e.hitWall) e.dir = -e.hitWall;
        if (e.t % 90 === 0 && Math.abs(dx) > 200) e.dir = Math.sign(dx);
        e.vx += (e.dir * 3.6 - e.vx) * 0.05;
        e.rot += e.vx * 0.05;
        moveActor(e);
        break;
      case 'gator':
        // Creeps along, then lunges with its jaws open when you're close.
        if (e.lunge > 0) {
          e.lunge--; e.vx = e.dir * 7;
          if (e.lunge === 0) e.timer = 80;
        } else {
          e.dir = Math.sign(dx) || -1; e.vx = e.dir * 0.8;
          if (--e.timer <= 0 && Math.abs(dx) < 220 && Math.abs(p.y + p.h - (e.y + e.h)) < 30) { e.lunge = 22; SFX.chomp(); }
        }
        e.face = e.dir;
        e.jaw = e.lunge > 0 ? Math.min(1, (e.jaw || 0) + 0.25) : Math.max(0, (e.jaw || 0) - 0.1);
        moveActor(e);
        break;
      case 'tumbleweed':
        if (!e.dir) e.dir = Math.sign(dx) || -1;
        e.vx += (e.dir * 4.2 - e.vx) * 0.05;
        if (e.onGround) e.vy = -rand(4, 7.5);
        if (e.hitWall) e.dir = -e.hitWall;
        if (e.t % 120 === 0 && Math.abs(dx) > 250) e.dir = Math.sign(dx);
        e.rot += e.vx * 0.06;
        moveActor(e, false, 0.35);
        break;
      case 'rat':
        e.vx += (Math.sign(dx) * 4 - e.vx) * 0.15;
        if (e.onGround && (e.hitWall || Math.random() < 0.01)) e.vy = -7;
        if (e.t % 70 === 0 && onScreen(e)) SFX.ratSqueak();
        moveActor(e);
        break;
      default: // the newer critters and cousins (enemies-more.js)
        if (ENEMY_AI[e.type]) ENEMY_AI[e.type](e, p, dx);
    }
    if (!p.dead && overlap(e, p)) hurtPlayer(e.dmg || 1, e.x + e.w / 2);
  }
  G.enemies = G.enemies.filter(e => e.hp > 0 && e.x > G.camX - 400 && e.x < G.level.length + 200);
}

// quiet = no number/sound per hit (used by the flamethrower's many tiny hits).
function damageEnemy(e, dmg, quiet = false) {
  e.hp -= dmg; e.flash = 6;
  if (!quiet) floatText(e.x + e.w / 2, e.y - 4, String(dmg), '#fff', 14, 30);
  if (e.hp <= 0) killEnemy(e); else if (!quiet) SFX.hit();
}
function killEnemy(e) {
  e.hp = 0;
  const cols = { blob: ['#8fbf4d', '#5e8c2c'], fly: ['#333', '#a00'], bird: ['#4dabf7', '#fff'],
    goon: ['#e8e4d0', '#8a6a3a', '#c92a2a'], meatball: ['#7f4f24', '#c1121f'],
    gator: ['#4a7d32', '#fff'], tumbleweed: ['#a0743c', '#d4a373'], rat: ['#7d7d7d', '#f4a6b7'] }[e.type]
    || (ENEMY_TYPES[e.type] && ENEMY_TYPES[e.type].bits) || ['#adb5bd', '#fff'];
  particles(e.x + e.w / 2, e.y + e.h / 2, 16, cols, { speed: 5 });
  SFX.kill(e.type);
  floatText(e.x + e.w / 2 + rand(-10, 10), e.y - 10, pick(['POW!', 'SPLAT!', 'BAM!', 'ZAP!', 'BONK!', 'KAPOW!', 'SPLORCH!']),
    pick(['#ffd43b', '#ff6b6b', '#69db7c', '#74c0fc', '#ff8fab']), 22, 40);
  G.score += e.score;
  const onDeath = ENEMY_TYPES[e.type] && ENEMY_TYPES[e.type].onDeath; // e.g. splits into smaller enemies
  if (onDeath) onDeath(e);
  if (Math.random() < 0.12) {
    G.pickups.push({ x: e.x, y: e.y, w: 34, h: 30, vx: 0, vy: -4, type: pick(['ammo', 'pie', 'nade']), bob: 0 });
  }
}

// Splat colors for thrown things defined in other files: SPLAT_COLS[kind] = [colors].
const SPLAT_COLS = {};

function addPuddle(x) {
  for (const d of G.puddles) {
    if (x > d.x - 20 && x < d.x + d.w + 20) {
      const r = Math.max(d.x + d.w, x + 15);
      d.x = Math.min(d.x, x - 15); d.w = Math.min(170, r - d.x); d.life = 420;
      return;
    }
  }
  G.puddles.push({ x: x - 15, w: 30, life: 420 });
}
function splat(b) {
  const cols = { egg: ['#ffd60a', '#fff'], syrup: ['#9c5a1a', '#c47a2c'], burp: ['#9ccc65', '#c5e1a5'], chicken: ['#ffd60a'],
    jug: ['#a0703c', '#f3e2b5'], can: ['#e63946', '#ddd'], meat: ['#7f4f24'], record: ['#111', '#d62828'],
    dice: ['#ff8fab', '#fff'], drumstick: ['#b5651d', '#f1faee'], crawfish: ['#d9480f', '#ff8787'],
    hubcap: ['#ced4da', '#868e96'], banana: ['#ffd43b', '#fff3bf'], trash: ['#e03131', '#f1f3f5'],
    waterballoon: ['#4dabf7', '#a5d8ff'], firework: ['#ffd43b', '#ff6b6b', '#74c0fc'], corndog: ['#d9a441', '#c92a2a'] }[b.kind]
    || SPLAT_COLS[b.kind] || ['#aaa'];
  if (b.kind === 'waterballoon') SFX.splash();
  particles(b.x, Math.min(b.y, GROUND_Y - 2), 8, cols, { speed: 3 });
  if (b.kind === 'syrup') addPuddle(b.x);
  if (b.kind === 'chicken') SFX.squeak();
}

// Gas and ghostly stuff drifts over cover; everything else thrown at you is stopped by it.
const PASSES_COVER = new Set(['stink', 'burp', 'eg_wrap', 'disco']);

function updateEnemyBullets() {
  const p = G.player, L = G.level;
  for (const b of G.ebullets) {
    if (b.ox === undefined) { b.ox = b.x; b.oy = b.y; b.lob = b.vy < -1; } // where it was thrown from, and if upward
    b.life--;
    if (b.home) {
      const dx = p.x + p.w / 2 - b.x, dy = p.y + p.h / 2 - b.y, d = Math.hypot(dx, dy) || 1;
      b.vx += dx / d * b.home; b.vy += dy / d * b.home;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 3) { b.vx *= 3 / sp; b.vy *= 3 / sp; }
    }
    b.vy += b.g || 0;
    b.x += b.vx; b.y += b.vy;
    b.rot = (b.rot || 0) + (b.spin ?? 0.2);
    if (b.kind === 'disco') {
      b.y = GROUND_Y - b.r; b.rot += b.vx * 0.02;
      const hitL = b.x - b.r < L.arenaX && b.vx < 0, hitR = b.x + b.r > L.arenaX + W && b.vx > 0;
      if ((hitL || hitR) && b.bounces-- > 0) { b.vx *= -1; shake(4); SFX.pop(); }
    } else if (b.roll) { // bowling balls roll along the ground
      b.y = GROUND_Y - b.r; b.rot += b.vx * 0.04;
    } else if (b.sine) { // banjo music notes wave up and down
      b.st = (b.st || 0) + 1; b.baseY += b.dy || 0; b.y = b.baseY + Math.sin(b.st * 0.12) * b.sine;
    } else if (!b.linger && b.kind !== 'wave' && b.y + b.r > GROUND_Y) {
      b.life = 0; splat(b);
    }
    // Cover protects you too: thrown junk smacks into it and chips it (see props.js). Rolling balls hit hard.
    // An enemy standing right beside a crate lobs things over it, so its own cover doesn't eat those.
    let blocked = false;
    if (b.life > 0 && !PASSES_COVER.has(b.kind)) {
      for (const s of G.solids) {
        if (!s.cover || !circleHitsRect(b.x, b.y, b.r * 0.6, s)) continue;
        if (b.lob && Math.abs(b.ox - (s.x + s.w / 2)) < s.w / 2 + 36 && b.oy > s.y - 60) continue;
        hitCover(s, b.roll ? 4 * (b.dmg + 1) : 3 * b.dmg, b.x, b.y, 'thrown');
        SFX.thunk(); b.life = 0; splat(b); blocked = true;
        break;
      }
    }
    if (!blocked && !p.dead && circleHitsRect(b.x, b.y, b.r * 0.8, p)) {
      hurtPlayer(b.dmg, b.x);
      if (b.onHit) b.onHit(b); // e.g. a camera flash blinds you for a moment
      if (b.kind !== 'wave' && b.kind !== 'disco' && !b.roll && !b.linger) { b.life = 0; splat(b); }
    }
    if (b.fw && b.life <= 0 && !b.popped) { // bottle rockets end with a sparkly pop
      b.popped = true; particles(b.x, b.y, 14, ['#ffd43b', '#ff6b6b', '#74c0fc', '#fff'], { speed: 4, grav: 0.05 }); SFX.pop();
    }
  }
  G.ebullets = G.ebullets.filter(b => b.life > 0 && b.x > G.camX - 200 && b.x < G.camX + W + 200);
  for (const d of G.puddles) d.life--;
  G.puddles = G.puddles.filter(d => d.life > 0);
}

// ---- Drawing -------------------------------------------------------------
function drawEnemy(ctx, e) {
  const c = col => (e.flash > 0 ? '#ffffff' : col);
  const cx = e.x + e.w / 2, by = e.y + e.h, f = e.face;
  const eyes = (x, y, r) => {
    circle(ctx, x - r * 1.1, y, r, '#fff'); circle(ctx, x + r * 1.1, y, r, '#fff');
    circle(ctx, x - r * 1.1 + f * r * 0.4, y + 1, r * 0.5, '#111'); circle(ctx, x + r * 1.1 + f * r * 0.4, y + 1, r * 0.5, '#111');
  };
  switch (e.type) {
    case 'blob': {
      const sq = e.onGround ? 1 + Math.sin(e.t * 0.2) * 0.06 : 0.82;
      const hh = e.h * sq;
      ellipse(ctx, cx, by - hh / 2, e.w / 2 * (2 - sq), hh / 2, c('#8fbf4d'));
      circle(ctx, cx - 12, by - 3, 5, c('#76a83a')); circle(ctx, cx + 9, by - 2, 4, c('#76a83a'));
      ellipse(ctx, cx - 8, by - hh + 8, 7, 3, 'rgba(255,255,255,0.5)');
      eyes(cx + f * 3, by - hh * 0.62, 5);
      line(ctx, cx - 6 + f * 3, by - hh * 0.3, cx + 6 + f * 3, by - hh * 0.3, '#2d4a14', 2);
      break;
    }
    case 'fly': {
      const flap = Math.sin(e.t * 1.2) * 0.6;
      ctx.globalAlpha = 0.6;
      ellipse(ctx, cx - 6, e.y + 4, 11, 6, '#e0f2ff', -0.6 + flap);
      ellipse(ctx, cx + 6, e.y + 4, 11, 6, '#e0f2ff', 0.6 - flap);
      ctx.globalAlpha = 1;
      ellipse(ctx, cx, e.y + 14, 13, 9, c('#2f2f2f'));
      circle(ctx, cx + f * 9, e.y + 11, 6, c('#b3001b'));
      circle(ctx, cx + f * 6, e.y + 8, 2, '#ff8fa3');
      for (let i = -1; i <= 1; i++) line(ctx, cx + i * 5, e.y + 21, cx + i * 7, e.y + 27, '#222', 1.5);
      break;
    }
    case 'bird': {
      const flap = Math.sin(e.t * 0.8) * 8;
      poly(ctx, [cx - 4, e.y + 12, cx - 18, e.y + 4 - flap, cx + 4, e.y + 10], c('#1c7ed6'));
      circle(ctx, cx, e.y + 13, 11, c('#4dabf7'));
      ellipse(ctx, cx, e.y + 17, 7, 5, c('#e7f5ff'));
      poly(ctx, [cx + f * 9, e.y + 9, cx + f * 18, e.y + 12, cx + f * 9, e.y + 15], '#f59f00');
      circle(ctx, cx + f * 4, e.y + 9, 3, '#fff'); circle(ctx, cx + f * 5, e.y + 9, 1.5, '#111');
      line(ctx, cx + f * 1, e.y + 4, cx + f * 8, e.y + 6, '#111', 2);
      break;
    }
    case 'goon': {
      const walk = Math.abs(e.vx) > 0.3 ? Math.sin(e.t * 0.25) * 5 : 0;
      rect(ctx, cx - 12, by - 18 + walk * 0.2, 9, 18, c('#5c5a3d')); rect(ctx, cx + 3, by - 18 - walk * 0.2, 9, 18, c('#5c5a3d'));
      ellipse(ctx, cx - 8, by - 2, 8, 4, '#4a2f1b'); ellipse(ctx, cx + 8, by - 2, 8, 4, '#4a2f1b');
      ellipse(ctx, cx, by - 30, 21, 18, c('#e8e4d0'));
      circle(ctx, cx - 6, by - 32, 4, c('#b08a3a')); circle(ctx, cx + 8, by - 24, 3, c('#c92a2a'));
      ellipse(ctx, cx, by - 15, 14, 5, c('#f1c9a5'));
      circle(ctx, cx + f * 2, by - 52, 11, c('#f1c9a5'));
      ellipse(ctx, cx + f * 3, by - 45, 10, 7, c('#9a9a9a'));
      ctx.fillStyle = c(G.level.goonCap); ctx.beginPath(); ctx.arc(cx + f * 2, by - 55, 11.5, Math.PI, 0); ctx.fill();
      circle(ctx, cx + f * 6, by - 54, 2.5, '#111');
      const up = e.throwAnim > 0;
      line(ctx, cx + f * 16, by - 38, cx + f * (up ? 22 : 20), by - (up ? 64 : 22), c('#f1c9a5'), 7);
      break;
    }
    case 'meatball': {
      ctx.save(); ctx.translate(cx, e.y + e.h / 2); ctx.rotate(e.rot);
      circle(ctx, 0, 0, 18, c('#7f4f24'));
      for (let i = 0; i < 7; i++) circle(ctx, Math.cos(i * 2.4) * 10, Math.sin(i * 2.4) * 10, 3, c('#5e3a1a'));
      ctx.restore();
      line(ctx, cx - 8, e.y + 4, cx + 10, e.y - 6, '#f7d794', 2);
      eyes(cx + f * 3, e.y + 14, 4);
      line(ctx, cx - 8 + f * 2, e.y + 7, cx - 1 + f * 2, e.y + 10, '#111', 2);
      line(ctx, cx + 8 + f * 2, e.y + 7, cx + 1 + f * 2, e.y + 10, '#111', 2);
      break;
    }
    case 'gator': {
      ctx.save(); ctx.translate(cx, by); ctx.scale(f, 1);
      poly(ctx, [-30, -10, -52, -4, -30, -2], c('#3f6b2a'));
      ellipse(ctx, -4, -11, 30, 11, c('#4a7d32'));
      for (let i = -24; i < 16; i += 8) poly(ctx, [i, -20, i + 4, -26, i + 8, -20], c('#3f6b2a'));
      rect(ctx, -22, -6, 8, 6, c('#3f6b2a')); rect(ctx, 6, -6, 8, 6, c('#3f6b2a'));
      rect(ctx, 18, -10, 22, 6, c('#4a7d32'));
      for (let i = 21; i < 38; i += 5) poly(ctx, [i, -10, i + 2, -14, i + 4, -10], '#fff');
      ctx.save(); ctx.translate(18, -12); ctx.rotate(-(e.jaw || 0) * 0.6);
      fillRR(ctx, 0, -6, 24, 8, 3, c('#4a7d32'));
      for (let i = 3; i < 22; i += 5) poly(ctx, [i, 2, i + 2, 6, i + 4, 2], '#fff');
      ctx.restore();
      circle(ctx, 14, -21, 5, c('#4a7d32'));
      circle(ctx, 15, -22, 2.5, '#ffd43b'); rect(ctx, 14.5, -24, 1.5, 4, '#111');
      ctx.restore();
      break;
    }
    case 'tumbleweed': {
      ctx.save(); ctx.translate(cx, e.y + e.h / 2); ctx.rotate(e.rot);
      ctx.strokeStyle = c('#a0743c'); ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath(); ctx.ellipse(0, 0, 19 - (i % 3) * 3, 9 + (i % 4) * 2.5, i * 0.7, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      for (const ox of [-5, 5]) { circle(ctx, cx + ox + f * 3, e.y + 18, 3.5, '#fff'); circle(ctx, cx + ox + f * 4, e.y + 18, 1.6, '#111'); }
      break;
    }
    case 'rat': {
      ctx.save(); ctx.translate(cx, by); ctx.scale(f, 1);
      ctx.strokeStyle = '#f4a6b7'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-15, -6); ctx.quadraticCurveTo(-30, -2 + Math.sin(e.t * 0.4) * 5, -38, -12); ctx.stroke();
      ellipse(ctx, -2, -9, 16, 9, c('#7d7d7d'));
      ellipse(ctx, 13, -9, 8, 6, c('#8c8c8c'));
      circle(ctx, 9, -16, 4.5, c('#9a9a9a')); circle(ctx, 9, -16, 2.5, '#f4a6b7');
      circle(ctx, 16, -11, 1.8, '#ff2d2d'); circle(ctx, 21, -9, 1.8, '#f4a6b7');
      const leg = Math.sin(e.t * 0.6) * 3;
      line(ctx, -8, -2, -8 + leg, 0, '#666', 2); line(ctx, 6, -2, 6 - leg, 0, '#666', 2);
      ctx.restore();
      break;
    }
    default:
      if (ENEMY_ART[e.type]) ENEMY_ART[e.type](ctx, e, c, cx, by, f);
  }
  if (e.hp < e.maxHp && e.maxHp >= 9) {
    rect(ctx, e.x, e.y - 12, e.w, 4, '#000');
    rect(ctx, e.x, e.y - 12, e.w * (e.hp / e.maxHp), 4, '#ff6b6b');
  }
}

function drawEnemyBullet(ctx, b) {
  if (b.warn) ellipse(ctx, b.x, GROUND_Y - 1, 16 * clamp(1 - (GROUND_Y - b.y) / 700, 0.3, 1), 4, 'rgba(0,0,0,0.35)');
  ctx.save(); ctx.translate(b.x, b.y);
  switch (b.kind) {
    case 'wave':
      ctx.globalAlpha = 0.85;
      poly(ctx, [-22, 16, -8, -10, 0, 4, 8, -14, 22, 16], '#a0845c');
      poly(ctx, [-14, 16, -4, -2, 6, -6, 14, 16], '#d9c29a');
      break;
    case 'burp':
      ctx.globalAlpha = 0.75;
      for (let i = 0; i < 5; i++) circle(ctx, Math.cos(i * 1.3 + b.rot * 0.2) * 14, Math.sin(i * 1.3 + b.rot * 0.2) * 10, 16, i % 2 ? '#9ccc65' : '#c5e1a5');
      circle(ctx, -6, -4, 3, '#33691e'); circle(ctx, 6, -4, 3, '#33691e');
      break;
    case 'syrup':
      ellipse(ctx, 0, 0, 6, 8, '#9c5a1a', Math.atan2(b.vy, b.vx) + Math.PI / 2);
      circle(ctx, -2, -2, 2, '#e3a857');
      break;
    case 'disco':
      ctx.rotate(b.rot);
      circle(ctx, 0, 0, b.r, '#aab3bb');
      for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) {
        if (r * r + q * q > 5) continue;
        rect(ctx, q * 12 - 5, r * 12 - 5, 10, 10, (r + q + Math.floor(G.t / 6)) % 3 === 0 ? '#fff' : '#7d868e');
      }
      break;
    default:
      ctx.rotate(b.rot);
      drawThrown(ctx, b.kind);
  }
  ctx.restore();
}
function drawThrown(ctx, kind) {
  switch (kind) {
    case 'jug': ellipse(ctx, 0, 2, 9, 10, '#a0703c'); rect(ctx, -3, -12, 6, 6, '#7a4a22'); rect(ctx, -6, -1, 12, 5, '#f3e2b5'); break;
    case 'can': rect(ctx, -6, -9, 12, 18, '#e63946'); rect(ctx, -6, -9, 12, 3, '#ccc'); rect(ctx, -6, -2, 12, 4, '#fff'); break;
    case 'meat': circle(ctx, 0, 0, 10, '#7f4f24'); circle(ctx, -3, -3, 2.5, '#5e3a1a'); circle(ctx, 4, 2, 2.5, '#5e3a1a'); break;
    case 'egg': ellipse(ctx, 0, 0, 8, 10, '#a5d8ff'); circle(ctx, -2, -3, 2, '#e7f5ff'); break;
    case 'chicken':
      ellipse(ctx, 0, 0, 16, 6, '#ffd60a');
      circle(ctx, 14, -5, 6, '#ffd60a'); poly(ctx, [12, -12, 16, -16, 18, -10], '#e63946');
      poly(ctx, [19, -6, 25, -4, 19, -3], '#f08c00'); circle(ctx, 15, -6, 1.3, '#111');
      break;
    case 'record': ellipse(ctx, 0, 0, 14, 14, '#111'); circle(ctx, 0, 0, 5, '#d62828'); circle(ctx, 0, 0, 1.5, '#fff'); break;
    case 'dice':
      fillRR(ctx, -9, -9, 18, 18, 5, '#ff8fab');
      for (const [x, y] of [[-4, -4], [4, 4], [0, 0]]) circle(ctx, x, y, 1.8, '#fff');
      break;
    case 'drumstick': ellipse(ctx, 3, 0, 10, 7, '#b5651d'); rect(ctx, -12, -2, 10, 4, '#f1faee'); circle(ctx, -13, -2, 3, '#f1faee'); circle(ctx, -13, 2, 3, '#f1faee'); break;
    case 'crawfish':
      ellipse(ctx, 0, 0, 10, 5, '#d9480f');
      for (let i = 1; i <= 3; i++) ellipse(ctx, -8 - i * 4, 0, 3, 4 - i * 0.6, '#c2410c');
      circle(ctx, 12, -5, 4, '#d9480f'); circle(ctx, 12, 5, 4, '#d9480f');
      circle(ctx, 6, -2, 1.2, '#111');
      break;
    case 'hubcap':
      circle(ctx, 0, 0, 12, '#ced4da'); circle(ctx, 0, 0, 5, '#868e96');
      for (let i = 0; i < 5; i++) line(ctx, Math.cos(i * 1.26) * 5, Math.sin(i * 1.26) * 5, Math.cos(i * 1.26) * 11, Math.sin(i * 1.26) * 11, '#adb5bd', 2);
      break;
    case 'banana':
      ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, -6, 12, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
      circle(ctx, 10, 2, 2, '#5c3d1e'); circle(ctx, -10, 2, 2, '#5c3d1e');
      break;
    default:
      if (THROWN_ART[kind]) THROWN_ART[kind](ctx);
  }
}
