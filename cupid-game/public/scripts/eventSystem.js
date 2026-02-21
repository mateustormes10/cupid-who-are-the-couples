import { randChoice, randRange } from './utils.js';
import { t } from './i18n.js';

export class EventSystem {
  constructor({ audio }) {
    this.audio = audio;
    this.reset();
  }

  reset() {
    this.toasts = [];
    this.particles = [];
    this._time = 0;
  }

  update(dt) {
    this._time += dt;
    for (const t of this.toasts) t.ttl -= dt;
    this.toasts = this.toasts.filter((t) => t.ttl > 0);

    for (const p of this.particles) {
      p.ttl -= dt;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.vel.y += p.gravity * dt;
    }
    this.particles = this.particles.filter((p) => p.ttl > 0);
  }

  trigger(type, payload) {
    const msg = this._messageFor(type, payload);
    if (msg) this.toast(msg);

    if (type === 'bound-success') this._hearts(payload.a.pos, payload.b.pos);
    if (type === 'misbind') this._confetti(payload.a.pos, payload.b.pos);
    if (type.startsWith('miss')) this._puff();
  }

  toast(text) {
    this.toasts.push({ text, ttl: 2.5 });
  }

  _messageFor(type, payload) {
    if (type === 'awaiting') return t('event.awaiting');
    if (type === 'timeout') return t('event.timeout');
    if (type === 'bound-success') {
      const pct = payload.report?.percentage ?? 0;
      if (Math.random() < 0.12) {
        return `Metic: ${pct}% — "Significativo".`;
      }
      return t('event.boundSuccess', { pct });
    }
    if (type === 'bound-rejected') {
      const pct = payload.report?.percentage ?? 0;
      if (Math.random() < 0.18) {
        return t('event.redlight', { pct });
      }
      return t('event.boundRejected', { pct });
    }
    if (type === 'miss-second') return t('event.missSecond');
    if (type === 'miss-idle') return randChoice([t('event.missIdleA'), t('event.missIdleB'), t('event.missIdleC')]);

    if (type === 'object-love') {
      const npc = payload.npc;
      const obj = payload.obj;
      const npcName = npc?.name ?? npc?.id ?? 'alguém';
      const objKind = obj?.kind;
      const objKey = objKind ? `obj.${objKind}` : null;
      const translated = objKey ? t(objKey) : '';
      const objName = objKey && translated !== objKey ? translated : objKind ?? 'objeto';
      return t('event.objectLove', { npc: npcName, obj: objName });
    }

    if (type === 'misbind') {
      const a = payload.a;
      const b = payload.b;
      const aName = a.name ?? a.kind ?? 'algo';
      const bName = b.name ?? b.kind ?? 'algo';

      // Special cameo events
      const ids = new Set([a.id, b.id, a.kind, b.kind]);
      if (ids.has('gobbo') && ids.has('mushroom')) return t('event.gobboMushroom');
      if (ids.has('rock') && (a.id || b.id)) return t('event.rockEyes');
      if (ids.has('redlight')) return t('event.redlight');
      if (ids.has('metic')) return t('event.metic');

      return t('event.misbind', { a: aName, b: bName });
    }

    return null;
  }

  _hearts(a, b) {
    for (let i = 0; i < 18; i++) {
      const t = i / 18;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      this.particles.push({
        pos: { x, y },
        vel: { x: randRange(-20, 20), y: randRange(-70, -20) },
        gravity: 140,
        ttl: randRange(0.6, 1.2),
        kind: 'heart'
      });
    }
  }

  _confetti(a, b) {
    const x = (a.pos?.x ?? a.x ?? 0) * 0.5 + (b.pos?.x ?? b.x ?? 0) * 0.5;
    const y = (a.pos?.y ?? a.y ?? 0) * 0.5 + (b.pos?.y ?? b.y ?? 0) * 0.5;
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        pos: { x, y },
        vel: { x: randRange(-120, 120), y: randRange(-160, -50) },
        gravity: 240,
        ttl: randRange(0.5, 1.1),
        kind: 'confetti'
      });
    }
  }

  _puff() {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        pos: { x: randRange(80, 880), y: randRange(60, 480) },
        vel: { x: randRange(-10, 10), y: randRange(-30, -10) },
        gravity: 40,
        ttl: randRange(0.35, 0.8),
        kind: 'puff'
      });
    }
  }

  render(ctx) {
    // particles
    for (const p of this.particles) {
      const a = Math.max(0, Math.min(1, p.ttl));
      ctx.save();
      ctx.globalAlpha = 0.6 * a;
      if (p.kind === 'heart') {
        ctx.fillStyle = 'rgba(255,79,167,0.9)';
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'confetti') {
        ctx.fillStyle = 'rgba(85,224,255,0.85)';
        ctx.fillRect(p.pos.x, p.pos.y, 3, 3);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // toasts
    if (this.toasts.length === 0) return;
    const t = this.toasts[this.toasts.length - 1];
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    const w = 640;
    const h = 40;
    const x = (ctx.canvas.width - w) / 2;
    const y = ctx.canvas.height - 68;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, ctx.canvas.width / 2, y + 26);
    ctx.restore();
  }
}
