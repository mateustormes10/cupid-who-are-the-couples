import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { Physics } from './physics.js';
import { ArrowSystem } from './arrowSystem.js';
import { NPCSystem } from './npcSystem.js';
import { BindingSystem } from './bindingSystem.js';
import { CompatibilitySystem } from './compatibilitySystem.js';
import { EventSystem } from './eventSystem.js';
import { LevelManager } from './levelManager.js';
import { UIEvents } from './uiManager.js';
import { SpriteManager } from './spriteManager.js';
import { t } from './i18n.js';

export const GameState = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  END: 'end',
  CREDITS: 'credits'
});

export class Game {
  constructor({ canvas, audio }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audio;

    this.state = GameState.MENU;
    this.debug = false;

    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas, this.ctx);
    this.physics = new Physics();

    this.compat = new CompatibilitySystem();
    this.events = new EventSystem({ audio });
    this.levels = new LevelManager();

    this.sprites = new SpriteManager();
    this.sprites.preload();

    this.npcs = new NPCSystem({ compat: this.compat });
    this.binding = new BindingSystem({ compat: this.compat, events: this.events, audio });
    this.arrows = new ArrowSystem({ physics: this.physics, binding: this.binding, audio });

    this.ui = new UIEvents();
    this._wireInput();

    this.achievements = null;

    this.activeLevelIndex = 0;
    this._activeLevel = null;
    this.session = this._newSession();

    this.lastVictory = false;

    this.player = {
      pos: { x: 120, y: 420 },
      vel: { x: 0, y: 0 },
      r: 16,
      speed: 240,
      facing: 'south',
      animT: 0,
      animFrame: 0,
      shootT: 0
    };

    this._lastTs = 0;
    this._raf = 0;
  }

  setAchievements(achievements) {
    this.achievements = achievements ?? null;
    if (this.achievements) this.ui.emit('achievements', this.achievements.getProgress());
  }

  getLevels() {
    return this.levels.getAll();
  }

  getActiveLevel() {
    return this._activeLevel ?? this.levels.get(this.activeLevelIndex);
  }

  start() {
    this._raf = requestAnimationFrame((ts) => this._loop(ts));
  }

  setState(nextState) {
    this.state = nextState;
    this.ui.emit('state', nextState);
  }

  setDebug(isOn) {
    this.debug = isOn;
    this.ui.emit('debug', this.debug);
  }

  newGame(levelIndex = 0) {
    this.lastVictory = false;
    this.activeLevelIndex = Math.max(0, Math.min(levelIndex, this.levels.getAll().length - 1));
    this.session = this._newSession();

    const baseLevel = this.levels.get(this.activeLevelIndex);
    this._activeLevel = this._cloneLevel(baseLevel);
    const level = this._activeLevel;
    this.npcs.loadLevel(level);
    this.binding.reset({ keepOutcome: false, clearBonds: true });
    this.arrows.reset();
    this.events.reset();

    // Spawn player (do not mutate level definition)
    this.player.pos.x = level.cupid.pos.x;
    this.player.pos.y = level.cupid.pos.y;
    this.player.vel.x = 0;
    this.player.vel.y = 0;
    this.player.facing = 'south';
    this.player.animT = 0;
    this.player.animFrame = 0;
    this.player.shootT = 0;

    // Arrows budget (simple: enough for some mistakes)
    this.session.maxArrows = level.maxArrows ?? (this.npcs.requiredPairs * 3 + 4);
    this.session.arrowsLeft = this.session.maxArrows;

    // God mission prompt (toast)
    const goal = this.npcs.requiredPairs;
    const couples = goal === 1 ? t('unit.couple1') : t('unit.coupleN');
    this.events.toast(t('toast.godMission', { goal, couples }));

    // God briefing (in-canvas, start of level)
    this.session.godBriefT = 6.0;
    this.session.godBriefLines = [
      t('brief.line1', { goal, couples }),
      t('brief.line2'),
      t('brief.line3'),
      t('brief.line4'),
      t('brief.line5')
    ];

    this.ui.emit('session', this.session);

    this.setState(GameState.PLAYING);
    this.audio.ensureStarted();
    this.audio.playMusic();
  }

  restartLevel() {
    this.newGame(this.activeLevelIndex);
  }

  nextLevel() {
    const nextIndex = Math.min(this.activeLevelIndex + 1, this.levels.getAll().length - 1);
    this.newGame(nextIndex);
  }

  backToMenu() {
    this._clearTransientEffects();
    this.setState(GameState.MENU);
  }

  pauseToggle() {
    if (this.state === GameState.PLAYING) this.setState(GameState.PAUSED);
    else if (this.state === GameState.PAUSED) this.setState(GameState.PLAYING);
  }

  endLevel({ victory, reason }) {
    this.lastVictory = Boolean(victory);
    this.setState(GameState.END);
    this.audio.playJingle(victory ? 'win' : 'lose');
    this.ui.emit('end', this._buildEndPayload({ victory, reason }));
    this._clearTransientEffects();
  }

  _clearTransientEffects() {
    // Prevent effects/lines persisting across screens/levels.
    this.arrows.reset();
    this.events.reset();
    this.binding.reset({ keepOutcome: true, clearBonds: true });
  }

  _buildEndPayload({ victory, reason }) {
    const durationMs = Math.max(1, performance.now() - this.session.startMs);
    const accuracy = this.session.shots > 0 ? this.session.hits / this.session.shots : 0;
    const base = this.session.score;

    // Jam-friendly/simple scoring: end-screen "Total" matches the in-game Score.
    const total = Math.max(0, base);

    // Stars are binary: win=3★, loss=0★.
    const stars = this._starsFor(total, victory);
    const level = this.getActiveLevel();

    this._saveLocalRanking({ levelId: level.id, total, stars, durationMs, accuracy, victory: Boolean(victory) });

    return {
      victory,
      reason,
      level,
      total,
      stars,
      durationMs,
      accuracy,
      shots: this.session.shots,
      hits: this.session.hits,
      misbinds: this.session.misbinds,
      rejected: this.session.rejected,
      best: this._getLocalBest(level.id)
    };
  }

  _starsFor(_total, victory) {
    return victory ? 3 : 0;
  }

  _getLocalBest(levelId) {
    try {
      const raw = localStorage.getItem(`dtd_best_${levelId}`);
      const prev = raw ? JSON.parse(raw) : null;
      if (!prev) return null;

      // Migration: old saves used 0-3 stars based on thresholds.
      // New rule is binary (win=3★, loss=0★). If victory isn't stored,
      // treat any non-zero stars as a win.
      if (prev.victory === undefined) {
        const wasWin = Number(prev.stars ?? 0) > 0;
        prev.victory = wasWin;
        prev.stars = wasWin ? 3 : 0;
      } else {
        prev.stars = prev.victory ? 3 : 0;
      }

      return prev;
    } catch {
      return null;
    }
  }

  _saveLocalRanking({ levelId, total, stars, durationMs, accuracy, victory }) {
    const prev = this._getLocalBest(levelId);
    const next = {
      total,
      victory: Boolean(victory),
      stars: Boolean(victory) ? 3 : 0,
      durationMs,
      accuracy,
      at: new Date().toISOString()
    };

    if (!prev) {
      localStorage.setItem(`dtd_best_${levelId}`, JSON.stringify(next));
      return;
    }

    const prevScore = prev.total ?? 0;
    const prevStars = prev.stars ?? 0;

    const isBetter = stars > prevStars || (stars === prevStars && total > prevScore);
    if (isBetter) localStorage.setItem(`dtd_best_${levelId}`, JSON.stringify(next));
  }

  _newSession() {
    return {
      startMs: performance.now(),
      score: 0,
      combo: 1,
      shots: 0,
      hits: 0,
      misbinds: 0,
      rejected: 0,
      chaos: 0,
      boundPairs: 0,
      requiredPairs: 0,
      arrowsLeft: 0,
      maxArrows: 0,
      godBriefT: 0,
      godBriefLines: null
    };
  }

  _cloneLevel(base) {
    const objects = (base?.objects ?? []).map((o) => {
      const kind = String(o.kind ?? '').toLowerCase();
      const defaultSolid = kind === 'rock' || kind === 'crate' || kind === 'mushroom';
      const solid = o.solid === undefined ? defaultSolid : Boolean(o.solid);
      return {
        ...o,
        kind,
        solid,
        pos: { ...(o.pos ?? { x: 0, y: 0 }) },
        collected: false
      };
    });

    return {
      ...base,
      bounds: { ...(base?.bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 }) },
      cupid: { pos: { ...(base?.cupid?.pos ?? { x: 0, y: 0 }) } },
      npcs: Array.isArray(base?.npcs) ? base.npcs : [],
      objects
    };
  }

  _collectPickups(level) {
    if (!level?.objects?.length) return;

    let changed = false;
    for (const obj of level.objects) {
      if (obj.collected) continue;
      const pickup = obj.pickup;
      if (!pickup) continue;

      const dx = this.player.pos.x - obj.pos.x;
      const dy = this.player.pos.y - obj.pos.y;
      const r = (this.player.r ?? 16) + (obj.r ?? 12);
      if (dx * dx + dy * dy > r * r) continue;

      obj.collected = true;
      changed = true;

      if (pickup.type === 'arrows') {
        const amount = Number(pickup.amount ?? 0) || 0;
        if (amount) {
          this.session.maxArrows = Math.max(0, (this.session.maxArrows ?? 0) + amount);
          this.session.arrowsLeft = Math.max(0, (this.session.arrowsLeft ?? 0) + amount);
        }
      }
    }

    if (changed) this.ui.emit('session', this.session);
  }

  _wireInput() {
    this.input.on('shoot', () => {
      if (this.state !== GameState.PLAYING) return;
      if (this.session.arrowsLeft <= 0) {
        this.events.toast('Sem flechas restantes. (R) para reiniciar.');
        this.audio.playSfx('miss');
        return;
      }

      this.session.shots++;
      this.session.arrowsLeft = Math.max(0, this.session.arrowsLeft - 1);
      this.ui.emit('session', this.session);
      this.player.shootT = 0.22;
      this.arrows.shoot({ from: this.player.pos, to: this.input.worldMouse });
    });

    this.input.on('key', (key) => {
      if (key === 'Escape') this.pauseToggle();
      if (key === 'KeyR') this.restartLevel();
      if (key === 'KeyM') this.audio.toggleMute();
      if (key === 'F3') this.setDebug(!this.debug);
    });
  }

  _loop(ts) {
    const dt = this._lastTs === 0 ? 0 : Math.min(0.033, (ts - this._lastTs) / 1000);
    this._lastTs = ts;

    if (this.state === GameState.PLAYING) {
      this._update(dt);
    }
    this._render();

    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    const level = this.getActiveLevel();

    if (this.session.godBriefT > 0) {
      this.session.godBriefT = Math.max(0, this.session.godBriefT - dt);
    }

    // Player movement (WASD)
    const mv = this.input.getMoveVector();
    const moving = mv.x !== 0 || mv.y !== 0;
    if (moving) {
      if (Math.abs(mv.x) > Math.abs(mv.y)) this.player.facing = mv.x > 0 ? 'east' : 'west';
      else this.player.facing = mv.y > 0 ? 'south' : 'north';
    }

    if (moving) {
      this.player.animT += dt;
      this.player.animFrame = Math.floor(this.player.animT * 10) % 4;
    } else {
      this.player.animT = 0;
      this.player.animFrame = 0;
    }

    if (this.player.shootT > 0) this.player.shootT = Math.max(0, this.player.shootT - dt);

    this.player.vel.x = mv.x * this.player.speed;
    this.player.vel.y = mv.y * this.player.speed;
    this.player.pos.x += this.player.vel.x * dt;
    this.player.pos.y += this.player.vel.y * dt;

    // Clamp to bounds
    this.player.pos.x = Math.max(level.bounds.minX + this.player.r, Math.min(level.bounds.maxX - this.player.r, this.player.pos.x));
    this.player.pos.y = Math.max(level.bounds.minY + this.player.r, Math.min(level.bounds.maxY - this.player.r, this.player.pos.y));

    // Player vs solid objects
    for (let iter = 0; iter < 2; iter++) {
      let any = false;
      for (const obj of level.objects) {
        if (obj.collected) continue;
        if (obj.solid === false) continue;
        const mover = { x: this.player.pos.x, y: this.player.pos.y, r: this.player.r };
        const fixed = { x: obj.pos.x, y: obj.pos.y, r: obj.r };
        const hit = this.physics.separateCircleStatic({ mover, fixed });
        if (!hit) continue;
        any = true;
        this.player.pos.x = mover.x;
        this.player.pos.y = mover.y;
        this.player.pos.x = Math.max(level.bounds.minX + this.player.r, Math.min(level.bounds.maxX - this.player.r, this.player.pos.x));
        this.player.pos.y = Math.max(level.bounds.minY + this.player.r, Math.min(level.bounds.maxY - this.player.r, this.player.pos.y));
      }
      if (!any) break;
    }

    // Collect pickups (hearts -> +arrows)
    this._collectPickups(level);

    this.events.update(dt);
    this.binding.update(dt);
    this.arrows.update(dt, { level, npcs: this.npcs });
    this.npcs.update(dt, {
      level,
      chaos: this.session.chaos,
      player: this.player,
      arrows: this.arrows.arrows,
      physics: this.physics
    });

    // Player vs NPC collisions
    this.npcs.collideWithPlayer({ player: this.player, physics: this.physics, level });

    const bindingOutcome = this.binding.consumeLastOutcome();
    if (bindingOutcome) {
      this.session.hits += bindingOutcome.hits;

      const mult = bindingOutcome.scoreUseCombo ? this.session.combo : 1;
      this.session.score += (bindingOutcome.scoreDelta ?? 0) * mult;

      if (this.achievements && Array.isArray(bindingOutcome.unlockKeys) && bindingOutcome.unlockKeys.length) {
        let any = false;
        for (const k of bindingOutcome.unlockKeys) {
          if (this.achievements.unlock(k)) any = true;
        }
        if (any) this.ui.emit('achievements', this.achievements.getProgress());
      }

      if (bindingOutcome.comboReset) this.session.combo = 1;
      else if (bindingOutcome.comboBump) this.session.combo = Math.min(8, this.session.combo + 1);

      this.session.misbinds += bindingOutcome.misbinds;
      this.session.rejected += bindingOutcome.rejected;
      this.session.chaos = Math.max(0, Math.min(100, this.session.chaos + bindingOutcome.chaosDelta));
      this.session.boundPairs += bindingOutcome.boundPairs;
      this.session.requiredPairs = this.npcs.requiredPairs;

      this.ui.emit('session', this.session);

      if (this.session.chaos >= 100) {
        this.endLevel({ victory: false, reason: t('reason.chaos') });
      } else if (this.session.boundPairs >= this.session.requiredPairs && this.session.requiredPairs > 0) {
        this.endLevel({ victory: true, reason: t('reason.allPairs') });
      }
    }

    // Optional fail state: no arrows left and nothing in flight
    if (
      this.session.arrowsLeft <= 0 &&
      this.state === GameState.PLAYING &&
      this.binding.state === 'Idle' &&
      this.arrows.arrows.every((a) => a.hit) &&
      this.session.boundPairs < this.npcs.requiredPairs
    ) {
      this.endLevel({ victory: false, reason: t('reason.noArrows') });
    }
  }

  _render() {
    const level = this.getActiveLevel();
    this.renderer.render({
      state: this.state,
      debug: this.debug,
      level,
      input: this.input,
      session: this.session,
      compat: this.compat,
      player: this.player,
      npcs: this.npcs,
      arrows: this.arrows,
      binding: this.binding,
      events: this.events,
      sprites: this.sprites,
      meta: { lastVictory: this.lastVictory }
    });
  }
}
