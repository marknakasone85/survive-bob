'use strict';
// Heroes, weapons, bullets, grenades and pickups.

// The heroes themselves (and how they're drawn) live in heroes.js.

// type: 'bullet' (default), 'rocket' (explodes) or 'flame' (short-range fire).
// pellets > 1 fires an even spread (shotgun). muzzle = gun length from the shoulder.
const WEAPONS = {
  pistol:  { name: 'PISTOL', short: 'PISTOL', dmg: 3, cd: 15, speed: 13, spread: 0.03, color: '#ffe066', len: 12, w: 3, sfx: 'pistol', kick: 0, muzzle: 30 },
  rifle:   { name: 'RIFLE', short: 'RIFLE', dmg: 9, cd: 32, speed: 21, spread: 0, pierce: 2, color: '#ffffff', len: 26, w: 3, sfx: 'rifle', ammoPack: 20, kick: 2.5, muzzle: 48 },
  mg:      { name: 'MACHINE GUN', short: 'MG', dmg: 2, cd: 5, speed: 16, spread: 0.1, color: '#ff9f43', len: 10, w: 3, sfx: 'mg', ammoPack: 120, kick: 0.3, muzzle: 48 },
  shotgun: { name: 'SHOTGUN', short: 'SHOTGUN', dmg: 3, pellets: 6, cd: 40, speed: 14, speedVar: 0.15, spread: 0.32, life: 22, color: '#ff922b', len: 9, w: 4, sfx: 'shotgun', ammoPack: 16, kick: 3, muzzle: 46 },
  rocket:  { name: 'ROCKET LAUNCHER', short: 'ROCKETS', type: 'rocket', dmg: 6, cd: 55, speed: 7, spread: 0, life: 100, blast: 80, blastDmg: 14, sfx: 'rocket', ammoPack: 6, kick: 4, muzzle: 48 },
  flame:   { name: 'FLAMETHROWER', short: 'FLAME', type: 'flame', dmg: 2, cd: 4, speed: 8, speedVar: 0.25, spread: 0.14, pierce: 99, life: 30, sfx: 'flame', ammoPack: 200, kick: 0, muzzle: 42 },
  br:      { name: '.308 BATTLE RIFLE', short: '.308', dmg: 7, cd: 14, speed: 22, spread: 0.01, pierce: 3, color: '#fff3bf', len: 24, w: 3.5, sfx: 'br', kick: 1.5, muzzle: 52 },
  gl:      { name: 'GRENADE LAUNCHER', short: 'GL', type: 'lob', dmg: 4, cd: 40, speed: 13, spread: 0, life: 150, blast: 85, blastDmg: 14, sfx: 'gl', kick: 2, muzzle: 44 },
  lmg:     { name: 'BELT-FED LMG', short: 'LMG', dmg: 3, cd: 4, speed: 17, spread: 0.08, pierce: 2, color: '#ffa94d', len: 12, w: 3.5, sfx: 'lmg', kick: 0.4, muzzle: 56 },
};
const WEAPON_ORDER = ['pistol', 'rifle', 'mg', 'shotgun', 'rocket', 'flame', 'br', 'gl', 'lmg'];

// Launch angle that lobs a shot (speed v, gravity g) from (sx,sy) onto (tx,ty), or null if out of range.
function lobAngle(sx, sy, tx, ty, v, g) {
  const dx = tx - sx, up = sy - ty, v2 = v * v;
  const disc = v2 * v2 - g * (g * dx * dx + 2 * up * v2);
  if (disc < 0 || Math.abs(dx) < 1) return null;
  const th = Math.atan((v2 - Math.sqrt(disc)) / (g * Math.abs(dx)));
  return dx >= 0 ? -th : Math.PI + th;
}

function makePlayer(i) {
  const h = HEROES[i];
  return {
    hero: h, x: 80, y: GROUND_Y - 56, w: 30, h: 56, vx: 0, vy: 0, onGround: false, standOn: null,
    face: 1, aim: 0, hp: h.hp, maxHp: h.hp, inv: 0, weapon: 'pistol',
    owned: { pistol: true }, ammo: { rifle: 0, mg: 0, shotgun: 0, rocket: 0, flame: 0 },
    grenades: h.special === 'grenadier' ? 9 : 3, airJumps: 0, regenT: 0, nadeT: 0, gliding: false,
    cd: 0, nadeCd: 0, walkT: 0, drop: 0, recoil: 0, flashT: 0, coyote: 0, jumpBuf: 0, dead: false, deadT: 0,
  };
}
function saveLoadout(p) { return JSON.stringify({ weapon: p.weapon, owned: p.owned, ammo: p.ammo, grenades: p.grenades }); }
function loadLoadout(p, s) { Object.assign(p, JSON.parse(s)); }

function mouseAiming() { return G.t - Input.mouse.lastMove < 240; }

// Aim help: finds the enemy (or Bob) closest to where you're aiming, within `cone` radians.
function findTarget(p, angle, cone) {
  const cx = p.x + p.w / 2, cy = p.y + 25;
  let best = null, bestScore = Infinity;
  const consider = (tx, ty, ref) => {
    const dx = tx - cx, dy = ty - cy, d = Math.hypot(dx, dy);
    if (d > 820 || d < 10) return;
    let diff = Math.atan2(dy, dx) - angle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) > cone) return;
    const score = Math.abs(diff) * 300 + d * 0.5;
    if (score < bestScore) { bestScore = score; best = { x: tx, y: ty, ref, angle: Math.atan2(dy, dx) }; }
  };
  for (const e of G.enemies) if (e.hp > 0 && onScreen(e)) consider(e.x + e.w / 2, e.y + e.h / 2, e);
  if (G.boss && G.boss.canBeHit()) consider(G.boss.cx, G.boss.y + 90, G.boss);
  return best;
}

function updatePlayer(p) {
  const h = p.hero;
  const left = down('ArrowLeft', 'KeyA'), right = down('ArrowRight', 'KeyD');
  const heavyFire = p.weapon === 'lmg' && (down('KeyJ') || Input.mouse.down); // the LMG is heavy
  const speed = h.speed * (p.onGround && inPuddle(p) ? 0.45 : 1) * (heavyFire ? 0.6 : 1);
  p.vx += ((right - left) * speed - p.vx) * (p.onGround ? 0.35 : 0.2);

  const cx = p.x + p.w / 2, cy = p.y + 25;
  if (mouseAiming()) {
    p.aim = Math.atan2(Input.mouse.y - cy, Input.mouse.x + G.camX - cx);
    p.face = Math.cos(p.aim) >= 0 ? 1 : -1;
  } else {
    if (left && !right) p.face = -1; else if (right && !left) p.face = 1;
    p.aim = p.face > 0 ? 0 : Math.PI;
  }
  // Mouse players get a gentle nudge; keyboard players auto-aim at whatever is in front.
  const mouse = mouseAiming();
  p.lock = findTarget(p, p.aim, mouse ? 0.3 : 1.0);
  if (p.lock && !mouse) p.aim = p.lock.angle;

  // Jumping, with a little forgiveness (coyote time + jump buffer).
  p.coyote = p.onGround ? 7 : p.coyote - 1;
  if (p.onGround) p.airJumps = h.special === 'doubleJump' ? 1 : 0;
  p.jumpBuf = hit('Space', 'ArrowUp', 'KeyW') ? 8 : p.jumpBuf - 1;
  if (p.jumpBuf > 0 && p.coyote > 0) {
    p.vy = -h.jump; p.coyote = 0; p.jumpBuf = 0; SFX.jump();
    particles(cx, p.y + p.h, 5, '#ddd', { speed: 2, grav: 0.05 });
  } else if (p.jumpBuf > 0 && p.airJumps > 0) { // Bandit's double jump
    p.vy = -h.jump * 0.9; p.airJumps--; p.jumpBuf = 0; SFX.jump();
    particles(cx, p.y + p.h, 8, ['#fff', '#ced4da'], { speed: 2.5, grav: 0.05 });
  }
  const holdJump = down('Space', 'ArrowUp', 'KeyW');
  if (!holdJump && p.vy < -4) p.vy += 0.6;
  p.gliding = h.special === 'glide' && holdJump && !p.onGround && p.vy > 0.7; // Honk glides
  if (p.gliding) p.vy = 0.7;
  if (hit('ArrowDown', 'KeyS') && p.standOn && p.standOn.oneWay) p.drop = 12;
  if (p.drop > 0) p.drop--;
  const wasAir = !p.onGround, fallV = p.vy;
  moveActor(p, p.drop > 0);
  if (wasAir && p.onGround && fallV > 7) {
    SFX.land(); particles(p.x + p.w / 2, p.y + p.h, 6, '#d0d0d0', { speed: 2, grav: 0.05, lifeMul: 0.5 });
  }
  const minX = G.arenaLocked ? G.level.arenaX + 4 : 0;
  p.x = clamp(p.x, minX, G.level.length - p.w - 4);

  WEAPON_ORDER.forEach((w, i) => { if (hit('Digit' + (i + 1))) switchWeapon(p, w); });
  if (hit('KeyQ') || Input.wheel) cycleWeapon(p, Input.wheel < 0 ? -1 : 1);

  p.cd--; p.nadeCd--;
  if ((down('KeyJ') || Input.mouse.down) && p.cd <= 0) fire(p, p.lock ? p.lock.angle : p.aim);
  if (hit('KeyK', 'KeyG', 'Mouse2') && p.nadeCd <= 0) throwGrenade(p);

  if (p.inv > 0) p.inv--;
  if (p.flashT > 0) p.flashT--;
  if (h.special === 'regen' && p.hp < p.maxHp && ++p.regenT >= 480) {
    p.regenT = 0; p.hp++; floatText(cx, p.y - 12, '+1 HEART', '#ff8fab', 14);
  }
  if (h.special === 'grenadier' && p.grenades < 9 && ++p.nadeT >= 600) {
    p.nadeT = 0; p.grenades++; floatText(cx, p.y - 12, '+1 GRENADE', '#8ce99a', 13);
  }
  p.recoil *= 0.7;
  if (p.onGround && Math.abs(p.vx) > 0.5) {
    const before = Math.floor(p.walkT / Math.PI);
    p.walkT += Math.abs(p.vx) * 0.09;
    if (Math.floor(p.walkT / Math.PI) !== before) SFX.step();
  }
}

// Ammo is infinite: once you've found a gun, it's yours to use forever.
function canUse(p, w) { return !!p.owned[w]; }
function switchWeapon(p, w) {
  if (canUse(p, w)) { if (p.weapon !== w) SFX.select(); p.weapon = w; }
  else floatText(p.x + p.w / 2, p.y - 12, 'FIND THE ' + WEAPONS[w].name, '#ddd', 12);
}
function cycleWeapon(p, dir) {
  const N = WEAPON_ORDER.length;
  let i = WEAPON_ORDER.indexOf(p.weapon);
  for (let n = 0; n < N; n++) {
    i = (i + dir + N) % N;
    if (canUse(p, WEAPON_ORDER[i])) { switchWeapon(p, WEAPON_ORDER[i]); return; }
  }
}

function fire(p, angle) {
  const wpn = WEAPONS[p.weapon];
  p.cd = wpn.cd;
  const cx = p.x + p.w / 2, cy = p.y + 25;
  if (wpn.type === 'lob') {
    // Aim the arc so the grenade lands on the target (or the mouse, or a bit ahead of you).
    const tx = p.lock ? p.lock.x : mouseAiming() ? Input.mouse.x + G.camX : cx + p.face * 300;
    const ty = p.lock ? p.lock.y : mouseAiming() ? Input.mouse.y : GROUND_Y - 10;
    angle = lobAngle(cx, cy, tx, ty, wpn.speed, 0.35) ?? (tx >= cx ? -Math.PI / 4 : -Math.PI * 3 / 4);
  }
  const gx = cx + Math.cos(angle) * wpn.muzzle, gy = cy + Math.sin(angle) * wpn.muzzle;
  const n = wpn.pellets || 1, life = wpn.life || 60;
  for (let i = 0; i < n; i++) {
    const a = n > 1 ? angle + (i / (n - 1) - 0.5) * wpn.spread + rand(-0.03, 0.03) : angle + rand(-wpn.spread, wpn.spread);
    const sp = wpn.speed * (wpn.speedVar ? rand(1 - wpn.speedVar, 1 + wpn.speedVar) : 1);
    G.bullets.push({ type: wpn.type || 'bullet', x: gx, y: gy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: wpn.dmg,
      pierce: wpn.pierce || 1, color: wpn.color, len: wpn.len, w: wpn.w, life, max: life, hit: new Set(),
      blast: wpn.blast, blastDmg: wpn.blastDmg });
  }
  const isFlame = wpn.type === 'flame';
  if (!isFlame) particles(gx, gy, n > 1 ? 8 : 3, ['#fff3a0', '#ffb703'], { speed: n > 1 ? 4 : 2, grav: 0, lifeMul: 0.3 });
  SFX[wpn.sfx]();
  p.recoil = isFlame ? 1 : 5; p.flashT = isFlame ? 0 : 3;
  p.vx -= Math.cos(angle) * wpn.kick;
  // Empty shell casings fly out and bounce on the ground.
  if (!wpn.type) {
    G.particles.push({ x: cx, y: cy - 2, vx: -p.face * rand(1, 2.5), vy: -rand(3, 5), life: 70, max: 70,
      color: p.weapon === 'shotgun' ? '#e03131' : '#e0b04a', size: 3, grav: 0.35 });
  }
  if (wpn.type === 'rocket' || wpn.type === 'lob') particles(gx, gy, 10, ['#adb5bd', '#dee2e6', '#ffa94d'], { speed: 2.5, grav: -0.02, sizeMul: 1.8 });
}

function throwGrenade(p) {
  if (p.grenades <= 0) { floatText(p.x + p.w / 2, p.y - 14, 'NO GRENADES', '#ddd', 12); p.nadeCd = 20; return; }
  p.grenades--; p.nadeCd = 30;
  const a = mouseAiming() ? p.aim : (p.face > 0 ? -0.5 : Math.PI + 0.5);
  G.grenades.push({ x: p.x + p.w / 2 - 5, y: p.y + 14, w: 10, h: 10,
    vx: Math.cos(a) * 10.5 + p.vx * 0.5, vy: Math.sin(a) * 10.5 - 3.5, fuse: 85, rot: 0 });
  SFX.throwIt();
}

// Splinter colors when a shot passes through cover.
const SPLINTERS = {
  hay: ['#d9b44a', '#b8922c'], crate: ['#a87a45', '#6e4a22'], barrel: ['#8b4a2b', '#555'], stump: ['#6b4f3a', '#a68a64'],
  cactus: ['#2f9e44', '#237a35'], trashbags: ['#1f1f1f', '#444'], dumpster: ['#2b8a3e', '#ccc'], oldcar: ['#a0522d', '#ccc'],
  tirestack: ['#222', '#555'], toaster: ['#c9d1d6', '#fff'], cereal: ['#e63946', '#ffd166'], jar: ['#b47828', '#fff'],
};

function updateBullets() {
  for (const b of G.bullets) {
    const flame = b.type === 'flame', rocket = b.type === 'rocket', lob = b.type === 'lob';
    if (lob) {
      b.vy += 0.35; b.rot = (b.rot || 0) + 0.3;
      if (G.t % 3 === 0) particles(b.x, b.y, 1, ['#ced4da'], { speed: 0.4, grav: -0.02, lifeMul: 0.5 });
    } else if (rocket) {
      if (Math.hypot(b.vx, b.vy) < 15) { b.vx *= 1.07; b.vy *= 1.07; }
      if (G.t % 2 === 0) particles(b.x - b.vx, b.y - b.vy, 1, ['#adb5bd', '#dee2e6'], { speed: 0.6, grav: -0.02, lifeMul: 0.8, sizeMul: 1.8 });
    } else if (flame) {
      b.vx *= 0.94; b.vy = b.vy * 0.94 - 0.08;
    } else {
      // Bullets curve a little toward nearby flies and birds.
      for (const e of G.enemies) {
        if ((e.type !== 'fly' && e.type !== 'bird') || e.hp <= 0 || b.hit.has(e)) continue;
        const dx = e.x + e.w / 2 - b.x, dy = e.y + e.h / 2 - b.y;
        if (dx * dx + dy * dy > 110 * 110) continue;
        const sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx);
        let diff = Math.atan2(dy, dx) - cur; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        if (Math.abs(diff) < 1.2) { const na = cur + clamp(diff, -0.15, 0.15); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; }
        break;
      }
    }
    for (let step = 0; step < 2 && b.life > 0; step++) {
      b.x += b.vx / 2; b.y += b.vy / 2;
      for (const s of G.solids) {
        if (s.oneWay || !(b.x > s.x && b.x < s.x + s.w && b.y > s.y && b.y < s.y + s.h)) continue;
        if (s.style === 'ground') {
          b.life = 0;
          if (!flame && !rocket && !lob) particles(b.x, b.y, 4, '#ffe8a3', { speed: 2 });
          break;
        }
        // Crates, barrels, cars... aren't bulletproof: shots go straight through, with splinters.
        if (!b.hit.has(s)) {
          b.hit.add(s);
          if (!flame) particles(b.x, b.y, 6, SPLINTERS[s.style] || ['#adb5bd', '#868e96'], { speed: 3 });
        }
      }
      if (b.life <= 0) break;
      const r = flame ? 6 + (1 - b.life / b.max) * 14 : rocket ? 8 : lob ? 7 : 5;
      const box = { x: b.x - r, y: b.y - r, w: r * 2, h: r * 2 };
      for (const e of G.enemies) {
        if (e.hp > 0 && !b.hit.has(e) && overlap(box, e)) {
          // Some enemies (shields, armor) can block a shot: ENEMY_TYPES[type].block(e, b) returns true.
          const blk = ENEMY_TYPES[e.type] && ENEMY_TYPES[e.type].block;
          if (blk && blk(e, b)) {
            b.hit.add(e); b.life = 0;
            if (!flame) { particles(b.x, b.y, 5, ['#fff3bf', '#ffd43b', '#fff'], { speed: 3 }); SFX.clink(); }
            break;
          }
          b.hit.add(e); damageEnemy(e, b.dmg, flame);
          if (--b.pierce <= 0) { b.life = 0; break; }
        }
      }
      const boss = G.boss;
      if (b.life > 0 && boss && !b.hit.has(boss) && overlap(box, boss.hitbox()) && boss.hurt(b.dmg, flame)) {
        b.hit.add(boss);
        if (!flame) { SFX.hit(); particles(b.x, b.y, 5, ['#8a8f6a', '#c8b88a', '#fff'], { speed: 3 }); }
        if (--b.pierce <= 0) b.life = 0;
      }
    }
    b.life--;
    // Rockets and launcher grenades blow up when they hit something or run out of time.
    if ((rocket || lob) && b.life <= 0 && !b.exploded) { b.exploded = true; explode(b.x, b.y, b.blast, b.blastDmg); }
  }
  G.bullets = G.bullets.filter(b => b.life > 0 && b.x > G.camX - 60 && b.x < G.camX + W + 60 && b.y > -60 && b.y < H);
}

function updateGrenades() {
  for (const g of G.grenades) {
    g.vy += 0.42; g.rot += g.vx * 0.08;
    g.x += g.vx;
    for (const s of G.solids) if (!s.oneWay && overlap(g, s)) { g.x -= g.vx; g.vx *= -0.5; }
    const prevB = g.y + g.h;
    g.y += g.vy;
    for (const s of G.solids) {
      if (overlap(g, s) && g.vy > 0 && (!s.oneWay || prevB <= s.y + 0.5)) {
        g.y = s.y - g.h; g.vy = Math.abs(g.vy) > 2 ? -g.vy * 0.45 : 0; g.vx *= 0.75;
      }
    }
    let boom = --g.fuse <= 0;
    for (const e of G.enemies) if (e.hp > 0 && overlap(g, e)) boom = true;
    if (G.boss && G.boss.canBeHit() && overlap(g, G.boss.hitbox())) boom = true;
    if (boom) { g.dead = true; explode(g.x + 5, g.y + 5, 95, 15); }
  }
  G.grenades = G.grenades.filter(g => !g.dead);
}

function explode(x, y, r, dmg) {
  G.explosions.push({ x, y, r, t: 0 });
  particles(x, y, 26, ['#ffb703', '#fb8500', '#ffd166', '#6c757d'], { speed: 7, grav: 0.15, sizeMul: 1.6 });
  shake(12); SFX.boom();
  G.flash = Math.max(G.flash || 0, 0.3);
  for (const e of G.enemies) if (e.hp > 0 && circleHitsRect(x, y, r, e)) damageEnemy(e, dmg);
  if (G.boss && circleHitsRect(x, y, r, G.boss.hitbox())) G.boss.hurt(Math.round(dmg * 0.8));
}

function hurtPlayer(dmg, fromX) {
  const p = G.player;
  if (!p || p.inv > 0 || p.dead || G.state !== 'play') return;
  const sp = p.hero.special;
  if (sp === 'shell' && Math.random() < 1 / 3) { // Dillo's shell
    p.inv = 30; floatText(p.x + p.w / 2, p.y - 10, 'BLOCKED!', '#ffd43b', 16); SFX.hit(); return;
  }
  p.hp -= dmg; p.inv = sp === 'playDead' ? 200 : 90;
  if (sp !== 'tough') { p.vx = (p.x + p.w / 2 < fromX) ? -6 : 6; p.vy = -5; }
  shake(6); SFX.hurt();
  floatText(p.x + p.w / 2, p.y - 10, '-' + dmg, '#ff6b6b', 18);
  particles(p.x + p.w / 2, p.y + 20, 8, '#ff6b6b', { speed: 3 });
  if (p.hp <= 0) {
    p.hp = 0; p.dead = true; p.deadT = 0; G.deadTimer = 110; SFX.sad();
    if (G.boss) G.boss.say('HEH HEH HUH', 90);
  }
}

function inPuddle(p) {
  for (const d of G.puddles) if (p.x + p.w > d.x && p.x < d.x + d.w && p.y + p.h >= GROUND_Y - 1) return true;
  return false;
}

function updatePickups() {
  const p = G.player;
  for (const pk of G.pickups) {
    moveActor(pk);
    if (!p.dead && overlap(pk, p)) { pk.taken = true; applyPickup(p, pk.type, pk.x + pk.w / 2, pk.y); }
  }
  G.pickups = G.pickups.filter(pk => !pk.taken);
}
function applyPickup(p, type, x, y) {
  SFX.pickup();
  let msg = '';
  if (WEAPONS[type] && type !== 'pistol') {
    const w = WEAPONS[type];
    if (!p.owned[type]) {
      p.owned[type] = true; p.weapon = type; msg = w.name + '!';
      G.banner = { text: `NEW: ${w.name}! (KEY ${WEAPON_ORDER.indexOf(type) + 1})`, t: 130 };
      SFX.fanfare();
    } else { p.grenades = Math.min(9, p.grenades + 1); msg = '+1 GRENADE'; }
  } else if (type === 'ammo') {
    // Guns never run out now, so ammo boxes hold grenades instead.
    p.grenades = Math.min(9, p.grenades + 2); msg = '+2 GRENADES';
  } else if (type === 'nade') {
    p.grenades = Math.min(9, p.grenades + 3); msg = '+3 GRENADES';
  } else if (type === 'pie') {
    p.hp = Math.min(p.maxHp, p.hp + 5); msg = '+5 HP (PIE!)';
  }
  floatText(x, y - 10, msg, '#fff3a0', 16, 70);
  G.score += 5;
}

// ---- Drawing -------------------------------------------------------------
function drawPlayer(ctx, p) {
  const h = p.hero, cx = p.x + p.w / 2, top = p.y, by = p.y + p.h, f = p.face;
  if (!p.dead && p.inv > 0 && Math.floor(p.inv / 4) % 2 === 0) return;
  ctx.save();
  if (p.dead) {
    ctx.translate(cx, by - 8); ctx.rotate(-f * Math.PI / 2 * Math.min(1, p.deadT / 20)); ctx.translate(-cx, -(by - 8));
  }
  const moving = p.onGround && Math.abs(p.vx) > 0.5;
  const sw = moving ? Math.sin(p.walkT) * 0.7 : (p.onGround ? 0 : 0.5);
  const lift = p.onGround ? 0 : -4;
  const [sleeve, hand] = (HERO_ART[h.kind] || HERO_ART.human)(ctx, p, cx, top, by, f, sw, lift);

  ctx.save();
  ctx.translate(cx, top + 25); ctx.rotate(p.aim);
  if (Math.cos(p.aim) < 0) ctx.scale(1, -1);
  const r = -p.recoil;
  line(ctx, 0, 0, 14 + r, 0, sleeve, 7);
  circle(ctx, 15 + r, 1, 4, hand);
  if (!p.dead) {
    drawGun(ctx, p.weapon, r);
    if (p.flashT > 0) circle(ctx, WEAPONS[p.weapon].muzzle + 2 + r, -1, p.weapon === 'shotgun' ? 10 : 7, '#fff3a0');
  }
  ctx.restore();
  ctx.restore();
}
function drawGun(ctx, w, r) {
  if (w === 'pistol') { rect(ctx, 12 + r, -5, 17, 6, '#2b2d42'); rect(ctx, 13 + r, 0, 5, 8, '#2b2d42'); }
  else if (w === 'rifle') { rect(ctx, 2 + r, -4, 16, 7, '#7f5539'); rect(ctx, 16 + r, -4, 32, 5, '#343a40'); rect(ctx, 26 + r, -8, 9, 4, '#212529'); }
  else if (w === 'mg') {
    rect(ctx, 6 + r, -7, 30, 12, '#343a40'); rect(ctx, 36 + r, -4, 14, 5, '#212529');
    for (let i = 0; i < 4; i++) rect(ctx, 12 + r + i * 4, 5 + i * 1.5, 3, 5, '#e0b04a');
  } else if (w === 'shotgun') {
    rect(ctx, 2 + r, -4, 14, 8, '#7f5539');
    rect(ctx, 16 + r, -5, 30, 3, '#343a40'); rect(ctx, 16 + r, -2, 30, 3, '#495057');
    rect(ctx, 22 + r, 1, 12, 4, '#5c3d22');
  } else if (w === 'rocket') {
    fillRR(ctx, -10 + r, -8, 56, 13, 4, '#5c940d');
    rect(ctx, 42 + r, -9, 5, 15, '#2b8a3e'); rect(ctx, -2 + r, -8, 4, 13, '#ffd43b');
    rect(ctx, 14 + r, -12, 6, 4, '#333'); rect(ctx, 12 + r, 4, 5, 7, '#333');
  } else if (w === 'flame') {
    fillRR(ctx, 2 + r, 2, 16, 10, 4, '#e03131');
    rect(ctx, 8 + r, -4, 32, 6, '#868e96'); rect(ctx, 36 + r, -5, 5, 8, '#495057');
    circle(ctx, 43 + r, -1, 2.5 + Math.random(), '#4dabf7');
  } else if (w === 'br') { // .308 battle rifle: wood stock, black receiver, box mag, long barrel
    rect(ctx, 0 + r, -4, 14, 8, '#6b4f3a');
    rect(ctx, 14 + r, -5, 20, 8, '#2b2d42'); rect(ctx, 21 + r, 3, 6, 9, '#343a40');
    rect(ctx, 34 + r, -3, 18, 3, '#212529'); rect(ctx, 48 + r, -7, 2, 4, '#212529');
    rect(ctx, 18 + r, -9, 10, 4, '#495057');
  } else if (w === 'gl') { // grenade launcher: fat tube and a revolving drum
    fillRR(ctx, 4 + r, -7, 36, 12, 4, '#495057'); rect(ctx, 38 + r, -8, 6, 14, '#343a40');
    circle(ctx, 16 + r, 3, 8, '#5c636a');
    for (let i = 0; i < 5; i++) circle(ctx, 16 + r + Math.cos(i * 1.26) * 5, 3 + Math.sin(i * 1.26) * 5, 1.5, '#3e6b2f');
    rect(ctx, 10 + r, 6, 5, 8, '#333');
  } else if (w === 'lmg') { // belt-fed LMG: big receiver, holey barrel, bipod, ammo box and belt
    rect(ctx, 2 + r, -6, 32, 11, '#343a40'); rect(ctx, 2 + r, -3, 8, 8, '#495057');
    rect(ctx, 34 + r, -3, 24, 5, '#212529');
    for (let i = 0; i < 4; i++) circle(ctx, 38 + r + i * 5, -0.5, 1, '#868e96');
    line(ctx, 48 + r, 2, 44 + r, 12, '#212529', 2); line(ctx, 48 + r, 2, 52 + r, 12, '#212529', 2);
    rect(ctx, 10 + r, 5, 13, 11, '#556b2f');
    for (let i = 0; i < 4; i++) rect(ctx, 20 + r + i * 3, 3 - i * 2, 3, 4, '#e0b04a');
  }
}
function drawBullets(ctx) {
  for (const b of G.bullets) {
    if (b.type === 'rocket') {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
      circle(ctx, -15, 0, 5 + Math.random() * 3, '#ffa94d'); circle(ctx, -13, 0, 3, '#fff3bf');
      poly(ctx, [-12, -4, -17, -9, -7, -4], '#2b8a3e'); poly(ctx, [-12, 4, -17, 9, -7, 4], '#2b8a3e');
      fillRR(ctx, -12, -4, 20, 8, 3, '#5c940d');
      poly(ctx, [8, -4, 15, 0, 8, 4], '#e03131');
      ctx.restore();
    } else if (b.type === 'lob') {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot || 0);
      fillRR(ctx, -7, -5, 14, 10, 4, '#3e6b2f'); rect(ctx, -2, -5, 3, 10, '#ffd43b');
      ctx.restore();
    } else if (b.type === 'flame') {
      const k = 1 - b.life / b.max;
      ctx.globalAlpha = Math.max(0, 0.95 - k * 0.75);
      circle(ctx, b.x, b.y, 7 + k * 17, k < 0.2 ? '#ffe066' : k < 0.45 ? '#ff922b' : k < 0.75 ? '#f03e3e' : '#868e96');
      if (k < 0.6) circle(ctx, b.x, b.y, 3 + k * 6, '#fff3bf');
      ctx.globalAlpha = 1;
    } else {
      const sp = Math.hypot(b.vx, b.vy) || 1;
      line(ctx, b.x - b.vx / sp * b.len, b.y - b.vy / sp * b.len, b.x, b.y, b.color, b.w);
    }
  }
}
function drawGrenades(ctx) {
  for (const g of G.grenades) {
    ctx.save(); ctx.translate(g.x + 5, g.y + 5); ctx.rotate(g.rot);
    circle(ctx, 0, 0, 7, '#3e6b2f'); rect(ctx, -2, -11, 4, 5, '#999');
    if (g.fuse < 30 && g.fuse % 6 < 3) circle(ctx, 0, 0, 3, '#ff4d4d');
    ctx.restore();
  }
}
function drawExplosions(ctx) {
  for (const e of G.explosions) {
    const k = e.t / 22;
    ctx.globalAlpha = 1 - k;
    circle(ctx, e.x, e.y, e.r * (0.4 + k * 0.7), '#ffb703');
    circle(ctx, e.x, e.y, e.r * (0.25 + k * 0.5), '#fff3b0');
    ctx.globalAlpha = 1;
  }
}
