import { clamp, lerp, randChoice, randRange } from './utils.js';
import { AchievementKeys } from './achievementsManager.js';

export const BindingState = Object.freeze({
  Idle: 'Idle',
  AwaitingPair: 'AwaitingPair'
});

export class BindingSystem {
  constructor({ compat, events, audio }) {
    this.compat = compat;
    this.events = events;
    this.audio = audio;
    this._lastOutcome = null;
    this.bonds = [];
    this.reset({ keepOutcome: false, clearBonds: false });
  }

  reset({ keepOutcome, clearBonds } = {}) {
    this.state = BindingState.Idle;
    this.first = null;
    this.firstType = null;
    this.timer = 0;
    this.maxWait = 5.0;
    if (clearBonds) this.bonds.length = 0;
    if (!keepOutcome) this._lastOutcome = null;
  }

  update(dt) {
    // Age bonds (used for temporary/rejected breakage)
    for (let i = this.bonds.length - 1; i >= 0; i--) {
      const b = this.bonds[i];
      b.age = (b.age ?? 0) + dt;
      const bad = b.kind === 'Rejected' || b.kind === 'Misbound' || b.kind === 'Absurd' || b.kind === 'Oops';
      if (bad && b.age >= 5.0) {
        this.bonds.splice(i, 1);
      }
    }

    if (this.state === BindingState.AwaitingPair) {
      this.timer += dt;

      if (this.timer >= this.maxWait) {
        // Timeout: candidate gets sad/confused and we apply penalty
        if (this.firstType === 'npc' && this.first) {
          this.first.state = 'sad';
          this.first.stateTtl = 1.2;
        }
        this.audio.playSfx('fail');
        this.events.trigger('timeout', { first: this.first, firstType: this.firstType });
        this._emitOutcome({
          hits: 0,
          scoreDelta: -30,
          comboReset: true,
          comboBump: false,
          misbinds: 0,
          rejected: 1,
          chaosDelta: 8,
          boundPairs: 0
        });
        this._clearAwaiting({ keepOutcome: true });
      }
    }
  }

  consumeLastOutcome() {
    const out = this._lastOutcome;
    this._lastOutcome = null;
    return out;
  }

  onMiss() {
    if (this.state === BindingState.AwaitingPair) {
      // Missed second tap => comedic penalty
      this._emitOutcome({
        hits: 0,
        scoreDelta: -30,
        comboReset: true,
        comboBump: false,
        misbinds: 1,
        rejected: 0,
        chaosDelta: 10,
        boundPairs: 0
      });

      this.audio.playSfx('miss');
      this.events.trigger('miss-second', { first: this.first, firstType: this.firstType });
      if (this.firstType === 'npc' && this.first) {
        this.first.state = 'confused';
        this.first.stateTtl = 1.0;
      }
      this._clearAwaiting({ keepOutcome: true });
    } else {
      this.audio.playSfx('miss');
      this.events.trigger('miss-idle', {});
    }
  }

  onHitTarget({ target, targetType }) {
    if (this.state === BindingState.Idle) {
      this.first = target;
      this.firstType = targetType;
      this.state = BindingState.AwaitingPair;
      this.timer = 0;
      this.audio.playSfx('tag');
      this.events.trigger('awaiting', { first: target, firstType: targetType });

      if (targetType === 'npc' && target) {
        target.state = 'awaitingBond';
        target.stateTtl = this.maxWait;
      }

      this._emitOutcome({
        hits: 1,
        scoreDelta: 0,
        comboReset: false,
        comboBump: false,
        misbinds: 0,
        rejected: 0,
        chaosDelta: 0,
        boundPairs: 0
      });
      return;
    }

    // awaiting second target
    const second = target;
    const secondType = targetType;
    // speed bonus removed: scoring is now combo-multiplied per correct couple

    let outcome;
    if (this.firstType === 'npc' && secondType === 'npc') {
      const report = this.compat.match(this.first, second);
      if (report.success) {
        this.bonds.push({ a: this.first, b: second, kind: 'Bound', t: 0, age: 0 });

        this.first.state = 'bound';
        second.state = 'bound';
        this.first.boundTo = second;
        second.boundTo = this.first;

        this.audio.playSfx('success');
        this.events.trigger('bound-success', { a: this.first, b: second, report });

        outcome = {
          hits: 1,
          scoreDelta: 1,
          scoreUseCombo: true,
          comboReset: false,
          comboBump: true,
          misbinds: 0,
          rejected: 0,
          chaosDelta: -8,
          boundPairs: 1,
          unlockKeys: [AchievementKeys.npcNpc(this.first.id, second.id)]
        };
      } else {
        // Rejected bonds still show a knot briefly, then break.
        this.bonds.push({ a: this.first, b: second, kind: 'Rejected', t: 0, age: 0 });

        this.first.state = 'confused';
        second.state = 'confused';
        this.first.stateTtl = 1.4;
        second.stateTtl = 1.4;

        this.audio.playSfx('fail');
        this.events.trigger('bound-rejected', { a: this.first, b: second, report });
        outcome = {
          hits: 1,
          scoreDelta: -30,
          scoreUseCombo: false,
          comboReset: true,
          comboBump: false,
          misbinds: 0,
          rejected: 1,
          chaosDelta: 14,
          boundPairs: 0
        };
      }
    } else {
      // NPC + object: can be a "correct" couple if the NPC likes that object.
      const npc = this.firstType === 'npc' ? this.first : secondType === 'npc' ? second : null;
      const obj = this.firstType === 'object' ? this.first : secondType === 'object' ? second : null;
      const objKind = obj?.kind;
      const likesObj = npc && objKind && Array.isArray(npc.likesObjects) && npc.likesObjects.includes(objKind);

      if (npc && obj && likesObj) {
        this.bonds.push({ a: npc, b: obj, kind: 'ObjectLove', t: 0, age: 0 });
        this.audio.playSfx('success');
        this.events.trigger('object-love', { npc, obj });
        npc.speech = { ttl: 1.0, text: '❤' };

        outcome = {
          hits: 1,
          scoreDelta: 1,
          scoreUseCombo: true,
          comboReset: false,
          comboBump: true,
          misbinds: 0,
          rejected: 0,
          chaosDelta: -2,
          boundPairs: 0,
          unlockKeys: [AchievementKeys.npcObj(npc.id, objKind)]
        };
      } else {
        // NPC + object or object + object => misbind
        const kind = randChoice(['Misbound', 'Absurd', 'Oops']);
        this.bonds.push({ a: this.first, b: second, kind, t: 0, age: 0 });
        this.audio.playSfx('misbind');
        this.events.trigger('misbind', { a: this.first, b: second, aType: this.firstType, bType: secondType });

        if (npc && obj) {
          npc.state = 'misbound';
          npc.misboundTo = obj;
          npc.stateTtl = 5.0;
          npc.misboundTtl = 5.0;
        } else {
          if (this.firstType === 'npc' && this.first) {
            this.first.state = 'confused';
            this.first.stateTtl = 1.2;
          }
          if (secondType === 'npc' && second) {
            second.state = 'confused';
            second.stateTtl = 1.2;
          }
        }

        outcome = {
          hits: 1,
          scoreDelta: -50 + Math.floor(randRange(-10, 10)),
          scoreUseCombo: false,
          comboReset: true,
          comboBump: false,
          misbinds: 1,
          rejected: 0,
          chaosDelta: 18,
          boundPairs: 0
        };
      }
    }

    this._emitOutcome(outcome);
    this._clearAwaiting({ keepOutcome: true });
  }

  _clearAwaiting({ keepOutcome } = {}) {
    if (this.firstType === 'npc' && this.first && this.first.state === 'awaitingBond') {
      this.first.state = 'walking';
      this.first.stateTtl = 0;
    }
    this.reset({ keepOutcome, clearBonds: false });
  }

  _emitOutcome(outcome) {
    this._lastOutcome = outcome;
  }

  render(ctx) {
    for (const bond of this.bonds) {
      bond.t = Math.min(1, bond.t + 0.016);
      const a = bond.a.pos;
      const b = bond.b.pos;

      ctx.save();
      const alpha = 0.25 + 0.35 * (1 - Math.cos(bond.t * Math.PI));
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 4;
      const good = bond.kind === 'Bound' || bond.kind === 'ObjectLove';
      ctx.strokeStyle = good ? 'rgba(68,255,154,0.8)' : 'rgba(255,107,107,0.8)';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      const midx = (a.x + b.x) / 2;
      const midy = (a.y + b.y) / 2 - 18;
      ctx.quadraticCurveTo(midx, midy, b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}
