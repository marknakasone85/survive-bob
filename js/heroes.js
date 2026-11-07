'use strict';
// The playable heroes: people and animals, each with a special power.
// special: regen | grenadier | doubleJump | glide | tough | playDead | shell

const HEROES = [
  { name: 'RUSTY', kind: 'human', hat: 'band', blurb: 'Good at everything.', hp: 12, speed: 4.3, jump: 13.2,
    band: '#e63946', shirt: '#3a6ea5', pants: '#3d3a4b', skin: '#f1c27d', hair: '#6b3e1f' },
  { name: 'DAKOTA', kind: 'human', hat: 'band', blurb: 'Super fast, jumps high, less health.', hp: 9, speed: 5.3, jump: 14.6,
    band: '#ffd166', shirt: '#2a9d8f', pants: '#264653', skin: '#c68642', hair: '#1b1b1b' },
  { name: 'MOOSE', kind: 'human', hat: 'band', blurb: 'Slow, but tough as a tractor.', hp: 16, speed: 3.6, jump: 12.4,
    band: '#f4a261', shirt: '#6a4c93', pants: '#3b3b3b', skin: '#e0ac69', hair: '#c0841a' },
  { name: 'GRANNY MAE', kind: 'human', hat: 'bun', special: 'regen', blurb: 'Heals a heart every 8 seconds.', hp: 10, speed: 3.9, jump: 12.8,
    band: '#ff8fab', shirt: '#f783ac', pants: '#e9d8e9', skin: '#f1c9a5', hair: '#dee2e6' },
  { name: 'DARLA', kind: 'human', hat: 'cap', special: 'grenadier', blurb: 'Starts with 9 grenades and makes more.', hp: 11, speed: 4.4, jump: 13.2,
    band: '#e03131', shirt: '#c92a2a', pants: '#1c7ed6', skin: '#8d5524', hair: '#3b2412' },
  { name: 'BANDIT', kind: 'raccoon', special: 'doubleJump', blurb: 'Raccoon. Can double jump!', hp: 9, speed: 5.0, jump: 13.6,
    band: '#adb5bd', fur: '#868e96', belly: '#ced4da', dark: '#343a40' },
  { name: 'HONK', kind: 'goose', special: 'glide', blurb: 'Goose. Hold jump to glide.', hp: 9, speed: 4.5, jump: 13.4,
    band: '#f08c00', fur: '#f8f9fa', belly: '#dee2e6', dark: '#212529', beak: '#f08c00' },
  { name: 'HAMBONE', kind: 'hog', special: 'tough', blurb: 'Hog. Toughest of all, never knocked back.', hp: 18, speed: 3.4, jump: 12.2,
    band: '#f4a261', fur: '#e8a0a0', belly: '#f3c4c4', dark: '#a85c5c' },
  { name: 'PETE', kind: 'possum', special: 'playDead', blurb: 'Possum. Plays dead: stays safe longer after a hit.', hp: 10, speed: 4.6, jump: 13.2,
    band: '#ff8fab', fur: '#adb5bd', belly: '#f1f3f5', dark: '#495057' },
  { name: 'DILLO', kind: 'armadillo', special: 'shell', blurb: 'Armadillo. Shell blocks 1 in 3 hits.', hp: 11, speed: 4.0, jump: 12.8,
    band: '#c9a46b', fur: '#c9a46b', belly: '#e9d5a8', dark: '#8a6a3a' },
];

// Two walking legs; returns nothing. hip = where legs start.
function heroLegs(ctx, cx, by, f, sw, lift, color, foot, hip = 22, len = 14, width = 8) {
  for (const [lx, s] of [[-5, sw], [5, -sw]]) {
    const fx = cx + lx + Math.sin(s) * len;
    line(ctx, cx + lx, by - hip, fx, by - 4 + lift, color, width);
    ellipse(ctx, fx + f * 3, by - 3 + lift, 7, 4, foot);
  }
}

// Each drawer paints the body and returns [sleeve color, hand color] for the gun arm.
const HERO_ART = {
  human(ctx, p, cx, top, by, f, sw, lift) {
    const h = p.hero;
    heroLegs(ctx, cx, by, f, sw, lift, h.pants, '#3b2a1a');
    if (h.hat === 'bun') {
      // Granny: flowery dress
      poly(ctx, [cx - 12, top + 20, cx + 12, top + 20, cx + 16, by - 12, cx - 16, by - 12], h.shirt);
      for (const [dx, dy] of [[-7, 28], [5, 32], [-3, 40], [8, 44], [-10, 46]]) circle(ctx, cx + dx, top + dy, 2, '#fff');
    } else {
      fillRR(ctx, cx - 13, top + 20, 26, 26, 8, h.shirt);
      if (h.hat === 'cap') { // Darla: overall bib and straps over a flannel shirt
        rect(ctx, cx - 8, top + 28, 16, 18, h.pants);
        line(ctx, cx - 7, top + 21, cx - 6, top + 29, h.pants, 3); line(ctx, cx + 7, top + 21, cx + 6, top + 29, h.pants, 3);
        line(ctx, cx - 12, top + 26, cx - 8, top + 26, '#7a1c1c', 1.5);
      } else {
        rect(ctx, cx - 13, top + 40, 26, 5, '#3b2a1a'); rect(ctx, cx - 2, top + 40, 5, 5, '#e9c46a');
      }
    }
    circle(ctx, cx, top + 12, 12, h.skin);
    if (h.hat === 'band') {
      ctx.fillStyle = h.hair; ctx.beginPath(); ctx.arc(cx, top + 10, 12.5, Math.PI, 0); ctx.fill();
      rect(ctx, cx - 12.5, top + 5, 25, 5, h.band);
      const back = cx - f * 11, wave = Math.sin(G.t * 0.3);
      ctx.strokeStyle = h.band; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(back, top + 8); ctx.quadraticCurveTo(back - f * 10, top + 5 + wave * 3, back - f * 18, top + 11 + wave * 4); ctx.stroke();
    } else if (h.hat === 'bun') {
      ctx.fillStyle = h.hair; ctx.beginPath(); ctx.arc(cx, top + 10, 12.5, Math.PI, 0); ctx.fill();
      circle(ctx, cx - f * 11, top + 4, 6, h.hair);
      ctx.strokeStyle = '#495057'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx + f * 5, top + 13, 3.5, 0, Math.PI * 2); ctx.stroke();
    } else if (h.hat === 'cap') {
      ellipse(ctx, cx - f * 10, top + 14, 4, 8, h.hair); // ponytail
      ctx.fillStyle = h.band; ctx.beginPath(); ctx.arc(cx, top + 9, 12.5, Math.PI, 0); ctx.fill();
      rect(ctx, cx + (f > 0 ? 2 : -18), top + 7, 16, 4, h.band);
    }
    circle(ctx, cx + f * 5 + Math.cos(p.aim) * 1.5, top + 13 + Math.sin(p.aim) * 1.5, 2.4, '#1b1b1b');
    line(ctx, cx + f * 2, top + 19, cx + f * 7, top + 18, '#7a3b2a', 1.5);
    return [h.hat === 'bun' ? '#f8f0e3' : h.shirt, h.skin];
  },

  raccoon(ctx, p, cx, top, by, f, sw, lift) {
    const h = p.hero;
    for (let i = 0; i < 5; i++) ellipse(ctx, cx - f * (13 + i * 5), top + 42 - i * 4, 6, 5, i % 2 ? h.dark : h.fur, -f * 0.6);
    heroLegs(ctx, cx, by, f, sw, lift, h.dark, '#212529', 16, 10, 7);
    ellipse(ctx, cx, top + 34, 13, 15, h.fur);
    ellipse(ctx, cx + f * 2, top + 37, 8, 10, h.belly);
    circle(ctx, cx - 7, top + 3, 4.5, h.fur); circle(ctx, cx + 8, top + 3, 4.5, h.fur);
    circle(ctx, cx - 7, top + 3, 2, h.dark); circle(ctx, cx + 8, top + 3, 2, h.dark);
    circle(ctx, cx + f * 2, top + 14, 12, h.fur);
    ellipse(ctx, cx + f * 4, top + 13, 11, 4.5, h.dark);
    circle(ctx, cx + f * 7, top + 13, 2.4, '#fff'); circle(ctx, cx + f * 7.5, top + 13, 1.2, '#111');
    ellipse(ctx, cx + f * 11, top + 18, 5, 3.5, h.belly); circle(ctx, cx + f * 15, top + 17, 2, '#111');
    return [h.fur, h.dark];
  },

  goose(ctx, p, cx, top, by, f, sw, lift) {
    const h = p.hero;
    heroLegs(ctx, cx, by, f, sw, lift, h.beak, h.beak, 16, 8, 3);
    poly(ctx, [cx - f * 14, top + 32, cx - f * 24, top + 26, cx - f * 16, top + 40], h.belly);
    ellipse(ctx, cx - f * 2, top + 36, 15, 12, h.fur);
    if (p.gliding) {
      const flap = Math.sin(G.t * 0.5) * 0.5;
      ellipse(ctx, cx - f * 6, top + 22, 20, 7, h.belly, -f * (0.5 + flap));
    } else ellipse(ctx, cx - f * 4, top + 35, 10, 6, h.belly);
    line(ctx, cx + f * 4, top + 30, cx + f * 6, top + 10, h.fur, 7);
    ellipse(ctx, cx + f * 7, top + 8, 7, 6, h.fur);
    poly(ctx, [cx + f * 12, top + 5, cx + f * 21, top + 9, cx + f * 12, top + 12], h.beak);
    circle(ctx, cx + f * 8, top + 6, 1.8, h.dark);
    line(ctx, cx + f * 5, top + 2, cx + f * 11, top + 4, h.dark, 1.5);
    return [h.belly, h.belly];
  },

  hog(ctx, p, cx, top, by, f, sw, lift) {
    const h = p.hero;
    ctx.strokeStyle = h.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx - f * 17, top + 32, 4, 0, Math.PI * 1.5); ctx.stroke();
    heroLegs(ctx, cx, by, f, sw, lift, h.dark, '#5c3a3a', 14, 8, 9);
    ellipse(ctx, cx, top + 33, 17, 16, h.fur);
    ellipse(ctx, cx + f * 3, top + 37, 10, 9, h.belly);
    rect(ctx, cx - 10, top + 22, 20, 5, h.band);
    poly(ctx, [cx - 9, top + 6, cx - 4, top - 3, cx - 1, top + 6], h.dark);
    poly(ctx, [cx + 3, top + 6, cx + 8, top - 3, cx + 11, top + 6], h.dark);
    circle(ctx, cx + f * 4, top + 15, 12, h.fur);
    ellipse(ctx, cx + f * 14, top + 18, 5, 4.5, h.dark);
    circle(ctx, cx + f * 13, top + 18, 1.2, '#3b1f1f'); circle(ctx, cx + f * 16, top + 18, 1.2, '#3b1f1f');
    poly(ctx, [cx + f * 10, top + 22, cx + f * 12, top + 27, cx + f * 13, top + 22], '#fff');
    circle(ctx, cx + f * 7, top + 12, 2.2, '#1b1b1b');
    return [h.fur, h.dark];
  },

  possum(ctx, p, cx, top, by, f, sw, lift) {
    const h = p.hero;
    ctx.strokeStyle = '#f4a6b7'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - f * 10, top + 44); ctx.quadraticCurveTo(cx - f * 28, top + 48, cx - f * 24, top + 30); ctx.stroke();
    heroLegs(ctx, cx, by, f, sw, lift, h.dark, '#343a40', 16, 10, 7);
    ellipse(ctx, cx, top + 34, 12, 15, h.fur);
    ellipse(ctx, cx + f * 2, top + 37, 7, 10, h.belly);
    circle(ctx, cx - f * 3, top + 5, 4, '#343a40');
    ellipse(ctx, cx + f * 4, top + 14, 11, 9, h.belly);
    ellipse(ctx, cx + f * 13, top + 17, 7, 4, h.belly);
    circle(ctx, cx + f * 19, top + 17, 2.5, '#ff8fab');
    if (p.inv > 90) { // playing dead: X eyes
      line(ctx, cx + f * 6, top + 10, cx + f * 10, top + 14, '#111', 1.5); line(ctx, cx + f * 10, top + 10, cx + f * 6, top + 14, '#111', 1.5);
    } else circle(ctx, cx + f * 8, top + 12, 2.2, '#111');
    return [h.fur, h.belly];
  },

  armadillo(ctx, p, cx, top, by, f, sw, lift) {
    const h = p.hero;
    poly(ctx, [cx - f * 14, top + 44, cx - f * 28, top + 50, cx - f * 14, top + 50], h.dark);
    heroLegs(ctx, cx, by, f, sw, lift, h.dark, '#5c4424', 12, 8, 8);
    ellipse(ctx, cx, top + 42, 13, 8, h.belly);
    ctx.fillStyle = h.fur; ctx.beginPath(); ctx.ellipse(cx - f * 2, top + 40, 17, 18, 0, Math.PI, 0); ctx.fill();
    rect(ctx, cx - 19, top + 38, 34, 4, h.dark);
    ctx.strokeStyle = h.dark; ctx.lineWidth = 2;
    for (const dx of [-8, -1, 6]) { ctx.beginPath(); ctx.moveTo(cx + dx - f * 2, top + 23); ctx.lineTo(cx + dx - f * 2, top + 38); ctx.stroke(); }
    ellipse(ctx, cx + f * 14, top + 30, 8, 6, h.fur);
    ellipse(ctx, cx + f * 11, top + 22, 2.5, 5, h.dark);
    circle(ctx, cx + f * 16, top + 28, 1.8, '#111');
    circle(ctx, cx + f * 22, top + 31, 2, h.dark);
    return [h.fur, h.dark];
  },
};
