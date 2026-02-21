import { Game } from './game.js';
import { UIManager } from './uiManager.js';
import { AudioManager } from './audioManager.js';
import { initLang } from './i18n.js';
import { AchievementsManager } from './achievementsManager.js';

initLang();

const canvas = document.getElementById('gameCanvas');
const uiRoot = {
  overlay: document.getElementById('overlay'),
  screens: {
    menu: document.getElementById('screenMenu'),
    pause: document.getElementById('screenPause'),
    end: document.getElementById('screenEnd'),
    credits: document.getElementById('screenCredits')
  },
  menu: {
    levelList: document.getElementById('levelList'),
    volume: document.getElementById('volume'),
    language: document.getElementById('languageSelect'),
    btnMute: document.getElementById('btnMute'),
    btnCredits: document.getElementById('btnCredits'),
    btnCreditsBack: document.getElementById('btnCreditsBack')
  },
  pause: {
    btnResume: document.getElementById('btnResume'),
    btnRestart: document.getElementById('btnRestart'),
    btnBackToMenu: document.getElementById('btnBackToMenu')
  },
  end: {
    title: document.getElementById('endTitle'),
    summary: document.getElementById('endSummary'),
    stars: document.getElementById('endStars'),
    godSprite: document.getElementById('godEndSprite'),
    btnNext: document.getElementById('btnNext'),
    btnRetry: document.getElementById('btnRetry'),
    btnEndMenu: document.getElementById('btnEndMenu')
  },
  hud: {
    level: document.getElementById('hudLevel'),
    score: document.getElementById('hudScore'),
    combo: document.getElementById('hudCombo'),
    arrows: document.getElementById('hudArrows'),
    state: document.getElementById('hudState'),
    chaos: document.getElementById('hudChaos'),
    timer: document.getElementById('hudTimer')
  }
};

const audio = new AudioManager();
const game = new Game({ canvas, audio });
const achievements = new AchievementsManager({ levels: game.getLevels(), compat: game.compat });
game.setAchievements(achievements);
const ui = new UIManager({ game, audio, uiRoot, achievements });

ui.init();
game.start();
