'use strict';
// More of Bob's critters and cousins, each with its own attack.
// Animals: raccoon, goose, hog, skunk, snake, chicken.  Cousins: fireworks, bowler, balloon, banjo.

Object.assign(ENEMY_TYPES, {
  raccoon:   { w: 34, h: 30, hp: 5,  score: 12, bits: ['#868e96', '#343a40'] },
  goose:     { w: 36, h: 34, hp: 6,  score: 15, bits: ['#f8f9fa', '#f08c00'] },
  hog:       { w: 60, h: 38, hp: 20, score: 30, dmg: 2, bits: ['#8b5e3c', '#c48b6a'] },
  skunk:     { w: 40, h: 28, hp: 7,  score: 15, bits: ['#212529', '#f8f9fa'] },
  snake:     { w: 46, h: 16, hp: 6,  score: 15, bits: ['#6b8e23', '#c9a46b'] },
  chicken:   { w: 26, h: 26, hp: 2,  score: 5,  bits: ['#f8f9fa', '#d9a066', '#e03131'] },
  fireworks: { w: 40, h: 62, hp: 12, score: 25, bits: ['#e03131', '#f8f9fa', '#1c7ed6'] },
  bowler:    { w: 44, h: 62, hp: 14, score: 25, bits: ['#20c997', '#1c1c3a'] },
  balloon:   { w: 44, h: 60, hp: 8,  score: 25, fly: true, bits: ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c'] },
  banjo:     { w: 40, h: 60, hp: 12, score: 25, bits: ['#e9c46a', '#1c7ed6'] },
});

const ENEMY_AI = {
  // Runs up close, then hops back and throws trash.
  raccoon(e, p, dx) {
    const d = Math.abs(dx);
    if (d > 240) e.vx += (Math.sign(dx) * 3 - e.vx) * 0.15; else e.vx *= 0.8;
    if (e.onGround && Math.random() < 0.015) e.vy = -8;
    if (d < 480 && --e.timer <= 0 && !p.dead) {
      throwArc(e.x + e.w / 2, e.y, p.x + p.w / 2, p.y + p.h / 2, 'trash', 40 + randi(0, 10));
      e.timer = randi(70, 110); SFX.throwIt();
    }
    moveActor(e);
  },
  // Waddles, then charges with its neck out, honking.
  goose(e, p, dx) {
    if (e.charge > 0) { e.charge--; e.vx = e.dir * 7; }
    else {
      e.dir = Math.sign(dx) || -1; e.vx = e.dir * 1.4;
      if (--e.timer <= 0 && Math.abs(dx) < 300) { e.charge = 32; e.timer = randi(90, 140); SFX.honk(); if (e.onGround) e.vy = -4; }
    }
    e.face = e.dir; moveActor(e);
  },
  // Paws the ground, then rams across the screen. Hits hard.
  hog(e, p, dx) {
    if (e.state === 'wind') {
      e.vx = 0;
      if (e.t % 6 === 0) particles(e.x + e.w / 2 - e.dir * 25, e.y + e.h, 2, ['#a68a64', '#d9c29a'], { speed: 2 });
      if (--e.st <= 0) { e.state = 'charge'; e.st = 70; SFX.oink(); }
    } else if (e.state === 'charge') {
      e.vx = e.dir * 8;
      if (e.t % 3 === 0) particles(e.x + e.w / 2, e.y + e.h, 1, ['#a68a64'], { speed: 2 });
      if (--e.st <= 0 || e.hitWall) { e.state = 'rest'; e.st = 50; if (e.hitWall) shake(4); }
    } else if (e.state === 'rest') {
      e.vx *= 0.8; if (--e.st <= 0) e.state = null;
    } else {
      e.dir = Math.sign(dx) || -1; e.vx = e.dir;
      if (Math.abs(dx) < 500 && Math.abs(p.y + p.h - (e.y + e.h)) < 60 && --e.timer <= 0) { e.state = 'wind'; e.st = 35; e.timer = 60; }
    }
    e.face = e.dir; moveActor(e);
  },
  // Gets close, turns around, and sprays a stink cloud that hangs in the air.
  skunk(e, p, dx) {
    const d = Math.abs(dx);
    if (e.spray > 0) {
      e.spray--; e.vx = 0; e.face = -(Math.sign(dx) || 1);
      if (e.spray === 20) {
        const dir = Math.sign(dx) || 1;
        G.ebullets.push({ kind: 'stink', x: e.x + e.w / 2 + dir * 30, y: e.y + 4, vx: dir * 1.6, vy: -0.15, g: 0, r: 28, dmg: 1, life: 190, linger: true, spin: 0.02 });
        SFX.pop();
      }
    } else {
      e.vx = d > 180 ? Math.sign(dx) * 1.6 : 0;
      if (d <= 220 && --e.timer <= 0) { e.spray = 40; e.timer = randi(120, 170); }
    }
    moveActor(e);
  },
  // Slithers low and strikes when you get close.
  snake(e, p, dx) {
    if (e.strike > 0) { e.strike--; e.vx = e.dir * 5; }
    else {
      e.dir = Math.sign(dx) || -1; e.vx = e.dir * 0.9;
      if (Math.abs(dx) < 110 && --e.timer <= 0) { e.strike = 14; e.timer = randi(60, 100); SFX.hiss(); }
    }
    e.face = e.dir; moveActor(e);
  },
  // Flocks of chickens: fast, hoppy, peck on contact.
  chicken(e, p, dx) {
    if (!e.color) e.color = pick(['#f8f9fa', '#d9a066', '#f8f9fa', '#8d5524']);
    e.vx += (Math.sign(dx) * rand(1.5, 3.2) - e.vx) * 0.1;
    if (e.onGround && Math.random() < 0.04) e.vy = -rand(4, 7);
    if (e.t % 90 === 0 && onScreen(e)) SFX.cluck();
    moveActor(e, false, e.vy > 0 ? 0.35 : GRAV); // flutters down slowly
  },
  // Keeps its distance and shoots bottle rockets at you.
  fireworks(e, p, dx) {
    const d = Math.abs(dx);
    e.vx = d > 380 ? Math.sign(dx) * 1.2 : d < 220 ? -Math.sign(dx) : 0;
    e.face = Math.sign(dx) || 1;
    if (d < 620 && --e.timer <= 0 && !p.dead) {
      const sx = e.x + e.w / 2 + e.face * 20, sy = e.y + 18;
      const a = Math.atan2(p.y + 20 - sy, p.x + p.w / 2 - sx);
      G.ebullets.push({ kind: 'firework', x: sx, y: sy, vx: Math.cos(a) * 6.5, vy: Math.sin(a) * 6.5, g: 0.015, r: 8, dmg: 1, life: 120, fw: true, spin: 0, rot: a });
      e.timer = randi(100, 140); SFX.whistle();
    }
    moveActor(e);
  },
  // Rolls bowling balls along the ground. Jump over them!
  bowler(e, p, dx) {
    const d = Math.abs(dx);
    e.vx = d > 340 ? Math.sign(dx) * 1.1 : 0; e.face = Math.sign(dx) || 1;
    if (d < 650 && --e.timer <= 0 && !p.dead) { e.windup = 24; e.timer = randi(120, 160); }
    if (e.windup > 0 && --e.windup === 0) {
      G.ebullets.push({ kind: 'bowling', x: e.x + e.w / 2 + e.face * 24, y: GROUND_Y - 12, vx: e.face * 6.5, vy: 0, g: 0, r: 12, dmg: 1, life: 240, roll: true, spin: 0 });
      SFX.roll();
    }
    moveActor(e);
  },
  // Floats over in a lawn chair tied to balloons and drops water balloons.
  balloon(e, p, dx) {
    if (!e.init) { e.init = true; e.baseY = rand(150, 185); e.y = e.baseY; }
    e.vx += (Math.sign(dx) * 1.2 - e.vx) * 0.03;
    e.x += e.vx; e.y = e.baseY + Math.sin(e.t * 0.03) * 10;
    if (--e.timer <= 0 && Math.abs(dx) < 120 && !p.dead) {
      G.ebullets.push({ kind: 'waterballoon', x: e.x + e.w / 2, y: e.y + e.h, vx: e.vx * 0.5, vy: 1, g: 0.3, r: 9, dmg: 1, life: 200 });
      e.timer = randi(70, 110); SFX.throwIt();
    }
  },
  // Picks the banjo; music notes wave through the air at you.
  banjo(e, p, dx) {
    const d = Math.abs(dx);
    e.vx = d > 420 ? Math.sign(dx) * 1.1 : 0; e.face = Math.sign(dx) || 1;
    if (d < 600 && --e.timer <= 0 && !p.dead) { e.burst = 3; e.timer = 130; }
    if (e.burst > 0 && e.t % 12 === 0) {
      e.burst--;
      const sx = e.x + e.w / 2 + e.face * 20, sy = e.y + 30, steps = Math.max(30, d / 3.2);
      G.ebullets.push({ kind: 'note', x: sx, y: sy, baseY: sy, dy: (p.y + 24 - sy) / steps, vx: e.face * 3.2, vy: 0, g: 0, r: 9, dmg: 1, life: 220, sine: 22, spin: 0 });
      SFX.pluck();
    }
    moveActor(e);
  },
};

// A scruffy cousin of Bob's; the extras are drawn by each cousin.
function cousin(ctx, e, c, cx, by, f, o) {
  const walk = Math.abs(e.vx) > 0.3 ? Math.sin(e.t * 0.25) * 5 : 0;
  rect(ctx, cx - 12, by - 18 + walk * 0.2, 9, 18, c(o.pants)); rect(ctx, cx + 3, by - 18 - walk * 0.2, 9, 18, c(o.pants));
  ellipse(ctx, cx - 8, by - 2, 8, 4, '#4a2f1b'); ellipse(ctx, cx + 8, by - 2, 8, 4, '#4a2f1b');
  ellipse(ctx, cx, by - 30, 20, 18, c(o.shirt));
  if (o.stripes) for (let i = 0; i < 3; i++) rect(ctx, cx - 16, by - 40 + i * 8, 32, 3, c(o.stripes));
  ellipse(ctx, cx, by - 15, 14, 5, c('#f1c9a5'));
  circle(ctx, cx + f * 2, by - 52, 11, c('#f1c9a5'));
  if (o.beard) ellipse(ctx, cx + f * 3, by - 45, 10, 7, c(o.beard));
  if (o.hat === 'straw') { ellipse(ctx, cx + f * 2, by - 58, 17, 4, c('#e9c46a')); ellipse(ctx, cx + f * 2, by - 62, 9, 6, c('#e9c46a')); }
  else if (o.hat === 'band') { rect(ctx, cx - 10 + f * 2, by - 60, 22, 4, c(o.hatColor)); ctx.fillStyle = c('#5c3d22'); ctx.beginPath(); ctx.arc(cx + f * 2, by - 56, 11, Math.PI, 0); ctx.fill(); rect(ctx, cx - 10 + f * 2, by - 60, 22, 4, c(o.hatColor)); }
  else { ctx.fillStyle = c(o.hatColor || '#495057'); ctx.beginPath(); ctx.arc(cx + f * 2, by - 55, 11.5, Math.PI, 0); ctx.fill(); }
  if (o.glasses) rect(ctx, cx + f * 3 - 6, by - 55, 12, 4, '#111'); else circle(ctx, cx + f * 6, by - 54, 2.5, '#111');
}

const ENEMY_ART = {
  raccoon(ctx, e, c, cx, by, f) {
    const run = Math.sin(e.t * 0.5) * 3;
    for (let i = 0; i < 4; i++) ellipse(ctx, cx - f * (14 + i * 3), by - 18 - i * 5, 5, 4, i % 2 ? '#343a40' : c('#868e96'));
    for (const lx of [-10, -3, 4, 10]) rect(ctx, cx + lx + (lx < 0 ? run : -run) * 0.4, by - 8, 4, 8, '#343a40');
    ellipse(ctx, cx - 2 * f, by - 13, 15, 9, c('#868e96'));
    circle(ctx, cx + f * 7, by - 25, 3, c('#868e96')); circle(ctx, cx + f * 14, by - 25, 3, c('#868e96'));
    circle(ctx, cx + f * 11, by - 17, 8, c('#868e96'));
    ellipse(ctx, cx + f * 12, by - 18, 7, 3, '#343a40');
    circle(ctx, cx + f * 14, by - 18, 1.6, '#fff');
    circle(ctx, cx + f * 19, by - 15, 1.8, '#111');
  },
  goose(ctx, e, c, cx, by, f) {
    const ch = e.charge > 0, step = Math.sin(e.t * (ch ? 0.9 : 0.4)) * 4;
    line(ctx, cx - 3, by - 10, cx - 3 + step, by, '#f08c00', 2.5); line(ctx, cx + 3, by - 10, cx + 3 - step, by, '#f08c00', 2.5);
    poly(ctx, [cx - f * 14, by - 18, cx - f * 24, by - 24, cx - f * 16, by - 12], c('#dee2e6'));
    ellipse(ctx, cx - f * 2, by - 16, 15, 10, c('#f8f9fa'));
    if (ch) ellipse(ctx, cx - f * 4, by - 26, 16, 5, c('#dee2e6'), -f * (0.6 + Math.sin(e.t * 0.8) * 0.4));
    else ellipse(ctx, cx - f * 4, by - 17, 9, 5, c('#dee2e6'));
    const hx = ch ? cx + f * 22 : cx + f * 9, hy = ch ? by - 21 : by - 34;
    line(ctx, cx + f * 7, by - 19, hx - f * 2, hy + 1, c('#f8f9fa'), 6);
    ellipse(ctx, hx, hy, 6, 5, c('#f8f9fa'));
    poly(ctx, [hx + f * 4, hy - 2, hx + f * 12, hy + 1, hx + f * 4, hy + 3], '#f08c00');
    circle(ctx, hx + f, hy - 1, 1.5, '#111');
    line(ctx, hx - f * 2, hy - 4, hx + f * 4, hy - 2, '#111', 1.5);
  },
  hog(ctx, e, c, cx, by, f) {
    const run = e.state === 'charge' ? Math.sin(e.t * 0.9) * 4 : Math.sin(e.t * 0.3) * 2;
    for (const [lx, s] of [[-20, 1], [-10, -1], [6, 1], [16, -1]]) rect(ctx, cx + lx * f + run * s, by - 12, 6, 12, '#4a3020');
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx - f * 30, by - 26, 4, 0, Math.PI * 1.5); ctx.stroke();
    ellipse(ctx, cx - f * 2, by - 21, 28, 15, c('#8b5e3c'));
    for (let i = -20; i < 16; i += 5) line(ctx, cx + i * f, by - 34, cx + (i + 2) * f, by - 39, '#4a3020', 2);
    ellipse(ctx, cx + f * 24, by - 20, 11, 10, c('#7a5230'));
    poly(ctx, [cx + f * 18, by - 28, cx + f * 22, by - 37, cx + f * 26, by - 28], '#4a3020');
    ellipse(ctx, cx + f * 33, by - 17, 5, 5, c('#c48b6a'));
    circle(ctx, cx + f * 32, by - 17, 1.2, '#3b1f1f'); circle(ctx, cx + f * 35, by - 17, 1.2, '#3b1f1f');
    poly(ctx, [cx + f * 28, by - 13, cx + f * 31, by - 6, cx + f * 32, by - 13], '#fff');
    circle(ctx, cx + f * 26, by - 23, 2.2, '#e03131');
    if (e.state === 'wind') { ctx.globalAlpha = 0.5; circle(ctx, cx + f * (40 + (e.t % 12)), by - 18, 4, '#f1f3f5'); ctx.globalAlpha = 1; }
  },
  skunk(ctx, e, c, cx, by, f) {
    const up = e.spray > 0;
    ellipse(ctx, cx - f * 14, by - (up ? 30 : 22), 10, up ? 18 : 13, c('#212529'), -f * (up ? 0.2 : 0.7));
    ellipse(ctx, cx - f * 14, by - (up ? 30 : 22), 3, up ? 14 : 10, '#f8f9fa', -f * (up ? 0.2 : 0.7));
    for (const lx of [-8, 6]) rect(ctx, cx + lx, by - 7, 4, 7, '#212529');
    ellipse(ctx, cx, by - 12, 15, 9, c('#212529'));
    ellipse(ctx, cx - f * 2, by - 18, 11, 2.5, '#f8f9fa');
    circle(ctx, cx + f * 14, by - 12, 7, c('#212529'));
    line(ctx, cx + f * 12, by - 18, cx + f * 16, by - 12, '#f8f9fa', 2);
    circle(ctx, cx + f * 20, by - 10, 1.8, '#ff8fab'); circle(ctx, cx + f * 15, by - 13, 1.5, '#fff');
  },
  snake(ctx, e, c, cx, by, f) {
    const strike = e.strike > 0;
    for (let i = 7; i >= 0; i--) {
      const x = cx - f * (i * 6 - 18), y = by - 5 - Math.sin(e.t * 0.3 + i) * 2;
      circle(ctx, x, y, 6 - i * 0.35, c('#6b8e23'));
      if (i % 2 === 0) poly(ctx, [x - 2, y, x, y - 3, x + 2, y, x, y + 3], '#3f5a14');
    }
    const tx = cx - f * 26, shake = Math.sin(e.t * 1.5) * 1.5;
    ellipse(ctx, tx, by - 6 + shake, 3, 2.5, '#d9c29a'); ellipse(ctx, tx - f * 4, by - 6 - shake, 2.5, 2, '#d9c29a');
    const hx = cx + f * (strike ? 26 : 22), hy = strike ? by - 16 : by - 7;
    ellipse(ctx, hx, hy, 7, 5, c('#556b2f'));
    circle(ctx, hx + f * 2, hy - 2, 1.6, '#ffd43b');
    if (e.t % 20 < 10) { line(ctx, hx + f * 6, hy + 1, hx + f * 11, hy + 1, '#e03131', 1.2); line(ctx, hx + f * 11, hy + 1, hx + f * 13, hy - 1, '#e03131', 1); }
  },
  chicken(ctx, e, c, cx, by, f) {
    const step = Math.sin(e.t * 0.6) * 3, col = e.color || '#f8f9fa';
    line(ctx, cx - 3, by - 8, cx - 3 + step, by, '#f08c00', 2); line(ctx, cx + 3, by - 8, cx + 3 - step, by, '#f08c00', 2);
    poly(ctx, [cx - f * 9, by - 14, cx - f * 16, by - 22, cx - f * 12, by - 10], c(col));
    ellipse(ctx, cx, by - 12, 11, 9, c(col));
    ellipse(ctx, cx - f * 2, by - 13, 6, 4, c(col === '#f8f9fa' ? '#dee2e6' : '#a0663a'), e.onGround ? 0 : -f * 0.8);
    circle(ctx, cx + f * 8, by - 21, 5.5, c(col));
    poly(ctx, [cx + f * 5, by - 26, cx + f * 8, by - 30, cx + f * 11, by - 26], '#e03131');
    poly(ctx, [cx + f * 12, by - 22, cx + f * 17, by - 20, cx + f * 12, by - 19], '#f08c00');
    circle(ctx, cx + f * 12, by - 17, 2, '#e03131'); circle(ctx, cx + f * 9, by - 22, 1.3, '#111');
  },
  fireworks(ctx, e, c, cx, by, f) {
    cousin(ctx, e, c, cx, by, f, { pants: '#3d5a80', shirt: '#f8f9fa', stripes: '#e03131', hat: 'cap', hatColor: '#1c7ed6', glasses: true, beard: '#9a9a9a' });
    ctx.save(); ctx.translate(cx + f * 14, by - 40); ctx.rotate(f > 0 ? -0.3 : Math.PI + 0.3);
    rect(ctx, 0, -5, 26, 10, '#c92a2a'); rect(ctx, 26, -6, 4, 12, '#ffd43b'); ctx.restore();
  },
  bowler(ctx, e, c, cx, by, f) {
    cousin(ctx, e, c, cx, by, f, { pants: '#343a40', shirt: '#20c997', stripes: '#0ca678', hat: 'none', hatColor: '#6b3e1f', beard: '#6b3e1f' });
    rect(ctx, cx - 4, by - 47, 8, 6, '#f8f9fa');
    if (!e.windup || e.windup > 12) circle(ctx, cx + f * 20, by - (e.windup ? 46 : 26), 10, '#1c1c3a');
  },
  balloon(ctx, e, c, cx, by, f) {
    const cols = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#da77f2'];
    for (let i = 0; i < 5; i++) {
      const bx = cx - 24 + i * 12, byy = e.y - 50 + Math.sin(e.t * 0.05 + i) * 3 - (i % 2) * 10;
      line(ctx, cx, e.y + 6, bx, byy + 10, '#ddd', 1);
      ellipse(ctx, bx, byy, 9, 11, cols[i]);
    }
    rect(ctx, cx - 20, by - 14, 40, 4, '#adb5bd'); rect(ctx, cx - 20, by - 34, 4, 22, '#adb5bd');
    for (let i = 0; i < 3; i++) rect(ctx, cx - 18, by - 32 + i * 7, 36, 4, i % 2 ? '#fff' : '#2b8a3e');
    ellipse(ctx, cx, by - 22, 14, 12, c('#e8e4d0'));
    circle(ctx, cx + f * 2, by - 40, 9, c('#f1c9a5'));
    ctx.fillStyle = c('#e03131'); ctx.beginPath(); ctx.arc(cx + f * 2, by - 43, 9.5, Math.PI, 0); ctx.fill();
    circle(ctx, cx + f * 5, by - 41, 2, '#111');
    line(ctx, cx - 6, by - 10, cx - 10, by + 2, '#f1c9a5', 4); line(ctx, cx + 6, by - 10, cx + 10, by + 2, '#f1c9a5', 4);
  },
  banjo(ctx, e, c, cx, by, f) {
    cousin(ctx, e, c, cx, by, f, { pants: '#1c7ed6', shirt: '#e9d8a6', hat: 'straw', beard: '#c0841a' });
    rect(ctx, cx - 10, by - 44, 20, 22, c('#1c7ed6'));
    ctx.save(); ctx.translate(cx + f * 4, by - 30); ctx.rotate(-f * 0.6);
    circle(ctx, 0, 0, 10, '#e9c46a'); circle(ctx, 0, 0, 7, '#f8f0dc');
    rect(ctx, f > 0 ? 8 : -30, -2, 22, 4, '#6b4f3a');
    ctx.restore();
  },
};

// Things the new enemies throw or shoot.
const THROWN_ART = {
  trash(ctx) { ellipse(ctx, 0, 0, 5, 8, '#f8f0dc'); ellipse(ctx, 0, -7, 6, 3, '#e03131'); ellipse(ctx, 0, 7, 6, 3, '#e03131'); rect(ctx, -1, -12, 2, 4, '#5c3d1e'); },
  stink(ctx) {
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 5; i++) circle(ctx, Math.cos(i * 1.3) * 16, Math.sin(i * 1.3) * 10, 15, i % 2 ? '#82c91e' : '#a9e34b');
    ctx.globalAlpha = 1;
    line(ctx, -8, -4, -2, -10, '#5c940d', 2); line(ctx, 4, -2, 10, -9, '#5c940d', 2);
  },
  firework(ctx) {
    rect(ctx, -9, -3, 14, 6, '#e03131'); poly(ctx, [5, -4, 11, 0, 5, 4], '#ffd43b');
    line(ctx, -9, 0, -22, 0, '#8a6a3a', 1.5);
    for (let i = 0; i < 3; i++) circle(ctx, -12 - Math.random() * 10, (Math.random() - 0.5) * 8, 1.5 + Math.random() * 1.5, pick(['#ffd43b', '#ff922b', '#fff']));
  },
  bowling(ctx) { circle(ctx, 0, 0, 12, '#1c1c3a'); circle(ctx, -3, -4, 2, '#000'); circle(ctx, 3, -4, 2, '#000'); circle(ctx, 0, 1, 2, '#000'); ellipse(ctx, -5, -6, 3, 2, 'rgba(255,255,255,0.25)'); },
  waterballoon(ctx) { circle(ctx, 0, 0, 9, '#4dabf7'); poly(ctx, [-2, -9, 2, -9, 0, -13], '#1c7ed6'); ellipse(ctx, -3, -3, 3, 2, 'rgba(255,255,255,0.5)'); },
  note(ctx) {
    ellipse(ctx, -3, 5, 5.5, 4, '#ffd43b', -0.4); rect(ctx, 1, -10, 2.5, 15, '#ffd43b');
    poly(ctx, [3.5, -10, 10, -6, 3.5, -4], '#ffd43b');
  },
  corndog(ctx) { ellipse(ctx, 2, 0, 11, 5, '#d9a441'); rect(ctx, -16, -1, 8, 2, '#e9d8a6'); },
};
