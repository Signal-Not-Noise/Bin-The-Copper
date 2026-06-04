/**
 * Procedural SFX & chiptune BGM via Web Audio (no external files)
 */
const AudioEngine = {
  ctx: null,
  musicGain: null,
  sfxGain: null,
  initialized: false,
  musicPlaying: false,
  musicStep: 0,
  musicTimer: null,
  muted: false,

  ensureInit() {
    if (this.initialized) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.14;
    this.sfxGain.gain.value = 0.4;
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    this.initialized = true;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startMusic();
  },

  playTone(freq, duration, type, volume, when, bus = 'sfx') {
    if (!this.initialized || this.muted || freq <= 0) return;
    const ctx = this.ctx;
    const t = when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(bus === 'music' ? this.musicGain : this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  },

  playNoise(duration, volume) {
    if (!this.initialized || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration);
  },

  /** Hit / bin impact */
  playHit(attackerIsPlayer, damage) {
    this.ensureInit();
    if (!this.initialized || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const heavy = damage >= 8;
    const base = heavy ? 90 : 140;
    const slide = heavy ? 50 : 70;

    this.playNoise(heavy ? 0.12 : 0.08, heavy ? 0.35 : 0.22);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(slide, t + 0.1);
    gain.gain.setValueAtTime(heavy ? 0.45 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);

    if (attackerIsPlayer) {
      this.playTone(220, 0.05, 'triangle', 0.15, t);
    } else {
      this.playTone(160, 0.06, 'sawtooth', 0.12, t + 0.02);
    }
  },

  playPowerUp() {
    this.ensureInit();
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      this.playTone(f, 0.12, 'square', 0.2, t + i * 0.1);
    });
  },

  playRoundStart() {
    this.ensureInit();
    if (!this.initialized || this.muted) return;
    this.playTone(392, 0.08, 'square', 0.15);
    this.playTone(523, 0.12, 'square', 0.18, this.ctx.currentTime + 0.08);
  },

  // UK pub-fight style loop (Am / G feel)
  startMusic() {
    if (!this.initialized || this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicStep = 0;

    const bass = [110, 0, 110, 98, 110, 0, 87, 98];
    const lead = [0, 220, 262, 220, 0, 196, 220, 0];
    const hat = [0, 1, 0, 1, 0, 1, 0, 1];

    const tick = () => {
      if (!this.musicPlaying || !this.initialized) return;
      const i = this.musicStep % 8;
      const t = this.ctx.currentTime;

      if (bass[i] > 0) {
        this.playTone(bass[i], 0.14, 'triangle', 0.1, t, 'music');
      }
      if (lead[i] > 0) {
        this.playTone(lead[i], 0.1, 'square', 0.06, t, 'music');
      }
      if (hat[i]) {
        this.playNoise(0.02, 0.04);
      }

      this.musicStep++;
      this.musicTimer = setTimeout(tick, 210);
    };
    tick();
  },

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  },
};

window.addEventListener('keydown', () => AudioEngine.ensureInit(), { once: false });
window.addEventListener('click', () => AudioEngine.ensureInit(), { once: false });