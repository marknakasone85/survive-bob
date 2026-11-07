'use strict';
// Level data and parallax backgrounds.
// platforms: [x, y, w, style]  (one-way, jump up through them, Down to drop)
// blocks:    [x, w, h, style]  (solid, sit on the ground)
// props:     [type, x, arg]    (decoration only)
// spawns:    [x, enemyType, count, y?]
// pickups:   [x, type]

function sky(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function ridge(ctx, camX, par, base, amp, freq, color, seed) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
  for (let sx = 0; sx <= W + 8; sx += 8) {
    const wx = (sx + camX * par) * freq;
    ctx.lineTo(sx, base - (Math.sin(wx + seed) * amp + Math.sin(wx * 2.3 + seed * 2) * amp * 0.4 + Math.sin(wx * 5.1 + seed) * amp * 0.15));
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}
// Calls fn(screenX, index) for evenly spaced items scrolling at `par` speed.
function repeatX(camX, par, spacing, fn) {
  const off = camX * par, first = Math.floor(off / spacing) - 1, n = Math.ceil(W / spacing) + 3;
  for (let i = first; i < first + n; i++) fn(i * spacing - off, i);
}
function bgPine(ctx, x, y, s, c) {
  rect(ctx, x - 3 * s, y - 14 * s, 6 * s, 14 * s, c);
  for (let i = 0; i < 3; i++) {
    const ty = y - 10 * s - i * 22 * s, hw = (34 - i * 8) * s;
    poly(ctx, [x - hw, ty, x + hw, ty, x, ty - 36 * s], c);
  }
}
function cloud(ctx, x, y, s) {
  for (const [dx, dy, r] of [[0, 0, 24], [26, -10, 30], [56, 0, 24], [28, 8, 22]]) circle(ctx, x + dx * s, y + dy * s, r * s, 'rgba(255,255,255,0.9)');
}

// Bob's own junk (from the concept drawing), used as arena decoration.
Object.assign(Props, {
  bobsign(ctx, x) {
    const y = GROUND_Y;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06);
    fillRR(ctx, 0, -96, 150, 92, 4, '#c9a46b');
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.strokeRect(2, -94, 146, 88);
    text(ctx, 'NEED FUNDS', 75, -80, { size: 13, color: '#6a2c91' });
    text(ctx, 'FOR WORLD', 75, -62, { size: 13, color: '#2b8a3e' });
    text(ctx, 'DOMINATION', 75, -44, { size: 13, color: '#c92a2a' });
    text(ctx, '(also new fuzzy slippers)', 75, -24, { size: 10, color: '#222', font: FONT2, weight: 800 });
    ctx.restore();
  },
  records(ctx, x) {
    const y = GROUND_Y;
    const cols = ['#e9c46a', '#264653', '#e76f51', '#2a9d8f'];
    for (let i = 0; i < 4; i++) rect(ctx, x + (i % 2) * 3, y - 8 - i * 8, 70, 8, cols[i]);
    ellipse(ctx, x + 36, y - 44, 34, 8, '#111');
    ellipse(ctx, x + 36, y - 44, 10, 3, '#d62828');
  },
  discoball(ctx, x) {
    const y = GROUND_Y - 44;
    circle(ctx, x, y, 42, '#aab3bb');
    for (let r = -3; r <= 3; r++) for (let c = -3; c <= 3; c++) {
      if (r * r + c * c > 10) continue;
      const lit = hash(r * 7 + c + Math.floor(G.t / 20)) > 0.6;
      rect(ctx, x + c * 11 - 5, y + r * 11 - 5, 10, 10, lit ? '#ffffff' : (hash(r + c * 3) > 0.5 ? '#c9d1d8' : '#7d868e'));
    }
  },
  beachball(ctx, x) {
    const y = GROUND_Y - 28;
    circle(ctx, x, y, 28, '#fff');
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, 28, 0, Math.PI * 2); ctx.clip();
    rect(ctx, x - 28, y - 28, 18, 56, '#e63946'); rect(ctx, x + 10, y - 28, 18, 56, '#457b9d');
    ctx.restore();
  },
});

const LEVELS = [
  // ---------------------------------------------------------------- LEVEL 1
  {
    name: 'APPALACHIAN HOLLER',
    sub: "Bob's been stinkin' up these hills...",
    length: 4600, music: 'holler',
    goonThrow: 'jug', goonCap: '#6b8e23',
    bobAttacks: ['toss', 'slam'], bobFood: ['jug', 'egg', 'chicken'], bobSpeed: 1,
    platforms: [[520, 380, 140, 'plank'], [760, 320, 130, 'plank'], [1150, 350, 260, 'shack'], [1700, 390, 120, 'plank'],
      [1900, 330, 140, 'plank'], [2150, 270, 120, 'plank'], [2500, 360, 220, 'shack'], [2900, 380, 130, 'plank'],
      [3150, 320, 130, 'plank'], [3900, 360, 130, 'plank'], [4230, 330, 130, 'plank']],
    blocks: [[980, 50, 40, 'hay'], [2050, 46, 46, 'crate'], [2350, 40, 56, 'barrel'], [3350, 50, 40, 'hay']],
    props: [['pine', 300, 1.2], ['jug', 600], ['jug', 626], ['sign', 440, 'HOLLER'], ['pine', 1060, 1], ['outhouse', 1460],
      ['pine', 1610, 1.4], ['jug', 2770], ['pine', 3010, 1.1], ['truck', 3430], ['pine', 3640, 1.3], ['bobsign', 3700]],
    spawns: [[700, 'blob', 1], [950, 'blob', 2], [1300, 'fly', 2], [1550, 'goon', 1], [1850, 'blob', 3], [2200, 'goon', 1],
      [2450, 'fly', 3], [2850, 'goon', 1], [3050, 'blob', 2], [3300, 'goon', 1], [3450, 'fly', 2]],
    pickups: [[1260, 'rifle'], [2000, 'pie'], [2600, 'ammo'], [3200, 'nade'], [3560, 'pie']],
    drawBg(ctx, camX) {
      sky(ctx, ['#241a4a', '#7b3f72', '#f08a5d']);
      for (let i = 0; i < 50; i++) {
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(G.t * 0.02 + i));
        circle(ctx, hash(i) * W, hash(i + 100) * 200, hash(i + 7) * 1.5 + 0.5, '#fff');
      }
      ctx.globalAlpha = 1;
      circle(ctx, 760 - camX * 0.02, 100, 48, 'rgba(255,240,200,0.15)');
      circle(ctx, 760 - camX * 0.02, 100, 32, '#fff1c9');
      ridge(ctx, camX, 0.06, 300, 55, 0.0035, '#4b3f78', 1);
      ridge(ctx, camX, 0.15, 345, 45, 0.005, '#352e5e', 4);
      repeatX(camX, 0.3, 46, (sx, i) => { if (hash(i) > 0.3) bgPine(ctx, sx + hash(i + 9) * 30, 400 + hash(i + 3) * 16, 0.8 + hash(i + 5) * 0.5, '#1d2a40'); });
      ridge(ctx, camX, 0.45, 440, 14, 0.008, '#1a2a30', 2);
      repeatX(camX, 0.55, 60, (sx, i) => { if (hash(i * 3) > 0.4) bgPine(ctx, sx, 452, 1.1 + hash(i) * 0.5, '#16302b'); });
      for (let i = 0; i < 14; i++) {
        const x = ((hash(i + 40) * W - camX * 0.6) % W + W) % W;
        const y = 300 + hash(i + 60) * 150 + Math.sin(G.t * 0.03 + i) * 12;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 0.08 + i * 2);
        circle(ctx, x, y, 2.2, '#e9ff70');
      }
      ctx.globalAlpha = 1;
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#5b3b22');
      rect(ctx, x0, GROUND_Y, x1 - x0, 10, '#3f7a2a');
      for (let i = Math.floor(x0 / 14); i < x1 / 14 + 1; i++) {
        const bx = i * 14;
        poly(ctx, [bx, GROUND_Y + 2, bx + 4, GROUND_Y - 6 - hash(i) * 6, bx + 8, GROUND_Y + 2], '#4f9234');
        if (hash(i + 3) > 0.85) ellipse(ctx, bx, GROUND_Y + 30 + hash(i) * 30, 8, 5, '#46301b');
      }
    },
  },
  // ---------------------------------------------------------------- LEVEL 2
  {
    name: 'SUNNY PINES TRAILER PARK',
    sub: 'Bob owes everybody here money.',
    length: 5000, music: 'trailer',
    goonThrow: 'can', goonCap: '#d62828',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco'], bobFood: ['chicken', 'record', 'dice'], bobSpeed: 1.1,
    platforms: [[500, 340, 300, 'trailer'], [1100, 350, 280, 'trailer'], [1650, 330, 320, 'trailer'], [2400, 345, 300, 'trailer'],
      [3050, 335, 300, 'trailer'], [3550, 370, 120, 'plank'], [4200, 360, 130, 'plank'], [4650, 330, 130, 'plank']],
    blocks: [[880, 40, 56, 'barrel'], [2250, 46, 46, 'crate'], [2800, 40, 56, 'barrel'], [3750, 46, 46, 'crate']],
    props: [['flamingo', 300], ['flamingo', 340], ['tire', 430], ['grill', 950], ['chair', 1010], ['clothesline', 1420],
      ['gnome', 1590], ['truck', 2010, '#3a6ea5'], ['pool', 2930], ['flamingo', 3400], ['tire', 3480], ['gnome', 3700],
      ['records', 3830], ['beachball', 3930], ['discoball', 3995], ['bobsign', 4090]],
    spawns: [[650, 'blob', 2], [900, 'goon', 1], [1200, 'fly', 3], [1500, 'goon', 1], [1800, 'goon', 1], [2050, 'blob', 3],
      [2300, 'fly', 3], [2600, 'goon', 1], [2900, 'goon', 2], [3200, 'blob', 3], [3500, 'fly', 4], [3700, 'goon', 1], [3900, 'goon', 1]],
    pickups: [[1600, 'mg'], [2300, 'br'], [2450, 'pie'], [2900, 'ammo'], [3300, 'nade'], [3850, 'pie'], [3950, 'ammo']],
    drawBg(ctx, camX) {
      sky(ctx, ['#5fb4e8', '#a7d8f0', '#ffe3a3']);
      circle(ctx, 150 - camX * 0.02, 110, 60, 'rgba(255,240,160,0.3)');
      circle(ctx, 150 - camX * 0.02, 110, 40, '#fff2a8');
      repeatX(camX, 0.05, 340, (sx, i) => cloud(ctx, sx, 60 + hash(i) * 80, 0.8 + hash(i + 1) * 0.6));
      ridge(ctx, camX, 0.12, 395, 20, 0.01, '#8bb07a', 3);
      repeatX(camX, 0.2, 1500, (sx) => {
        const tx = sx + 500;
        for (const lx of [-30, 30]) line(ctx, tx + lx * 0.6, 240, tx + lx, 400, '#8a9399', 5);
        fillRR(ctx, tx - 50, 170, 100, 70, 30, '#b0b8bf');
        text(ctx, 'BOBVILLE', tx, 205, { size: 14, color: '#5c6670' });
      });
      ridge(ctx, camX, 0.3, 420, 10, 0.02, '#6f9a5c', 1);
      repeatX(camX, 0.5, 280, (sx) => {
        rect(ctx, sx, 180, 8, 260, '#7a5a3a'); rect(ctx, sx - 22, 196, 52, 6, '#7a5a3a');
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        for (const off of [-18, 22]) {
          ctx.beginPath(); ctx.moveTo(sx + off, 198); ctx.quadraticCurveTo(sx + off + 140, 230, sx + off + 280, 198); ctx.stroke();
        }
      });
      repeatX(camX, 0.75, 22, (sx, i) => {
        rect(ctx, sx, 400 + (i % 2) * 4, 18, 70, i % 5 === 0 ? '#9c7f57' : '#b0936a');
      });
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, H - GROUND_Y, '#9b8462');
      for (let i = Math.floor(x0 / 18); i < x1 / 18 + 1; i++) {
        const bx = i * 18;
        if (hash(i) > 0.3) poly(ctx, [bx, GROUND_Y + 3, bx + 5, GROUND_Y - 5 - hash(i + 2) * 5, bx + 10, GROUND_Y + 3], '#8fae4a');
        circle(ctx, bx + hash(i + 5) * 18, GROUND_Y + 12 + hash(i + 9) * 50, 2 + hash(i) * 2, '#82704f');
      }
      rect(ctx, x0, GROUND_Y, x1 - x0, 4, '#7f9e40');
    },
  },
  // ---------------------------------------------------------------- LEVEL 3
  {
    name: "BOB'S KITCHEN",
    sub: "Bob's home turf. It smells like old syrup.",
    doneText: 'He dove onto a cargo plane headed for Japan!',
    length: 5200, music: 'kitchen',
    goonThrow: 'meat', goonCap: '#f4a261',
    bobAttacks: ['toss', 'slam', 'burp', 'summon', 'disco', 'rain', 'spray', 'spray'], bobFood: ['egg', 'chicken', 'record', 'drumstick'], bobSpeed: 1.35,
    platforms: [[450, 360, 160, 'shelf'], [700, 300, 160, 'shelf'], [1000, 380, 110, 'plates'], [1550, 340, 160, 'shelf'],
      [1800, 280, 160, 'shelf'], [2300, 370, 110, 'plates'], [2600, 330, 180, 'shelf'], [2900, 370, 110, 'plates'],
      [3250, 320, 180, 'shelf'], [3600, 360, 110, 'plates'], [4400, 360, 140, 'shelf'], [4850, 330, 140, 'shelf']],
    blocks: [[1300, 90, 70, 'toaster'], [2100, 60, 110, 'cereal'], [3050, 60, 64, 'jar'], [3900, 90, 70, 'toaster']],
    props: (() => {
      const list = [];
      for (let x = 180; x < 5150; x += 230) list.push(['plate', x, hash(x) > 0.45]);
      list.push(['bobsign', 4290]);
      return list;
    })(),
    spawns: [[600, 'meatball', 2], [900, 'fly', 3], [1150, 'goon', 1], [1500, 'meatball', 2], [1750, 'blob', 3], [2050, 'goon', 1],
      [2400, 'fly', 4], [2700, 'meatball', 3], [3000, 'goon', 2], [3300, 'blob', 3], [3600, 'fly', 4], [3800, 'goon', 1], [3950, 'meatball', 2]],
    pickups: [[500, 'rifle'], [1000, 'ammo'], [1200, 'mg'], [1500, 'br'], [1700, 'pie'], [2000, 'nade'], [2400, 'shotgun'],
      [2650, 'ammo'], [2850, 'gl'], [3100, 'rocket'], [3300, 'pie'], [3500, 'lmg'], [3650, 'nade'], [3720, 'flame'],
      [4000, 'ammo'], [4120, 'pie']],
    drawBg(ctx, camX) {
      rect(ctx, 0, 0, W, H, '#f7e3b5');
      repeatX(camX, 0.3, 40, (sx) => rect(ctx, sx, 0, 16, H, 'rgba(255,255,255,0.22)'));
      repeatX(camX, 0.3, 1100, (sx) => {
        const wx = sx + 200;
        rect(ctx, wx - 10, 150, 240, 170, '#fff');
        rect(ctx, wx, 160, 220, 150, '#8fd3f4');
        ellipse(ctx, wx + 110, 330, 160, 60, '#7cb860');
        line(ctx, wx + 110, 160, wx + 110, 310, '#fff', 8); line(ctx, wx, 235, wx + 220, 235, '#fff', 8);
        for (let i = 0; i < 6; i++) rect(ctx, wx - 30 + i * 8, 150, 8, 180, i % 2 ? '#e63946' : '#fff');
        for (let i = 0; i < 6; i++) rect(ctx, wx + 214 + i * 8, 150, 8, 180, i % 2 ? '#e63946' : '#fff');
        const cx = sx + 760, cy = 220;
        circle(ctx, cx, cy, 36, '#333'); circle(ctx, cx, cy, 31, '#fffaf0');
        line(ctx, cx, cy, cx + Math.cos(G.t * 0.01) * 22, cy + Math.sin(G.t * 0.01) * 22, '#333', 3);
        line(ctx, cx, cy, cx + Math.cos(G.t * 0.001) * 14, cy + Math.sin(G.t * 0.001) * 14, '#333', 4);
      });
      repeatX(camX, 0.55, 210, (sx, i) => {
        rect(ctx, sx, 0, 200, 120, '#b9783f');
        rect(ctx, sx + 10, 10, 85, 100, '#a8692f'); rect(ctx, sx + 105, 10, 85, 100, '#a8692f');
        circle(ctx, sx + 88, 90, 4, '#e9c46a'); circle(ctx, sx + 112, 90, 4, '#e9c46a');
        if (hash(i) > 0.5) {
          line(ctx, sx + 150, 120, sx + 150, 150, '#555', 2);
          ellipse(ctx, sx + 150, 170, 26, 22, '#4a4a4a'); rect(ctx, sx + 146, 140, 8, 14, '#333');
        }
      });
      repeatX(camX, 0.9, 40, (sx, i) => {
        for (let r = 0; r < 4; r++) rect(ctx, sx + 1, 310 + r * 40 + 1, 38, 38, (i + r) % 2 ? '#ffffff' : '#dfeef5');
      });
    },
    drawGround(ctx, x0, x1) {
      rect(ctx, x0, GROUND_Y, x1 - x0, 22, '#e8dcc6');
      for (let i = Math.floor(x0 / 12); i < x1 / 12 + 1; i++) circle(ctx, i * 12 + hash(i) * 12, GROUND_Y + 4 + hash(i + 1) * 14, 1.2, '#c9b99c');
      rect(ctx, x0, GROUND_Y + 22, x1 - x0, 6, '#bfae90');
      rect(ctx, x0, GROUND_Y + 28, x1 - x0, H, '#8b5a2b');
      for (let i = Math.floor(x0 / 150); i < x1 / 150 + 1; i++) {
        rect(ctx, i * 150 + 8, GROUND_Y + 36, 134, 60, '#7a4b22');
        circle(ctx, i * 150 + 75, GROUND_Y + 46, 4, '#e9c46a');
      }
    },
  },
];
