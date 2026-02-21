import { GameState } from './game.js';
import { formatTime } from './utils.js';
import { getLang, setLang, t } from './i18n.js';

export class UIEvents {
  constructor() {
    this._listeners = new Map();
  }

  on(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }

  emit(type, payload) {
    for (const fn of this._listeners.get(type) ?? []) fn(payload);
  }
}

export class UIManager {
  constructor({ game, audio, uiRoot, achievements }) {
    this.game = game;
    this.audio = audio;
    this.ui = uiRoot;
    this.achievements = achievements ?? null;

    this._tickTimer = 0;
    this._timerInterval = 200;

    this._godAnimTimer = 0;

    this._lastEndPayload = null;
  }

  _renderCreditsTheme2() {
    const root = document.getElementById('creditsTheme2');
    if (!root) return;

    root.innerHTML = '';

    const heading = document.createElement('p');
    const headingStrong = document.createElement('b');
    headingStrong.textContent = 'Theme 2:';
    heading.appendChild(headingStrong);
    root.appendChild(heading);

    const entries = [
      {
        lang: 'English',
        text:
          "Cupid's Arrow is said to pierce through two people's hearts, forever binding them together. Or maybe Cupid has to, like, double-tap two different people: if the first arrow hits someone, then the next person Cupid shoots is bound to the first person. But what happens if Cupid misses one of them? Could you be bound to a rock, or something? How do the mechanics of this thing even work? That's up for you to decide, in your game about bringing people together as Cupid, using your magic bow and arrow of love!"
      }
    ];

    for (const entry of entries) {
      const p = document.createElement('p');
      const label = document.createElement('span');
      label.className = 'langLabel';
      label.textContent = `${entry.lang}: `;
      const text = document.createElement('span');
      text.textContent = entry.text;
      p.appendChild(label);
      p.appendChild(text);
      root.appendChild(p);
    }
  }

  init() {
    this._wireI18n();
    this._buildLevelButtons();
    this._wireButtons();
    this._wireGameEvents();

    this._applyI18n();
    this._renderAchievements();
    this._wireFirstGestureAudio();

    this.showScreen('menu');
    this._startHudTicker();
  }

  _wireFirstGestureAudio() {
    const kick = () => {
      try {
        this.audio.ensureStarted();
        this.audio.playMusic();
      } catch {
        // ignore
      }
    };

    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
  }

  _wireI18n() {
    const sel = this.ui.menu.language;
    if (!sel) return;

    sel.value = getLang();
    sel.addEventListener('change', () => {
      setLang(sel.value);
      this._applyI18n();
      this._buildLevelButtons();
      this._updateHud(this.game.session);
      this._renderAchievements();
      if (this.game.state === GameState.END && this._lastEndPayload) this._renderEnd(this._lastEndPayload);
    });
  }

  _applyI18n() {
    // Update document language attribute.
    const lang = getLang();
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;

    // App branding (title/subtitle)
    const brandTitle = document.getElementById('brandTitle');
    if (brandTitle) brandTitle.textContent = t('app.title');
    const brandSubtitle = document.getElementById('brandSubtitle');
    if (brandSubtitle) brandSubtitle.textContent = t('app.subtitle');
    try {
      document.title = t('app.title');
      const canvas = document.getElementById('gameCanvas');
      if (canvas) canvas.setAttribute('aria-label', t('app.title'));
    } catch {
      // ignore
    }

    // MENU
    const menu = this.ui.menu;
    const playTitle = document.getElementById('menuPlayTitle');
    if (playTitle) playTitle.textContent = t('menu.play');
    const choose = document.getElementById('menuChooseLevel');
    if (choose) choose.textContent = t('menu.chooseLevel');
    const optTitle = document.getElementById('menuOptionsTitle');
    if (optTitle) optTitle.textContent = t('menu.options');
    const volLabel = document.getElementById('menuVolumeLabel');
    if (volLabel) volLabel.textContent = t('menu.volume');
    const langLabel = document.getElementById('menuLanguageLabel');
    if (langLabel) langLabel.textContent = t('menu.language');
    const hintMouse = document.getElementById('menuHintMouse');
    if (hintMouse) hintMouse.innerHTML = t('menu.hintMouse').replace(/^([^:]+):/, '<b>$1</b>:');
    const hintKeys = document.getElementById('menuHintKeys');
    if (hintKeys) {
      hintKeys.innerHTML = t('menu.hintKeys')
        .replace(/\bESC\b/g, '<b>ESC</b>')
        .replace(/\bR\b/g, '<b>R</b>')
        .replace(/\bF3\b/g, '<b>F3</b>');
    }
    const footer = document.getElementById('menuFooter');
    if (footer) footer.innerHTML = t('menu.footer').replace('Gobbo', '<b>Gobbo</b>');

    const achTitle = document.getElementById('menuAchievementsTitle');
    if (achTitle) achTitle.textContent = t('menu.achievements');

    if (menu.btnCredits) menu.btnCredits.textContent = t('menu.credits');
    this._syncMuteButton();

    // PAUSE
    const pauseTitle = document.getElementById('pauseTitle');
    if (pauseTitle) pauseTitle.textContent = t('pause.title');
    this.ui.pause.btnResume.textContent = t('pause.resume');
    this.ui.pause.btnRestart.textContent = t('pause.restart');
    this.ui.pause.btnBackToMenu.textContent = t('pause.menu');

    // END buttons (title/summary handled in _renderEnd)
    this.ui.end.btnNext.textContent = t('end.next');
    this.ui.end.btnRetry.textContent = t('end.retry');
    this.ui.end.btnEndMenu.textContent = t('end.menu');

    // CREDITS
    const cTitle = document.getElementById('creditsTitle');
    if (cTitle) cTitle.textContent = t('credits.title');
    const cDevLabel = document.getElementById('creditsDevLabel');
    if (cDevLabel) cDevLabel.textContent = `${t('credits.devLabel')} `;
    const cDevLink = document.getElementById('creditsDevLink');
    if (cDevLink) {
      cDevLink.textContent = 'Mateus Tormes Gervazioni';
      cDevLink.href = 'https://www.linkedin.com/in/mateus-tormes-gervazioni/';
    }
    const cBody = document.getElementById('creditsBody');
    if (cBody) {
      const body = t('credits.body');
      cBody.innerHTML = body;
      cBody.style.display = body ? 'block' : 'none';
    }
    const cCameo = document.getElementById('creditsCameo');
    if (cCameo) cCameo.innerHTML = 'Cameo: <b>Gobbo</b> (Imaginary Game Studios).';

    this._renderCreditsTheme2();

    const cNote = document.getElementById('creditsNote');
    if (cNote) cNote.textContent = t('credits.note');
    if (this.ui.menu.btnCreditsBack) this.ui.menu.btnCreditsBack.textContent = lang === 'pt' ? 'Voltar' : lang === 'es' ? 'Volver' : 'Back';

    // HUD labels are refreshed in _updateHud
  }

  _renderAchievements(progressOverride) {
    const listEl = document.getElementById('achievementsList');
    if (!listEl) return;

    const progress = progressOverride ?? (this.achievements ? this.achievements.getProgress() : []);
    listEl.innerHTML = '';

    for (const a of progress) {
      const row = document.createElement('div');
      row.className = `achievementItem ${a.unlocked ? 'is-unlocked' : ''}`;

      const dot = document.createElement('div');
      dot.className = 'achievementDot';

      const text = document.createElement('div');
      text.textContent = this._formatAchievement(a);

      row.appendChild(dot);
      row.appendChild(text);
      listEl.appendChild(row);
    }
  }

  _formatAchievement(a) {
    if (a.type === 'npc-npc') {
      return `${a.aName} + ${a.bName} ${a.unlocked ? '(' + t('ach.unlocked') + ')' : '(' + t('ach.locked') + ')'}`;
    }
    if (a.type === 'npc-obj') {
      const obj = t(`obj.${a.objKind}`);
      return `${a.npcName} + ${obj} ${a.unlocked ? '(' + t('ach.unlocked') + ')' : '(' + t('ach.locked') + ')'}`;
    }
    return a.key;
  }

  _syncMuteButton() {
    const isMuted = typeof this.audio?.isMuted === 'function' ? this.audio.isMuted() : Boolean(this.audio?._muted);
    this.ui.menu.btnMute.textContent = isMuted ? t('menu.unmute') : t('menu.mute');
  }

  showScreen(name) {
    const hasScreen = Boolean(name);
    this.ui.overlay.classList.toggle('is-hidden', !hasScreen);
    for (const key of Object.keys(this.ui.screens)) {
      this.ui.screens[key].classList.toggle('is-active', key === name);
    }

    if (name !== 'end') this._stopGodEndAnimation();
  }

  _buildLevelButtons() {
    const list = this.ui.menu.levelList;
    list.innerHTML = '';
    const levels = this.game.getLevels();

    levels.forEach((lvl, idx) => {
      const btn = document.createElement('button');
      btn.className = 'btn primary';
      const name = t(`level.${lvl.id}`);
      btn.textContent = `${idx + 1}. ${name}`;
      btn.addEventListener('click', () => this.game.newGame(idx));
      list.appendChild(btn);
    });
  }

  _wireButtons() {
    const { menu, pause, end } = this.ui;

    menu.volume.addEventListener('input', () => {
      this.audio.setVolume(parseFloat(menu.volume.value));
    });
    menu.btnMute.addEventListener('click', () => this.audio.toggleMute());
    menu.btnCredits.addEventListener('click', () => {
      this.game.setState(GameState.CREDITS);
      this.showScreen('credits');
    });
    menu.btnCreditsBack.addEventListener('click', () => {
      this.game.backToMenu();
    });

    pause.btnResume.addEventListener('click', () => this.game.pauseToggle());
    pause.btnRestart.addEventListener('click', () => this.game.restartLevel());
    pause.btnBackToMenu.addEventListener('click', () => this.game.backToMenu());

    end.btnNext.addEventListener('click', () => this.game.nextLevel());
    end.btnRetry.addEventListener('click', () => this.game.restartLevel());
    end.btnEndMenu.addEventListener('click', () => this.game.backToMenu());
  }

  _wireGameEvents() {
    this.game.ui.on('state', (st) => {
      if (st === GameState.MENU) this.showScreen('menu');
      if (st === GameState.PAUSED) this.showScreen('pause');
      if (st === GameState.PLAYING) this.showScreen('');
      if (st === GameState.END) this.showScreen('end');
      if (st === GameState.CREDITS) this.showScreen('credits');
    });

    this.game.ui.on('session', (s) => this._updateHud(s));
    this.game.ui.on('end', (payload) => this._renderEnd(payload));
    this.game.ui.on('achievements', (progress) => this._renderAchievements(progress));

    // reflect mute
    this.audio.on('mute', (isMuted) => {
      this.ui.menu.btnMute.textContent = isMuted ? t('menu.unmute') : t('menu.mute');
    });

    this.game.ui.on('debug', (d) => {
      this.ui.hud.state.textContent = d ? 'Debug ON' : this.ui.hud.state.textContent;
    });
  }

  _updateHud(session) {
    const level = this.game.getActiveLevel();
    const levelName = level ? t(`level.${level.id}`) : '-';
    this.ui.hud.level.textContent = t('hud.level', { name: levelName });
    this.ui.hud.score.textContent = t('hud.score', { score: session.score });
    this.ui.hud.combo.textContent = t('hud.combo', { combo: session.combo });
    const left = session.arrowsLeft ?? 0;
    const max = session.maxArrows ?? 0;
    this.ui.hud.arrows.textContent = max > 0 ? t('hud.arrows', { left, max }) : t('hud.arrowsSolo', { left });
    this.ui.hud.chaos.textContent = t('hud.chaos', { pct: Math.round(session.chaos) });
    this.ui.hud.state.textContent = this.game.binding.state;
  }

  _startHudTicker() {
    setInterval(() => {
      if (this.game.state !== GameState.PLAYING) return;
      const t = performance.now() - this.game.session.startMs;
      this.ui.hud.timer.textContent = formatTime(t);
    }, this._timerInterval);
  }

  _renderEnd(p) {
    this._lastEndPayload = p;
    this.ui.end.title.textContent = p.victory ? t('end.victory') : t('end.defeat');
    const acc = Math.round(p.accuracy * 100);
    const best = p.best
      ? t('end.bestFmt', { total: p.best.total, stars: p.best.stars })
      : t('end.bestFirst');

    this.ui.end.summary.textContent = t('end.summaryFmt', {
      reason: p.reason,
      total: p.total,
      acc,
      shots: p.shots,
      misbinds: p.misbinds,
      best
    });

    this.ui.end.stars.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('div');
      s.className = `star ${i < p.stars ? 'on' : ''}`;
      this.ui.end.stars.appendChild(s);
    }

    // Hide next on last level
    const isLast = this.game.activeLevelIndex >= this.game.getLevels().length - 1;
    this.ui.end.btnNext.style.display = isLast ? 'none' : 'inline-flex';

    if (p.victory) this._startGodEndAnimation();
    else this._stopGodEndAnimation();
  }

  _startGodEndAnimation() {
    const el = this.ui.end.godSprite;
    if (!el) return;
    this._stopGodEndAnimation();

    const frames = [
      './public/assets/sprites/god/frame_000.png',
      './public/assets/sprites/god/frame_001.png',
      './public/assets/sprites/god/frame_002.png',
      './public/assets/sprites/god/frame_003.png'
    ];

    let idx = 0;
    el.src = frames[1];
    el.classList.add('is-active');
    this._godAnimTimer = window.setInterval(() => {
      idx = (idx + 1) % frames.length;
      el.src = frames[idx];
    }, 140);
  }

  _stopGodEndAnimation() {
    const el = this.ui.end.godSprite;
    if (this._godAnimTimer) {
      window.clearInterval(this._godAnimTimer);
      this._godAnimTimer = 0;
    }
    if (!el) return;
    el.classList.remove('is-active');
    el.src = '';
  }
}
