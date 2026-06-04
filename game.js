/**
 * BIN THE COPPER - Retro street fighter
 * Browser canvas game
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const GROUND_Y = 420;

// --- DOM ---
const el = (id) => document.getElementById(id);
const playerHealthBar = el('player-health');
const enemyHealthBar = el('enemy-health');
const playerHpText = el('player-hp-text');
const enemyHpText = el('enemy-hp-text');
const roundNumEl = el('round-num');
const levelNumEl = el('level-num');
const playerWinsEl = el('player-wins');
const copWinsEl = el('cop-wins');
const messageOverlay = el('message-overlay');
const messageText = el('message-text');
const messageSub = el('message-sub');
const fightAnnounce = el('fight-announce');

// --- Input ---
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'Enter' && game.awaitingContinue) {
    game.onContinue();
  }
  if (e.code === 'KeyM') {
    AudioEngine.muted = !AudioEngine.muted;
    if (AudioEngine.muted) AudioEngine.stopMusic();
    else {
      AudioEngine.ensureInit();
      AudioEngine.musicPlaying = false;
      AudioEngine.startMusic();
    }
  }
  AudioEngine.ensureInit();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

document.addEventListener('touchstart', () => AudioEngine.ensureInit(), { once: false, passive: true });

// --- Utilities ---
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// --- Game state machine ---
const State = {
  TITLE: 'title',
  ROUND_INTRO: 'round_intro',
  FIGHT: 'fight',
  KO: 'ko',
  ROUND_END: 'round_end',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
};

class Game {
  constructor() {
    this.state = State.TITLE;
    this.level = 1;
    this.round = 1;
    this.playerRoundWins = 0;
    this.copRoundWins = 0;
    this.awaitingContinue = false;
    this.introTimer = 0;
    this.koTimer = 0;
    this.koWinner = null;
    this.messageCallback = null;

    this.playerBoostSpeed = 1;
    this.playerBoostDamage = 1;
    this.pendingPowerAnnounce = null;
    this.announceTimer = null;

    this.player = null;
    this.cop = null;
    this.bins = [];
    this.projectiles = [];
    this.particles = [];
  }

  copScale() {
    return 1 + 0.02 * (this.level - 1);
  }

  applyMilestoneBoosts() {
    const milestones = Math.floor(this.level / 10);
    this.playerBoostDamage = 1 + milestones * 0.1;
    this.playerBoostSpeed = 1;
    if (this.player) {
      this.player.speedMult = this.playerBoostSpeed;
      this.player.damageMult = this.playerBoostDamage;
    }
  }

  strengthBonusPercent() {
    return Math.round((this.playerBoostDamage - 1) * 100);
  }

  showFightAnnouncement(title, detail, durationMs = 3200) {
    fightAnnounce.innerHTML = `<span class="announce-title">${title}</span>${detail}`;
    fightAnnounce.classList.remove('hidden');
    if (this.announceTimer) clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => {
      fightAnnounce.classList.add('hidden');
    }, durationMs);
  }

  resetFighters() {
    const scale = this.copScale();
    this.player = new Fighter('player', 180, GROUND_Y);
    this.cop = new Fighter('cop', W - 180, GROUND_Y);
    this.cop.speedMult = scale;
    this.cop.damageMult = scale;
    this.cop.aiAggression = 0.35 + Math.min(0.45, (this.level - 1) * 0.008);
    this.player.speedMult = this.playerBoostSpeed;
    this.player.damageMult = this.playerBoostDamage;
    this.projectiles = [];
    this.particles = [];
  }

  spawnRoundBins() {
    this.bins = [
      new WheelieBin(W * 0.38, GROUND_Y - 8, 'player'),
      new WheelieBin(W * 0.62, GROUND_Y - 8, 'cop'),
    ];
    this.player.hasBin = false;
    this.cop.hasBin = false;
    this.player.binEquipped = false;
    this.cop.binEquipped = false;
    for (const bin of this.bins) {
      bin.equipped = false;
      bin.holder = null;
      bin.inFlight = false;
      bin.onGround = true;
      bin.pickupCooldown = 0;
      bin.linkedProjectile = null;
    }
  }

  start() {
    this.level = 1;
    this.round = 1;
    this.playerRoundWins = 0;
    this.copRoundWins = 0;
    this.applyMilestoneBoosts();
    this.showMessage(
      'BIN THE COPPER',
      'Defeat the copper! Best of 3 rounds.\nCollect your wheelie bin — then swing or throw!\nPress any key for music & sound. M = mute.',
      () => this.beginRound()
    );
  }

  beginRound() {
    this.state = State.ROUND_INTRO;
    this.introTimer = 120;
    this.resetFighters();
    this.spawnRoundBins();
    this.updateHud();
    messageOverlay.classList.add('hidden');
    this.state = State.FIGHT;
    AudioEngine.ensureInit();
    AudioEngine.playRoundStart();
    if (this.pendingPowerAnnounce) {
      this.showFightAnnouncement(
        this.pendingPowerAnnounce.title,
        this.pendingPowerAnnounce.detail
      );
      this.pendingPowerAnnounce = null;
    }
  }

  showMessage(title, sub, onContinue) {
    this.state = State.TITLE;
    this.awaitingContinue = true;
    messageText.textContent = title;
    messageSub.textContent = sub;
    messageOverlay.classList.remove('hidden');
    this.messageCallback = onContinue;
  }

  onContinue() {
    this.awaitingContinue = false;
    messageOverlay.classList.add('hidden');
    if (this.messageCallback) {
      const cb = this.messageCallback;
      this.messageCallback = null;
      cb();
    }
  }

  dealDamage(attacker, defender, baseMin = 5, baseMax = 10) {
    if (defender.invuln > 0 || defender.hp <= 0) return;
    const mult = attacker.damageMult || 1;
    const dmg = Math.round(randInt(baseMin, baseMax) * mult);
    defender.hp = clamp(defender.hp - dmg, 0, 100);
    defender.invuln = 28;
    defender.hitStun = 18;
    defender.vx = attacker.facing * 5;
    defender.hitFlash = 20;
    defender.lastDamage = dmg;
    AudioEngine.playHit(attacker === this.player, dmg);
    this.spawnHitParticles(defender.x, defender.y - 90);
    if (defender.hp <= 0) {
      this.triggerKO(attacker === this.player ? 'player' : 'cop');
    }
  }

  spawnHitParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 20 + randInt(0, 15),
        color: i % 2 ? '#ff6b6b' : '#ffd166',
      });
    }
  }

  triggerKO(winner) {
    this.state = State.KO;
    this.koWinner = winner;
    this.koTimer = 0;
    const loser = winner === 'player' ? this.cop : this.player;
    const winnerFighter = winner === 'player' ? this.player : this.cop;
    loser.koPhase = 'fall';
    loser.koTimer = 0;
    winnerFighter.koVictory = true;
  }

  endRound(playerWon) {
    if (playerWon) this.playerRoundWins++;
    else this.copRoundWins++;

    this.updateHud();

    if (this.playerRoundWins >= 2) {
      this.onLevelWin();
      return;
    }
    if (this.copRoundWins >= 2) {
      this.onGameOver();
      return;
    }

    this.round++;
    this.showMessage(
      playerWon ? 'ROUND WON!' : 'ROUND LOST!',
      `Score: ${this.playerRoundWins} - ${this.copRoundWins}\nRound ${this.round} — get your bin!`,
      () => this.beginRound()
    );
  }

  onLevelWin() {
    if (this.level >= 99) {
      this.showMessage(
        'CHAMPION!',
        'You binned every copper to level 99!\nLegend of the streets.',
        () => location.reload()
      );
      return;
    }
    const completed = this.level;
    this.level++;
    this.round = 1;
    this.playerRoundWins = 0;
    this.copRoundWins = 0;
    this.applyMilestoneBoosts();

    let sub = `Level ${this.level}. Copper +${((this.copScale() - 1) * 100).toFixed(0)}% tougher.`;
    if (completed % 10 === 0) {
      const totalPct = this.strengthBonusPercent();
      sub += `\n★ POWER UP! +10% strength (total bonus: +${totalPct}%)`;
      this.pendingPowerAnnounce = {
        title: '★ STRENGTH +10% ★',
        detail: `Every 10 levels you grow tougher.<br>Total damage bonus: <strong>+${totalPct}%</strong>`,
      };
      AudioEngine.playPowerUp();
    }

    this.showMessage('LEVEL CLEAR!', sub, () => this.beginRound());
  }

  onGameOver() {
    this.state = State.GAME_OVER;
    this.showMessage(
      'GAME OVER',
      `You reached level ${this.level}.\nThe copper got you binned.`,
      () => location.reload()
    );
  }

  updateHud() {
    playerHealthBar.style.width = `${this.player?.hp ?? 100}%`;
    enemyHealthBar.style.width = `${this.cop?.hp ?? 100}%`;
    playerHpText.textContent = String(Math.max(0, this.player?.hp ?? 100));
    enemyHpText.textContent = String(Math.max(0, this.cop?.hp ?? 100));
    roundNumEl.textContent = String(this.round);
    levelNumEl.textContent = String(this.level);
    playerWinsEl.textContent = String(this.playerRoundWins);
    copWinsEl.textContent = String(this.copRoundWins);
  }

  getBinForOwner(ownerTag) {
    return this.bins.find((b) => b.owner === ownerTag);
  }

  releaseBin(fighter, placeX, placeY) {
    const bin = this.getBinForOwner(fighter.type === 'player' ? 'player' : 'cop');
    if (!bin) return;
    bin.equipped = false;
    bin.holder = null;
    bin.inFlight = false;
    bin.linkedProjectile = null;
    bin.x = placeX ?? fighter.x;
    bin.y = placeY ?? GROUND_Y - 8;
    bin.pickupCooldown = 0;
    bin.onGround = true;
    fighter.hasBin = false;
    fighter.binEquipped = false;
  }

  tryPickupBin(fighter, ownerTag) {
    if (fighter.hasBin) return false;
    const bin = this.getBinForOwner(ownerTag);
    if (!bin || bin.equipped || bin.inFlight) return false;

    const feetBox = fighter.getFeetHitbox();
    const bBox = bin.getPickupHitbox();
    if (rectsOverlap(feetBox, bBox)) {
      bin.equipped = true;
      bin.holder = fighter;
      bin.onGround = false;
      bin.inFlight = false;
      bin.linkedProjectile = null;
      bin.pickupCooldown = 0;
      fighter.hasBin = true;
      fighter.binEquipped = true;
      return true;
    }
    return false;
  }

  placeBinOnGround(bin, x, y) {
    if (!bin) return;
    bin.equipped = false;
    bin.holder = null;
    bin.inFlight = false;
    bin.linkedProjectile = null;
    bin.x = clamp(x, 50, W - 50);
    bin.y = y ?? GROUND_Y - 8;
    bin.onGround = true;
    bin.pickupCooldown = 0;
  }

  update() {
    if (this.state === State.TITLE || this.awaitingContinue) return;

    if (this.state === State.KO) {
      this.updateKO();
      this.updateParticles();
      this.updateHud();
      return;
    }

    if (this.state !== State.FIGHT) return;

    this.player.update(this, keys);
    this.cop.updateAI(this);
    this.cop.update(this, {});

    this.tryPickupBin(this.player, 'player');
    this.tryPickupBin(this.cop, 'cop');

    this.updateProjectiles();
    this.updateParticles();
    this.resolveFighterCollisions();
    this.updateHud();
  }

  resolveFighterCollisions() {
    const minDist = 50;
    const dx = this.cop.x - this.player.x;
    if (Math.abs(dx) < minDist) {
      const push = (minDist - Math.abs(dx)) / 2;
      if (dx > 0) {
        this.player.x -= push;
        this.cop.x += push;
      } else {
        this.player.x += push;
        this.cop.x -= push;
      }
    }
    this.player.x = clamp(this.player.x, 40, W - 40);
    this.cop.x = clamp(this.cop.x, 40, W - 40);
  }

  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update();
      const target = p.owner === 'player' ? this.cop : this.player;
      const attacker = p.owner === 'player' ? this.player : this.cop;

      if (p.active && rectsOverlap(p.getHitbox(), target.getHitbox()) && target.invuln <= 0 && target.hp > 0) {
        this.dealDamage(attacker, target);
        p.active = false;
        attacker.hasBin = false;
        attacker.binEquipped = false;
        this.placeBinOnGround(p.binRef, p.x, GROUND_Y - 8);
      }

      if (!p.active || p.x < -50 || p.x > W + 50) {
        if (p.binRef) {
          const landX = clamp(p.x, 50, W - 50);
          this.placeBinOnGround(p.binRef, landX, GROUND_Y - 8);
        }
        this.projectiles.splice(i, 1);
      }
    }

    for (const bin of this.bins) {
      if (bin.pickupCooldown > 0) bin.pickupCooldown--;
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  updateKO() {
    this.koTimer++;
    const loser = this.koWinner === 'player' ? this.cop : this.player;
    const winner = this.koWinner === 'player' ? this.player : this.cop;

    if (loser.koPhase === 'fall') {
      loser.y += 2;
      loser.koTimer++;
      if (loser.koTimer > 40) {
        loser.koPhase = 'bin';
        loser.koTimer = 0;
      }
    } else if (loser.koPhase === 'bin') {
      loser.koBinProgress = (loser.koBinProgress || 0) + 0.02;
      loser.y = GROUND_Y - 20 * loser.koBinProgress;
      loser.scaleY = 1 - loser.koBinProgress * 0.7;
      loser.koTimer++;
      if (loser.koTimer > 80) {
        const playerWon = this.koWinner === 'player';
        loser.koPhase = null;
        loser.scaleY = 1;
        loser.koBinProgress = 0;
        loser.y = loser.baseY;
        this.endRound(playerWon);
      }
    }

    winner.pose = 'victory';
    this.player.update(this, {});
    this.cop.update(this, {});
  }

  draw() {
    this.drawBackground();

    for (const bin of this.bins) {
      if (bin.onGround && !bin.inFlight) bin.draw(ctx);
    }

    if (this.player) this.player.draw(ctx);
    if (this.cop) this.cop.draw(ctx);

    for (const p of this.projectiles) p.draw(ctx);

    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 4, 4);
    }

    if (this.state === State.KO) {
      this.drawKOBin();
    }
  }

  drawKOBin() {
    const loser = this.koWinner === 'player' ? this.cop : this.player;
    if (loser.koPhase !== 'bin') return;
    const bx = loser.x;
    const by = GROUND_Y;
    drawWheelieBinGraphic(ctx, bx, by, loser.type === 'cop' ? 'cop' : 'player', 1.2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('BINNED!', bx, by - 90);
  }

  drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#3d2b4a');
    grd.addColorStop(0.4, '#5c4d6e');
    grd.addColorStop(0.7, '#7a6b5a');
    grd.addColorStop(1, '#4a4035');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Brick wall
    ctx.fillStyle = '#6b5344';
    ctx.fillRect(0, 80, W, 200);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 30; col++) {
        const off = (row % 2) * 16;
        ctx.strokeStyle = '#4a3728';
        ctx.strokeRect(col * 32 + off, 80 + row * 24, 32, 24);
      }
    }

    // Street / pavement
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#525252';
    ctx.fillRect(0, GROUND_Y, W, 12);
    // Lane markings
    ctx.fillStyle = '#f4d35e';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(40 + i * 80, GROUND_Y + 50, 40, 6);
    }

    // Pub sign
    ctx.fillStyle = '#2a1810';
    ctx.fillRect(W / 2 - 80, 32, 160, 44);
    ctx.fillStyle = '#ffb703';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('THE WHEELIE', W / 2, 52);
    ctx.fillText('& BOOT', W / 2, 68);
    // Street lamp
    ctx.fillStyle = '#333';
    ctx.fillRect(80, 200, 8, 220);
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(84, 195, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,59,0.15)';
    ctx.beginPath();
    ctx.arc(84, 280, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// --- Wheelie Bin ---
class WheelieBin {
  constructor(x, y, owner) {
    this.x = x;
    this.y = y;
    this.owner = owner;
    this.equipped = false;
    this.holder = null;
    this.pickupCooldown = 0;
    this.inFlight = false;
    this.onGround = true;
    this.linkedProjectile = null;
    this.w = 44;
    this.h = 58;
  }

  getPickupHitbox() {
    return {
      x: this.x - this.w / 2 - 8,
      y: this.y - this.h - 10,
      w: this.w + 16,
      h: this.h + 20,
    };
  }

  draw(c) {
    drawWheelieBinGraphic(c, this.x, this.y, this.owner, 1.1);
    if (this.onGround && !this.inFlight) {
      c.fillStyle = 'rgba(255,255,180,0.85)';
      c.font = '6px "Press Start 2P"';
      c.textAlign = 'center';
      const label = this.owner === 'player' ? 'YOUR BIN — WALK IN' : 'COP BIN';
      c.fillText(label, this.x, this.y - this.h - 12);
    }
  }
}

// --- Projectile (thrown bin) ---
class BinProjectile {
  constructor(x, y, facing, owner, damageMult, binRef) {
    this.x = x;
    this.y = y;
    this.vx = facing * 9;
    this.vy = -2;
    this.facing = facing;
    this.owner = owner;
    this.damageMult = damageMult;
    this.binRef = binRef;
    this.active = true;
    this.gravity = 0.35;
    this.grounded = false;
    if (binRef) {
      binRef.inFlight = true;
      binRef.onGround = false;
      binRef.linkedProjectile = this;
    }
  }

  getHitbox() {
    return { x: this.x - 24, y: this.y - 48, w: 48, h: 48 };
  }

  update() {
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;
    if (this.y >= GROUND_Y - 10) {
      this.y = GROUND_Y - 10;
      this.vy = 0;
      this.grounded = true;
      if (Math.abs(this.vx) < 1) this.active = false;
      else this.vx *= 0.9;
    }
  }

  draw(c) {
    drawWheelieBinGraphic(c, this.x, this.y, this.owner, 1.0);
  }
}

// --- Fighter ---
class Fighter {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = 100;
    this.facing = type === 'player' ? 1 : -1;
    this.onGround = true;
    this.ducking = false;
    this.attacking = false;
    this.attackTimer = 0;
    this.attackFrame = 0;
    this.hasBin = false;
    this.binEquipped = false;
    this.invuln = 0;
    this.hitStun = 0;
    this.speedMult = 1;
    this.damageMult = 1;
    this.width = 48;
    this.height = 100;
    this.koPhase = null;
    this.koTimer = 0;
    this.koBinProgress = 0;
    this.scaleY = 1;
    this.pose = 'idle';
    this.animFrame = 0;
    this.throwCooldown = 0;
    this.swingCooldown = 0;
    this.attackHitDone = false;
    this.hitFlash = 0;
    this.lastDamage = 0;
  }

  getHitbox() {
    const h = this.ducking ? 72 : 135;
    const w = this.ducking ? 72 : 56;
    return {
      x: this.x - w / 2,
      y: this.y - h * this.scaleY,
      w,
      h: h * this.scaleY,
    };
  }

  getFeetHitbox() {
    return {
      x: this.x - 36,
      y: this.y - 55,
      w: 72,
      h: 55,
    };
  }

  computeAttackHitbox() {
    const reach = this.hasBin ? 95 : 58;
    const h = this.ducking ? 50 : 75;
    const yTop = this.y - h - 50;
    if (this.facing > 0) {
      return { x: this.x + 8, y: yTop, w: reach, h };
    }
    return { x: this.x - reach - 8, y: yTop, w: reach, h };
  }

  update(game, keys) {
    if (this.hp <= 0 && this.koPhase) return;

    this.animFrame++;
    if (this.invuln > 0) this.invuln--;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.hitStun > 0) {
      this.hitStun--;
      this.x += this.vx;
      this.vx *= 0.85;
      return;
    }
    if (this.throwCooldown > 0) this.throwCooldown--;
    if (this.swingCooldown > 0) this.swingCooldown--;

    if (this.type === 'player' && this.hp > 0) {
      this.handlePlayerInput(game, keys);
    }

    // Gravity
    if (!this.onGround) {
      this.vy += 0.9;
      this.y += this.vy;
      if (this.y >= this.baseY) {
        this.y = this.baseY;
        this.vy = 0;
        this.onGround = true;
      }
    }

    this.x = clamp(this.x, 40, W - 40);
  }

  handlePlayerInput(game, keys) {
    if (this.attacking && this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer >= 3 && this.attackTimer <= 11) {
        this.checkAttackHit(game);
      }
      if (this.attackTimer === 0) {
        this.attacking = false;
      }
      return;
    }

    const speed = 4.2 * this.speedMult;
    this.ducking = keys['ArrowDown'] && this.onGround;

    if (!this.ducking) {
      if (keys['ArrowLeft']) {
        this.vx = -speed;
        this.facing = -1;
        this.pose = 'walk';
      } else if (keys['ArrowRight']) {
        this.vx = speed;
        this.facing = 1;
        this.pose = 'walk';
      } else {
        this.vx = 0;
        this.pose = 'idle';
      }

      if (keys['ArrowUp'] && this.onGround) {
        this.vy = -14;
        this.onGround = false;
        this.pose = 'jump';
      }
    } else {
      this.vx = 0;
      this.pose = 'duck';
    }

    this.x += this.vx;

    if (keys['KeyZ'] && this.swingCooldown <= 0 && this.hasBin) {
      this.startAttack();
      this.swingCooldown = 35;
    }
    if (keys['KeyX'] && this.throwCooldown <= 0 && this.hasBin) {
      this.throwBin(game);
      this.throwCooldown = 50;
    }
  }

  startAttack() {
    this.attacking = true;
    this.attackTimer = 16;
    this.attackFrame = 0;
    this.attackHitDone = false;
    this.pose = 'attack';
  }

  checkAttackHit(game) {
    if (this.attackHitDone) return;
    const box = this.computeAttackHitbox();
    const other = this.type === 'player' ? game.cop : game.player;
    if (rectsOverlap(box, other.getHitbox())) {
      game.dealDamage(this, other);
      this.attackHitDone = true;
      if (this.hasBin && Math.random() < 0.08) {
        game.releaseBin(this, this.x + this.facing * 30, GROUND_Y - 8);
      }
    }
  }

  throwBin(game) {
    if (!this.hasBin) return;
    const ownerTag = this.type === 'player' ? 'player' : 'cop';
    const bin = game.getBinForOwner(ownerTag);
    if (!bin) return;

    this.hasBin = false;
    this.binEquipped = false;
    bin.equipped = false;
    bin.holder = null;

    const proj = new BinProjectile(
      this.x + this.facing * 40,
      this.y - 50,
      this.facing,
      this.type,
      this.damageMult,
      bin
    );
    game.projectiles.push(proj);
    this.pose = 'throw';
  }

  updateAI(game) {
    if (this.type !== 'cop' || this.hp <= 0 || this.hitStun > 0) return;

    const p = game.player;
    const dist = p.x - this.x;
    const speed = 3.2 * this.speedMult;

    if (this.attacking && this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer >= 3 && this.attackTimer <= 11) {
        this.checkAttackHit(game);
      }
      if (this.attackTimer === 0) this.attacking = false;
      return;
    }

    this.facing = dist > 0 ? 1 : -1;

    if (!this.hasBin) {
      const myBin = game.getBinForOwner('cop');
      if (myBin && !myBin.equipped && !myBin.inFlight && myBin.onGround) {
        const dx = myBin.x - this.x;
        if (Math.abs(dx) > 20) {
          this.x += Math.sign(dx) * speed * 0.9;
          this.pose = 'walk';
        }
      } else if (Math.abs(dist) > 80) {
        this.x += Math.sign(dist) * speed * 0.7;
        this.pose = 'walk';
      }
    } else {
      if (Math.abs(dist) > 55) {
        this.x += Math.sign(dist) * speed * 0.85;
        this.pose = 'walk';
      } else {
        this.pose = 'idle';
        if (Math.random() < this.aiAggression && this.swingCooldown <= 0) {
          this.startAttack();
          this.swingCooldown = 40 + randInt(0, 30);
        }
        if (Math.random() < this.aiAggression * 0.5 && this.throwCooldown <= 0 && Math.abs(dist) < 200) {
          this.throwBin(game);
          this.throwCooldown = 70;
        }
      }
    }

    if (Math.random() < 0.008 * this.speedMult && this.onGround) {
      this.vy = -12;
      this.onGround = false;
    }

    this.ducking = Math.abs(dist) < 60 && p.attacking && Math.random() < 0.04;
  }

  draw(c) {
    c.save();
    c.translate(this.x, this.y);
    c.scale(this.facing, this.scaleY);

    if (this.type === 'player') {
      drawSkinhead(c, this);
    } else {
      drawCopper(c, this);
    }

    const binOwner = this.type === 'player' ? 'player' : 'cop';
    if (this.hasBin && !this.attacking) {
      drawWheelieBinGraphic(c, 32, -78, binOwner, 0.72);
    }
    if (this.attacking && this.hasBin) {
      const swing = (16 - this.attackTimer) / 16;
      c.save();
      c.rotate(-0.6 - swing * 1.2);
      drawWheelieBinDetailed(c, 52, -92, null, 1.05, swing > 0.35, binOwner);
      c.restore();
    }

    if (this.invuln > 0 && Math.floor(this.invuln / 3) % 2) {
      c.globalAlpha = 0.6;
    }

    c.restore();

    if (this.hitFlash > 0) {
      drawHitSpark(c, this.x, this.y - 110, 20 - this.hitFlash);
      c.fillStyle = '#ff4444';
      c.font = 'bold 12px Arial';
      c.textAlign = 'center';
      c.fillText(`-${this.lastDamage}`, this.x, this.y - 130);
    }

    // Debug attack box (optional) — uncomment to tune hitboxes
    // if (this.attacking && this.type === 'player') {
    //   const b = this.computeAttackHitbox();
    //   c.strokeStyle = 'rgba(255,0,0,0.5)';
    //   c.strokeRect(b.x, b.y, b.w, b.h);
    // }
  }
}

// --- Boot ---
const game = new Game();
game.start();
game.loop();