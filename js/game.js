'use strict';
// Main loop, input, game states, HUD and menus.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Load the game fonts right away: text drawn only on a canvas doesn't always make the browser fetch them.
if (document.fonts) for (const f of ["16px 'Bungee'", "500 16px 'Rubik'", "800 16px 'Rubik'"]) document.fonts.load(f).catch(() => {});

// ---- Input ---------------------------------------------------------------
const Input = { keys: {}, pressed: {}, mouse: { x: W / 2, y: H / 2, down: false, lastMove: -9999 }, wheel: 0 };
function down(...c) { return c.some(k => Input.keys[k]); }
function hit(...c) { return c.some(k => Input.pressed[k]); }
const NO_SCROLL = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
addEventListener('keydown', e => {
  G.touchMode = false; // a real keyboard: show keyboard controls
  if (!Input.keys[e.code]) Input.pressed[e.code] = true;
  Input.keys[e.code] = true;
  if (NO_SCROLL.includes(e.code)) e.preventDefault();
  SFX.unlock();
});
addEventListener('keyup', e => { Input.keys[e.code] = false; });
addEventListener('blur', () => { Input.keys = {}; Input.mouse.down = false; if (G.state === 'play') setState('paused'); });
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  Input.mouse.x = (e.clientX - r.left) * W / r.width;
  Input.mouse.y = (e.clientY - r.top) * H / r.height;
}
// Phones also send pretend mouse clicks after a tap; ignore those so a tap only counts once.
let lastTouch = -1e9;
const fromTouch = () => performance.now() - lastTouch < 800;
canvas.addEventListener('mousemove', e => { if (fromTouch()) return; toCanvas(e); Input.mouse.lastMove = G.t; });
canvas.addEventListener('mousedown', e => {
  if (fromTouch()) return;
  toCanvas(e); Input.mouse.lastMove = G.t; SFX.unlock();
  if (e.button === 0) { Input.mouse.down = true; Input.pressed.Mouse0 = true; }
  if (e.button === 2) { Input.pressed.Mouse2 = true; Input.keys.Mouse2 = true; }
});
addEventListener('mouseup', e => {
  if (fromTouch()) return;
  if (e.button === 0) Input.mouse.down = false;
  if (e.button === 2) Input.keys.Mouse2 = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ---- Touch (phones and tablets) ----
// Touching the game screen aims and shoots at that spot; menus work by tapping.
G.touchMode = matchMedia('(pointer: coarse)').matches;
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return; // the mouse is handled above
  e.preventDefault(); lastTouch = performance.now(); G.touchMode = true; SFX.unlock();
  toCanvas(e); Input.mouse.id = e.pointerId; Input.mouse.lastMove = G.t;
  Input.mouse.down = true; Input.pressed.Mouse0 = true;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' && e.pointerId === Input.mouse.id) { toCanvas(e); Input.mouse.lastMove = G.t; }
});
const touchEnd = e => {
  if (e.pointerType !== 'touch') return;
  lastTouch = performance.now(); SFX.unlock();
  if (e.pointerId === Input.mouse.id) { Input.mouse.down = false; Input.mouse.id = null; Input.mouse.lastMove = -99999; }
};
canvas.addEventListener('pointerup', touchEnd);
canvas.addEventListener('pointercancel', touchEnd);

// The on-screen buttons press the same "keys" the keyboard does.
const touchUI = document.getElementById('touch');
const gunBtn = document.getElementById('bGun');
const touchButtons = touchUI ? [...touchUI.querySelectorAll('[data-key]')] : [];
for (const b of touchButtons) {
  const code = b.dataset.key;
  b.addEventListener('pointerdown', e => {
    e.preventDefault(); lastTouch = performance.now(); G.touchMode = e.pointerType !== 'mouse' || G.touchMode; SFX.unlock();
    try { b.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    if (!Input.keys[code]) Input.pressed[code] = true;
    Input.keys[code] = true;
    Input.mouse.lastMove = -99999; // buttons use auto-aim, not the last tap
    b.classList.add('on');
  });
  const release = () => { Input.keys[code] = false; b.classList.remove('on'); SFX.unlock(); };
  b.addEventListener('pointerup', release);
  b.addEventListener('pointercancel', release);
  b.addEventListener('lostpointercapture', release);
  b.addEventListener('contextmenu', e => e.preventDefault());
}
// Show the buttons only while playing on a touch screen; the GUN button shows your current gun.
function updateTouchUI() {
  if (!touchUI) return;
  const show = G.touchMode && (G.state === 'play' || G.state === 'intro');
  if (touchUI.hidden === show) {
    touchUI.hidden = !show;
    if (!show) for (const b of touchButtons) { Input.keys[b.dataset.key] = false; b.classList.remove('on'); }
  }
  if (show && G.player) {
    const s = WEAPONS[G.player.weapon].short;
    if (gunBtn.dataset.w !== s) { gunBtn.dataset.w = s; gunBtn.innerHTML = `GUN<small>${s}</small>`; }
  }
}
document.addEventListener('contextmenu', e => { if (G.touchMode) e.preventDefault(); });
canvas.addEventListener('wheel', e => { Input.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

// ---- Level flow ----------------------------------------------------------
const titleBob = new Bob({ arenaX: 0, bobSpeed: 1, bobAttacks: [] });
titleBob.x = 450; titleBob.state = 'idle'; titleBob.noiseT = 60;
const posterBob = new Bob({ arenaX: 0, bobSpeed: 1, bobAttacks: [] }); // his mugshot on the WANTED poster
posterBob.state = 'idle';

G.startAt = 0;      // story level picked on the level screen (always starts on level 1)
G.mode = 'story';   // 'story' (the campaign) or 'waves'
G.menuMode = 0;     // which button is highlighted on the title screen
G.mapIdx = 0;       // map picked for waves mode

function newGame() {
  if (G.mode === 'waves') { startWaves(G.mapIdx); return; }
  G.player = makePlayer(G.heroIndex);
  const p = G.player, s = G.startAt;
  // Starting later? Hand over every gun you'd have found in the earlier levels.
  for (const L of LEVELS.slice(0, s)) for (const [, type] of L.pickups) if (WEAPONS[type]) p.owned[type] = true;
  p.grenades = Math.min(9, p.grenades + s);
  G.score = 0; G.startTime = G.t;
  startLevel(s);
}

function startLevel(i, waves = false) {
  if (i >= LEVELS.length) { setState('win'); return; }
  G.levelIndex = i;
  const L = G.level = LEVELS[i];
  L.arenaX = L.length - W;
  G.solids = [{ x: -600, y: GROUND_Y, w: L.length + 1200, h: 200, oneWay: false, style: 'ground' }];
  for (const [x, y, w, style] of L.platforms) G.solids.push({ x, y, w, h: 14, oneWay: true, style });
  for (const [x, w, h, style] of L.blocks) G.solids.push({ x, y: GROUND_Y - h, w, h, oneWay: false, style });
  G.bullets = []; G.ebullets = []; G.grenades = []; G.enemies = []; G.particles = [];
  G.texts = []; G.explosions = []; G.puddles = [];
  G.pickups = L.pickups.map(([x, type]) => ({ x, y: 60, w: 34, h: 30, vx: 0, vy: 0, type, bob: Math.random() * 6 }));
  for (const [x, w] of L.mud || []) G.puddles.push({ x, w, life: Infinity, mud: true }); // mud pits slow you down
  G.spawns = [...L.spawns].sort((a, b) => a[0] - b[0]); G.spawnIdx = 0;
  G.boss = null; G.arenaLocked = false; G.bossDoneT = 0; G.banner = null; G.levelT = 0; G.checkpoint = null; G.flash = 0;
  const p = G.player;
  Object.assign(p, { x: 80, y: GROUND_Y - p.h, vx: 0, vy: 0, hp: p.maxHp, inv: 0, dead: false, deadT: 0, face: 1 });
  G.loadout = saveLoadout(p);
  G.camX = 0;
  setState('intro');
}
// If Bob beat you, you try again right at the Bob fight (with the guns you had then).
function retryLevel() {
  if (G.mode === 'waves') { startWaves(G.levelIndex); return; }
  const cp = G.checkpoint;
  loadLoadout(G.player, cp || G.loadout);
  startLevel(G.levelIndex);
  if (cp) {
    const L = G.level;
    G.player.x = L.arenaX + 200; G.camX = L.arenaX; G.spawnIdx = G.spawns.length;
    G.checkpoint = cp;
  }
}

// ---- Update --------------------------------------------------------------
function update() {
  G.t++; G.stateT++;
  const go = hit('Enter', 'Space', 'Mouse0');
  switch (G.state) {
    case 'title': {
      titleBob.idleAnim();
      if (hit('ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'ArrowUp', 'ArrowDown')) { G.menuMode = 1 - G.menuMode; SFX.select(); }
      const tapped = hit('Mouse0') ? titleButtonAt(Input.mouse.x, Input.mouse.y) : -1;
      if (tapped >= 0) G.menuMode = tapped;
      if (tapped >= 0 || hit('Enter', 'Space')) { G.mode = G.menuMode === 1 ? 'waves' : 'story'; SFX.select(); setState('select'); }
      break;
    }
    case 'select': updateSelect(); break;
    case 'levels': updateLevels(); break;
    case 'intro':
      updateFx();
      if (G.stateT > 170 || (G.stateT > 20 && go)) setState('play');
      break;
    case 'play': updatePlay(); break;
    case 'paused': updatePaused(); break;
    case 'levelDone':
      if (G.stateT === 1) SFX.fanfare();
      updateFx();
      if (G.stateT > 40 && go) startLevel(G.levelIndex + 1);
      break;
    case 'gameover':
      if (G.stateT > 40 && hit('Enter', 'Mouse0')) retryLevel();
      if (hit('Escape')) setState('title');
      break;
    case 'win':
      updateFx();
      if (G.boss) G.boss.update(); // flies keep buzzing around Bob
      if (G.stateT === 1) SFX.fanfare();
      if (G.stateT > 60 && go) setState('title');
      break;
  }
  if (hit('KeyM')) floatText(G.camX + W / 2, 120, SFX.toggleMute() ? 'SOUND OFF' : 'SOUND ON', '#fff', 18);
  if (hit('KeyN')) floatText(G.camX + W / 2, 140, Music.toggle() ? 'MUSIC ON' : 'MUSIC OFF', '#fff', 18);
  updateMusic();
  updateTouchUI();
  Input.pressed = {}; Input.wheel = 0;
}

// Picks the song for what's happening right now.
function updateMusic() {
  let want = null, tempo = 1;
  const b = G.boss, bossOn = b && ['enter', 'idle', 'toss', 'slam', 'slamAir', 'burp', 'summon', 'disco', 'spray', 'rain'].includes(b.state);
  switch (G.state) {
    case 'title': case 'select': case 'levels': want = 'title'; break;
    case 'intro': case 'play': case 'paused':
      if (bossOn) { want = 'boss'; tempo = Math.min(1.3, 1 + G.levelIndex * 0.03) * (b.mad ? 1.12 : 1); }
      else if (b && (b.state === 'dying' || b.state === 'dead')) want = null; // dead silence
      else want = G.level.music;
      break;
    case 'win': want = G.stateT > 150 ? 'win' : null; break;
  }
  Music.play(want);
  Music.setTempo(tempo);
  Music.setPaused(G.state === 'paused');
}

// Title screen buttons: STORY and WAVES.
const TITLE_BTNS = [{ x: 82, y: 266, w: 140, h: 50, label: 'STORY' }, { x: 238, y: 266, w: 140, h: 50, label: 'WAVES' }];
function titleButtonAt(mx, my) { return TITLE_BTNS.findIndex(b => mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h); }

// Hero cards: a 5 x 2 grid.
const CARD = { cols: 5, w: 168, h: 150, x0: 40, y0: 78, gap: 10 };
const cardPos = i => ({ x: CARD.x0 + (i % CARD.cols) * (CARD.w + CARD.gap), y: CARD.y0 + Math.floor(i / CARD.cols) * (CARD.h + CARD.gap) });
function cardAt(mx, my) {
  return HEROES.findIndex((h, i) => { const c = cardPos(i); return mx > c.x && mx < c.x + CARD.w && my > c.y && my < c.y + CARD.h; });
}
function updateSelect() {
  const N = HEROES.length, R = CARD.cols;
  if (hit('ArrowLeft', 'KeyA')) { G.heroIndex = (G.heroIndex + N - 1) % N; SFX.select(); }
  if (hit('ArrowRight', 'KeyD')) { G.heroIndex = (G.heroIndex + 1) % N; SFX.select(); }
  if (hit('ArrowUp', 'KeyW', 'ArrowDown', 'KeyS')) { G.heroIndex = (G.heroIndex + R) % N; SFX.select(); }
  let next = hit('Enter', 'Space');
  if (hit('Mouse0')) {
    const c = cardAt(Input.mouse.x, Input.mouse.y);
    if (c === G.heroIndex) next = true; else if (c >= 0) { G.heroIndex = c; SFX.select(); }
    else if (heroNextAt(Input.mouse.x, Input.mouse.y)) next = true;
  }
  if (next) { SFX.select(); setState('levels'); return; }
  if (hit('Escape')) setState('title');
}
// The NEXT button under the hero cards.
const HERO_NEXT = { x: W / 2 - 110, y: 446, w: 220, h: 42 };
const heroNextAt = (mx, my) => mx > HERO_NEXT.x && mx < HERO_NEXT.x + HERO_NEXT.w && my > HERO_NEXT.y && my < HERO_NEXT.y + HERO_NEXT.h;

// Level screen (after the hero): every level (or waves map) as a picture. Tap one, then tap it again or PLAY.
const LEVEL_BTNS = [{ label: 'BACK', x: 300 }, { label: 'PLAY', x: 490 }];
function levelBtnAt(mx, my) {
  const y = pauseBtnY();
  return my > y && my < y + 42 ? LEVEL_BTNS.findIndex(b => mx > b.x && mx < b.x + 170) : -1;
}
function updateLevels() {
  const n = LEVELS.length, waves = G.mode === 'waves';
  if (G.stateT === 1) G.levelSel = waves ? G.mapIdx : 0; // story always starts on level 1
  const move = (hit('ArrowRight', 'KeyD') ? 1 : 0) - (hit('ArrowLeft', 'KeyA') ? 1 : 0) + (hit('ArrowDown', 'KeyS') ? PGRID.cols : 0) - (hit('ArrowUp', 'KeyW') ? PGRID.cols : 0);
  if (move) { G.levelSel = (G.levelSel + move + n) % n; SFX.select(); }
  let play = hit('Enter', 'Space');
  if (hit('Mouse0')) {
    const ti = pauseTileAt(Input.mouse.x, Input.mouse.y);
    if (ti >= 0) { if (ti === G.levelSel) play = true; else { G.levelSel = ti; SFX.select(); } }
    const bi = levelBtnAt(Input.mouse.x, Input.mouse.y);
    if (bi === 0) { SFX.select(); setState('select'); return; }
    if (bi === 1) play = true;
  }
  if (play) {
    if (waves) G.mapIdx = G.levelSel; else G.startAt = G.levelSel;
    SFX.select(); newGame(); return;
  }
  if (hit('Escape')) setState('select');
}

function updatePlay() {
  if (hit('KeyP', 'Escape')) { setState('paused'); return; }
  const p = G.player, L = G.level;
  G.levelT++;
  if (!p.dead) updatePlayer(p);
  else {
    p.deadT++; p.vx *= 0.9; moveActor(p);
    if (--G.deadTimer <= 0) setState('gameover');
  }
  if (G.mode === 'waves') updateWaves();
  else {
    while (G.spawnIdx < G.spawns.length && G.spawns[G.spawnIdx][0] < G.camX + W + 40) {
      const [x, type, n = 1, y] = G.spawns[G.spawnIdx++];
      for (let k = 0; k < n; k++) spawnEnemy(type, x + k * 50, y);
    }
    if (!G.boss && p.x > L.arenaX + 160) { G.arenaLocked = true; G.boss = new Bob(L); G.checkpoint = saveLoadout(p); }
  }
  updateEnemies();
  if (G.boss) G.boss.update();
  updateBullets(); updateEnemyBullets(); updateGrenades(); updatePickups(); updateFx();
  const target = G.arenaLocked ? L.arenaX : clamp(p.x - W * 0.4, 0, L.length - W);
  G.camX += (target - G.camX) * 0.1;
  if (G.mode !== 'waves' && G.boss && G.boss.done && ++G.bossDoneT > 90) {
    if (L.final) { G.winTime = Math.round((G.t - G.startTime) / 60); setState('win'); }
    else setState('levelDone');
  }
}

function updateFx() {
  for (const q of G.particles) {
    q.x += q.vx; q.y += q.vy; q.vy += q.grav; q.life--;
    if (q.grav > 0 && q.y > GROUND_Y + 4) { q.y = GROUND_Y + 4; q.vx *= 0.6; q.vy = 0; }
  }
  G.particles = G.particles.filter(q => q.life > 0);
  if (G.particles.length > 600) G.particles.splice(0, G.particles.length - 600);
  for (const t of G.texts) { t.y -= 0.7; t.life--; }
  G.texts = G.texts.filter(t => t.life > 0);
  for (const e of G.explosions) e.t++;
  G.explosions = G.explosions.filter(e => e.t < 22);
  G.shake *= 0.86; if (G.shake < 0.3) G.shake = 0;
  G.flash = Math.max(0, (G.flash || 0) - 0.03);
  if (G.banner && --G.banner.t <= 0) G.banner = null;
}

// ---- Render --------------------------------------------------------------
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.state === 'title') { drawTitle(); return; }
  if (G.state === 'select') { drawSelect(); return; }
  if (G.state === 'levels') { drawLevels(); return; }
  drawWorld();
  if (G.flash > 0) rect(ctx, 0, 0, W, H, `rgba(255,240,200,${G.flash})`);
  drawHUD();
  drawOverlay();
}

function drawWorld() {
  const L = G.level;
  ctx.save();
  if (G.shake > 0) ctx.translate(rand(-G.shake, G.shake), rand(-G.shake, G.shake));
  L.drawBg(ctx, G.camX);
  ctx.save();
  ctx.translate(-Math.round(G.camX), 0);
  const x0 = G.camX - 40, x1 = G.camX + W + 40;
  L.drawGround(ctx, x0, x1);
  for (const d of G.puddles) {
    ellipse(ctx, d.x + d.w / 2, GROUND_Y + 3, d.w / 2 + 6, d.mud ? 8 : 6, d.mud ? 'rgba(74,48,32,0.95)' : `rgba(156,90,26,${Math.min(0.85, d.life / 60)})`);
    if (d.mud) ellipse(ctx, d.x + d.w / 2 + Math.sin(G.t * 0.05 + d.x) * 10, GROUND_Y + 1, 8, 2, 'rgba(255,255,255,0.15)');
  }
  for (const pr of L.props) if (pr[1] > x0 - 300 && pr[1] < x1 + 100) Props[pr[0]](ctx, pr[1], pr[2]);
  for (const s of G.solids) if (s.style !== 'ground' && s.x < x1 && s.x + s.w > x0) drawSolid(ctx, s);
  if (G.arenaLocked) {
    for (let y = 0; y < GROUND_Y; y += 24) rect(ctx, L.arenaX, y, 8, 12, '#ffd43b');
    for (let y = 12; y < GROUND_Y; y += 24) rect(ctx, L.arenaX, y, 8, 12, '#222');
  }
  for (const pk of G.pickups) drawPickup(ctx, pk);
  for (const e of G.enemies) drawEnemy(ctx, e);
  if (G.boss) G.boss.draw(ctx);
  drawPlayer(ctx, G.player);
  drawAimHelp(G.player);
  drawGrenades(ctx);
  drawBullets(ctx);
  for (const b of G.ebullets) drawEnemyBullet(ctx, b);
  drawExplosions(ctx);
  for (const q of G.particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    rect(ctx, q.x - q.size / 2, q.y - q.size / 2, q.size, q.size, q.color);
  }
  ctx.globalAlpha = 1;
  for (const t of G.texts) {
    ctx.globalAlpha = Math.min(1, t.life / 15);
    text(ctx, t.str, t.x, t.y, { size: t.size, color: t.color, stroke: '#000', sw: 3 });
  }
  ctx.globalAlpha = 1;
  if (G.boss) G.boss.drawBubble(ctx);
  ctx.restore();
  ctx.restore();
}

// ---- Controls, always on screen ----
// Each control: keycaps [label, ...key codes that light it up] and what it does.
// 'mouse' lights up while the mouse button is held, 'aim' while the mouse is being used.
const CONTROLS = [
  [{ keys: [['A', 'KeyA', 'ArrowLeft'], ['D', 'KeyD', 'ArrowRight']], what: 'MOVE' },
   { keys: [['W', 'KeyW', 'ArrowUp'], ['SPACE', 'Space']], what: 'JUMP' },
   { keys: [['S', 'KeyS', 'ArrowDown']], what: 'DROP DOWN' },
   { keys: [['MOUSE', 'aim']], what: 'AIM' },
   { keys: [['J', 'KeyJ'], ['CLICK', 'mouse']], what: 'SHOOT' },
   { keys: [['K', 'KeyK', 'KeyG'], ['RIGHT-CLICK', 'Mouse2']], what: 'GRENADE' }],
  [{ keys: [['1-9', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'], ['Q', 'KeyQ']], what: 'SWITCH GUN' },
   { keys: [['P', 'KeyP', 'Escape']], what: 'PAUSE' },
   { keys: [['M', 'KeyM']], what: 'MUTE' },
   { keys: [['N', 'KeyN']], what: 'MUSIC ON/OFF' }],
];
const KEY_FONT = 10, WHAT_FONT = 11;
function keyLit(codes) {
  return codes.some(c => c === 'mouse' ? Input.mouse.down : c === 'aim' ? mouseAiming() : Input.keys[c]);
}
function textW(str, size, font, weight = '') { ctx.font = `${weight} ${size}px ${font}`; return ctx.measureText(str).width; }
function keycapW(label) { return textW(label, KEY_FONT, FONT) + 12; }
function drawKeycap(label, codes, x, y) {
  const w = keycapW(label), lit = keyLit(codes);
  fillRR(ctx, x, y - 8, w, 18, 4, lit ? '#b08900' : '#868e96');
  fillRR(ctx, x, y - 9, w, 16, 4, lit ? '#ffd43b' : '#f1f3f5');
  text(ctx, label, x + w / 2, y - 1, { size: KEY_FONT, color: '#212529' });
  return w;
}
function itemW(it) {
  return it.keys.reduce((s, k) => s + keycapW(k[0]), 0) + (it.keys.length - 1) * 4 + 6 + textW(it.what, WHAT_FONT, FONT2, 800);
}
function drawControlRow(items, y) {
  const gap = 22, total = items.reduce((s, it) => s + itemW(it), 0) + gap * (items.length - 1);
  let x = (W - total) / 2;
  for (const it of items) {
    it.keys.forEach((k, i) => { x += drawKeycap(k[0], k.slice(1), x, y) + (i < it.keys.length - 1 ? 4 : 6); });
    text(ctx, it.what, x, y, { size: WHAT_FONT, align: 'left', font: FONT2, weight: 800 });
    x += textW(it.what, WHAT_FONT, FONT2, 800) + gap;
  }
}
function drawControlsBar() {
  rect(ctx, 0, H - 48, W, 48, 'rgba(0,0,0,0.65)');
  rect(ctx, 0, H - 48, W, 2, 'rgba(255,255,255,0.15)');
  drawControlRow(CONTROLS[0], H - 33);
  drawControlRow(CONTROLS[1], H - 12);
}
// Touch-screen version of the controls help.
const TOUCH_HELP = [['◀ ▶', 'MOVE'], ['▼', 'DROP DOWN'], ['JUMP', 'JUMP'], ['FIRE', 'SHOOT (AUTO-AIMS)'],
  ['TAP THE GAME', 'SHOOT WHERE YOU TAP'], ['💣', 'GRENADE'], ['GUN', 'SWITCH GUN'], ['II', 'PAUSE']];
function drawTouchHelp() {
  rect(ctx, 0, H - 48, W, 48, 'rgba(0,0,0,0.65)');
  const items = TOUCH_HELP.map(([k, what]) => ({ keys: [[k]], what }));
  drawControlRow(items.slice(0, 4), H - 33);
  drawControlRow(items.slice(4), H - 12);
}
function drawTouchList(top) {
  TOUCH_HELP.forEach(([k, what], i) => {
    const y = top + i * 34;
    drawKeycap(k, [], W / 2 - 14 - keycapW(k), y);
    text(ctx, what, W / 2 + 14, y, { size: 16, align: 'left', font: FONT2, weight: 800 });
  });
}
const tapOr = (tapText, keyText) => (G.touchMode ? tapText : keyText);

// Big version for the pause screen: one control per line.
function drawControlsList(top) {
  const all = [...CONTROLS[0], ...CONTROLS[1]];
  all.forEach((it, i) => {
    const y = top + i * 30, kw = it.keys.reduce((s, k) => s + keycapW(k[0]), 0) + (it.keys.length - 1) * 8;
    let x = W / 2 - 14 - kw;
    it.keys.forEach(k => { x += drawKeycap(k[0], k.slice(1), x, y) + 8; });
    text(ctx, it.what, W / 2 + 14, y, { size: 16, align: 'left', font: FONT2, weight: 800 });
  });
  text(ctx, 'Shooting with J auto-aims at the closest enemy in front of you.', W / 2, top + all.length * 30 + 6,
    { size: 13, font: FONT2, weight: 800, color: '#ffd43b' });
}

// A faint laser sight, plus red target brackets on whatever your shots will lock onto.
function drawAimHelp(p) {
  if (p.dead || G.state !== 'play') return;
  const cx = p.x + p.w / 2, cy = p.y + 25, a = p.lock ? p.lock.angle : p.aim, m = WEAPONS[p.weapon].muzzle;
  ctx.save();
  ctx.globalAlpha = 0.35; ctx.setLineDash([4, 6]);
  line(ctx, cx + Math.cos(a) * m, cy + Math.sin(a) * m, cx + Math.cos(a) * (m + 150), cy + Math.sin(a) * (m + 150), '#ff4d4d', 2);
  ctx.restore();
  if (p.lock) {
    const r = 16 + Math.sin(G.t * 0.2) * 2;
    ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(p.lock.x, p.lock.y, r, i * Math.PI / 2 + 0.3, i * Math.PI / 2 + 1.27); ctx.stroke();
    }
  }
}

function drawHUD() {
  const p = G.player;
  fillRR(ctx, 10, 8, 430, 90, 10, 'rgba(0,0,0,0.5)');
  text(ctx, p.hero.name, 22, 24, { size: 14, align: 'left', color: p.hero.band });
  const hx = Math.max(100, 34 + textW(p.hero.name, 14, FONT)); // hearts start after the name
  const hs = Math.min(17, (430 - hx) / p.maxHp);
  for (let i = 0; i < p.maxHp; i++) heart(ctx, hx + i * hs, 16, Math.min(15, hs - 1), i < p.hp ? '#ff4d6d' : 'rgba(255,255,255,0.18)');
  WEAPON_ORDER.forEach((k, i) => {
    const x = 18 + i * 46, owned = p.owned[k], sel = p.weapon === k, short = WEAPONS[k].short;
    fillRR(ctx, x, 38, 43, 34, 5, sel ? '#ffd43b' : 'rgba(255,255,255,0.1)');
    const ink = sel ? '#222' : owned ? '#fff' : '#666';
    text(ctx, short, x + 21.5, 47, { size: short.length > 5 ? 6.5 : 8, color: ink });
    text(ctx, String(i + 1), x + 5, 64, { size: 9, align: 'left', color: sel ? '#555' : '#888' });
    text(ctx, owned ? '∞' : '-', x + 25, 63, { size: 13, color: ink });
  });
  for (let i = 0; i < p.grenades; i++) { circle(ctx, 26 + i * 16, 86, 5.5, '#5a8f3e'); rect(ctx, 24 + i * 16, 78, 4, 3, '#bbb'); }
  text(ctx, 'GRENADES', 30 + Math.max(1, p.grenades) * 16, 86, { size: 9, align: 'left', color: '#ccc' });
  const where = G.mode === 'waves'
    ? `WAVE ${G.wave} · ${G.waveQueue.length + G.enemies.length} LEFT · BEST ${G.bestWave}`
    : `LEVEL ${G.levelIndex + 1}: ${G.level.name}`;
  text(ctx, where, W - 14, 22, { size: 13, align: 'right', stroke: '#000', sw: 4 });
  text(ctx, 'SCORE ' + G.score, W - 14, 44, { size: 16, align: 'right', color: '#ffd43b', stroke: '#000', sw: 4 });
  if (SFX.muted) text(ctx, 'MUTED (M)', W - 14, 64, { size: 11, align: 'right', color: '#aaa' });

  const b = G.boss;
  if (b && !['gone', 'dying', 'dead'].includes(b.state)) {
    const bw = 520, bx = (W - bw) / 2 + 30, by = 128;
    fillRR(ctx, bx - 12, by - 28, bw + 24, 52, 10, 'rgba(0,0,0,0.6)');
    text(ctx, 'BOB', bx, by - 13, { size: 16, align: 'left', color: '#ffd43b' });
    text(ctx, b.mad ? 'ENRAGED!' : 'fat, sloppy & weird', bx + 60, by - 13, { size: 11, align: 'left', color: b.mad ? '#ff922b' : '#bbb', font: FONT2, weight: 800 });
    text(ctx, `${b.hp} / ${b.maxHp} HP`, bx + bw, by - 13, { size: 13, align: 'right' });
    rect(ctx, bx, by, bw, 14, '#3a0d0d');
    rect(ctx, bx, by, bw * b.hp / b.maxHp, 14, b.mad ? '#ff6b00' : '#e03131');
  }
  if (!G.touchMode) drawControlsBar(); // on touch screens the buttons explain themselves
  if (G.banner && G.state !== 'paused') {
    ctx.globalAlpha = Math.min(1, G.banner.t / 20);
    const s = 1 + Math.max(0, (G.banner.t - 100) / 40);
    ctx.save(); ctx.translate(W / 2, 200); ctx.scale(s, s);
    text(ctx, G.banner.text, 0, 0, { size: 44, color: '#ff6b6b', stroke: '#2b0a0a', sw: 10 });
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function dim(a = 0.6) { rect(ctx, 0, 0, W, H, `rgba(0,0,0,${a})`); }
function drawOverlay() {
  const blink = Math.floor(G.t / 30) % 2 === 0;
  switch (G.state) {
    case 'intro': {
      const a = Math.min(1, G.stateT / 15, (170 - G.stateT) / 20);
      ctx.globalAlpha = Math.max(0, a);
      rect(ctx, 0, 180, W, 170, 'rgba(0,0,0,0.7)');
      const wv = G.mode === 'waves';
      text(ctx, wv ? 'WAVES MODE' : `LEVEL ${G.levelIndex + 1} OF ${LEVELS.length}`, W / 2, 220, { size: 22, color: '#ffd43b' });
      text(ctx, G.level.name, W / 2, 268, { size: 44, stroke: '#000', sw: 8 });
      text(ctx, wv ? `How many waves can you survive?  Best so far: ${G.bestWave}` : G.level.sub, W / 2, 316, { size: 18, font: FONT2, weight: 800, color: '#ddd' });
      ctx.globalAlpha = 1;
      break;
    }
    case 'paused': drawPaused(); break;
    case 'levelDone': {
      dim(0.55);
      const next = LEVELS[G.levelIndex + 1];
      text(ctx, 'BOB GOT AWAY!', W / 2, 190, { size: 56, color: '#ffd43b', stroke: '#000', sw: 10 });
      text(ctx, G.level.doneText || 'He ran off making weird noises...', W / 2, 250, { size: 20, font: FONT2, weight: 800 });
      text(ctx, `NEXT STOP: ${next.name}`, W / 2, 300, { size: 24, color: '#8ce99a' });
      if (blink) text(ctx, tapOr('TAP TO KEEP GOING', 'PRESS ENTER'), W / 2, 380, { size: 24 });
      break;
    }
    case 'gameover':
      dim(0.7);
      text(ctx, 'BOB WINS...', W / 2, 200, { size: 64, color: '#ff6b6b', stroke: '#000', sw: 10 });
      if (G.mode === 'waves') {
        text(ctx, `You survived ${Math.max(0, G.wave - 1)} waves · best ${G.bestWave} · score ${G.score}`, W / 2, 262, { size: 22, font: FONT2, weight: 800 });
      } else text(ctx, '...for now. *BLORP*', W / 2, 262, { size: 22, font: FONT2, weight: 800 });
      if (blink) text(ctx, tapOr('TAP: ', 'ENTER: ') + (G.checkpoint ? 'TRY BOB AGAIN' : 'TRY AGAIN'), W / 2, 340, { size: 24 });
      if (!G.touchMode) text(ctx, 'ESC: title screen', W / 2, 380, { size: 16, font: FONT2, weight: 800, color: '#bbb' });
      break;
    case 'win':
      dim(0.55);
      text(ctx, 'BOB IS DEAD!', W / 2, 120, { size: 64, color: '#ff6b6b', stroke: '#000', sw: 10 });
      text(ctx, 'YOU SURVIVED BOB!', W / 2, 184, { size: 34, color: '#ffd43b', stroke: '#000', sw: 8 });
      text(ctx, `SCORE ${G.score}`, W / 2, 238, { size: 28, stroke: '#000', sw: 6 });
      text(ctx, `TIME ${Math.floor(G.winTime / 60)}:${String(G.winTime % 60).padStart(2, '0')}`, W / 2, 274, { size: 20, color: '#ddd', stroke: '#000', sw: 5 });
      text(ctx, 'The whole world is safe. It still smells like syrup, though.', W / 2, 312, { size: 18, font: FONT2, weight: 800, stroke: '#000', sw: 4 });
      if (blink) text(ctx, tapOr('TAP TO PLAY AGAIN', 'PRESS ENTER'), W / 2, 360, { size: 24, stroke: '#000', sw: 6 });
      break;
  }
}

// ---- Pause menu: jump to any level, resume, see the controls, quit ----
const PGRID = { cols: 5, w: 172, h: 64, x0: 34, y0: 90, gap: 8 };
const pauseTile = i => ({ x: PGRID.x0 + (i % PGRID.cols) * (PGRID.w + PGRID.gap), y: PGRID.y0 + Math.floor(i / PGRID.cols) * (PGRID.h + PGRID.gap) });
function pauseTileAt(mx, my) {
  return LEVELS.findIndex((L, i) => { const t = pauseTile(i); return mx > t.x && mx < t.x + PGRID.w && my > t.y && my < t.y + PGRID.h; });
}
const pauseBtnY = () => pauseTile(LEVELS.length - 1).y + PGRID.h + 16;
const PAUSE_BTNS = [{ label: 'RESUME', x: 205 }, { label: 'CONTROLS', x: 395 }, { label: 'QUIT', x: 585 }];
function pauseBtnAt(mx, my) {
  const y = pauseBtnY();
  return my > y && my < y + 42 ? PAUSE_BTNS.findIndex(b => mx > b.x && mx < b.x + 170) : -1;
}
const onCurrentLevel = i => i === G.levelIndex && G.mode === 'story';

function updatePaused() {
  const n = LEVELS.length;
  if (G.stateT === 1) { G.pauseSel = G.levelIndex; G.pauseView = 'levels'; }
  if (G.pauseView === 'controls') {
    if (hit('KeyP', 'Escape', 'Enter', 'Space', 'KeyC', 'Mouse0')) { G.pauseView = 'levels'; SFX.select(); }
    return;
  }
  if (hit('KeyP', 'Escape')) { setState('play'); return; }
  if (hit('KeyC')) { G.pauseView = 'controls'; SFX.select(); return; }
  const move = (hit('ArrowRight', 'KeyD') ? 1 : 0) - (hit('ArrowLeft', 'KeyA') ? 1 : 0) + (hit('ArrowDown', 'KeyS') ? PGRID.cols : 0) - (hit('ArrowUp', 'KeyW') ? PGRID.cols : 0);
  if (move) { G.pauseSel = (G.pauseSel + move + n) % n; SFX.select(); }
  if (hit('Enter', 'Space')) {
    if (G.pauseSel === G.levelIndex) setState('play'); else playLevel(G.pauseSel); // ENTER on where you are = keep going
    return;
  }
  if (hit('Mouse0')) {
    const ti = pauseTileAt(Input.mouse.x, Input.mouse.y);
    if (ti >= 0) {
      if (ti === G.pauseSel) playLevel(ti); // tap the picked level again to play it (or restart it)
      else { G.pauseSel = ti; SFX.select(); }
      return;
    }
    const bi = pauseBtnAt(Input.mouse.x, Input.mouse.y);
    if (bi === 0) setState('play');
    if (bi === 1) { G.pauseView = 'controls'; SFX.select(); }
    if (bi === 2) setState('title');
  }
}

// Start any story level with the same hero: you keep your guns, plus every gun from the earlier levels.
function playLevel(i) {
  const old = G.player, p = makePlayer(G.heroIndex);
  for (const L of LEVELS.slice(0, i)) for (const [, type] of L.pickups) if (WEAPONS[type]) p.owned[type] = true;
  if (old) {
    for (const k in old.owned) if (old.owned[k]) p.owned[k] = true;
    if (p.owned[old.weapon]) p.weapon = old.weapon;
  }
  p.grenades = Math.min(9, Math.max(p.grenades + i, old ? old.grenades : 0));
  if (G.mode !== 'story') { G.mode = 'story'; G.score = 0; G.startTime = G.t; }
  G.player = p; G.startAt = i; G.boss = null;
  SFX.select();
  startLevel(i);
}

// Little pictures of each level for the pause menu (drawn once, then reused).
const levelThumbs = [];
function levelThumb(i) {
  if (levelThumbs[i] !== undefined) return levelThumbs[i];
  let c = null;
  try {
    const L = LEVELS[i];
    c = document.createElement('canvas'); c.width = PGRID.w * 2; c.height = PGRID.h * 2;
    const g = c.getContext('2d'), s = c.width / W, cam = Math.min(L.length - W, 900);
    g.scale(s, s); g.translate(0, -(GROUND_Y + 34 - c.height / s)); // the part with the landmarks and the ground
    L.drawBg(g, cam);
    g.translate(-cam, 0); L.drawGround(g, cam - 40, cam + W + 40);
  } catch (e) { c = null; }
  levelThumbs[i] = c;
  return c;
}

// The 4 x 5 grid of level pictures. tagOf(i): small green label; pillOf(i): what the picked tile says.
function drawLevelGrid(selIdx, tagOf, pillOf) {
  LEVELS.forEach((L, i) => {
    const { x, y } = pauseTile(i), w = PGRID.w, h = PGRID.h, sel = i === selIdx, tag = tagOf(i);
    ctx.save(); rr(ctx, x, y, w, h, 8); ctx.clip();
    const th = levelThumb(i);
    if (th) ctx.drawImage(th, x, y, w, h); else rect(ctx, x, y, w, h, '#343a40');
    rect(ctx, x, y + h - 22, w, 22, 'rgba(0,0,0,0.65)');
    if (!sel) rect(ctx, x, y, w, h, 'rgba(0,0,0,0.25)');
    ctx.restore();
    text(ctx, String(i + 1), x + 8, y + 15, { size: 17, align: 'left', color: L.final ? '#ff6b6b' : '#ffd43b', stroke: '#000', sw: 4 });
    if (tag) text(ctx, tag, x + w - 8, y + 14, { size: 9, align: 'right', color: '#8ce99a', stroke: '#000', sw: 3 });
    else if (L.final) text(ctx, 'FINAL', x + w - 8, y + 14, { size: 10, align: 'right', color: '#ff6b6b', stroke: '#000', sw: 3 });
    let ns = 11; while (ns > 7 && textW(L.name, ns, FONT) > w - 10) ns -= 0.5;
    text(ctx, L.name, x + w / 2, y + h - 11, { size: ns, color: sel ? '#ffd43b' : '#fff' });
    ctx.strokeStyle = sel ? '#ffd43b' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = sel ? 4 : 1.5; rr(ctx, x, y, w, h, 8); ctx.stroke();
    if (sel) {
      const msg = pillOf(i), mw = textW(msg, 10, FONT) + 14;
      fillRR(ctx, x + w / 2 - mw / 2, y + 22, mw, 18, 9, '#ffd43b');
      text(ctx, msg, x + w / 2, y + 31, { size: 10, color: '#212529' });
    }
  });
}
function drawButtons(btns, by) {
  btns.forEach((b, i) => {
    const main = !!b.main;
    fillRR(ctx, b.x, by, 170, 42, 10, main ? '#ffd43b' : 'rgba(255,255,255,0.12)');
    ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 2; rr(ctx, b.x, by, 170, 42, 10); ctx.stroke();
    text(ctx, b.label, b.x + 85, by + 21, { size: 17, color: main ? '#212529' : '#fff' });
  });
}

function drawLevels() {
  const waves = G.mode === 'waves', sel = G.levelSel || 0;
  LEVELS[sel].drawBg(ctx, G.t * 0.3);
  dim(0.72);
  text(ctx, waves ? 'WAVES: PICK A MAP' : 'PICK A LEVEL', W / 2, 38, { size: 32, color: '#ffd43b', stroke: '#000', sw: 8 });
  text(ctx, waves ? 'Where do you want to fight the waves?' : 'Start at level 1 for the whole trip, or jump to any level',
    W / 2, 72, { size: 14, font: FONT2, weight: 800, color: '#ddd' });
  drawLevelGrid(sel, () => '', () => tapOr('TAP AGAIN: PLAY', 'ENTER: PLAY'));
  const by = pauseBtnY();
  drawButtons([{ label: 'BACK', x: LEVEL_BTNS[0].x }, { label: `PLAY ${waves ? 'MAP' : 'LEVEL'} ${sel + 1}`, x: LEVEL_BTNS[1].x, main: true }], by);
  text(ctx, tapOr('Tap a level, then tap it again (or PLAY)', '←↑↓→ pick a level · ENTER play · ESC back to heroes'),
    W / 2, by + 62, { size: 14, font: FONT2, weight: 800, color: '#ddd' });
}

function drawPaused() {
  dim(0.82);
  text(ctx, 'PAUSED', W / 2, 38, { size: 34, color: '#ffd43b', stroke: '#000', sw: 8 });
  if (G.pauseView === 'controls') {
    text(ctx, 'CONTROLS', W / 2, 76, { size: 16, color: '#bbb' });
    if (G.touchMode) drawTouchList(112); else drawControlsList(112);
    if (Math.floor(G.t / 30) % 2 === 0) text(ctx, tapOr('TAP TO GO BACK', 'PRESS C TO GO BACK'), W / 2, 466, { size: 18 });
    return;
  }
  text(ctx, G.mode === 'waves' ? 'PICK A STORY LEVEL TO PLAY, OR RESUME YOUR WAVES' : 'PICK ANY LEVEL TO PLAY', W / 2, 72, { size: 13, color: '#bbb' });
  drawLevelGrid(G.pauseSel, i => (onCurrentLevel(i) ? 'YOU ARE HERE' : ''),
    i => (G.touchMode ? (onCurrentLevel(i) ? 'TAP AGAIN: RESTART' : 'TAP AGAIN: PLAY') : (i === G.levelIndex ? 'ENTER: KEEP GOING' : 'ENTER: PLAY')));
  const by = pauseBtnY();
  drawButtons(PAUSE_BTNS.map((b, i) => ({ ...b, main: i === 0 })), by);
  const hint = tapOr('Tap a level, then tap it again to play it', '←↑↓→ pick a level · ENTER play it · P resume · C controls');
  text(ctx, hint, W / 2, by + 62, { size: 14, font: FONT2, weight: 800, color: '#ddd' });
}

function drawWanted(x, y) {
  ctx.save();
  ctx.translate(x + 130, y + 150); ctx.rotate(0.04); ctx.translate(-130, -150);
  rect(ctx, 8, 8, 260, 300, 'rgba(0,0,0,0.35)');
  rect(ctx, 0, 0, 260, 300, '#f1e2c0');
  circle(ctx, 130, 10, 6, '#c92a2a');
  text(ctx, 'WANTED', 130, 32, { size: 30, color: '#5a2d0c' });
  // Mugshot: the cartoon Bob in front of a height chart.
  ctx.save();
  ctx.beginPath(); ctx.rect(20, 54, 220, 190); ctx.clip();
  rect(ctx, 20, 54, 220, 190, '#cfd4d8');
  for (let i = 1; i < 6; i++) rect(ctx, 20, 54 + i * 32, 220, 1.5, 'rgba(40,40,40,0.3)');
  posterBob.t = G.t; posterBob.x = 130 - posterBob.w / 2; posterBob.y = 96;
  ctx.translate(130, 96); ctx.scale(1.05, 1.05); ctx.translate(-130, -96);
  posterBob.draw(ctx);
  ctx.restore();
  ctx.strokeStyle = '#5a2d0c'; ctx.lineWidth = 3; ctx.strokeRect(20, 54, 220, 190);
  text(ctx, 'BOB', 130, 262, { size: 22, color: '#c92a2a' });
  text(ctx, 'For crimes against hygiene', 130, 284, { size: 12, font: FONT2, weight: 800, color: '#5a2d0c' });
  ctx.restore();
}

function drawTitle() {
  const L = LEVELS[0], cam = G.t * 0.6;
  L.drawBg(ctx, cam);
  ctx.save(); ctx.translate(-cam, 0); L.drawGround(ctx, cam - 40, cam + W + 40); ctx.restore();
  drawWanted(650, 30);
  titleBob.draw(ctx); titleBob.drawBubble(ctx);
  ctx.save(); ctx.translate(230, 110); ctx.rotate(-0.05);
  text(ctx, 'SURVIVE', 0, 0, { size: 64, color: '#ffd43b', stroke: '#3b1f0e', sw: 12 });
  text(ctx, 'BOB', 0, 82, { size: 100, color: '#ff6b6b', stroke: '#3b1f0e', sw: 14 });
  ctx.restore();
  text(ctx, 'A run-and-gun trip around the world', 230, 236, { size: 18, font: FONT2, weight: 800, stroke: '#000', sw: 4 });
  TITLE_BTNS.forEach((b, i) => {
    const sel = G.menuMode === i, pulse = sel ? Math.sin(G.t * 0.12) * 2 : 0;
    fillRR(ctx, b.x - pulse, b.y - pulse, b.w + pulse * 2, b.h + pulse * 2, 12, sel ? '#ffd43b' : 'rgba(0,0,0,0.55)');
    ctx.strokeStyle = sel ? '#3b1f0e' : '#ffd43b'; ctx.lineWidth = 3; rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
    text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, { size: 22, color: sel ? '#3b1f0e' : '#fff' });
  });
  text(ctx, G.menuMode === 1 ? `Endless waves · your best: wave ${G.bestWave}` : `${LEVELS.length} levels: America, then the world`, 230, 336,
    { size: 15, font: FONT2, weight: 800, stroke: '#000', sw: 4 });
  text(ctx, tapOr('Tap a mode to start', '←/→ pick a mode · ENTER to start'), 230, 360, { size: 13, font: FONT2, weight: 800, color: '#ddd', stroke: '#000', sw: 3 });
  if (G.touchMode) drawTouchHelp(); else drawControlsBar();
}

function drawSelect() {
  LEVELS[0].drawBg(ctx, G.t * 0.3);
  dim(0.6);
  const waves = G.mode === 'waves';
  text(ctx, waves ? 'WAVES: PICK YOUR HERO' : 'PICK YOUR HERO', W / 2, 40, { size: 30, color: '#ffd43b', stroke: '#000', sw: 7 });
  HEROES.forEach((h, i) => {
    const { x, y } = cardPos(i), sel = i === G.heroIndex;
    fillRR(ctx, x, y, CARD.w, CARD.h, 12, sel ? 'rgba(255,212,59,0.25)' : 'rgba(0,0,0,0.5)');
    if (sel) { ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 4; rr(ctx, x, y, CARD.w, CARD.h, 12); ctx.stroke(); }
    const pv = makePlayer(i);
    pv.x = 0; pv.y = 0; pv.onGround = true; pv.aim = -0.2 + Math.sin(G.t * 0.03 + i) * 0.2;
    pv.walkT = sel ? G.t * 0.2 : 0; pv.vx = sel ? 2 : 0;
    pv.gliding = sel && h.special === 'glide' && Math.sin(G.t * 0.05) > 0;
    ctx.save(); ctx.translate(x + CARD.w / 2 - 34, y + 16); ctx.scale(1.5, 1.5); drawPlayer(ctx, pv); ctx.restore();
    text(ctx, h.name, x + CARD.w / 2, y + CARD.h - 18, { size: h.name.length > 7 ? 13 : 16, color: h.band, stroke: '#000', sw: 4 });
  });
  // Details for the highlighted hero.
  const h = HEROES[G.heroIndex];
  fillRR(ctx, 40, 400, 880, 36, 10, 'rgba(0,0,0,0.6)');
  text(ctx, h.blurb, 56, 418, { size: 14, align: 'left', font: FONT2, weight: 800 });
  [['HEALTH', h.hp / 18], ['SPEED', h.speed / 5.3], ['JUMP', h.jump / 14.6]].forEach(([n, v], j) => {
    const lx = 560 + j * 120;
    text(ctx, n, lx, 418, { size: 9, align: 'left', color: '#ccc' });
    rect(ctx, lx + 50, 413, 60, 10, 'rgba(255,255,255,0.15)');
    rect(ctx, lx + 50, 413, 60 * v, 10, h.band);
  });
  const nb = HERO_NEXT, pulse = Math.sin(G.t * 0.12) * 2;
  fillRR(ctx, nb.x - pulse, nb.y - pulse, nb.w + pulse * 2, nb.h + pulse * 2, 10, '#ffd43b');
  text(ctx, waves ? 'NEXT: PICK A MAP ▶' : 'NEXT: PICK A LEVEL ▶', nb.x + nb.w / 2, nb.y + nb.h / 2 + 1, { size: 17, color: '#212529' });
  const selHint = tapOr('Tap a hero, then tap NEXT', '←↑↓→ pick a hero · ENTER next · ESC back');
  text(ctx, selHint, W / 2, 510, { size: 18, font: FONT2, weight: 800 });
}

// ---- Fixed-timestep loop ---------------------------------------------------
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= 1 / 60) { update(); acc -= 1 / 60; }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
