'use strict';
// Scenery and platform art for the Bayou, Route 66 and Back Alley levels.

Object.assign(Props, {
  // ---- Bayou ----
  cypress(ctx, x, s = 1) {
    const y = GROUND_Y;
    poly(ctx, [x - 34 * s, y, x - 12 * s, y - 60 * s, x - 9 * s, y - 250 * s, x + 9 * s, y - 250 * s, x + 12 * s, y - 60 * s, x + 34 * s, y], '#4a3b2c');
    for (const [dx, dy, rx] of [[-40, -255, 60], [30, -270, 55], [0, -290, 50]]) ellipse(ctx, x + dx * s, y + dy * s, rx * s, 18 * s, '#3d5a3a');
    ctx.strokeStyle = '#9aa58a'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const mx = x + (-80 + i * 20) * s, top = y - 250 * s, len = (30 + hash(i + x) * 50) * s;
      ctx.beginPath(); ctx.moveTo(mx, top);
      ctx.quadraticCurveTo(mx + Math.sin(G.t * 0.02 + i) * 4, top + len / 2, mx + Math.sin(G.t * 0.02 + i + 1) * 6, top + len);
      ctx.stroke();
    }
  },
  reeds(ctx, x) {
    const y = GROUND_Y;
    for (let i = 0; i < 6; i++) {
      const rx = x + i * 7, h = 40 + hash(i + x) * 30, sway = Math.sin(G.t * 0.03 + i) * 3;
      line(ctx, rx, y, rx + sway, y - h, '#5c7a2e', 2);
      if (i % 2 === 0) ellipse(ctx, rx + sway, y - h + 6, 3, 8, '#6b4423');
    }
  },
  canoe(ctx, x) {
    const y = GROUND_Y;
    ctx.fillStyle = '#9c3d1e'; ctx.beginPath(); ctx.ellipse(x, y - 8, 60, 14, 0, 0, Math.PI); ctx.fill();
    rect(ctx, x - 58, y - 10, 116, 4, '#c2552d');
    line(ctx, x + 10, y - 10, x + 50, y - 40, '#8b6f47', 3);
    ellipse(ctx, x + 52, y - 42, 6, 10, '#8b6f47', 0.8);
  },
  crawpot(ctx, x) {
    const y = GROUND_Y;
    rect(ctx, x, y - 30, 40, 30, 'rgba(120,120,120,0.35)');
    ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
    for (let i = 0; i <= 40; i += 8) { ctx.beginPath(); ctx.moveTo(x + i, y - 30); ctx.lineTo(x + i, y); ctx.stroke(); }
    for (let j = 0; j <= 30; j += 8) { ctx.beginPath(); ctx.moveTo(x, y - 30 + j); ctx.lineTo(x + 40, y - 30 + j); ctx.stroke(); }
  },
  // ---- Route 66 ----
  cactusd(ctx, x, s = 1) {
    const y = GROUND_Y;
    fillRR(ctx, x - 9 * s, y - 110 * s, 18 * s, 110 * s, 9 * s, '#2f9e44');
    fillRR(ctx, x - 30 * s, y - 84 * s, 12 * s, 40 * s, 6 * s, '#2f9e44'); rect(ctx, x - 30 * s, y - 52 * s, 24 * s, 10 * s, '#2f9e44');
    fillRR(ctx, x + 18 * s, y - 96 * s, 12 * s, 36 * s, 6 * s, '#2f9e44'); rect(ctx, x + 6 * s, y - 68 * s, 24 * s, 10 * s, '#2f9e44');
    for (const dx of [-4, 0, 4]) line(ctx, x + dx * s, y - 104 * s, x + dx * s, y - 4, '#237a35', 1);
  },
  skull(ctx, x) {
    const y = GROUND_Y;
    ellipse(ctx, x, y - 8, 12, 9, '#f8f9fa'); rect(ctx, x - 5, y - 4, 10, 6, '#f8f9fa');
    ctx.strokeStyle = '#f1f3f5'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 10, y - 12); ctx.quadraticCurveTo(x - 24, y - 16, x - 22, y - 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 10, y - 12); ctx.quadraticCurveTo(x + 24, y - 16, x + 22, y - 28); ctx.stroke();
    circle(ctx, x - 5, y - 9, 2.5, '#333'); circle(ctx, x + 5, y - 9, 2.5, '#333');
  },
  sign66(ctx, x) {
    const y = GROUND_Y;
    rect(ctx, x - 3, y - 90, 6, 90, '#777');
    poly(ctx, [x - 26, y - 132, x + 26, y - 132, x + 24, y - 104, x, y - 86, x - 24, y - 104], '#fff');
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, 'US ROUTE', x, y - 122, { size: 7, color: '#111', font: FONT2, weight: 800 });
    text(ctx, '66', x, y - 104, { size: 20, color: '#111' });
  },
  pump(ctx, x) {
    const y = GROUND_Y;
    fillRR(ctx, x - 14, y - 72, 28, 72, 6, '#e03131');
    rect(ctx, x - 9, y - 62, 18, 14, '#fff8e1');
    circle(ctx, x, y - 80, 9, '#fff'); circle(ctx, x, y - 80, 6, '#e03131');
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 14, y - 40); ctx.quadraticCurveTo(x + 30, y - 20, x + 20, y - 52); ctx.stroke();
  },
  // ---- Back Alley ----
  trashbag(ctx, x) {
    const y = GROUND_Y;
    ellipse(ctx, x, y - 18, 22, 18, '#1f1f1f');
    poly(ctx, [x - 5, y - 34, x + 5, y - 34, x + 8, y - 44, x - 8, y - 44], '#1f1f1f');
    ellipse(ctx, x - 8, y - 24, 5, 8, 'rgba(255,255,255,0.15)', 0.4);
  },
  cans(ctx, x) {
    const y = GROUND_Y;
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(x + i * 16, y - 5); ctx.rotate(i === 1 ? 0 : Math.PI / 2);
      rect(ctx, -5, -8, 10, 16, ['#e63946', '#2b8a3e', '#1c7ed6'][i]);
      ctx.restore();
    }
  },
  boombox(ctx, x) {
    const y = GROUND_Y;
    fillRR(ctx, x - 30, y - 34, 60, 34, 6, '#343a40');
    circle(ctx, x - 16, y - 16, 10, '#111'); circle(ctx, x + 16, y - 16, 10, '#111');
    circle(ctx, x - 16, y - 16, 4, '#555'); circle(ctx, x + 16, y - 16, 4, '#555');
    rect(ctx, x - 6, y - 28, 12, 8, '#74c0fc');
    line(ctx, x - 20, y - 34, x - 16, y - 46, '#999', 3); line(ctx, x + 20, y - 34, x + 16, y - 46, '#999', 3); line(ctx, x - 16, y - 46, x + 16, y - 46, '#999', 3);
    const k = (G.t % 60) / 60;
    ctx.globalAlpha = 1 - k;
    text(ctx, '♪', x + 24 + k * 10, y - 50 - k * 30, { size: 16, color: '#ffd43b', font: FONT2 });
    ctx.globalAlpha = 1;
  },
});

Object.assign(SolidArt, {
  dock(ctx, s) {
    const posts = [s.x + 10, s.x + s.w - 18];
    if (s.w > 150) posts.push(s.x + s.w / 2 - 4);
    for (const px of posts) rect(ctx, px, s.y + 10, 8, GROUND_Y - s.y - 10, '#5b4a36');
    rect(ctx, s.x, s.y, s.w, 14, '#8b6f47');
    for (let i = s.x + 20; i < s.x + s.w; i += 20) line(ctx, i, s.y + 1, i, s.y + 13, '#6b5537', 1.5);
  },
  stilts(ctx, s) {
    const bodyB = s.y + 90;
    for (const px of [s.x + 14, s.x + s.w / 2 - 4, s.x + s.w - 22]) rect(ctx, px, bodyB, 8, GROUND_Y - bodyB, '#5b4a36');
    rect(ctx, s.x + 6, s.y + 12, s.w - 12, 78, '#7c6a4f');
    for (let i = s.x + 18; i < s.x + s.w - 10; i += 16) line(ctx, i, s.y + 14, i, bodyB, '#6a5a41', 2);
    rect(ctx, s.x + 24, s.y + 30, 36, 26, '#f5c86a'); line(ctx, s.x + 42, s.y + 30, s.x + 42, s.y + 56, '#4a2f1b', 3);
    rect(ctx, s.x + s.w - 64, s.y + 30, 30, 60, '#4a2f1b');
    rect(ctx, s.x - 8, s.y, s.w + 16, 14, '#868e96');
    for (let i = s.x - 8; i < s.x + s.w + 8; i += 10) line(ctx, i, s.y, i, s.y + 14, '#6c757d', 1);
  },
  mesa(ctx, s) {
    poly(ctx, [s.x + 6, s.y, s.x + s.w - 6, s.y, s.x + s.w + 14, GROUND_Y, s.x - 14, GROUND_Y], '#c2703d');
    for (let yy = s.y + 26; yy < GROUND_Y; yy += 24) line(ctx, s.x - 4, yy, s.x + s.w + 4, yy + 3, '#a85a2c', 3);
    rect(ctx, s.x, s.y, s.w, 12, '#d9895b');
  },
  billboard(ctx, s) {
    for (const px of [s.x + 20, s.x + s.w - 30]) rect(ctx, px, s.y + 70, 10, GROUND_Y - s.y - 70, '#6b4f3a');
    rect(ctx, s.x, s.y, s.w, 70, '#f8f0dc');
    ctx.strokeStyle = '#6b4f3a'; ctx.lineWidth = 4; ctx.strokeRect(s.x + 2, s.y + 2, s.w - 4, 66);
    text(ctx, "EAT AT BOB'S", s.x + s.w / 2, s.y + 26, { size: 18, color: '#c92a2a' });
    text(ctx, 'all-u-can-slurp syrup', s.x + s.w / 2, s.y + 50, { size: 12, color: '#6b4f3a', font: FONT2, weight: 800 });
    rect(ctx, s.x, s.y, s.w, 6, '#6b4f3a');
  },
  gasroof(ctx, s) {
    for (const px of [s.x + 20, s.x + s.w - 32]) rect(ctx, px, s.y + 22, 12, GROUND_Y - s.y - 22, '#dee2e6');
    rect(ctx, s.x - 10, s.y, s.w + 20, 22, '#f8f9fa');
    rect(ctx, s.x - 10, s.y + 10, s.w + 20, 6, '#e03131');
    text(ctx, "BOB'S GAS", s.x + s.w / 2, s.y + 32, { size: 11, color: '#e03131' });
  },
  fireescape(ctx, s) {
    rect(ctx, s.x + s.w - 26, s.y + 8, 4, 90, '#495057'); rect(ctx, s.x + s.w - 10, s.y + 8, 4, 90, '#495057');
    for (let yy = s.y + 18; yy < s.y + 98; yy += 14) rect(ctx, s.x + s.w - 26, yy, 20, 3, '#495057');
    rect(ctx, s.x, s.y - 28, s.w, 4, '#495057');
    for (let i = s.x; i <= s.x + s.w; i += 14) rect(ctx, i, s.y - 28, 3, 28, '#495057');
    rect(ctx, s.x, s.y, s.w, 9, '#343a40');
    for (let i = s.x + 4; i < s.x + s.w; i += 8) rect(ctx, i, s.y + 2, 4, 5, '#5c636a');
  },
  stump(ctx, s) {
    rect(ctx, s.x, s.y + 6, s.w, s.h - 6, '#6b4f3a');
    ellipse(ctx, s.x + s.w / 2, s.y + 6, s.w / 2, 7, '#a68a64');
    ellipse(ctx, s.x + s.w / 2, s.y + 6, s.w / 4, 3.5, '#8b6f47');
  },
  cactus(ctx, s) {
    const cx = s.x + s.w / 2;
    fillRR(ctx, cx - 12, s.y, 24, s.h, 10, '#2f9e44');
    fillRR(ctx, s.x, s.y + 14, 10, 26, 5, '#2f9e44'); rect(ctx, s.x, s.y + 34, 20, 8, '#2f9e44');
    fillRR(ctx, s.x + s.w - 10, s.y + 8, 10, 24, 5, '#2f9e44'); rect(ctx, s.x + s.w - 20, s.y + 26, 20, 8, '#2f9e44');
    for (const dx of [-5, 0, 5]) line(ctx, cx + dx, s.y + 6, cx + dx, s.y + s.h - 2, '#237a35', 1);
  },
  oldcar(ctx, s) {
    fillRR(ctx, s.x, s.y + 18, s.w, s.h - 28, 10, '#a0522d');
    fillRR(ctx, s.x + 26, s.y, s.w - 60, 24, 8, '#a0522d');
    rect(ctx, s.x + 32, s.y + 5, s.w - 72, 14, '#9fd3e6');
    for (let i = 0; i < 5; i++) circle(ctx, s.x + 14 + hash(i + s.x) * (s.w - 28), s.y + 26 + hash(i * 3) * 14, 4, '#6e2f1c');
    for (const wx of [s.x + 24, s.x + s.w - 24]) { ellipse(ctx, wx, s.y + s.h - 6, 14, 9, '#222'); circle(ctx, wx, s.y + s.h - 7, 4, '#777'); }
  },
  tirestack(ctx, s) {
    for (let yy = s.y + s.h - 6; yy > s.y; yy -= 12) { ellipse(ctx, s.x + s.w / 2, yy, s.w / 2, 8, '#222'); ellipse(ctx, s.x + s.w / 2, yy - 2, s.w / 4, 3, '#444'); }
  },
  dumpster(ctx, s) {
    rect(ctx, s.x, s.y + 8, s.w, s.h - 14, '#2b8a3e');
    rect(ctx, s.x - 4, s.y, s.w + 8, 10, '#237032');
    for (let i = s.x + 12; i < s.x + s.w - 6; i += 22) line(ctx, i, s.y + 12, i, s.y + s.h - 10, '#237032', 3);
    text(ctx, 'BOB WUZ HERE', s.x + s.w / 2, s.y + 34, { size: 10, color: '#ff8fab' });
    for (const wx of [s.x + 12, s.x + s.w - 12]) circle(ctx, wx, s.y + s.h - 4, 5, '#222');
  },
  trashbags(ctx, s) {
    for (const [dx, r] of [[12, 16], [s.w - 14, 15], [s.w / 2, 18]]) {
      ellipse(ctx, s.x + dx, s.y + s.h - r, r + 2, r, '#1f1f1f');
      ellipse(ctx, s.x + dx - 5, s.y + s.h - r - 5, 4, 6, 'rgba(255,255,255,0.15)', 0.4);
    }
  },
});
