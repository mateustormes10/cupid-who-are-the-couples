function getGlobalStore() {
  const w = window;
  if (!w.__dtdAchievements) {
    w.__dtdAchievements = {
      unlocked: new Set()
    };
  }
  return w.__dtdAchievements;
}

function makeNpcNpcKey(aId, bId) {
  const a = String(aId);
  const b = String(bId);
  return a < b ? `nn:${a}|${b}` : `nn:${b}|${a}`;
}

function makeNpcObjKey(npcId, objKind) {
  return `no:${String(npcId)}|${String(objKind)}`;
}

export class AchievementsManager {
  constructor({ levels, compat }) {
    this.levels = levels ?? [];
    this.compat = compat ?? null;
    this.store = getGlobalStore();
    this.possible = this._buildPossible(this.levels);
  }

  isUnlocked(key) {
    return this.store.unlocked.has(key);
  }

  unlock(key) {
    if (!key) return false;
    if (this.store.unlocked.has(key)) return false;
    this.store.unlocked.add(key);
    return true;
  }

  getProgress() {
    return this.possible.map((p) => ({
      ...p,
      unlocked: this.isUnlocked(p.key)
    }));
  }

  _buildPossible(levels) {
    const npcsById = new Map();
    for (const lvl of levels ?? []) {
      for (const npc of lvl.npcs ?? []) {
        if (npc?.id) npcsById.set(npc.id, npc);
      }
    }

    const possible = [];
    const seen = new Set();

    // NPC <-> NPC possible couples (compatible by rules)
    const all = Array.from(npcsById.values());
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        let ok = false;
        if (this.compat && typeof this.compat.match === 'function') {
          ok = Boolean(this.compat.match(a, b).success);
        } else {
          // Fallback: only pairs connected by likesId are considered "possible".
          ok = (a.likesId && a.likesId === b.id) || (b.likesId && b.likesId === a.id);
        }
        if (!ok) continue;

        const key = makeNpcNpcKey(a.id, b.id);
        if (seen.has(key)) continue;
        seen.add(key);
        possible.push({
          key,
          type: 'npc-npc',
          aId: a.id,
          bId: b.id,
          aName: a.name ?? a.id,
          bName: b.name ?? b.id
        });
      }
    }

    // NPC <-> Object destiny pairs (based on likesObjects)
    for (const npc of npcsById.values()) {
      const likes = npc.likesObjects ?? npc.likesObjectKinds ?? [];
      for (const kind of likes) {
        const key = makeNpcObjKey(npc.id, kind);
        if (seen.has(key)) continue;
        seen.add(key);
        possible.push({
          key,
          type: 'npc-obj',
          npcId: npc.id,
          npcName: npc.name ?? npc.id,
          objKind: String(kind)
        });
      }
    }

    // Stable ordering
    possible.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
    return possible;
  }
}

export const AchievementKeys = {
  npcNpc: makeNpcNpcKey,
  npcObj: makeNpcObjKey
};
