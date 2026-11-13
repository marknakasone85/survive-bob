'use strict';
// Scenery art. Every function draws in world space with its base on GROUND_Y.

const Props = {
  pine(ctx, x, s = 1) {
    const y = GROUND_Y;
    rect(ctx, x - 6 * s, y - 40 * s, 12 * s, 40 * s, '#4a2f1b');
    for (let i = 0; i < 4; i++) {
      const ty = y - 30 * s - i * 34 * s, hw = (58 - i * 12) * s;
      poly(ctx, [x - hw, ty, x + hw, ty, x, ty - 58 * s], i % 2 ? '#1f4d2b' : '#25603a');
    }
  },
  jug(ctx, x) {
    const y = GROUND_Y;
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + 9, y - 27, 6, -1.4, 1.4); ctx.stroke();
    ellipse(ctx, x, y - 16, 14, 16, '#a0703c');
    fillRR(ctx, x - 5, y - 40, 10, 10, 3, '#7a4a22');
    rect(ctx, x - 9, y - 23, 18, 10, '#f3e2b5');
    text(ctx, 'XXX', x, y - 18, { size: 7, color: '#222', font: FONT2, weight: 800 });
  },
  outhouse(ctx, x) {
    const y = GROUND_Y;
    rect(ctx, x, y - 110, 60, 110, '#7a5230');
    for (let i = 1; i < 4; i++) line(ctx, x + i * 15, y - 108, x + i * 15, y, '#5e3d22', 2);
    poly(ctx, [x - 8, y - 106, x + 68, y - 120, x + 68, y - 110, x - 8, y - 96], '#4a2f1b');
    ctx.fillStyle = '#2b1a0d'; ctx.beginPath(); ctx.arc(x + 30, y - 85, 7, 0.6, 5.7); ctx.fill();
  },
  truck(ctx, x, color = '#9c4a2f') {
    const y = GROUND_Y;
    fillRR(ctx, x, y - 52, 170, 36, 6, color);
    fillRR(ctx, x + 100, y - 86, 64, 40, 8, color);
    fillRR(ctx, x + 110, y - 80, 44, 24, 4, '#9fd3e6');
    for (let i = 0; i < 6; i++) circle(ctx, x + 20 + hash(x + i) * 70, y - 40 + hash(i + x * 2) * 18, 4, '#6e2f1c');
    for (const wx of [x + 34, x + 132]) { circle(ctx, wx, y - 14, 15, '#222'); circle(ctx, wx, y - 14, 6, '#888'); }
  },
  sign(ctx, x, str = 'HOLLER') {
    const y = GROUND_Y;
    rect(ctx, x - 3, y - 80, 6, 80, '#5e3d22');
    fillRR(ctx, x - 50, y - 92, 100, 30, 4, '#c9a46b');
    text(ctx, str, x, y - 77, { size: 12, color: '#3b2412' });
  },
  flamingo(ctx, x) {
    const y = GROUND_Y;
    line(ctx, x, y, x, y - 34, '#e0559a', 2);
    line(ctx, x + 4, y, x + 2, y - 34, '#e0559a', 2);
    ellipse(ctx, x + 4, y - 42, 16, 10, '#ff6fb5');
    ctx.strokeStyle = '#ff6fb5'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 16, y - 44); ctx.quadraticCurveTo(x + 26, y - 60, x + 18, y - 70); ctx.stroke();
    circle(ctx, x + 18, y - 72, 5, '#ff6fb5');
    poly(ctx, [x + 22, y - 73, x + 30, y - 70, x + 22, y - 69], '#222');
  },
  tire(ctx, x) {
    ellipse(ctx, x, GROUND_Y - 10, 24, 11, '#222');
    ellipse(ctx, x, GROUND_Y - 12, 11, 5, '#555');
  },
  grill(ctx, x) {
    const y = GROUND_Y;
    line(ctx, x - 14, y, x, y - 34, '#333', 3); line(ctx, x + 14, y, x, y - 34, '#333', 3);
    ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(x, y - 44, 22, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 46, 22, Math.PI, 0); ctx.fill();
    for (let i = 0; i < 3; i++) circle(ctx, x - 8 + i * 8, y - 74 - ((G.t * 0.5 + i * 12) % 30), 4, 'rgba(200,200,200,0.35)');
  },
  clothesline(ctx, x) {
    const y = GROUND_Y;
    rect(ctx, x, y - 120, 5, 120, '#777'); rect(ctx, x + 180, y - 120, 5, 120, '#777');
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + 3, y - 116); ctx.quadraticCurveTo(x + 92, y - 100, x + 182, y - 116); ctx.stroke();
    const cols = ['#e63946', '#f1faee', '#457b9d', '#ffd166'];
    for (let i = 0; i < 4; i++) {
      const cx = x + 26 + i * 40, sway = Math.sin(G.t * 0.05 + i) * 3;
      poly(ctx, [cx, y - 110, cx + 26, y - 110, cx + 24 + sway, y - 76, cx + 2 + sway, y - 76], cols[i]);
    }
  },
  gnome(ctx, x) {
    const y = GROUND_Y;
    fillRR(ctx, x - 10, y - 26, 20, 26, 6, '#2f6fb0');
    poly(ctx, [x - 9, y - 26, x + 9, y - 26, x + 4, y - 14, x - 4, y - 14], '#fff');
    circle(ctx, x, y - 32, 7, '#f1c27d');
    poly(ctx, [x - 10, y - 34, x + 10, y - 34, x + 2, y - 58], '#d62828');
  },
  chair(ctx, x) {
    const y = GROUND_Y;
    line(ctx, x, y, x + 30, y - 30, '#bbb', 3); line(ctx, x + 30, y, x, y - 30, '#bbb', 3);
    for (let i = 0; i < 4; i++) rect(ctx, x - 2, y - 32 - i * 8, 34, 6, i % 2 ? '#fff' : '#2a9d8f');
  },
  pool(ctx, x) {
    ellipse(ctx, x, GROUND_Y - 8, 50, 12, '#4cc9f0');
    ellipse(ctx, x, GROUND_Y - 10, 40, 7, '#90e0ef');
  },
  // A plate lying on the counter, sometimes with a pancake stack on it.
  plate(ctx, x, pancake) {
    const y = GROUND_Y + 4;
    ellipse(ctx, x, y + 2, 46, 9, 'rgba(0,0,0,0.15)');
    ellipse(ctx, x, y, 44, 9, '#fdfdfd');
    ellipse(ctx, x, y - 1, 30, 5.5, '#eef1f4');
    if (pancake) {
      for (let i = 0; i < 3; i++) {
        ellipse(ctx, x, y - 4 - i * 7, 28, 6, '#b5762e');
        ellipse(ctx, x, y - 6 - i * 7, 27, 5, '#e3a857');
      }
      rect(ctx, x - 6, y - 28, 12, 7, '#fff3a0');
      ctx.fillStyle = 'rgba(122,62,16,0.85)';
      ctx.beginPath(); ctx.ellipse(x + 2, y - 22, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
      rect(ctx, x + 14, y - 22, 4, 12, 'rgba(122,62,16,0.85)');
    }
  },
};

// Platforms (one-way) and blocks (solid) draw themselves by style.
// Extra styles can be registered in SolidArt (see art-more.js).
const SolidArt = {};
function drawSolid(ctx, s) {
  if (s.cover && (s.hp < s.maxHp || G.t - s.hitAt < 8)) { drawDamagedCover(ctx, s); return; }
  const { x, y, w, h } = s;
  switch (s.style) {
    case 'plank':
      rect(ctx, x + 8, y + 10, 8, GROUND_Y - y - 10, '#5b3a1e');
      rect(ctx, x + w - 16, y + 10, 8, GROUND_Y - y - 10, '#5b3a1e');
      line(ctx, x + 12, y + 30, x + w - 12, GROUND_Y - 10, '#5b3a1e', 4);
      fillRR(ctx, x, y, w, 14, 3, '#9b6b3f');
      for (let i = 10; i < w; i += 30) circle(ctx, x + i, y + 7, 1.5, '#4a2f1b');
      break;
    case 'shack': {
      rect(ctx, x + 6, y + 10, w - 12, GROUND_Y - y - 10, '#8a6a4a');
      for (let i = x + 20; i < x + w - 10; i += 18) line(ctx, i, y + 12, i, GROUND_Y, '#6e5236', 2);
      rect(ctx, x + w * 0.62, GROUND_Y - 64, 34, 64, '#4a2f1b');
      rect(ctx, x + 24, y + 34, 40, 30, '#f5c86a');
      line(ctx, x + 44, y + 34, x + 44, y + 64, '#4a2f1b', 3);
      rect(ctx, x - 6, y, w + 12, 14, '#9aa3a8');
      for (let i = x - 6; i < x + w + 6; i += 10) line(ctx, i, y, i, y + 14, '#7d868b', 1);
      break;
    }
    case 'trailer': {
      const by = GROUND_Y - 14;
      fillRR(ctx, x, y, w, by - y, 14, '#efe9d8');
      rect(ctx, x, y + (by - y) * 0.45, w, 14, '#4a90a4');
      rect(ctx, x, y + (by - y) * 0.45 + 18, w, 5, '#4a90a4');
      for (let i = 0; i < Math.floor(w / 90); i++) {
        rect(ctx, x + 22 + i * 90, y + 22, 44, 28, '#3d5a6c');
        rect(ctx, x + 24 + i * 90, y + 24, 40, 24, '#a9d6e5');
      }
      rect(ctx, x + w - 60, y + 36, 34, by - y - 36, '#c7bfa6');
      circle(ctx, x + w - 32, y + 80, 3, '#333');
      rect(ctx, x + w - 66, by, 46, 7, '#999'); rect(ctx, x + w - 60, by + 7, 34, 7, '#888');
      rect(ctx, x + 10, by, w - 90, 14, '#bfb7a0');
      for (let i = x + 16; i < x + w - 84; i += 12) line(ctx, i, by + 2, i, by + 13, '#a39b84', 1);
      rect(ctx, x, y, w, 8, '#d9d4c7');
      break;
    }
    case 'shelf':
      fillRR(ctx, x, y, w, 14, 2, '#a86b3c');
      rect(ctx, x, y + 11, w, 3, '#7a4a25');
      for (const bx of [x + 14, x + w - 24]) poly(ctx, [bx, y + 14, bx + 10, y + 14, bx + 10, y + 40], '#666');
      break;
    case 'plates':
      for (let py = GROUND_Y - 2; py > y + 4; py -= 9) {
        ellipse(ctx, x + w / 2, py, w / 2, 6, '#dfe5ea');
        ellipse(ctx, x + w / 2, py - 2, w / 2, 5, '#ffffff');
      }
      ellipse(ctx, x + w / 2, y + 7, w / 2, 7, '#ffffff');
      ellipse(ctx, x + w / 2, y + 7, w / 3, 4, '#eef1f4');
      break;
    case 'hay':
      fillRR(ctx, x, y, w, h, 5, '#d9b44a');
      for (let i = 6; i < h; i += 8) line(ctx, x + 3, y + i, x + w - 3, y + i, '#b8922c', 1);
      rect(ctx, x + w * 0.3, y, 4, h, '#8a6a1c'); rect(ctx, x + w * 0.65, y, 4, h, '#8a6a1c');
      break;
    case 'crate':
      rect(ctx, x, y, w, h, '#a87a45');
      ctx.strokeStyle = '#6e4a22'; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      line(ctx, x + 4, y + 4, x + w - 4, y + h - 4, '#6e4a22', 4);
      break;
    case 'barrel':
      fillRR(ctx, x, y, w, h, 10, '#8b4a2b');
      rect(ctx, x, y + h * 0.25, w, 5, '#555'); rect(ctx, x, y + h * 0.7, w, 5, '#555');
      break;
    case 'toaster':
      fillRR(ctx, x, y, w, h, 14, '#c9d1d6');
      rect(ctx, x + 14, y - 2, w * 0.3, 6, '#333'); rect(ctx, x + w * 0.55, y - 2, w * 0.3, 6, '#333');
      fillRR(ctx, x + 6, y + 8, 10, h - 20, 4, 'rgba(255,255,255,0.6)');
      rect(ctx, x + w - 6, y + h * 0.4, 8, 8, '#333');
      break;
    case 'cereal':
      rect(ctx, x, y, w, h, '#e63946');
      rect(ctx, x + 6, y + 10, w - 12, 30, '#ffd166');
      text(ctx, 'BOB', x + w / 2, y + 25, { size: 14, color: '#e63946' });
      text(ctx, "O's", x + w / 2, y + 58, { size: 16, color: '#fff' });
      circle(ctx, x + w / 2, y + h - 22, 12, '#f4a261');
      break;
    case 'jar':
      fillRR(ctx, x, y + 10, w, h - 10, 10, 'rgba(180,120,40,0.85)');
      rect(ctx, x + 6, y, w - 12, 12, '#c0392b');
      rect(ctx, x + 10, y + 30, w - 20, 18, '#f1faee');
      break;
    default:
      if (SolidArt[s.style]) SolidArt[s.style](ctx, s);
  }
}

// ---- Cover: the crates, barrels, cars and rocks sitting on the ground ----
// Cover stops your shots, but every hit chips it. First come bullet holes. Then the top gets blown off a chunk
// at a time, so less and less of an enemy is hidden. At zero it bursts into rubble: shots fly straight through
// and enemies can walk past. Explosions wreck cover fast, and the .308 punches through it.
const COVER_HP = {
  jar: 18, trashbags: 18, hay: 21, cereal: 24, boxes: 24, cactus: 24,
  crate: 30, tk_crate: 30, hi_crate: 30, tk_cooler: 32, a51_crate: 34, stump: 34, am_stump: 34,
  barrel: 36, oz_drum: 36, an_drum: 36, an_iceblock: 36, tirestack: 40, a51_tank: 44, toaster: 48,
  eg_stone: 48, eg_pillar: 48, pt_boulder: 48, pt_block: 48, am_rock: 48, hi_boulder: 48, ro_stone: 48,
  dc_barrier: 52, oldcar: 56, dumpster: 56,
};
// Flames eat wood, paper and rubber fast and barely scorch stone, metal or ice.
const FLAMMABLE = new Set(['hay', 'trashbags', 'cereal', 'boxes', 'crate', 'tk_crate', 'hi_crate', 'a51_crate', 'stump', 'am_stump', 'tirestack']);
// How much of the height is left at each damage stage. Your shots fly 31px above the ground, so low cover
// (hay, 40px) stops them until its last stage, and tall cover until it breaks.
const COVER_STAGES = [1, 0.88, 0.75];
// Chips and splinters that fly off each kind of cover.
const COVER_BITS = {
  hay: ['#d9b44a', '#b8922c'], crate: ['#a87a45', '#6e4a22'], barrel: ['#8b4a2b', '#555'], stump: ['#6b4f3a', '#a68a64'],
  cactus: ['#2f9e44', '#237a35'], trashbags: ['#1f1f1f', '#444'], dumpster: ['#2b8a3e', '#237032', '#ccc'],
  oldcar: ['#a0522d', '#9fd3e6', '#ccc'], tirestack: ['#222', '#555'], toaster: ['#c9d1d6', '#fff'], cereal: ['#e63946', '#ffd166'],
  jar: ['#b47828', '#fff', '#c0392b'], boxes: ['#c9a46b', '#b8925a', '#8a6a3a'], tk_crate: ['#c9a46b', '#d9b67b', '#e63946'],
  tk_cooler: ['#1c7ed6', '#d0ebff', '#69db7c'], eg_stone: ['#d9b26a', '#b8863f'], eg_pillar: ['#e0b46a', '#c4924a'],
  pt_boulder: ['#a85240', '#c96f57'], pt_block: ['#d97a5f', '#c4614b'], am_stump: ['#6b4423', '#c9a46b'], am_rock: ['#6c757d', '#2f9e44'],
  oz_drum: ['#c92a2a', '#1c7ed6', '#2b8a3e'], an_iceblock: ['#a5d8ff', '#e7f5ff'], an_drum: ['#e8590c', '#c2410c'],
  hi_boulder: ['#6c757d', '#f8f9fa'], hi_crate: ['#4263eb', '#c9a46b'], ro_stone: ['#d9b38c', '#b08968'],
  a51_crate: ['#5c6b3a', '#3f4a27'], a51_tank: ['#868e96', '#2b8a3e', '#d8f5a2'], dc_barrier: ['#ced4da', '#fd7e14'],
};
const coverBits = s => COVER_BITS[s.style] || ['#adb5bd', '#868e96'];

function makeCover(x, w, h, style) {
  const hp = COVER_HP[style] || clamp(Math.round(w * h / 70), 20, 56);
  return { x, y: GROUND_Y - h, w, h, oneWay: false, style, cover: true, hp, maxHp: hp, h0: h, stage: 0, holes: [], hitAt: -99 };
}

// Damage cover s. kind is 'shot' (leaves a bullet hole where it hit), 'flame' or 'blast'.
function hitCover(s, dmg, hx, hy, kind = 'shot') {
  if (s.hp <= 0) return;
  if (kind === 'flame') dmg *= FLAMMABLE.has(s.style) ? 1.5 : 0.5;
  s.hp -= dmg; s.hitAt = G.t;
  if (kind === 'shot' && s.holes.length < 16) s.holes.push([hx - s.x, hy - (GROUND_Y - s.h0), rand(2, 3.4)]);
  if (!G.coverHint) { // the first time, tell the player cover can be shot to bits
    G.coverHint = true; floatText(s.x + s.w / 2, s.y - 16, 'SHOOT IT TO BITS!', '#ffd43b', 14, 90);
  }
  if (s.hp <= 0) { breakCover(s); return; }
  const stage = s.hp > s.maxHp * 2 / 3 ? 0 : s.hp > s.maxHp / 3 ? 1 : 2;
  if (stage > s.stage) { // a chunk of the top blows off
    const nh = Math.round(s.h0 * COVER_STAGES[stage]), oldY = s.y;
    s.stage = stage; s.y = GROUND_Y - nh; s.h = nh;
    particles(s.x + s.w / 2, (oldY + s.y) / 2, 16, coverBits(s), { speed: 4.5, sizeMul: 1.6, up: 2 });
    SFX.crunch(); shake(3);
  }
}

// Cover at zero: it bursts and leaves a little pile of rubble you can walk and shoot over.
function breakCover(s) {
  s.hp = 0; s.broken = true;
  G.solids = G.solids.filter(o => o !== s);
  const cx = s.x + s.w / 2, cy = GROUND_Y - s.h / 2, cols = coverBits(s);
  particles(cx, cy, 34, cols, { speed: 6.5, sizeMul: 2, grav: 0.35, up: 2 });
  particles(cx, cy, 14, ['#ced4da', '#adb5bd', '#f1f3f5'], { speed: 2.5, grav: -0.03, sizeMul: 2.6 });
  G.rubble.push({ x: s.x, w: s.w, cols });
  SFX.smash(); shake(6);
}

// Smoke curls off badly damaged cover.
function updateCover() {
  if (G.t % 9) return;
  for (const s of G.solids) {
    if (s.cover && s.stage === 2 && s.x + s.w > G.camX && s.x < G.camX + W) {
      particles(s.x + rand(6, s.w - 6), s.y + 2, 1, ['#adb5bd', '#ced4da'], { speed: 0.4, grav: -0.04, sizeMul: 1.6, lifeMul: 1.4 });
    }
  }
}

// Draw cover that's been hit: it jolts, shows its bullet holes, and the blown-off top is ragged.
function drawDamagedCover(ctx, s) {
  const top0 = GROUND_Y - s.h0, since = G.t - s.hitAt;
  ctx.save();
  if (since < 8) ctx.translate((since % 2 ? 1 : -1) * (8 - since) * 0.3, 0);
  let edge = null;
  if (s.stage > 0) { // clip off the missing top along a jagged line
    const n = Math.max(3, Math.round(s.w / 9));
    edge = [];
    for (let i = 0; i <= n; i++) edge.push(s.x + (i / n) * s.w, s.y + (i % 2 ? 2 + hash(s.x + i * 7 + s.stage) * 7 : 0));
    ctx.beginPath();
    ctx.moveTo(s.x - 12, GROUND_Y + 6); ctx.lineTo(s.x - 12, edge[1]);
    for (let i = 0; i < edge.length; i += 2) ctx.lineTo(edge[i], edge[i + 1]);
    ctx.lineTo(s.x + s.w + 12, edge[edge.length - 1]); ctx.lineTo(s.x + s.w + 12, GROUND_Y + 6);
    ctx.closePath(); ctx.clip();
  }
  drawSolid(ctx, { x: s.x, y: top0, w: s.w, h: s.h0, style: s.style });
  for (const [hx, hy, r] of s.holes) {
    circle(ctx, s.x + hx + 0.8, top0 + hy + 0.8, r + 1, 'rgba(255,255,255,0.22)');
    circle(ctx, s.x + hx, top0 + hy, r, 'rgba(25,15,10,0.85)');
  }
  if (s.stage === 2) { // scorch and cracks once it's badly hurt
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      const sx = s.x + s.w * (0.2 + 0.3 * i), sy = s.y + 4;
      line(ctx, sx, sy, sx + (hash(s.x + i) - 0.5) * 14, sy + s.h * 0.45, '#1a1210', 2);
    }
    ctx.globalAlpha = 1;
  }
  if (edge) {
    ctx.strokeStyle = 'rgba(20,12,8,0.6)'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i < edge.length; i += 2) ctx[i ? 'lineTo' : 'moveTo'](edge[i], edge[i + 1] + 1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRubble(ctx, r) {
  ellipse(ctx, r.x + r.w / 2, GROUND_Y + 1, r.w / 2 + 6, 5, 'rgba(0,0,0,0.25)');
  const n = Math.round(r.w / 6);
  for (let i = 0; i < n; i++) {
    const k = hash(r.x + i * 13), sz = 4 + hash(r.x + i * 5) * 7;
    rect(ctx, r.x + k * (r.w - sz), GROUND_Y - sz * (0.5 + hash(i + r.x) * 0.4), sz, sz * 0.8, r.cols[i % r.cols.length]);
  }
}

// Pickup icons (centered in their 34x30 box).
function drawPickup(ctx, pk) {
  const x = pk.x, y = pk.y + Math.sin(G.t * 0.08 + pk.bob) * 3, cx = x + pk.w / 2, cy = y + pk.h / 2;
  ctx.save();
  ctx.globalAlpha = 0.35 + Math.sin(G.t * 0.1) * 0.15;
  circle(ctx, cx, cy, 24, '#fff7b0');
  ctx.restore();
  switch (pk.type) {
    case 'rifle': case 'mg': case 'shotgun': case 'rocket': case 'flame': case 'br': case 'gl': case 'lmg': {
      const label = WEAPONS[pk.type].short;
      fillRR(ctx, x, y, pk.w, pk.h, 4, pk.type === 'flame' ? '#a61e4d' : pk.type === 'rocket' ? '#5c3d22' : '#556b2f');
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, pk.w - 2, pk.h - 2);
      text(ctx, label, cx, cy, { size: label.length <= 2 ? 14 : label.length <= 5 ? 9 : 7, color: '#ffe066' });
      break;
    }
    case 'ammo': // guns have infinite ammo now, so these boxes hold 2 grenades
      rect(ctx, x + 2, y + 10, pk.w - 4, pk.h - 10, '#3c4a2a');
      for (let i = 0; i < 2; i++) { circle(ctx, x + 11 + i * 12, y + 9, 6, '#3e6b2f'); rect(ctx, x + 9 + i * 12, y, 4, 4, '#888'); }
      text(ctx, 'x2', cx, cy + 8, { size: 9, color: '#fff' });
      break;
    case 'nade':
      for (let i = 0; i < 3; i++) {
        circle(ctx, x + 8 + i * 9, cy + 4, 7, '#3e6b2f');
        rect(ctx, x + 6 + i * 9, cy - 6, 4, 5, '#888');
      }
      break;
    case 'pie':
      ctx.fillStyle = '#c47a2c'; ctx.beginPath(); ctx.arc(cx, cy + 4, 16, Math.PI, 0); ctx.fill();
      rect(ctx, cx - 17, cy + 4, 34, 6, '#a35f1d');
      for (let i = -2; i <= 2; i++) line(ctx, cx + i * 6, cy - 8, cx + i * 6, cy + 4, '#e8a85a', 2);
      heart(ctx, cx, cy - 20, 10, '#ff4d6d');
      break;
  }
}
