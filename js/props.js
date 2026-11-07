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
