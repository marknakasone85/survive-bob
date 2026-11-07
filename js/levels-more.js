'use strict';
// Levels 3-5: Bayou, Route 66 and the Back Alley. They are inserted before
// Bob's Kitchen (level 10, where the world tour starts).

function bgCypress(ctx, x, y, s, c) {
  poly(ctx, [x - 16 * s, y, x - 5 * s, y - 30 * s, x - 4 * s, y - 120 * s, x + 4 * s, y - 120 * s, x + 5 * s, y - 30 * s, x + 16 * s, y], c);
  ellipse(ctx, x - 16 * s, y - 122 * s, 30 * s, 9 * s, c);
  ellipse(ctx, x + 14 * s, y - 132 * s, 26 * s, 8 * s, c);
  for (let i = 0; i < 5; i++) line(ctx, x + (-36 + i * 16) * s, y - 120 * s, x + (-36 + i * 16) * s, y - (90 - hash(i) * 20) * s, c, 1.5);
}
function buttes(ctx, camX, par, base, color, seed) {
  repeatX(camX, par, 260, (sx, i) => {
    if (hash(i + seed) < 0.35) return;
    const h = 50 + hash(i + seed + 3) * 90, w = 120 + hash(i + seed + 7) * 160;
    poly(ctx, [sx, base, sx + 20, base - h, sx + w - 20, base - h, sx + w, base], color);
  });
  rect(ctx, 0, base - 1, W, H - base, color);
}
let brickPattern = null;
function getBrickPattern() {
  if (brickPattern) return brickPattern;
  const c = document.createElement('canvas'); c.width = 48; c.height = 24;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.fillRect(0, 11, 48, 2); g.fillRect(0, 23, 48, 1);
  g.fillRect(23, 0, 2, 11); g.fillRect(0, 13, 1, 10); g.fillRect(47, 13, 1, 10);
  brickPattern = ctx.createPattern(c, 'repeat');
  return brickPattern;
}

const BAYOU = {
  name: 'BAYOU BACKWATER',
  sub: 'Bob went swimmin\'. Even the gators want him gone.',
  length: 5000, music: 'bayou',
  goonThrow: 'crawfish', goonCap: '#2f9e44',
  bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco'], bobFood: ['egg', 'crawfish', 'chicken'], bobSpeed: 1.15,
  platforms: [[450, 370, 180, 'dock'], [800, 330, 140, 'dock'], [1150, 340, 240, 'stilts'], [1650, 380, 160, 'dock'],
    [1900, 320, 140, 'dock'], [2250, 345, 260, 'stilts'], [2750, 370, 160, 'dock'], [3050, 310, 140, 'dock'],
    [3400, 350, 240, 'stilts'], [4200, 360, 140, 'dock'], [4660, 330, 140, 'dock']],
  blocks: [[1000, 50, 44, 'stump'], [2600, 50, 44, 'stump'], [3800, 44, 56, 'barrel']],
  props: [['cypress', 300, 1], ['reeds', 640], ['canoe', 720], ['sign', 1530, 'BAYOU'], ['cypress', 1640, 1.2],
    ['reeds', 2050], ['cypress', 2180, 0.9], ['crawpot', 2950], ['cypress', 3320, 1.1], ['reeds', 3700],
    ['cypress', 3960, 1], ['bobsign', 4090]],
  spawns: [[650, 'gator', 1], [900, 'fly', 3], [1200, 'goon', 1], [1500, 'blob', 2], [1800, 'gator', 1], [2100, 'fly', 3],
    [2400, 'goon', 1], [2700, 'gator', 2], [3000, 'goon', 1], [3250, 'fly', 4], [3500, 'blob', 3], [3750, 'gator', 1], [3900, 'goon', 1]],
  pickups: [[500, 'ammo'], [760, 'shotgun'], [1250, 'pie'], [1700, 'rifle'], [2350, 'nade'], [2600, 'gl'], [2800, 'mg'], [3450, 'pie'], [3900, 'ammo'], [3980, 'pie']],
  drawBg(ctx, camX) {
    sky(ctx, ['#2f4a3f', '#7a9e7e', '#e9d8a6']);
    circle(ctx, 680 - camX * 0.02, 250, 70, 'rgba(255,220,150,0.25)');
    circle(ctx, 680 - camX * 0.02, 250, 44, '#ffe8a8');
    ridge(ctx, camX, 0.08, 335, 22, 0.012, '#4f6b55', 2);
    repeatX(camX, 0.2, 90, (sx, i) => { if (hash(i) > 0.35) bgCypress(ctx, sx + hash(i + 4) * 40, 382, 0.6 + hash(i + 2) * 0.4, '#3a5444'); });
    rect(ctx, 0, 380, W, GROUND_Y - 380, '#3d5c4f');
    repeatX(camX, 0.6, 70, (sx, i) => {
      const wy = 395 + (i % 4) * 18, wob = Math.sin(G.t * 0.03 + i) * 6;
      line(ctx, sx + wob, wy, sx + 30 + wob, wy, 'rgba(255,255,255,0.18)', 2);
    });
    repeatX(camX, 0.6, 130, (sx, i) => { if (hash(i + 9) > 0.5) ellipse(ctx, sx, 420 + hash(i) * 30, 14, 4, '#5c8a3a'); });
    repeatX(camX, 0.4, 110, (sx, i) => { if (hash(i * 7) > 0.55) bgCypress(ctx, sx, 404, 1 + hash(i) * 0.3, '#2b3f33'); });
    ctx.globalAlpha = 0.22; rect(ctx, 0, 350, W, 50, '#dfe7d6'); ctx.globalAlpha = 1;
    for (let i = 0; i < 16; i++) {
      const x = ((hash(i + 40) * W - camX * 0.6) % W + W) % W;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 0.08 + i * 2);
      circle(ctx, x, 300 + hash(i + 60) * 140 + Math.sin(G.t * 0.03 + i) * 12, 2, '#e9ff70');
    }
    ctx.globalAlpha = 1;
  },
  drawGround(ctx, x0, x1) {
    rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#4e3b2a');
    rect(ctx, x0, GROUND_Y, x1 - x0, 8, '#4a5d23');
    for (let i = Math.floor(x0 / 16); i < x1 / 16 + 1; i++) {
      const bx = i * 16;
      if (hash(i) > 0.4) poly(ctx, [bx, GROUND_Y + 2, bx + 4, GROUND_Y - 7 - hash(i + 1) * 8, bx + 8, GROUND_Y + 2], '#5c7a2e');
      if (hash(i + 5) > 0.9) ellipse(ctx, bx, GROUND_Y + 30 + hash(i) * 30, 22, 5, '#3b2d20');
    }
  },
};

const ROUTE66 = {
  name: 'ROUTE 66 DESERT',
  sub: "Bob's been sleepin' in a broken-down gas station.",
  length: 5200, music: 'route66',
  goonThrow: 'hubcap', goonCap: '#e8590c',
  bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain'], bobFood: ['hubcap', 'record', 'dice', 'chicken'], bobSpeed: 1.2,
  platforms: [[500, 360, 160, 'mesa'], [850, 330, 200, 'billboard'], [1300, 340, 300, 'gasroof'], [1800, 370, 150, 'mesa'],
    [2050, 310, 140, 'mesa'], [2420, 340, 220, 'billboard'], [2900, 350, 300, 'gasroof'], [3400, 370, 150, 'mesa'],
    [3650, 320, 140, 'mesa'], [4400, 360, 140, 'mesa'], [4860, 330, 140, 'mesa']],
  blocks: [[1120, 60, 64, 'cactus'], [2250, 120, 56, 'oldcar'], [3260, 60, 64, 'cactus'], [3950, 50, 48, 'tirestack']],
  props: [['sign66', 300], ['cactusd', 720, 1], ['skull', 780], ['pump', 1390], ['pump', 1510], ['cactusd', 1720, 0.8],
    ['skull', 2700], ['pump', 2990], ['pump', 3110], ['cactusd', 3580, 1.1], ['sign66', 3830], ['bobsign', 4290]],
  spawns: [[700, 'tumbleweed', 2], [1000, 'goon', 1], [1250, 'fly', 3], [1600, 'tumbleweed', 3], [1900, 'goon', 1],
    [2200, 'blob', 3], [2500, 'fly', 3], [2800, 'tumbleweed', 3], [3100, 'goon', 2], [3400, 'fly', 4],
    [3700, 'tumbleweed', 3], [3950, 'goon', 1], [4100, 'tumbleweed', 2]],
  pickups: [[600, 'ammo'], [1250, 'pie'], [1650, 'mg'], [1700, 'rocket'], [2100, 'nade'], [2700, 'rifle'], [3000, 'ammo'], [3500, 'pie'], [3800, 'nade'], [4150, 'pie']],
  drawBg(ctx, camX) {
    sky(ctx, ['#ff9f5a', '#ffd08a', '#fff1d0']);
    circle(ctx, 200 - camX * 0.02, 120, 80, 'rgba(255,255,200,0.3)');
    circle(ctx, 200 - camX * 0.02, 120, 50, '#fff6c2');
    buttes(ctx, camX, 0.06, 340, '#e2a07a', 1);
    buttes(ctx, camX, 0.15, 385, '#c0704a', 5);
    repeatX(camX, 0.35, 300, (sx) => {
      rect(ctx, sx, 250, 6, 180, '#7a5a3a'); rect(ctx, sx - 16, 262, 38, 5, '#7a5a3a');
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx - 14, 264); ctx.quadraticCurveTo(sx + 136, 290, sx + 286, 264); ctx.stroke();
    });
    ridge(ctx, camX, 0.5, 445, 8, 0.01, '#e8b878', 3);
    repeatX(camX, 0.5, 170, (sx, i) => {
      if (hash(i) < 0.5) return;
      fillRR(ctx, sx - 5, 400, 10, 44, 5, '#b98552');
      fillRR(ctx, sx - 16, 412, 7, 18, 3, '#b98552'); rect(ctx, sx - 16, 426, 14, 5, '#b98552');
    });
  },
  drawGround(ctx, x0, x1) {
    rect(ctx, x0, GROUND_Y, x1 - x0, 14, '#e7c48d');
    rect(ctx, x0, GROUND_Y + 14, x1 - x0, H, '#4a4a4a');
    for (let i = Math.floor(x0 / 80); i < x1 / 80 + 1; i++) rect(ctx, i * 80, GROUND_Y + 40, 40, 5, '#ffd43b');
    for (let i = Math.floor(x0 / 14); i < x1 / 14 + 1; i++) if (hash(i) > 0.7) circle(ctx, i * 14, GROUND_Y + 5 + hash(i + 2) * 6, 2, '#c9a46b');
  },
};

const ALLEY = {
  name: 'BACK ALLEY',
  sub: "Bob's home sweet home. Watch where you step.",
  length: 5200, music: 'alley',
  goonThrow: 'banana', goonCap: '#495057',
  bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain'], bobFood: ['banana', 'record', 'chicken', 'dice'], bobSpeed: 1.25,
  platforms: [[450, 350, 170, 'fireescape'], [700, 290, 170, 'fireescape'], [1250, 360, 180, 'fireescape'], [1500, 300, 170, 'fireescape'],
    [1750, 240, 150, 'fireescape'], [2300, 350, 180, 'fireescape'], [2850, 370, 160, 'fireescape'], [3080, 310, 170, 'fireescape'],
    [3500, 350, 180, 'fireescape'], [4400, 360, 140, 'fireescape'], [4860, 330, 140, 'fireescape']],
  blocks: [[1000, 110, 70, 'dumpster'], [2050, 60, 40, 'trashbags'], [2600, 110, 70, 'dumpster'], [3300, 60, 40, 'trashbags'], [3850, 50, 46, 'crate']],
  props: [['trashbag', 300], ['trashbag', 338], ['cans', 390], ['records', 900], ['beachball', 1170], ['boombox', 1460],
    ['trashbag', 1920], ['cans', 2200], ['discoball', 2480], ['trashbag', 2760], ['records', 3160], ['boombox', 3700], ['bobsign', 4290]],
  spawns: [[600, 'rat', 2], [850, 'fly', 3], [1150, 'goon', 1], [1400, 'rat', 3], [1700, 'blob', 2], [1950, 'goon', 1],
    [2250, 'rat', 3], [2500, 'fly', 4], [2850, 'goon', 2], [3150, 'rat', 3], [3450, 'blob', 3], [3700, 'fly', 4],
    [3900, 'goon', 1], [4050, 'rat', 3]],
  pickups: [[500, 'ammo'], [1200, 'flame'], [1300, 'pie'], [1800, 'nade'], [2000, 'rifle'], [2350, 'mg'], [2900, 'pie'], [3030, 'lmg'], [3550, 'ammo'], [3800, 'nade'], [4150, 'pie']],
  drawBg(ctx, camX) {
    sky(ctx, ['#495057', '#868e96', '#adb5bd']);
    repeatX(camX, 0.1, 90, (sx, i) => {
      const top = 120 + hash(i) * 140;
      rect(ctx, sx, top, 82, H, '#5c636a');
      for (let r = 0; r < 6; r++) for (let q = 0; q < 3; q++) {
        if (hash(i * 31 + r * 7 + q) > 0.55) rect(ctx, sx + 10 + q * 24, top + 14 + r * 26, 10, 12, '#ffe8a3');
      }
    });
    repeatX(camX, 0.5, 320, (sx, i) => {
      const col = ['#8c3b2e', '#7a3428', '#9a4a35'][((i % 3) + 3) % 3];
      rect(ctx, sx, 80, 318, H, col);
      const pat = getBrickPattern();
      if (pat.setTransform) pat.setTransform(new DOMMatrix().translateSelf(sx, 0));
      ctx.fillStyle = pat; ctx.fillRect(sx, 80, 318, H);
      rect(ctx, sx, 72, 318, 10, '#5a2a20');
      for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) {
        const wx = sx + 34 + q * 96, wy = 120 + r * 100;
        rect(ctx, wx - 4, wy - 4, 58, 72, '#d9cfc1');
        rect(ctx, wx, wy, 50, 64, hash(i * 13 + r * 3 + q) > 0.6 ? '#ffe8a3' : '#2b2b2b');
        line(ctx, wx + 25, wy, wx + 25, wy + 64, '#d9cfc1', 3);
      }
      if (hash(i + 77) > 0.5) {
        rect(ctx, sx + 60, 330, 160, 140, '#6c757d');
        for (let yy = 336; yy < 470; yy += 9) line(ctx, sx + 60, yy, sx + 220, yy, '#5c636a', 2);
      } else {
        ctx.save(); ctx.translate(sx + 150, 380); ctx.rotate(-0.08);
        text(ctx, hash(i) > 0.5 ? 'BOB WUZ HERE' : 'SKRONK!', 0, 0, { size: 26, color: '#ff8fab', stroke: '#1c1c1c', sw: 4 });
        ctx.restore();
      }
      rect(ctx, sx + 300, 80, 8, H, '#495057');
    });
    repeatX(camX, 0.7, 240, (sx, i) => {
      const sag = 30 + hash(i) * 20;
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, 120); ctx.quadraticCurveTo(sx + 120, 120 + sag * 2, sx + 240, 120); ctx.stroke();
      for (let j = 1; j < 12; j++) {
        const t = j / 12, bx = sx + t * 240, by = 120 + 4 * sag * t * (1 - t);
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 0.1 + j + i);
        circle(ctx, bx, by + 3, 3.5, '#ffe066');
      }
      ctx.globalAlpha = 1;
    });
  },
  drawGround(ctx, x0, x1) {
    rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#7d7d7d');
    rect(ctx, x0, GROUND_Y, x1 - x0, 6, '#9a9a9a');
    for (let i = Math.floor(x0 / 60); i < x1 / 60 + 1; i++) {
      const bx = i * 60 + hash(i) * 30;
      if (hash(i + 1) > 0.5) {
        ctx.strokeStyle = '#5c5c5c'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(bx, GROUND_Y + 6); ctx.lineTo(bx + 10, GROUND_Y + 22); ctx.lineTo(bx + 4, GROUND_Y + 40); ctx.stroke();
      }
      if (hash(i + 3) > 0.7) rect(ctx, bx + 20, GROUND_Y + 2, 8, 3, ['#f1f3f5', '#ffd43b', '#e03131'][((i % 3) + 3) % 3]);
      if (hash(i + 9) > 0.85) ellipse(ctx, bx + 30, GROUND_Y + 20, 26, 5, '#5f6b73');
    }
  },
};

// Put the new levels between the trailer park and Bob's Kitchen.
LEVELS.splice(2, 0, BAYOU, ROUTE66, ALLEY);
