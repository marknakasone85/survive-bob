'use strict';
// WAVES mode: pick a map and survive endless waves. Bob crashes the party every 5th wave.

// [first wave it can show up in, enemy type]
const WAVE_POOL = [[1, 'blob'], [1, 'fly'], [1, 'chicken'], [2, 'rat'], [2, 'raccoon'], [3, 'goon'], [3, 'tumbleweed'],
  [4, 'goose'], [4, 'snake'], [5, 'meatball'], [6, 'hog'], [6, 'skunk'], [7, 'fireworks'], [7, 'bowler'],
  [8, 'gator'], [9, 'balloon'], [9, 'banjo'], [10, 'bird']];
// Enemies from the world levels say which wave they can first show up in (ENEMY_TYPES[type].wave).
for (const [type, t] of Object.entries(ENEMY_TYPES)) {
  if (t.wave && !WAVE_POOL.some(([, x]) => x === type)) WAVE_POOL.push([t.wave, type]);
}
const ALL_BOB_ATTACKS = ['toss', 'slam', 'burp', 'summon', 'disco', 'rain', 'spray'];
const BEST_KEY = 'surviveBob.bestWave';

function loadBestWave() { try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { return 0; } }
function saveBestWave(n) {
  if (n <= G.bestWave) return;
  G.bestWave = n;
  try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* private mode: just don't save */ }
}
G.bestWave = loadBestWave();

function startWaves(mapIndex) {
  G.mode = 'waves';
  G.player = makePlayer(G.heroIndex);
  G.score = 0; G.startTime = G.t;
  startLevel(mapIndex, true);
  const L = G.level, p = G.player;
  G.spawns = []; G.spawnIdx = 0; G.pickups = [];
  G.arenaLocked = true; G.camX = L.arenaX;
  p.x = L.arenaX + W / 2 - p.w / 2;
  G.wave = 0; G.waveQueue = []; G.waveSpawnT = 0; G.waveBreak = 100;
}

function updateWaves() {
  const L = G.level;
  if (G.boss && G.boss.done) G.boss = null;
  if (G.waveBreak > 0) {
    if (--G.waveBreak === 0) beginWave(G.wave + 1);
    return;
  }
  // Enemies march in from both sides (flyers come in high).
  if (G.waveQueue.length && --G.waveSpawnT <= 0) {
    const type = G.waveQueue.shift(), t = ENEMY_TYPES[type];
    const flying = t.fly || type === 'fly' || type === 'bird';
    const left = Math.random() < 0.5;
    const e = spawnEnemy(type, left ? L.arenaX - 50 : L.arenaX + W + 10, flying ? rand(120, 260) : undefined);
    if (flying) e.baseY = e.y;
    G.waveSpawnT = Math.max(16, 55 - G.wave * 3);
  }
  if (!G.waveQueue.length && !G.enemies.length && !G.boss) waveCleared();
}

function beginWave(n) {
  G.wave = n;
  const bossWave = n % 5 === 0;
  const pool = WAVE_POOL.filter(([w]) => w <= n).map(([, t]) => t);
  const count = Math.round((4 + n * 1.8) * (bossWave ? 0.5 : 1));
  G.waveQueue = Array.from({ length: count }, () => pick(pool));
  G.waveSpawnT = 40;
  G.banner = { text: bossWave ? `WAVE ${n}: BOB IS BACK!` : `WAVE ${n}`, t: 120 };
  SFX.select();
  if (bossWave) {
    const lv = Object.assign({}, G.level, { bobAttacks: ALL_BOB_ATTACKS, final: false, bobSpeed: Math.min(1.6, 1 + n * 0.02) });
    G.boss = new Bob(lv);
    G.boss.hp = G.boss.maxHp = 100 + (n / 5 - 1) * 40; // Bob gets beefier every time
  }
}

function waveCleared() {
  G.score += G.wave * 50;
  saveBestWave(G.wave);
  G.banner = { text: `WAVE ${G.wave} CLEARED!`, t: 110 };
  SFX.fanfare();
  // Rewards fall from the sky: always a pie, and a new gun every other wave.
  dropReward('pie');
  const next = WEAPON_ORDER.find(w => !G.player.owned[w]);
  dropReward(G.wave % 2 === 0 && next ? next : 'nade');
  G.waveBreak = 200;
}

function dropReward(type) {
  G.pickups.push({ x: G.level.arenaX + rand(120, W - 160), y: -40, w: 34, h: 30, vx: 0, vy: 0, type, bob: Math.random() * 6 });
}
