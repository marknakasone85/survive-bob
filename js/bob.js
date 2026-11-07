'use strict';
// BOB: the boss. 100 HP. Fat, sloppy, makes weird noises.
// Look is based on the original concept picture: brown beanie,
// wild gray hair, beard with bird nests + eggs, bulging eyes, olive jacket,
// pink fuzzy dice, rubber chicken in his pocket, rainbow nails, patched pants.

const BOB_NOISES = ['BLORP!', 'GLRRRK', 'HNNNNGH', 'MWAAAP!', 'SKRONK!', 'PFFFBBT', 'SNRRRK', 'BWAMP', 'HEH HEH HUH',
  'BLUBBA BLUB', 'HURRK', 'NYEHHH', 'BRAAAP!', 'WOOOBLE', 'SCHLORP', 'HONK!', 'MMMBRRR', 'FWEEEE!', 'GURGLE GURGLE'];
// [what the bubble says, which sound plays]
const BOB_OUCH = [['OOF!', 'OOF!'], ['OWIE!', 'OWIE!'], ['MY BELLY!', 'MY BELLY!'], ['HURRK', 'HURRK'],
  ['NOT THE BEARD!', 'OWIE!'], ['MY CHICKEN!', 'NYEHHH'], ['BLUBBA BLUB', 'BLUBBA BLUB'], ['HONK!', 'HONK!']];
const NAIL_COLORS = ['#ff6b9d', '#ffd43b', '#69db7c', '#4dabf7'];
const BLOOD = ['#c92a2a', '#a61e1e', '#e03131', '#7a0b0b'];

class Bob {
  constructor(L) {
    this.L = L; this.w = 140; this.h = 190;
    this.x = L.arenaX + W + 40; this.y = GROUND_Y - this.h;
    this.vx = 0; this.vy = 0; this.onGround = true;
    this.hp = 100; this.maxHp = 100;
    this.state = 'enter'; this.timer = 0; this.face = -1; this.t = 0; this.flash = 0;
    this.mouth = 0; this.noiseT = 200; this.bubble = null; this.last = null; this.shots = 0;
    this.speed = L.bobSpeed || 1;
    this.minX = L.arenaX + 20; this.maxX = L.arenaX + W - this.w - 20;
    this.squash = 0; this.armUp = 0; this.bottle = null; this.walkT = 0; this.wasMad = false; this.done = false;
    this.wounds = []; this.fall = 0; this.pool = 0; this.dead = false; // for the final level's death scene
  }
  get cx() { return this.x + this.w / 2; }
  get mad() { return this.hp <= 40; }
  hitbox() { return { x: this.x + 18, y: this.y + 10, w: this.w - 36, h: this.h - 10 }; }
  canBeHit() { return !['enter', 'flee', 'dying', 'dead', 'gone'].includes(this.state); }

  say(word, dur = 70, sound = word) {
    this.bubble = { word, t: dur, max: dur };
    this.mouth = Math.max(this.mouth, Math.min(40, dur * 0.6));
    SFX.bob(sound);
  }
  toIdle() { this.state = 'idle'; this.timer = (this.mad ? 55 : 100) / this.speed; this.bottle = null; }

  chooseAttack() {
    let opts = this.L.bobAttacks.filter(a => a !== this.last);
    if (G.enemies.length > 6) opts = opts.filter(a => a !== 'summon');
    if (G.ebullets.some(b => b.kind === 'disco')) opts = opts.filter(a => a !== 'disco');
    if (!opts.length) opts = ['toss'];
    const a = pick(opts);
    this.last = a; this.state = a; this.timer = 0; this.shots = 0;
    if (a === 'toss') this.say('HUP HUP!', 45);
    if (a === 'slam') { this.say('HRRRNNGH!', 60); this.timer = 28; }
    if (a === 'burp') this.timer = 50;
    if (a === 'summon') this.timer = 60;
    if (a === 'disco') { this.timer = 40; this.say('DISCO TIME!', 70, 'MWAAAP!'); }
    if (a === 'rain') this.say("IT'S RAININ' JUNK!", 80, 'SKRONK!');
  }

  // Lightweight animation for the title screen.
  idleAnim() {
    this.t++;
    if (this.mouth > 0) this.mouth--;
    if (this.bubble && --this.bubble.t <= 0) this.bubble = null;
    if (--this.noiseT <= 0) { this.say(pick(BOB_NOISES), 60); this.noiseT = randi(110, 200); }
  }

  update() {
    const p = G.player, px = p.x + p.w / 2;
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.mouth > 0) this.mouth--;
    if (this.armUp > 0) this.armUp--;
    if (this.bubble && --this.bubble.t <= 0) this.bubble = null;
    const active = this.canBeHit();
    if (active || this.state === 'enter') this.face = px < this.cx ? -1 : 1;
    if (active && --this.noiseT <= 0) {
      if (!this.bubble) this.say(pick(BOB_NOISES), 55);
      this.noiseT = randi(70, 140);
    }
    const s = this.speed * (this.mad ? 1.35 : 1);

    switch (this.state) {
      case 'enter':
        this.vx = -2.2;
        if (this.x <= this.maxX - 40) {
          this.vx = 0; this.toIdle(); this.timer = 70;
          this.say('BLORP!', 90); G.banner = { text: 'BOB HAS ARRIVED!', t: 120 }; shake(8);
        }
        break;
      case 'idle':
        this.vx = Math.abs(px - this.cx) > 230 ? Math.sign(px - this.cx) * 1.1 * s : 0;
        if (--this.timer <= 0 && !p.dead) this.chooseAttack();
        break;
      case 'toss': {
        this.vx = 0; this.timer++;
        const n = this.mad ? 5 : 3, gap = Math.round((this.mad ? 14 : 20) / this.speed);
        if (this.timer % gap === 0 && this.shots < n) {
          this.shots++; this.armUp = 10;
          throwArc(this.cx + this.face * 50, this.y + 20, px + rand(-60, 60), p.y + p.h / 2, pick(this.L.bobFood), randi(40, 58), 0.3);
          SFX.throwIt();
        }
        if (this.shots >= n && this.timer > n * gap + 30) this.toIdle();
        break;
      }
      case 'slam':
        this.vx = 0; this.squash = Math.min(1, this.squash + 0.05);
        if (--this.timer <= 0) {
          this.state = 'slamAir'; this.vy = -15; this.squash = 0;
          const tx = clamp(px - this.w / 2, this.minX, this.maxX);
          this.vx = (tx - this.x) / 55;
        }
        break;
      case 'slamAir': break;
      case 'burp':
        this.vx = 0; this.timer--;
        if (this.timer === 25) {
          this.say('BUUUURRRP!', 70);
          for (let i = 0; i < (this.mad ? 2 : 1); i++) {
            const sx = this.cx + this.face * 40, sy = this.y + 40;
            const a = Math.atan2(p.y + 20 - sy, px - sx) + (i ? 0.5 : 0);
            G.ebullets.push({ kind: 'burp', x: sx, y: sy, vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 2.6, g: 0, r: 28, dmg: 1, life: 240, home: 0.05, spin: 0.1 });
          }
        }
        if (this.timer <= -25) this.toIdle();
        break;
      case 'summon':
        this.vx = 0; this.timer--;
        if (this.timer === 40) {
          this.say('FLY, MY BEARD BIRDS!', 80, 'BZZZ! MY BABIES!');
          for (let i = 0; i < (this.mad ? 4 : 3); i++) {
            const e = spawnEnemy(this.L.summonType || 'bird', this.cx + this.face * 20 + rand(-20, 20), this.y + 50);
            e.baseY = rand(170, 300); e.vx = this.face * rand(1, 3); e.vy = -rand(2, 4);
          }
        }
        if (this.timer <= 0) this.toIdle();
        break;
      case 'disco':
        this.vx = 0; this.timer--;
        if (this.timer > 10) this.armUp = 2;
        if (this.timer === 10) {
          G.ebullets.push({ kind: 'disco', x: this.cx + this.face * 90, y: GROUND_Y - 34, r: 34, vx: this.face * (this.mad ? 7 : 5.5),
            vy: 0, g: 0, dmg: 2, life: 420, bounces: 1, spin: 0 });
          SFX.pop();
        }
        if (this.timer <= -30) this.toIdle();
        break;
      case 'rain': {
        // Chucks junk sky-high; it rains down all over the arena (shadows warn you).
        this.vx = 0; this.timer++;
        const n = this.mad ? 12 : 8;
        if (this.shots < n) this.armUp = 2;
        if (this.timer > 15 && this.timer % 6 === 0 && this.shots < n) {
          this.shots++;
          const tx = this.shots % 3 === 0 ? px : this.L.arenaX + 60 + rand(0, W - 120);
          G.ebullets.push({ kind: pick(this.L.bobFood), x: tx, y: -40 - rand(0, 120), vx: 0, vy: rand(1, 3), g: 0.22, r: 10, dmg: 1, life: 300, warn: true });
          particles(this.cx + this.face * 60, this.y + 10, 3, '#fff', { speed: 2, up: 4, grav: 0 });
          SFX.throwIt();
        }
        if (this.shots >= n && this.timer > 15 + n * 6 + 50) this.toIdle();
        break;
      }
      case 'spray': {
        // The giant syrup bottle: sweeps a sticky stream from high to low.
        this.vx = 0; this.timer++;
        if (this.timer === 1) this.say('SPLOOORT!', 80);
        const sweep = -0.9 + clamp((this.timer - 20) / 100, 0, 1) * 1.1;
        this.bottle = sweep;
        if (this.timer > 20 && this.timer < 120 && this.timer % 3 === 0) {
          const a = this.face > 0 ? sweep : Math.PI - sweep;
          const nx = this.cx + this.face * (66 + Math.cos(sweep) * 90), ny = this.y + 78 + Math.sin(sweep) * 90;
          const sp = rand(9, 11.5);
          G.ebullets.push({ kind: 'syrup', x: nx, y: ny, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.22, r: 7, dmg: 1, life: 150 });
          if (this.timer % 6 === 0) SFX.squirt();
        }
        if (this.timer > 140) this.toIdle();
        break;
      }
      case 'flee':
        this.timer++;
        if (this.timer > 60) { this.vx = 6; this.face = 1; if (this.onGround) this.vy = -9; }
        if (this.x > this.L.arenaX + W + 60) { this.state = 'gone'; this.done = true; }
        break;
      case 'dying': { // final level only: Bob goes down for good
        this.vx = 0; this.timer++;
        const k = this.timer, f = this.face;
        if (k < 110) {
          // Staggers, bleeding from every bullet hole, and makes room to fall over.
          this.x += Math.sin(k * 0.22) * 2.2;
          const want = f > 0 ? Math.max(this.cx, this.L.arenaX + 250) : Math.min(this.cx, this.L.arenaX + W - 250);
          this.x += (want - this.cx) * 0.06;
          if (k % 12 === 0 && this.wounds.length < 9) this.addWound();
          for (const w of this.wounds) {
            w.drip = Math.min(16, w.drip + 0.25);
            if ((k + w.ph) % 5 === 0) particles(this.cx + f * w.x, this.y + this.h + w.y, 2, BLOOD, { speed: 2.6, up: 2.2, sizeMul: 1.1 });
          }
          if (k % 16 === 0) { SFX.splat(); shake(3); }
          if (k === 70) this.say('HURRK...', 40, 'HURRK');
        } else if (k < 146) {
          // Timber! He tips over backwards.
          if (k === 110) this.bubble = null;
          this.fall = Math.pow((k - 110) / 36, 2);
        } else {
          if (k === 146) this.thud();
          this.pool = Math.min(1, this.pool + 0.006);
          if (k % 18 === 0) { const w = pick(this.wounds); if (w) particles(this.woundX(w), this.woundY(w), 2, BLOOD, { speed: 1.5, up: 1 }); }
          if (k >= 146 + 150) { this.state = 'dead'; this.done = true; }
        }
        break;
      }
      case 'dead':
        this.vx = 0; this.pool = Math.min(1, this.pool + 0.002);
        if (this.t % 80 === 0) SFX.buzz();
        break;
    }
    if (this.state === 'gone') return;

    if (this.onGround && Math.abs(this.vx) > 0.2) {
      // Heavy footsteps: a thud every time a foot comes down.
      const before = Math.floor(this.walkT / Math.PI);
      this.walkT += Math.abs(this.vx) * 0.08;
      if (Math.floor(this.walkT / Math.PI) !== before) { SFX.bobStep(); shake(1.5); }
    }
    this.vy += 0.55; this.x += this.vx; this.y += this.vy;
    if (this.y + this.h >= GROUND_Y) {
      const landing = this.state === 'slamAir' && this.vy > 3;
      this.y = GROUND_Y - this.h; this.vy = 0; this.onGround = true;
      if (landing) this.land();
    } else this.onGround = false;
    if (this.state !== 'flee' && this.state !== 'enter') this.x = clamp(this.x, this.minX, this.maxX);
    if (this.state !== 'slam') this.squash *= 0.85;
    if (active && !p.dead && overlap(this.hitbox(), p)) hurtPlayer(this.state === 'slamAir' ? 2 : 1, this.cx);
  }

  land() {
    this.toIdle(); this.timer = (this.mad ? 60 : 95) / this.speed;
    this.vx = 0; this.squash = 0.9; shake(14); SFX.boom();
    for (const d of [-1, 1]) {
      G.ebullets.push({ kind: 'wave', x: this.cx + d * 60, y: GROUND_Y - 16, vx: d * (this.mad ? 7 : 5.5), vy: 0, g: 0, r: 16, dmg: 1, life: 110, spin: 0 });
    }
    particles(this.cx, GROUND_Y - 4, 24, ['#a0845c', '#d9c29a'], { speed: 5, up: 2 });
  }

  hurt(dmg, quiet = false) {
    if (!this.canBeHit()) return false;
    this.hp = Math.max(0, this.hp - dmg); this.flash = 5;
    if (this.L.final) { // the last fight leaves marks
      particles(this.cx + rand(-40, 40), this.y + rand(40, 150), quiet ? 1 : 3, BLOOD, { speed: 2.5 });
      if (!quiet && Math.random() < 0.12 && this.wounds.length < 6) this.addWound();
    }
    if (!quiet || Math.random() < 0.15) floatText(this.cx + rand(-40, 40), this.y + rand(10, 70), '-' + dmg, '#ffe066', 20, 40);
    G.score += dmg;
    if (this.hp <= 0) { this.defeat(); return true; }
    if (!this.wasMad && this.mad) {
      this.wasMad = true; this.say("NOW BOB'S MAD!", 90); G.banner = { text: 'BOB IS ENRAGED!', t: 90 };
    } else if (!this.bubble && Math.random() < (quiet ? 0.04 : 0.3)) { const [w, snd] = pick(BOB_OUCH); this.say(w, 45, snd); }
    return true;
  }

  defeat() {
    G.score += 500; this.bottle = null; this.vx = 0;
    G.ebullets.length = 0;
    for (const e of G.enemies) if (e.hp > 0) killEnemy(e);
    if (this.L.final) {
      this.state = 'dying'; this.timer = 0; this.say('NOOOOOOO...', 66);
      while (this.wounds.length < 3) this.addWound();
      G.banner = { text: 'BOB IS GOING DOWN!', t: 110 }; shake(10);
    } else {
      this.state = 'flee'; this.timer = 0; this.say("THIS AIN'T OVER!", 120);
      G.banner = { text: 'BOB IS RUNNING AWAY!', t: 120 };
    }
  }

  addWound() { this.wounds.push({ x: rand(-30, 48), y: rand(-150, -78), ph: randi(0, 4), drip: 0 }); }
  // Where a wound is in the world (only right while he's still standing).
  woundX(w) { return this.cx + this.face * w.x; }
  woundY(w) { return this.fall > 0.5 ? GROUND_Y - 60 : this.y + this.h + w.y; }
  // He hits the ground. Hard.
  thud() {
    const f = this.face;
    this.fall = 1; this.dead = true; this.bubble = null; this.mouth = 0;
    shake(24); G.flash = 0.35; SFX.boom(); SFX.bobStep(); SFX.squeak(); SFX.splat();
    for (let i = 0; i < 7; i++) particles(this.cx - f * i * 32, GROUND_Y - 4, 4, ['#a0845c', '#d9c29a'], { speed: 4, up: 2 });
    particles(this.cx - f * 90, GROUND_Y - 30, 46, BLOOD, { speed: 7, up: 3, sizeMul: 1.4 });
    floatText(this.cx - f * 80, GROUND_Y - 150, 'THUD!', '#fff', 40, 70);
    G.banner = { text: 'BOB IS DEAD!', t: 240 };
  }

  // ---- Drawing -----------------------------------------------------------
  draw(ctx) {
    if (this.state === 'gone') return;
    const c = col => (this.flash > 0 ? '#ffffff' : col);
    const skin = c(this.mad ? '#e8907a' : '#e8b796');
    const f = this.face, t = this.t;
    const walk = Math.sin(this.walkT) * 6, bob = Math.abs(Math.sin(this.walkT)) * 3, jig = this.dead ? 0 : Math.sin(t * 0.15) * 2;
    const fall = this.fall;
    const sq = this.squash * 0.18;

    // Stink lines (drawn unflipped so they float straight up).
    ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = '#9ccc65'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const sx = this.cx - f * 90 * fall - 50 + i * 50, k = (t * 0.6 + i * 30) % 60, sy = this.y + 20 + (GROUND_Y - 130 - this.y - 20) * fall;
      ctx.beginPath();
      for (let j = 0; j < 4; j++) ctx.lineTo(sx + Math.sin(t * 0.1 + j + i) * 6, sy - k - j * 10);
      ctx.stroke();
    }
    ctx.restore();

    // A pool of blood spreading under the body.
    if (this.pool > 0) {
      const pr = this.pool, px = this.cx - f * 95;
      ellipse(ctx, px, GROUND_Y + 3, 30 + 150 * pr, 5 + 9 * pr, 'rgba(110,8,8,0.92)');
      ellipse(ctx, px - f * 20, GROUND_Y + 1, 12 + 80 * pr, 2 + 4 * pr, 'rgba(201,42,42,0.6)');
    }

    ctx.save();
    ctx.translate(this.cx, this.y + this.h - 104 * fall);
    if (fall) ctx.rotate(-f * fall * (Math.PI / 2 + 0.4)); // flat on his back, feet up
    ctx.scale(f * (1 + sq), 1 - sq);

    // Long gray hair behind the head.
    ellipse(ctx, -8, -158, 40, 36, c('#a8a8a8'));
    for (let i = 0; i < 7; i++) line(ctx, -30 + i * 6, -176, -40 + i * 5 + Math.sin(t * 0.05 + i) * 3, -122, c('#c4c4c4'), 3);

    // Back arm.
    ellipse(ctx, -66, -110 - bob, 17, 36, c('#5e5539'), 0.25);
    circle(ctx, -74, -78 - bob, 9, skin);

    // Legs (patched pants) and boots.
    fillRR(ctx, -40 - walk * 0.4, -66, 30, 50, 10, c('#7d7a5c'));
    fillRR(ctx, 10 + walk * 0.4, -66, 30, 50, 10, c('#7d7a5c'));
    rect(ctx, 14 + walk * 0.4, -52, 18, 15, c('#6c8ea4'));
    for (let i = 0; i < 4; i++) line(ctx, 15 + walk * 0.4 + i * 5, -54, 15 + walk * 0.4 + i * 5, -50, '#3d5466', 1);
    fillRR(ctx, -46 - walk * 0.4, -22, 38, 22, 7, c('#6b4423'));
    fillRR(ctx, 8 + walk * 0.4, -22, 42, 22, 7, c('#6b4423'));
    rect(ctx, -44 - walk * 0.4, -24, 34, 5, c('#553419')); rect(ctx, 10 + walk * 0.4, -24, 36, 5, c('#553419'));

    // Big body: olive jacket with the dirty hoodie belly poking out.
    ellipse(ctx, 0, -112 - bob, 72, 62, c('#6f6446'));
    ellipse(ctx, 10, -108 - bob, 48, 56 + jig, c('#a39b84'));
    fillRR(ctx, -12, -92 - bob, 48, 20, 8, c('#958d76'));
    circle(ctx, 22, -122 - bob, 6, 'rgba(90,70,40,0.35)'); circle(ctx, -2, -100 - bob, 5, 'rgba(90,70,40,0.35)');
    circle(ctx, 30, -84 - bob, 4, 'rgba(156,90,26,0.5)');
    line(ctx, 4, -152 - bob, 2, -128 - bob, '#e9ecef', 2); line(ctx, 20, -152 - bob, 22, -130 - bob, '#e9ecef', 2);
    line(ctx, -30, -162 - bob, -40, -64 - bob, c('#5a5139'), 3);

    // Badges, fuzzy dice, rubber chicken pocket.
    rect(ctx, -56, -150 - bob, 26, 12, c('#ffd43b'));
    for (let i = 0; i < 4; i++) line(ctx, -54 + i * 7, -140 - bob, -50 + i * 7, -148 - bob, '#222', 1.5);
    circle(ctx, -42, -126 - bob, 7, c('#f8f9fa'));
    ctx.strokeStyle = '#c92a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-42, -126 - bob, 7, 0, Math.PI * 2); ctx.stroke();
    circle(ctx, -54, -108 - bob, 5, c('#b08a3a')); circle(ctx, -46, -98 - bob, 3.5, c('#8fa3b0'));
    const sw = Math.sin(t * 0.1) * 4;
    line(ctx, -38, -118 - bob, -40 + sw, -100 - bob, '#ddd', 1.5);
    fillRR(ctx, -52 + sw, -102 - bob, 13, 13, 4, c('#ff8fab'));
    fillRR(ctx, -37 + sw, -98 - bob, 13, 13, 4, c('#ff8fab'));
    for (const [dx, dy] of [[-48, -98], [-43, -93], [-33, -94], [-28, -89]]) circle(ctx, dx + sw, dy - bob, 1.5, '#fff');
    line(ctx, 41, -136 - bob, 43, -160 - bob, c('#ffd60a'), 6);
    circle(ctx, 44, -164 - bob, 6.5, c('#ffd60a'));
    poly(ctx, [40, -170 - bob, 44, -176 - bob, 48, -169 - bob], '#e63946');
    poly(ctx, [50, -165 - bob, 57, -163 - bob, 50, -160 - bob], '#f08c00');
    circle(ctx, 46, -166 - bob, 1.3, '#111');
    fillRR(ctx, 30, -140 - bob, 24, 20, 3, c('#5e5539'));

    // Bullet holes.
    for (const w of this.wounds) {
      line(ctx, w.x, w.y - bob + 3, w.x + 1, w.y - bob + 5 + w.drip, '#a61e1e', 3);
      circle(ctx, w.x, w.y - bob, 5, '#7a0b0b'); circle(ctx, w.x, w.y - bob, 2.4, '#2b0000');
    }

    // Front arm: normal, raised (throwing), or holding the syrup bottle.
    if (this.bottle !== null) {
      ellipse(ctx, 50, -112, 16, 30, c('#5e5539'), -1.2);
      this.drawBottle(ctx, c, f);
      circle(ctx, 66, -112, 10, skin);
    } else if (this.armUp > 0) {
      ellipse(ctx, 56, -150, 16, 34, c('#5e5539'), -0.5);
      circle(ctx, 68, -184, 10, skin);
      this.drawNails(ctx, 68, -184, -Math.PI / 2);
    } else {
      ellipse(ctx, 62, -108 - bob, 17, 36, c('#5e5539'), -0.25);
      circle(ctx, 70, -76 - bob, 10, skin);
      this.drawNails(ctx, 70, -76 - bob, Math.PI / 2 - 0.3);
    }

    // Head.
    circle(ctx, 10, -178, 30, skin);
    circle(ctx, -14, -176, 7, skin);
    ctx.fillStyle = c('#8a7a5c'); ctx.beginPath(); ctx.arc(10, -186, 31, Math.PI, 0); ctx.fill();
    ellipse(ctx, 10, -212, 22, 10, c('#8a7a5c'));
    fillRR(ctx, -22, -194, 64, 12, 5, c('#7a6a4c'));
    for (let i = -18; i < 40; i += 6) line(ctx, i, -192, i, -184, '#6a5a3c', 1.5);
    if (this.mad) {
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 2; i++) circle(ctx, -6 + i * 30, -226 - ((t * 1.2 + i * 15) % 30), 8, '#f1f3f5');
      ctx.globalAlpha = 1;
    }
    // Bulging eyes that follow the player.
    const p = G.player;
    let lx = 1, ly = 0;
    if (p) { lx = (p.x + p.w / 2 - this.cx) * f; ly = p.y + 20 - (this.y + 14); }
    const la = this.state === 'dying' ? t * 0.3 : Math.atan2(ly, lx); // eyes roll while he staggers
    for (const ex of [2, 26]) {
      circle(ctx, ex, -175, 9.5, '#fff');
      if (this.dead) { line(ctx, ex - 6, -181, ex + 6, -169, '#111', 3); line(ctx, ex + 6, -181, ex - 6, -169, '#111', 3); continue; }
      line(ctx, ex - 8, -178, ex - 4, -176, '#ff8787', 1);
      circle(ctx, ex + Math.cos(la) * 4, -175 + Math.sin(la) * 4, 3.4, '#111');
    }
    const browTilt = this.mad ? 0.35 : -0.15;
    ellipse(ctx, 2, -189, 10, 3.5, c('#d0d0d0'), browTilt);
    ellipse(ctx, 26, -189, 10, 3.5, c('#d0d0d0'), -browTilt);
    ellipse(ctx, 37, -163, 9, 8, c('#d9967a'));
    circle(ctx, 39, -160, 1.8, '#7a3b2a');

    // Beard with bird nests (and eggs) living in it.
    ellipse(ctx, 10, -142, 36, 30, c('#8d8273'));
    ellipse(ctx, 14, -124, 26, 22, c('#8d8273'));
    for (let i = 0; i < 8; i++) line(ctx, -16 + i * 7, -150, -14 + i * 6 + Math.sin(t * 0.04 + i) * 2, -110, c('#b0a696'), 2);
    ellipse(ctx, 25, -156, 16, 6, c('#9d9282'));
    const open = this.dead ? 9 : this.mouth > 0 ? 5 + Math.abs(Math.sin(t * 0.5)) * 7 : 2;
    ellipse(ctx, 25, -149, 9, open, '#4a1414');
    if (this.dead) ellipse(ctx, 31, -139, 5, 10, '#e64980', -0.4); // tongue hanging out
    if (open > 4) { ellipse(ctx, 25, -149 + open * 0.5, 6, 3, '#d9536f'); rect(ctx, 21, -149 - open + 1, 4, 4, '#f1e3a0'); }
    if (this.mouth > 0) {
      ctx.globalAlpha = 0.7;
      line(ctx, 31, -146, 32, -140 + Math.sin(t * 0.2) * 6 + 8, '#bde0fe', 2.5);
      ctx.globalAlpha = 1;
    }
    for (const [nx, ny, eggs] of [[-4, -134, ['#ff8fab', '#74c0fc', '#8ce99a']], [30, -128, ['#ffd43b', '#ff8fab', '#74c0fc']]]) {
      ellipse(ctx, nx - 4, ny - 5, 4, 5, eggs[0]); ellipse(ctx, nx + 1, ny - 6, 4, 5, eggs[1]); ellipse(ctx, nx + 6, ny - 5, 4, 5, eggs[2]);
      ellipse(ctx, nx + 1, ny, 13, 6, c('#8b6b3e'));
      line(ctx, nx - 12, ny - 1, nx + 14, ny + 1, '#6b4e2a', 1.5); line(ctx, nx - 10, ny + 3, nx + 10, ny - 3, '#6b4e2a', 1.5);
    }
    // A few flies that just live near Bob.
    for (let i = 0; i < (this.dead ? 6 : 3); i++) {
      const a = t * 0.07 + i * 2.1;
      circle(ctx, 10 + Math.cos(a) * 55, -170 + Math.sin(a * 1.3) * 28, 2, '#222');
    }
    ctx.restore();
  }

  drawNails(ctx, hx, hy, dir) {
    for (let i = 0; i < 4; i++) {
      const a = dir + (i - 1.5) * 0.28;
      line(ctx, hx + Math.cos(a) * 7, hy + Math.sin(a) * 7, hx + Math.cos(a) * 17, hy + Math.sin(a) * 17, NAIL_COLORS[i], 3);
    }
  }

  drawBottle(ctx, c, f) {
    ctx.save(); ctx.translate(66, -112); ctx.rotate(this.bottle);
    fillRR(ctx, -16, -24, 80, 48, 16, c('#b5651d'));
    rect(ctx, -8, -20, 10, 40, 'rgba(255,255,255,0.25)');
    rect(ctx, 12, -16, 40, 32, c('#fff3e0'));
    ctx.save(); ctx.translate(32, 0); ctx.scale(f, 1);
    text(ctx, "BOB'S", 0, -6, { size: 9, color: '#7a3e10' });
    text(ctx, 'SYRUP', 0, 7, { size: 9, color: '#7a3e10' });
    ctx.restore();
    rect(ctx, 64, -9, 14, 18, c('#8a4a12'));
    rect(ctx, 78, -5, 12, 10, '#e9c46a');
    ctx.restore();
  }

  drawBubble(ctx) {
    if (!this.bubble || this.state === 'gone') return;
    const b = this.bubble, k = Math.min(1, (b.max - b.t) / 6);
    const bx = this.cx + this.face * 30, by = this.y - 46;
    ctx.save(); ctx.translate(bx, by); ctx.scale(k, k);
    ctx.font = `20px ${FONT}`;
    const tw = ctx.measureText(b.word).width + 28;
    fillRR(ctx, -tw / 2, -22, tw, 40, 14, '#fff');
    poly(ctx, [-this.face * 6 - 10, 16, -this.face * 6 + 10, 16, -this.face * 22, 36], '#fff');
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3; rr(ctx, -tw / 2, -22, tw, 40, 14); ctx.stroke();
    text(ctx, b.word, 0, -1, { size: 20, color: '#c92a2a' });
    ctx.restore();
  }
}
