const DIRS = ['east', 'north', 'south', 'west'];
const WALK_FRAMES = ['frame_000.png', 'frame_001.png', 'frame_002.png', 'frame_003.png'];
const SHOOT_FRAMES = ['frame_001.png', 'frame_002.png'];

function joinUrl(...parts) {
  return parts
    .filter(Boolean)
    .map((p) => String(p).replace(/\\/g, '/').replace(/^\//, '').replace(/\/$/, ''))
    .join('/');
}

function loadImage(url) {
  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  img.src = url;
  return img;
}

export class SpriteManager {
  constructor({ baseUrl = './public/assets/sprites' } = {}) {
    this.baseUrl = baseUrl;
    this._sets = new Map();
  }

  preload() {
    // Cupid
    this._loadDirectionalSet('Cupid', { dirs: DIRS, frames: WALK_FRAMES });
    this._loadFlatSet('Cupid/shooting', { frames: SHOOT_FRAMES });

    // NPCs
    this._loadDirectionalSet('npc_1', { dirs: DIRS, frames: WALK_FRAMES });
    this._loadDirectionalSet('npc_2', { dirs: DIRS, frames: WALK_FRAMES });
    this._loadDirectionalSet('npc_3', { dirs: DIRS, frames: WALK_FRAMES });

    // God (front only)
    this._loadFlatSet('god', { frames: WALK_FRAMES });
  }

  getDirectionalFrame(setName, dir, frameIndex) {
    const set = this._sets.get(setName);
    if (!set || set.type !== 'directional') return null;
    const d = DIRS.includes(dir) ? dir : 'south';
    const frames = set.framesByDir.get(d);
    if (!frames || frames.length === 0) return null;
    const idx = Math.max(0, Math.min(frames.length - 1, frameIndex | 0));
    const img = frames[idx];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }

  getShootingFrame(frameIndex) {
    const set = this._sets.get('Cupid/shooting');
    if (!set || set.type !== 'flat') return null;
    const frames = set.frames;
    if (!frames || frames.length === 0) return null;
    const idx = Math.max(0, Math.min(frames.length - 1, frameIndex | 0));
    const img = frames[idx];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }

  getFlatFrame(setName, frameIndex) {
    const set = this._sets.get(setName);
    if (!set || set.type !== 'flat') return null;
    const frames = set.frames;
    if (!frames || frames.length === 0) return null;
    const idx = Math.max(0, Math.min(frames.length - 1, frameIndex | 0));
    const img = frames[idx];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }

  _loadDirectionalSet(setName, { dirs, frames }) {
    const framesByDir = new Map();
    for (const dir of dirs) {
      const imgs = frames.map((f) => loadImage(joinUrl(this.baseUrl, setName, dir, f)));
      framesByDir.set(dir, imgs);
    }
    this._sets.set(setName, { type: 'directional', framesByDir });
  }

  _loadFlatSet(setName, { frames }) {
    const imgs = frames.map((f) => loadImage(joinUrl(this.baseUrl, setName, f)));
    this._sets.set(setName, { type: 'flat', frames: imgs });
  }
}
