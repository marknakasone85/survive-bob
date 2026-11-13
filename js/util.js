'use strict';
// Shared constants, helpers, physics and world state for SURVIVE BOB.

const W = 960, H = 540;
const GROUND_Y = 468;
const GRAV = 0.6;
const FONT = "'Bungee', 'Arial Black', Impact, sans-serif";
const FONT2 = "'Rubik', 'Trebuchet MS', Arial, sans-serif";

const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
// Stable pseudo-random 0..1 for a number (used so scenery doesn't flicker).
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function circleHitsRect(cx, cy, r, b) {
  const nx = clamp(cx, b.x, b.x + b.w), ny = clamp(cy, b.y, b.y + b.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

// ---- World state ---------------------------------------------------------
const G = {
  state: 'title', stateT: 0, t: 0,
  levelIndex: 0, level: null, heroIndex: 0,
  camX: 0, shake: 0, score: 0, startTime: 0,
  player: null, boss: null, arenaLocked: false,
  solids: [], rubble: [], bullets: [], ebullets: [], grenades: [], enemies: [],
  particles: [], texts: [], explosions: [], pickups: [], puddles: [],
  banner: null,
};

function setState(s) { G.state = s; G.stateT = 0; }

// ---- Drawing helpers -----------------------------------------------------
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, c) { ctx.fillStyle = c; rr(ctx, x, y, w, h, r); ctx.fill(); }
function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function circle(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function ellipse(ctx, x, y, rx, ry, c, rot = 0) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); ctx.fill();
}
function line(ctx, x1, y1, x2, y2, c, w = 2) {
  ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function poly(ctx, pts, c) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath(); ctx.fill();
}
function text(ctx, str, x, y, o = {}) {
  const size = o.size || 24;
  ctx.font = `${o.weight || ''} ${size}px ${o.font || FONT}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  if (o.stroke) {
    ctx.lineJoin = 'round'; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.sw || Math.max(3, size / 6);
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = o.color || '#fff';
  ctx.fillText(str, x, y);
}
function heart(ctx, x, y, s, c) {
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.65, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.65, x + s * 0.5, y + s * 0.35);
  ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.35);
  ctx.fill();
}

// ---- Effects -------------------------------------------------------------
function particles(x, y, n, color, o = {}) {
  const sp = o.speed || 4;
  for (let i = 0; i < n; i++) {
    const life = rand(20, 40) * (o.lifeMul || 1);
    G.particles.push({
      x, y, vx: rand(-1, 1) * sp, vy: rand(-1, 0.4) * sp - (o.up || 0),
      life, max: life, color: Array.isArray(color) ? pick(color) : color,
      size: rand(2, 5) * (o.sizeMul || 1), grav: o.grav ?? 0.25,
    });
  }
}
function floatText(x, y, str, color = '#fff', size = 18, life = 50) {
  G.texts.push({ x, y, str, color, size, life, max: life });
}
function shake(n) { G.shake = Math.max(G.shake, n); }

// ---- Physics -------------------------------------------------------------
// Moves an actor {x,y,w,h,vx,vy} through G.solids. One-way platforms can be
// stood on from above; pass drop=true to fall through them.
function moveActor(a, drop = false, gravity = GRAV) {
  a.hitWall = 0;
  a.x += a.vx;
  for (const s of G.solids) {
    if (s.oneWay || !overlap(a, s)) continue;
    if (a.vx > 0) { a.x = s.x - a.w; a.hitWall = 1; }
    else if (a.vx < 0) { a.x = s.x + s.w; a.hitWall = -1; }
  }
  const prevBottom = a.y + a.h;
  a.vy = Math.min(a.vy + gravity, 15);
  a.y += a.vy;
  a.onGround = false;
  a.standOn = null;
  for (const s of G.solids) {
    if (!overlap(a, s)) continue;
    if (s.oneWay) {
      if (a.vy >= 0 && prevBottom <= s.y + 0.5 && !drop) {
        a.y = s.y - a.h; a.vy = 0; a.onGround = true; a.standOn = s;
      }
    } else if (a.vy >= 0) {
      a.y = s.y - a.h; a.vy = 0; a.onGround = true; a.standOn = s;
    } else {
      a.y = s.y + s.h; a.vy = 0;
    }
  }
}
