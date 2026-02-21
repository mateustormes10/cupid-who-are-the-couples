export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this._volume = 0.7;
    this._muted = false;
    this._musicTimer = null;
    this._bgAudio = null;
    this._bgReady = false;
    this._listeners = new Map();
  }

  on(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }

  _emit(type, payload) {
    for (const fn of this._listeners.get(type) ?? []) fn(payload);
  }

  ensureStarted() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.32;
    this.sfxGain.gain.value = 0.75;

    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);

    this.setVolume(this._volume);
    this._applyMute();

    // Background music (HTMLAudio for simple looping file)
    this._initBgMusic();
  }

  _initBgMusic() {
    if (this._bgAudio) return;
    try {
      const a = new Audio('./public/assets/audio/cupid_background_music.mp3');
      a.loop = true;
      a.preload = 'auto';
      a.addEventListener('canplaythrough', () => {
        this._bgReady = true;
      });
      this._bgAudio = a;
      this._applyMute();
    } catch {
      this._bgAudio = null;
    }
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this._volume;
    this._applyMute();
  }

  getVolume() {
    return this._volume;
  }

  isMuted() {
    return this._muted;
  }

  toggleMute() {
    this._muted = !this._muted;
    this._applyMute();
    this._emit('mute', this._muted);
  }

  _applyMute() {
    if (this.master) this.master.gain.value = this._muted ? 0 : this._volume;
    if (this._bgAudio) {
      this._bgAudio.volume = this._muted ? 0 : Math.max(0, Math.min(1, this._volume));
    }
  }

  playSfx(kind) {
    this.ensureStarted();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.sfxGain);

    const map = {
      shoot: { f0: 880, f1: 520, t: 0.08, type: 'triangle' },
      tag: { f0: 660, f1: 990, t: 0.06, type: 'sine' },
      success: { f0: 523.25, f1: 783.99, t: 0.12, type: 'sine' },
      fail: { f0: 220, f1: 140, t: 0.16, type: 'square' },
      misbind: { f0: 310, f1: 930, t: 0.14, type: 'sawtooth' },
      miss: { f0: 300, f1: 120, t: 0.10, type: 'triangle' },
      win: { f0: 659.25, f1: 987.77, t: 0.28, type: 'sine' },
      lose: { f0: 196, f1: 146.83, t: 0.30, type: 'triangle' }
    };

    const s = map[kind] ?? map.miss;
    o.type = s.type;
    o.frequency.setValueAtTime(s.f0, now);
    o.frequency.exponentialRampToValueAtTime(s.f1, now + s.t);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + s.t);
    o.start(now);
    o.stop(now + s.t + 0.02);
  }

  playJingle(kind) {
    this.playSfx(kind);
  }

  playMusic() {
    this.ensureStarted();
    if (this._bgAudio) {
      // Requires user gesture; if blocked, ignore.
      const p = this._bgAudio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      return;
    }

    // Fallback: synthesized plucks
    if (!this.ctx) return;
    if (this._musicTimer) return;
    const notes = [261.63, 329.63, 392.0, 523.25];
    let i = 0;
    this._musicTimer = setInterval(() => {
      if (!this.ctx) return;
      const f = notes[i % notes.length];
      this._pluck(f, 0.10);
      i++;
    }, 380);
  }

  stopMusic() {
    if (this._bgAudio) {
      try {
        this._bgAudio.pause();
        this._bgAudio.currentTime = 0;
      } catch {
        // ignore
      }
    }
    if (this._musicTimer) clearInterval(this._musicTimer);
    this._musicTimer = null;
  }

  _pluck(freq, gain) {
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    o.connect(g);
    g.connect(this.musicGain);
    o.start(now);
    o.stop(now + 0.19);
  }
}
