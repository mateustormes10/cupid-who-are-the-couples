import { randRange } from './utils.js';

export class CompatibilitySystem {
  match(a, b) {
    const matches = [];

    const traitsA = new Set(a.traits ?? [a.hobby, a.personality, a.mood].filter(Boolean));
    const traitsB = new Set(b.traits ?? [b.hobby, b.personality, b.mood].filter(Boolean));
    let traitMatches = 0;
    for (const t of traitsA) {
      if (traitsB.has(t)) traitMatches++;
    }
    if (traitMatches > 0) matches.push(`traits(${traitMatches})`);

    const tagsA = new Set(a.affinityTags ?? a.tags ?? []);
    const tagsB = new Set(b.affinityTags ?? b.tags ?? []);
    let tagMatches = 0;
    for (const t of tagsA) if (tagsB.has(t)) tagMatches++;
    if (tagMatches > 0) matches.push(`tags(${tagMatches})`);

    const cA = a.color;
    const cB = b.color;
    if (cA && cB && this._isComplement(cA, cB)) matches.push('color');

    // "Proximidade natural" como sinal (baseado em interesse/likes)
    if ((a.likesId && a.likesId === b.id) || (b.likesId && b.likesId === a.id)) {
      matches.push('proximity');
    }

    const success = matches.length >= 2;
    const quality = success ? (matches.length >= 3 ? 'perfect' : 'acceptable') : 'bad';
    const score = success ? tagMatches * 5 + traitMatches * 6 : 0;
    const percentage = Math.max(0, Math.min(100, Math.round((matches.length / 4) * 100 + randRange(-6, 6))));

    return {
      success,
      quality,
      matches,
      percentage,
      score
    };
  }

  _isComplement(a, b) {
    const map = new Map([
      ['blue', 'purple'],
      ['purple', 'blue'],
      ['red', 'pink'],
      ['pink', 'red'],
      ['green', 'yellow'],
      ['yellow', 'green'],
      ['cyan', 'magenta'],
      ['magenta', 'cyan']
    ]);
    return map.get(String(a).toLowerCase()) === String(b).toLowerCase();
  }
}
