'use strict';
// Four more stops on Bob's trail: Junkyard, County Fair, Mud Bog, Flea Market.

Object.assign(Props, {
  junkpile(ctx, x) {
    const y = GROUND_Y;
    poly(ctx, [x - 90, y, x - 50, y - 70, x - 10, y - 95, x + 40, y - 80, x + 90, y], '#5f5a55');
    for (let i = 0; i < 9; i++) {
      const px = x - 70 + hash(x + i) * 140, py = y - 10 - hash(i * 7 + x) * 70;
      rect(ctx, px, py, 14 + hash(i) * 16, 8, ['#a0522d', '#868e96', '#3a6ea5', '#c92a2a'][i % 4]);
    }
    circle(ctx, x + 30, y - 30, 12, '#222'); circle(ctx, x + 30, y - 30, 5, '#666');
  },
  toilet(ctx, x) {
    const y = GROUND_Y;
    fillRR(ctx, x - 12, y - 52, 24, 20, 4, '#e9ecef'); ellipse(ctx, x + 4, y - 24, 16, 8, '#f8f9fa');
    rect(ctx, x - 4, y - 24, 12, 24, '#dee2e6');
  },
  fridgeold(ctx, x) {
    const y = GROUND_Y;
    fillRR(ctx, x, y - 90, 44, 90, 8, '#d8e2dc'); rect(ctx, x, y - 58, 44, 3, '#adb5bd');
    rect(ctx, x + 36, y - 82, 4, 16, '#868e96'); circle(ctx, x + 12, y - 40, 5, '#a0522d');
  },
  tv(ctx, x) {
    const y = GROUND_Y;
    fillRR(ctx, x, y - 46, 56, 42, 6, '#6b4f3a'); rect(ctx, x + 6, y - 40, 36, 30, '#495057');
    rect(ctx, x + 10, y - 36, 12, 6, 'rgba(255,255,255,0.15)'); circle(ctx, x + 49, y - 30, 3, '#ced4da');
    line(ctx, x + 20, y - 46, x + 10, y - 62, '#868e96', 2); line(ctx, x + 30, y - 46, x + 42, y - 62, '#868e96', 2);
    rect(ctx, x + 8, y - 4, 6, 4, '#3b2a1a'); rect(ctx, x + 42, y - 4, 6, 4, '#3b2a1a');
  },
  cornstand(ctx, x) {
    const y = GROUND_Y;
    rect(ctx, x, y - 60, 110, 60, '#f8f0dc');
    for (let i = 0; i < 6; i++) poly(ctx, [x - 6 + i * 20, y - 60, x + 14 + i * 20, y - 60, x + 4 + i * 20, y - 76], i % 2 ? '#fff' : '#e03131');
    rect(ctx, x - 6, y - 82, 122, 8, '#e03131');
    text(ctx, 'CORN DOGS', x + 55, y - 40, { size: 13, color: '#c92a2a' });
    ellipse(ctx, x + 55, y - 18, 16, 6, '#d9a441'); rect(ctx, x + 30, y - 19, 10, 2, '#e9d8a6');
  },
  teddy(ctx, x) {
    const y = GROUND_Y;
    circle(ctx, x, y - 24, 20, '#c0841a'); circle(ctx, x, y - 54, 15, '#c0841a');
    circle(ctx, x - 12, y - 66, 6, '#c0841a'); circle(ctx, x + 12, y - 66, 6, '#c0841a');
    ellipse(ctx, x, y - 50, 7, 5, '#e9c46a'); circle(ctx, x - 5, y - 57, 2, '#111'); circle(ctx, x + 5, y - 57, 2, '#111');
    poly(ctx, [x - 8, y - 40, x + 8, y - 40, x, y - 34], '#e64980');
  },
  pigpen(ctx, x) {
    const y = GROUND_Y;
    for (let i = 0; i <= 4; i++) rect(ctx, x + i * 40, y - 44, 6, 44, '#8b6f47');
    rect(ctx, x, y - 38, 166, 5, '#a68a64'); rect(ctx, x, y - 20, 166, 5, '#a68a64');
    ellipse(ctx, x + 80, y - 4, 70, 6, '#6f4e37');
  },
  balloons(ctx, x) {
    const y = GROUND_Y;
    rect(ctx, x - 2, y - 40, 4, 40, '#868e96');
    ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#da77f2'].forEach((col, i) => {
      const bx = x - 24 + i * 12, byy = y - 90 - (i % 2) * 14 + Math.sin(G.t * 0.04 + i) * 3;
      line(ctx, x, y - 40, bx, byy + 10, '#ddd', 1); ellipse(ctx, bx, byy, 9, 11, col);
    });
  },
  flag(ctx, x) {
    const y = GROUND_Y, wave = Math.sin(G.t * 0.1) * 4;
    rect(ctx, x, y - 130, 4, 130, '#adb5bd');
    poly(ctx, [x + 4, y - 128, x + 60, y - 120 + wave, x + 4, y - 100], '#e03131');
    poly(ctx, [x + 4, y - 114, x + 50, y - 110 + wave, x + 4, y - 100], '#ffd43b');
  },
  portapotty(ctx, x) {
    const y = GROUND_Y;
    fillRR(ctx, x, y - 100, 50, 100, 6, '#1c7ed6'); fillRR(ctx, x - 3, y - 106, 56, 10, 4, '#1864ab');
    rect(ctx, x + 6, y - 90, 38, 84, '#228be6'); rect(ctx, x + 36, y - 52, 5, 10, '#e9ecef');
    text(ctx, 'BOB', x + 25, y - 76, { size: 10, color: '#fff' });
  },
  couch(ctx, x) {
    const y = GROUND_Y;
    fillRR(ctx, x, y - 50, 130, 30, 8, '#8f5e3b'); fillRR(ctx, x - 6, y - 36, 142, 28, 8, '#a06a45');
    rect(ctx, x + 50, y - 34, 3, 22, '#7a4b2b'); circle(ctx, x + 90, y - 26, 6, '#e9c46a');
    rect(ctx, x + 6, y - 8, 8, 8, '#3b2a1a'); rect(ctx, x + 116, y - 8, 8, 8, '#3b2a1a');
  },
  lamp(ctx, x) {
    const y = GROUND_Y;
    rect(ctx, x - 2, y - 100, 4, 96, '#495057'); ellipse(ctx, x, y - 3, 14, 4, '#495057');
    poly(ctx, [x - 18, y - 96, x + 18, y - 96, x + 11, y - 124, x - 11, y - 124], '#ffe8a3');
  },
});

Object.assign(SolidArt, {
  carpile(ctx, s) {
    const cols = ['#a0522d', '#3a6ea5', '#868e96', '#2b8a3e'];
    for (let yy = s.y, i = 0; yy < GROUND_Y - 4; yy += 30, i++) {
      const inset = (i % 2) * 8, h = Math.min(28, GROUND_Y - yy);
      fillRR(ctx, s.x + inset, yy, s.w - inset * 2, h, 5, cols[(i + Math.floor(s.x / 100)) % 4]);
      rect(ctx, s.x + inset + 10, yy + 6, 24, 8, '#9fd3e6');
      circle(ctx, s.x + s.w - inset - 18, yy + h - 4, 6, '#222');
    }
    rect(ctx, s.x, s.y, s.w, 5, '#495057');
  },
  container(ctx, s) {
    const col = ['#c92a2a', '#1c7ed6', '#2b8a3e'][Math.floor(s.x / 300) % 3];
    rect(ctx, s.x, s.y, s.w, GROUND_Y - s.y, col);
    for (let i = s.x + 10; i < s.x + s.w; i += 12) rect(ctx, i, s.y + 6, 4, GROUND_Y - s.y - 12, 'rgba(0,0,0,0.18)');
    rect(ctx, s.x, s.y, s.w, 6, 'rgba(255,255,255,0.25)');
    text(ctx, 'BOB SHIPPING CO', s.x + s.w / 2, s.y + 40, { size: 11, color: 'rgba(255,255,255,0.7)' });
  },
  booth(ctx, s) {
    rect(ctx, s.x + 8, s.y + 14, s.w - 16, GROUND_Y - s.y - 14, '#f8f0dc');
    rect(ctx, s.x + 18, s.y + 34, s.w - 36, 40, '#2b1b4a');
    for (let i = 0; i < 4; i++) circle(ctx, s.x + 40 + i * ((s.w - 80) / 3), s.y + 54, 8, ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c'][i]);
    rect(ctx, s.x + 8, s.y + 90, s.w - 16, 8, '#e03131');
    for (let i = 0; i < s.w; i += 20) rect(ctx, s.x + i, s.y, 10, 14, i % 40 ? '#fff' : '#e03131');
    text(ctx, 'WIN A PRIZE', s.x + s.w / 2, s.y + 24, { size: 11, color: '#c92a2a' });
  },
  stage(ctx, s) {
    rect(ctx, s.x, s.y, s.w, GROUND_Y - s.y, '#6b4f3a');
    for (let i = s.x; i < s.x + s.w; i += 24) line(ctx, i, s.y + 14, i, GROUND_Y, '#5b4030', 2);
    rect(ctx, s.x - 4, s.y, s.w + 8, 14, '#8b6f47');
    for (let i = 0; i < 5; i++) poly(ctx, [s.x + i * s.w / 5, s.y + 14, s.x + (i + 1) * s.w / 5, s.y + 14, s.x + (i + 0.5) * s.w / 5, s.y + 34], i % 2 ? '#1c7ed6' : '#e03131');
  },
  monster(ctx, s) {
    // A monster truck you can stand on top of.
    const wy = GROUND_Y - 30;
    for (const wx of [s.x + 36, s.x + s.w - 36]) { circle(ctx, wx, wy, 30, '#1b1b1b'); circle(ctx, wx, wy, 14, '#868e96'); for (let a = 0; a < 8; a++) rect(ctx, wx + Math.cos(a) * 26 - 3, wy + Math.sin(a) * 26 - 3, 6, 6, '#333'); }
    rect(ctx, s.x + 30, wy - 40, s.w - 60, 14, '#495057');
    fillRR(ctx, s.x, s.y, s.w, wy - 40 - s.y + 4, 10, '#e8590c');
    fillRR(ctx, s.x + s.w * 0.45, s.y - 0, s.w * 0.4, 30, 8, '#d9480f');
    rect(ctx, s.x + s.w * 0.5, s.y + 6, s.w * 0.28, 16, '#9fd3e6');
    text(ctx, 'BIG BOB', s.x + s.w * 0.25, s.y + 30, { size: 14, color: '#fff', stroke: '#000', sw: 3 });
  },
  bleach(ctx, s) {
    for (let i = 0; i < 4; i++) rect(ctx, s.x + i * 10, s.y + i * 26, s.w - i * 20, 8, '#adb5bd');
    for (const px of [s.x + 10, s.x + s.w - 16]) rect(ctx, px, s.y + 8, 6, GROUND_Y - s.y - 8, '#868e96');
    line(ctx, s.x + 10, GROUND_Y, s.x + s.w - 10, s.y + 10, '#868e96', 3);
  },
  table(ctx, s) {
    for (const px of [s.x + 8, s.x + s.w - 14]) line(ctx, px, s.y + 8, px + (px < s.x + 20 ? 10 : -10), GROUND_Y, '#495057', 3);
    rect(ctx, s.x, s.y, s.w, 8, '#e9ecef'); rect(ctx, s.x, s.y + 8, s.w, 3, '#adb5bd');
    // junk for sale (drawn hanging under the tabletop so it doesn't get in the way)
    rect(ctx, s.x + 14, s.y + 14, 20, 14, '#e64980'); circle(ctx, s.x + s.w - 30, s.y + 22, 8, '#1c1c3a');
    text(ctx, '$1', s.x + s.w / 2, s.y + 24, { size: 12, color: '#2b8a3e' });
  },
  canopy(ctx, s) {
    for (const px of [s.x + 6, s.x + s.w - 10]) rect(ctx, px, s.y + 12, 4, GROUND_Y - s.y - 12, '#adb5bd');
    const col = ['#1c7ed6', '#e03131', '#2b8a3e', '#f08c00'][Math.floor(s.x / 400) % 4];
    rect(ctx, s.x - 6, s.y, s.w + 12, 12, col);
    for (let i = 0; i < s.w + 12; i += 24) poly(ctx, [s.x - 6 + i, s.y + 12, s.x + 18 + i, s.y + 12, s.x + 6 + i, s.y + 22], col);
  },
  boxes(ctx, s) {
    rect(ctx, s.x, s.y + s.h * 0.45, s.w, s.h * 0.55, '#c9a46b'); rect(ctx, s.x + 8, s.y, s.w - 16, s.h * 0.45, '#b8925a');
    line(ctx, s.x, s.y + s.h * 0.72, s.x + s.w, s.y + s.h * 0.72, '#8a6a3a', 2); line(ctx, s.x + s.w / 2, s.y, s.x + s.w / 2, s.y + s.h * 0.45, '#8a6a3a', 2);
  },
});

function fence(ctx, camX, par, top, color) {
  ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = color; ctx.lineWidth = 1;
  const off = (camX * par) % 16;
  for (let x = -off - 120; x < W + 120; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 88, GROUND_Y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 88, top); ctx.lineTo(x, GROUND_Y); ctx.stroke();
  }
  ctx.restore();
  repeatX(camX, par, 140, (sx) => rect(ctx, sx, top - 10, 5, GROUND_Y - top + 10, '#868e96'));
  rect(ctx, 0, top - 4, W, 3, '#868e96');
}

const JUNKYARD = {
  name: 'JUNKYARD JUNCTION', sub: 'Bob sleeps in a crushed station wagon out here.',
  length: 5200, music: 'junkyard', goonThrow: 'hubcap', goonCap: '#868e96',
  bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain'], bobFood: ['hubcap', 'trash', 'chicken'], bobSpeed: 1.22,
  platforms: [[480, 360, 170, 'carpile'], [800, 320, 150, 'carpile'], [1150, 350, 260, 'container'], [1650, 370, 160, 'carpile'],
    [1900, 310, 150, 'carpile'], [2250, 350, 280, 'container'], [2750, 365, 170, 'carpile'], [3050, 315, 150, 'carpile'],
    [3450, 350, 260, 'container'], [4400, 360, 140, 'plank'], [4860, 330, 140, 'plank']],
  blocks: [[1000, 50, 48, 'tirestack'], [2600, 120, 56, 'oldcar'], [3300, 40, 56, 'barrel'], [3950, 46, 46, 'crate']],
  props: [['junkpile', 250], ['sign', 700, 'KEEP OUT'], ['toilet', 1500], ['fridgeold', 1570], ['junkpile', 2100], ['tv', 2180],
    ['tire', 2950], ['junkpile', 3800], ['toilet', 4040], ['bobsign', 4290]],
  spawns: [[600, 'raccoon', 2], [850, 'rat', 3], [1100, 'goon', 1], [1350, 'snake', 2], [1600, 'fly', 3], [1850, 'raccoon', 2],
    [2100, 'hog', 1], [2400, 'bowler', 1], [2700, 'rat', 3], [2950, 'snake', 2], [3200, 'goon', 2], [3500, 'raccoon', 3],
    [3750, 'hog', 1], [4000, 'bowler', 1]],
  pickups: [[500, 'ammo'], [1300, 'pie'], [1700, 'nade'], [2300, 'pie'], [2900, 'ammo'], [3350, 'pie'], [3900, 'nade'], [4100, 'pie']],
  drawBg(ctx, camX) {
    sky(ctx, ['#4a3f5c', '#a35c7a', '#f28c6f']);
    circle(ctx, 700 - camX * 0.02, 140, 40, 'rgba(255,220,180,0.5)');
    ridge(ctx, camX, 0.08, 330, 40, 0.02, '#4a3f4f', 3);
    repeatX(camX, 0.2, 1600, (sx) => {
      const tx = sx + 900;
      rect(ctx, tx, 120, 14, 300, '#2f2a33'); rect(ctx, tx - 160, 120, 260, 12, '#2f2a33');
      line(ctx, tx - 140, 132, tx - 140, 210, '#2f2a33', 2); ellipse(ctx, tx - 140, 222, 26, 10, '#2f2a33');
      fillRR(ctx, tx - 175, 232, 70, 26, 6, '#3a3240');
    });
    ridge(ctx, camX, 0.3, 410, 30, 0.03, '#3a3240', 1);
    fence(ctx, camX, 0.7, 360, '#adb5bd');
  },
  drawGround(ctx, x0, x1) {
    rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#5e5248');
    rect(ctx, x0, GROUND_Y, x1 - x0, 5, '#74675b');
    for (let i = Math.floor(x0 / 90); i < x1 / 90 + 1; i++) {
      const bx = i * 90 + hash(i) * 40;
      if (hash(i + 2) > 0.6) { ellipse(ctx, bx, GROUND_Y + 22, 30, 6, '#2b2b33'); ellipse(ctx, bx - 6, GROUND_Y + 21, 12, 2, 'rgba(180,120,255,0.35)'); }
      if (hash(i + 5) > 0.5) rect(ctx, bx + 30, GROUND_Y + 8, 10, 4, '#868e96');
    }
  },
};

const FAIR = {
  name: 'COUNTY FAIR', sub: 'Bob ate every corn dog. Now he wants yours.',
  length: 5200, music: 'fair', goonThrow: 'corndog', goonCap: '#e64980',
  bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain'], bobFood: ['corndog', 'egg', 'chicken'], bobSpeed: 1.25,
  platforms: [[450, 360, 180, 'booth'], [800, 330, 140, 'plank'], [1100, 350, 240, 'booth'], [1600, 370, 200, 'stage'],
    [1950, 320, 140, 'plank'], [2300, 350, 240, 'booth'], [2800, 370, 200, 'stage'], [3100, 320, 150, 'plank'],
    [3500, 350, 240, 'booth'], [4400, 360, 140, 'plank'], [4860, 330, 140, 'plank']],
  blocks: [[950, 50, 40, 'hay'], [2150, 50, 40, 'hay'], [2650, 50, 40, 'hay'], [3350, 50, 40, 'hay'], [4000, 50, 40, 'hay']],
  props: [['cornstand', 260], ['teddy', 720], ['pigpen', 1420], ['balloons', 2060], ['teddy', 3000], ['pigpen', 3780], ['bobsign', 4290]],
  spawns: [[600, 'chicken', 4], [900, 'goose', 1], [1200, 'goon', 1], [1450, 'chicken', 5], [1700, 'fireworks', 1], [2000, 'goose', 2],
    [2300, 'balloon', 1], [2550, 'hog', 1], [2850, 'chicken', 5], [3100, 'fireworks', 1], [3400, 'goose', 2], [3650, 'balloon', 1], [3900, 'goon', 2]],
  pickups: [[550, 'ammo'], [1250, 'pie'], [1700, 'nade'], [2400, 'pie'], [3000, 'ammo'], [3550, 'pie'], [3950, 'nade'], [4150, 'pie']],
  drawBg(ctx, camX) {
    sky(ctx, ['#241640', '#5f3d8a', '#f7a072']);
    for (let i = 0; i < 30; i++) circle(ctx, hash(i) * W, hash(i + 50) * 160, 1.2, 'rgba(255,255,255,0.8)');
    // fireworks over the fair
    const k = (G.t % 120) / 120, bi = Math.floor(G.t / 120);
    if (k < 0.6) {
      const bx = 100 + hash(bi) * 760, byy = 60 + hash(bi + 3) * 90, col = ['#ffd43b', '#ff6b6b', '#74c0fc', '#69db7c'][bi % 4];
      ctx.globalAlpha = 1 - k / 0.6;
      for (let a = 0; a < 12; a++) circle(ctx, bx + Math.cos(a / 12 * 6.283) * k * 90, byy + Math.sin(a / 12 * 6.283) * k * 90, 2.5, col);
      ctx.globalAlpha = 1;
    }
    repeatX(camX, 0.15, 1400, (sx) => {
      const wx = sx + 700, wy = 230, r = 140, rot = G.t * 0.004;
      rect(ctx, wx - 60, wy, 8, 240, '#3b2d5c'); rect(ctx, wx + 52, wy, 8, 240, '#3b2d5c');
      ctx.strokeStyle = '#4c3a73'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI * 2); ctx.stroke();
      for (let a = 0; a < 10; a++) {
        const ang = rot + a / 10 * Math.PI * 2, gx = wx + Math.cos(ang) * r, gy = wy + Math.sin(ang) * r;
        line(ctx, wx, wy, gx, gy, '#4c3a73', 2);
        fillRR(ctx, gx - 10, gy, 20, 14, 4, ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#da77f2'][a % 5]);
        circle(ctx, gx, gy, 3, (G.t / 8 + a) % 4 < 2 ? '#fff3bf' : '#ffd43b');
      }
    });
    repeatX(camX, 0.4, 260, (sx, i) => {
      const tx = sx + 40, col = i % 2 ? '#e03131' : '#1c7ed6';
      for (let j = 0; j < 6; j++) poly(ctx, [tx + j * 30, 420, tx + j * 30 + 15, 420, tx + 90, 330], j % 2 ? '#fff' : col);
      rect(ctx, tx, 420, 180, 50, '#f8f0dc');
      line(ctx, tx + 90, 330, tx + 90, 310, '#555', 2); poly(ctx, [tx + 90, 310, tx + 112, 316, tx + 90, 322], '#ffd43b');
    });
  },
  drawGround(ctx, x0, x1) {
    rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#6a5a3a');
    rect(ctx, x0, GROUND_Y, x1 - x0, 8, '#6a8d3a');
    for (let i = Math.floor(x0 / 12); i < x1 / 12 + 1; i++) {
      if (hash(i) > 0.5) line(ctx, i * 12, GROUND_Y + 10 + hash(i + 1) * 40, i * 12 + 10, GROUND_Y + 6 + hash(i + 2) * 40, '#e9c46a', 1.5);
    }
  },
};

const MUDBOG = {
  name: 'MUD BOG MAYHEM', sub: 'Monster trucks, deep mud, and one very sloppy Bob.',
  length: 5000, music: 'mudbog', goonThrow: 'can', goonCap: '#e8590c',
  bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain'], bobFood: ['hubcap', 'record', 'chicken'], bobSpeed: 1.3,
  mud: [[650, 140], [1450, 120], [2250, 160], [3200, 140], [3850, 120]],
  platforms: [[450, 350, 200, 'monster'], [900, 320, 140, 'plank'], [1200, 360, 220, 'bleach'], [1700, 350, 200, 'monster'],
    [2100, 310, 140, 'plank'], [2450, 360, 220, 'bleach'], [2950, 350, 200, 'monster'], [3400, 330, 140, 'plank'],
    [3700, 360, 200, 'bleach'], [4200, 360, 140, 'plank'], [4660, 330, 140, 'plank']],
  blocks: [[800, 50, 48, 'tirestack'], [1550, 50, 40, 'hay'], [2800, 50, 48, 'tirestack'], [3600, 40, 56, 'barrel']],
  props: [['flag', 300], ['portapotty', 1100], ['tire', 2000], ['portapotty', 2700], ['flag', 3300], ['bobsign', 4090]],
  spawns: [[600, 'hog', 1], [850, 'fireworks', 1], [1100, 'raccoon', 2], [1400, 'gator', 1], [1650, 'bowler', 1], [1900, 'hog', 1],
    [2200, 'skunk', 1], [2500, 'fireworks', 1], [2800, 'gator', 2], [3100, 'goose', 2], [3400, 'hog', 1], [3650, 'bowler', 1], [3850, 'skunk', 1]],
  pickups: [[500, 'ammo'], [1300, 'pie'], [1800, 'nade'], [2500, 'pie'], [3000, 'ammo'], [3500, 'pie'], [3900, 'nade']],
  drawBg(ctx, camX) {
    sky(ctx, ['#3d4a5c', '#7d8ba1', '#c9cfd6']);
    repeatX(camX, 0.2, 700, (sx) => {
      rect(ctx, sx + 300, 90, 8, 330, '#495057'); rect(ctx, sx + 270, 80, 68, 26, '#343a40');
      for (let i = 0; i < 4; i++) circle(ctx, sx + 280 + i * 16, 93, 6, '#fff9db');
      ctx.globalAlpha = 0.12; poly(ctx, [sx + 270, 106, sx + 338, 106, sx + 420, 400, sx + 190, 400], '#fff9db'); ctx.globalAlpha = 1;
    });
    repeatX(camX, 0.4, 420, (sx, i) => {
      for (let r = 0; r < 5; r++) {
        rect(ctx, sx + r * 12, 300 + r * 24, 400 - r * 24, 8, '#6c757d');
        for (let j = 0; j < 14; j++) {
          const hx = sx + r * 12 + 10 + j * 27, hy = 292 + r * 24 + Math.abs(Math.sin(G.t * 0.1 + j + r + i)) * -3;
          circle(ctx, hx, hy, 5, ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#f1c27d'][(j + r + i) % 5]);
        }
      }
      rect(ctx, sx + 40, 270, 200, 22, '#e8590c');
      text(ctx, 'MUD BOG MAYHEM', sx + 140, 281, { size: 12, color: '#fff' });
    });
  },
  drawGround(ctx, x0, x1) {
    rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#5c4033');
    rect(ctx, x0, GROUND_Y, x1 - x0, 6, '#6f4e37');
    for (let i = Math.floor(x0 / 40); i < x1 / 40 + 1; i++) {
      rect(ctx, i * 40, GROUND_Y + 18, 22, 4, '#4a3328'); rect(ctx, i * 40 + 12, GROUND_Y + 34, 22, 4, '#4a3328');
      if (hash(i) > 0.7) ellipse(ctx, i * 40, GROUND_Y + 50, 18, 5, '#4a3328');
    }
  },
};

const FLEA = {
  name: 'SATURDAY SWAP MEET', sub: "Everything's a dollar. Bob's selling stolen stuff.",
  length: 5200, music: 'flea', goonThrow: 'trash', goonCap: '#2b8a3e',
  bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain'], bobFood: ['record', 'dice', 'trash', 'chicken'], bobSpeed: 1.32,
  platforms: [[450, 370, 160, 'table'], [700, 320, 200, 'canopy'], [1150, 370, 160, 'table'], [1400, 320, 200, 'canopy'],
    [1850, 370, 160, 'table'], [2100, 310, 200, 'canopy'], [2600, 370, 160, 'table'], [2850, 320, 200, 'canopy'],
    [3350, 370, 160, 'table'], [3600, 320, 200, 'canopy'], [4400, 360, 140, 'table'], [4860, 330, 140, 'plank']],
  blocks: [[1000, 60, 50, 'boxes'], [2400, 60, 50, 'boxes'], [3150, 46, 46, 'crate'], [3950, 60, 50, 'boxes']],
  props: [['couch', 260], ['tv', 1290], ['lamp', 1720], ['sign', 2010, '$1 EACH'], ['couch', 2450], ['tv', 3010], ['lamp', 3470], ['bobsign', 4290]],
  spawns: [[600, 'banjo', 1], [850, 'raccoon', 2], [1100, 'chicken', 4], [1350, 'skunk', 1], [1600, 'goon', 1], [1850, 'balloon', 1],
    [2100, 'raccoon', 3], [2400, 'banjo', 1], [2700, 'bowler', 1], [3000, 'skunk', 2], [3300, 'balloon', 1], [3600, 'goon', 2], [3900, 'banjo', 1]],
  pickups: [[550, 'ammo'], [1200, 'pie'], [1800, 'nade'], [2300, 'pie'], [2900, 'ammo'], [3500, 'pie'], [4000, 'nade'], [4150, 'pie']],
  drawBg(ctx, camX) {
    sky(ctx, ['#74c0fc', '#a5d8ff', '#e7f5ff']);
    repeatX(camX, 0.05, 360, (sx, i) => cloud(ctx, sx, 60 + hash(i) * 70, 0.7 + hash(i + 1) * 0.5));
    repeatX(camX, 0.3, 120, (sx, i) => {
      const col = ['#e03131', '#1c7ed6', '#f8f9fa', '#2b8a3e', '#fab005'][((i % 5) + 5) % 5];
      fillRR(ctx, sx, 392, 90, 26, 8, col); fillRR(ctx, sx + 18, 376, 50, 20, 6, col);
      rect(ctx, sx + 24, 380, 38, 12, '#a5d8ff');
      circle(ctx, sx + 18, 418, 8, '#222'); circle(ctx, sx + 72, 418, 8, '#222');
    });
    repeatX(camX, 0.5, 900, (sx) => {
      rect(ctx, sx + 100, 230, 6, 200, '#868e96'); rect(ctx, sx + 520, 230, 6, 200, '#868e96');
      rect(ctx, sx + 100, 230, 426, 50, '#fab005');
      text(ctx, 'SWAP MEET SATURDAY', sx + 313, 255, { size: 22, color: '#c92a2a' });
    });
  },
  drawGround(ctx, x0, x1) {
    rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#5c5f66');
    rect(ctx, x0, GROUND_Y, x1 - x0, 4, '#6c7078');
    for (let i = Math.floor(x0 / 120); i < x1 / 120 + 1; i++) {
      rect(ctx, i * 120, GROUND_Y + 10, 6, 50, '#f1f3f5');
      if (hash(i) > 0.6) ellipse(ctx, i * 120 + 60, GROUND_Y + 30, 22, 5, '#3f4248');
    }
  },
};

// Story order: ... Route 66, JUNKYARD, COUNTY FAIR, Back Alley, MUD BOG, SWAP MEET, Bob's Kitchen.
LEVELS.splice(4, 0, JUNKYARD, FAIR);
LEVELS.splice(7, 0, MUDBOG, FLEA);
