export class LevelManager {
  constructor() {
    this.levels = [
      this._park(),
      this._medieval(),
      this._modern(),
      this._festival(),
      this._finalChaos()
    ];
  }

  getAll() {
    return this.levels;
  }

  get(i) {
    return this.levels[i] ?? this.levels[0];
  }

  _baseLevel({ id, name, gimmick }) {
    return {
      id,
      name,
      gimmick,
      background: null,
      bounds: { minX: 16, minY: 16, maxX: 944, maxY: 524 },
      cupid: { pos: { x: 110, y: 440 } },
      npcs: [],
      objects: []
    };
  }

  _park() {
    const L = this._baseLevel({ id: 'park', name: 'Parque', gimmick: 'Tutorial do double-tap.' });
    L.background = 'backgroundPark.png';
    L.npcs = [
      {
        id: 'gobbo',
        name: 'Gobbo',
        r: 22,
        pos: { x: 720, y: 140 },
        color: 'green',
        traits: ['mushrooms', 'playful', 'curious'],
        affinityTags: ['green', 'cute', 'gremlin'],
        personality: 'playful',
        hobby: 'mushrooms',
        mood: 'curious',
        tags: ['cute', 'gremlin'],
        likesObjects: ['mushroom'],
        wander: 18
      },
      {
        id: 'lina',
        name: 'Lina',
        r: 20,
        pos: { x: 650, y: 310 },
        color: 'blue',
        traits: ['music', 'calm', 'night'],
        affinityTags: ['blue', 'moon', 'park'],
        likesId: 'toni',
        personality: 'playful',
        hobby: 'music',
        mood: 'curious',
        tags: ['cute', 'park'],
        wander: 14
      },
      {
        id: 'toni',
        name: 'Toni',
        r: 20,
        pos: { x: 820, y: 300 },
        color: 'purple',
        traits: ['music', 'calm', 'night'],
        affinityTags: ['purple', 'moon', 'park'],
        likesId: 'lina',
        personality: 'calm',
        hobby: 'music',
        mood: 'happy',
        tags: ['park', 'soft'],
        wander: 14
      },
      {
        id: 'brisa',
        name: 'Brisa',
        r: 20,
        pos: { x: 770, y: 220 },
        color: 'yellow',
        traits: ['reading', 'calm', 'day'],
        affinityTags: ['yellow', 'books', 'soft'],
        likesId: 'gobbo',
        personality: 'calm',
        hobby: 'reading',
        mood: 'happy',
        tags: ['soft', 'books'],
        likesObjects: ['rock'],
        wander: 12
      }
    ];
    L.objects = [
      { kind: 'mushroom', shootable: true, r: 18, pos: { x: 530, y: 160 } },
      { kind: 'rock', shootable: true, r: 22, pos: { x: 560, y: 360 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 260, y: 170 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 360, y: 420 } }
    ];
    return L;
  }

  _medieval() {
    const L = this._baseLevel({ id: 'medieval', name: 'Vila medieval', gimmick: 'Obstáculos a mais.' });
    L.background = 'backgroundMedieval.png';
    L.cupid.pos = { x: 120, y: 420 };
    L.objects = [
      { kind: 'rock', shootable: true, r: 22, pos: { x: 520, y: 280 } },
      { kind: 'crate', shootable: true, r: 20, pos: { x: 560, y: 170 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 230, y: 170 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 320, y: 460 } }
    ];
    L.npcs = [
    
      {
        id: 'squire',
        name: 'Escudeiro',
        r: 20,
        pos: { x: 710, y: 170 },
        color: 'red',
        traits: ['training', 'brave', 'honor'],
        affinityTags: ['red', 'metal', 'honor'],
        likesId: 'smith',
        personality: 'brave',
        hobby: 'training',
        mood: 'focused',
        tags: ['metal', 'honor'],
        likesObjects: ['crate'],
        wander: 22
      },
      {
        id: 'bard',
        name: 'Bardo',
        r: 20,
        pos: { x: 820, y: 260 },
        color: 'pink',
        traits: ['music', 'playful', 'story'],
        affinityTags: ['pink', 'song', 'story'],
        likesId: 'mystic',
        personality: 'playful',
        hobby: 'music',
        mood: 'happy',
        tags: ['song', 'story'],
        wander: 18
      },
      {
        id: 'scribe',
        name: 'Escriba',
        r: 20,
        pos: { x: 760, y: 340 },
        color: 'blue',
        traits: ['reading', 'calm', 'ink'],
        affinityTags: ['blue', 'books', 'ink'],
        likesId: 'bard',
        personality: 'calm',
        hobby: 'reading',
        mood: 'focused',
        tags: ['books', 'ink'],
        wander: 16
      },
      {
        id: 'smith',
        name: 'Ferreira',
        r: 20,
        pos: { x: 660, y: 260 },
        color: 'yellow',
        traits: ['crafting', 'brave', 'work'],
        affinityTags: ['yellow', 'metal', 'work'],
        likesId: 'squire',
        personality: 'brave',
        hobby: 'crafting',
        mood: 'happy',
        tags: ['metal', 'work'],
        likesObjects: ['crate'],
        wander: 16
      },
      {
        id: 'mystic',
        name: 'Mística',
        r: 20,
        pos: { x: 860, y: 180 },
        color: 'purple',
        traits: ['stars', 'weird', 'magic'],
        affinityTags: ['purple', 'magic', 'mood'],
        likesId: 'scribe',
        personality: 'weird',
        hobby: 'stars',
        mood: 'curious',
        tags: ['magic', 'mood'],
        likesObjects: ['rock'],
        wander: 20
      }
    ];
    L.objects = [
      { kind: 'crate', shootable: true, r: 20, pos: { x: 560, y: 210 } },
      { kind: 'rock', shootable: true, r: 22, pos: { x: 560, y: 360 } },
      { kind: 'crate', shootable: true, r: 20, pos: { x: 480, y: 290 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 260, y: 210 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 340, y: 380 } }
    ];
    return L;
  }

  _modern() {
    const L = this._baseLevel({ id: 'modern', name: 'Cidade moderna', gimmick: 'NPCs correm mais no caos.' });
    L.background = 'backgroundModernCity.png';
    L.cupid.pos = { x: 120, y: 120 };
    L.npcs = [
      {
        id: 'dev',
        name: 'Dev',
        r: 20,
        pos: { x: 720, y: 130 },
        color: 'cyan',
        traits: ['crafting', 'calm', 'logic'],
        affinityTags: ['cyan', 'logic', 'coffee'],
        likesId: 'barista',
        personality: 'calm',
        hobby: 'crafting',
        mood: 'focused',
        tags: ['logic', 'coffee'],
        wander: 26
      },
      {
        id: 'skater',
        name: 'Skater',
        r: 20,
        pos: { x: 840, y: 220 },
        color: 'pink',
        traits: ['sports', 'playful', 'speed'],
        affinityTags: ['pink', 'speed', 'street'],
        likesId: 'photog',
        personality: 'playful',
        hobby: 'sports',
        mood: 'happy',
        tags: ['speed', 'street'],
        wander: 30
      },
      {
        id: 'barista',
        name: 'Barista',
        r: 20,
        pos: { x: 760, y: 330 },
        color: 'magenta',
        traits: ['music', 'calm', 'soft'],
        affinityTags: ['magenta', 'coffee', 'soft'],
        likesId: 'dev',
        personality: 'calm',
        hobby: 'music',
        mood: 'happy',
        tags: ['coffee', 'soft'],
        wander: 22
      },
      {
        id: 'photog',
        name: 'Foto',
        r: 20,
        pos: { x: 660, y: 250 },
        color: 'yellow',
        traits: ['art', 'curious', 'color'],
        affinityTags: ['yellow', 'street', 'color'],
        likesId: 'skater',
        personality: 'curious',
        hobby: 'art',
        mood: 'curious',
        tags: ['street', 'color'],
        wander: 28
      },
      {
        id: 'redlight',
        name: 'Redlight',
        r: 20,
        pos: { x: 820, y: 120 },
        color: 'red',
        traits: ['rules', 'focused', 'brave'],
        affinityTags: ['red', 'rules', 'street'],
        personality: 'brave',
        hobby: 'rules',
        mood: 'focused',
        tags: ['rules', 'street'],
        wander: 20
      }
    ];
    L.objects = [
      { kind: 'rock', shootable: true, r: 22, pos: { x: 520, y: 280 } },
      { kind: 'crate', shootable: true, r: 20, pos: { x: 560, y: 170 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 230, y: 170 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 320, y: 460 } }
    ];
    return L;
  }

  _festival() {
    const L = this._baseLevel({ id: 'festival', name: 'Festival', gimmick: 'Muitos alvos + distração.' });
    L.background = 'backgroundFestival.png';
    L.cupid.pos = { x: 140, y: 410 };
    L.npcs = [
      {
        id: 'dancer',
        name: 'Dançarino',
        r: 18,
        pos: { x: 760, y: 150 },
        color: 'purple',
        traits: ['music', 'playful', 'party'],
        affinityTags: ['purple', 'party', 'spark'],
        likesId: 'fan',
        personality: 'playful',
        hobby: 'music',
        mood: 'happy',
        tags: ['party', 'spark'],
        wander: 34
      },
      {
        id: 'vendor',
        name: 'Vendedora',
        r: 18,
        pos: { x: 680, y: 220 },
        color: 'yellow',
        traits: ['crafting', 'calm', 'work'],
        affinityTags: ['yellow', 'work', 'party'],
        likesId: 'guard',
        personality: 'calm',
        hobby: 'crafting',
        mood: 'happy',
        tags: ['work', 'party'],
        wander: 30
      },
      {
        id: 'juggler',
        name: 'Malabar',
        r: 18,
        pos: { x: 860, y: 270 },
        color: 'cyan',
        traits: ['sports', 'weird', 'chaos'],
        affinityTags: ['cyan', 'party', 'chaos'],
        likesId: 'vendor',
        personality: 'weird',
        hobby: 'sports',
        mood: 'curious',
        tags: ['party', 'chaos'],
        wander: 36
      },
      {
        id: 'fan',
        name: 'Fã',
        r: 18,
        pos: { x: 740, y: 320 },
        color: 'pink',
        traits: ['art', 'playful', 'color'],
        affinityTags: ['pink', 'color', 'party'],
        likesId: 'dancer',
        personality: 'playful',
        hobby: 'art',
        mood: 'curious',
        tags: ['color', 'party'],
        wander: 34
      },
      {
        id: 'guard',
        name: 'Guarda',
        r: 18,
        pos: { x: 650, y: 140 },
        color: 'red',
        traits: ['training', 'brave', 'rules'],
        affinityTags: ['red', 'rules', 'honor'],
        likesId: 'vendor',
        personality: 'brave',
        hobby: 'training',
        mood: 'focused',
        tags: ['rules', 'honor'],
        wander: 28
      },
      {
        id: 'kid',
        name: 'Criança',
        r: 18,
        pos: { x: 820, y: 190 },
        color: 'green',
        traits: ['sports', 'playful', 'cute'],
        affinityTags: ['green', 'cute', 'party'],
        personality: 'playful',
        hobby: 'sports',
        mood: 'happy',
        tags: ['cute', 'party'],
        wander: 38
      }
    ];
    L.objects = [
      { kind: 'mushroom', shootable: true, r: 18, pos: { x: 530, y: 340 } },
      { kind: 'crate', shootable: true, r: 20, pos: { x: 520, y: 200 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 250, y: 230 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 360, y: 420 } }
    ];
    return L;
  }

  _finalChaos() {
    const L = this._baseLevel({ id: 'final', name: 'Final: Caos total', gimmick: 'Chaos meter sobe fácil.' });
    L.background = 'backgroundTotalChaos.png';
    L.cupid.pos = { x: 140, y: 120 };
    L.npcs = [
      {
        id: 'a',
        name: 'A',
        r: 18,
        pos: { x: 700, y: 120 },
        color: 'purple',
        traits: ['stars', 'weird', 'magic'],
        affinityTags: ['purple', 'chaos', 'magic'],
        personality: 'weird',
        hobby: 'stars',
        mood: 'curious',
        tags: ['chaos', 'magic'],
        wander: 44
      },
      {
        id: 'b',
        name: 'B',
        r: 18,
        pos: { x: 840, y: 160 },
        color: 'blue',
        traits: ['stars', 'weird', 'magic'],
        affinityTags: ['blue', 'chaos', 'magic'],
        likesId: 'a',
        personality: 'weird',
        hobby: 'stars',
        mood: 'curious',
        tags: ['chaos', 'magic'],
        wander: 44
      },
      {
        id: 'c',
        name: 'C',
        r: 18,
        pos: { x: 730, y: 240 },
        color: 'pink',
        traits: ['music', 'playful', 'party'],
        affinityTags: ['pink', 'party', 'chaos'],
        personality: 'playful',
        hobby: 'music',
        mood: 'happy',
        tags: ['party', 'chaos'],
        wander: 50
      },
      {
        id: 'd',
        name: 'D',
        r: 18,
        pos: { x: 860, y: 290 },
        color: 'cyan',
        traits: ['reading', 'calm', 'rules'],
        affinityTags: ['cyan', 'logic', 'rules'],
        personality: 'calm',
        hobby: 'reading',
        mood: 'focused',
        tags: ['logic', 'rules'],
        wander: 42
      },
      {
        id: 'e',
        name: 'E',
        r: 18,
        pos: { x: 780, y: 340 },
        color: 'yellow',
        traits: ['training', 'brave', 'rules'],
        affinityTags: ['yellow', 'honor', 'rules'],
        likesId: 'd',
        personality: 'brave',
        hobby: 'training',
        mood: 'focused',
        tags: ['honor', 'rules'],
        wander: 46
      },
      {
        id: 'f',
        name: 'F',
        r: 18,
        pos: { x: 660, y: 300 },
        color: 'green',
        traits: ['sports', 'playful', 'speed'],
        affinityTags: ['green', 'speed', 'chaos'],
        likesId: 'c',
        personality: 'playful',
        hobby: 'sports',
        mood: 'happy',
        tags: ['speed', 'chaos'],
        wander: 52
      },
      {
        id: 'metic',
        name: 'Metic',
        r: 18,
        pos: { x: 860, y: 120 },
        color: 'blue',
        traits: ['rules', 'calm', 'stats'],
        affinityTags: ['blue', 'logic', 'stats'],
        personality: 'calm',
        hobby: 'rules',
        mood: 'focused',
        tags: ['logic', 'stats'],
        wander: 30
      }
    ];
    L.objects = [
      { kind: 'rock', shootable: true, r: 22, pos: { x: 540, y: 160 } },
      { kind: 'mushroom', shootable: true, r: 18, pos: { x: 520, y: 330 } },
      { kind: 'crate', shootable: true, r: 20, pos: { x: 560, y: 250 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 240, y: 180 } },
      { kind: 'heart', shootable: false, solid: false, pickup: { type: 'arrows', amount: 2 }, r: 16, pos: { x: 350, y: 470 } }
    ];
    return L;
  }
}
