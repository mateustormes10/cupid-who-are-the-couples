import { clamp } from './utils.js';

export class ArrowSystem {
  constructor({ physics, binding, audio }) {
    this.physics = physics;
    this.binding = binding;
    this.audio = audio;
    this.arrows = [];
  }

  reset() {
    this.arrows.length = 0;
  }

  shoot({ from, to }) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const dir = { x: dx / len, y: dy / len };

    this.arrows.push({
      state: 'flying',
      pos: { x: from.x, y: from.y },
      prev: { x: from.x, y: from.y },
      vel: { x: dir.x * 950, y: dir.y * 950 },
      life: 0,
      maxLife: 1.1,
      hit: false,
      attachedTo: null,
      attachedType: null,
      attachOffset: { x: 0, y: 0 },
      attachT: 0,
      resolveT: 0
    });
    this.audio.playSfx('shoot');
  }

  update(dt, { level, npcs }) {
    const bounds = level.bounds;
    for (const arrow of this.arrows) {
      if (arrow.state === 'flying') {
        arrow.life += dt;
        arrow.prev.x = arrow.pos.x;
        arrow.prev.y = arrow.pos.y;
        arrow.pos.x += arrow.vel.x * dt;
        arrow.pos.y += arrow.vel.y * dt;

        // hit test NPCs (continuous)
        const hitNpc = npcs.raycastHit({ a: arrow.prev, b: arrow.pos, physics: this.physics });
        if (hitNpc) {
          this._attach(arrow, hitNpc, 'npc');
          this.binding.onHitTarget({ target: hitNpc, targetType: 'npc' });
          continue;
        }

        // hit test objects
        const hitObj = this._hitObject({ a: arrow.prev, b: arrow.pos, level });
        if (hitObj) {
          this._attach(arrow, hitObj, 'object');
          this.binding.onHitTarget({ target: hitObj, targetType: 'object' });
          continue;
        }

        // out of bounds
        if (
          arrow.pos.x < bounds.minX ||
          arrow.pos.x > bounds.maxX ||
          arrow.pos.y < bounds.minY ||
          arrow.pos.y > bounds.maxY ||
          arrow.life >= arrow.maxLife
        ) {
          arrow.hit = true;
          arrow.state = 'resolved';
          arrow.resolveT = 0;
          this.binding.onMiss();
        }
      } else if (arrow.state === 'attached') {
        arrow.attachT += dt;
        const tgt = arrow.attachedTo;
        if (tgt) {
          const tp = tgt.pos ?? tgt;
          arrow.prev.x = arrow.pos.x;
          arrow.prev.y = arrow.pos.y;
          arrow.pos.x = tp.x + arrow.attachOffset.x;
          arrow.pos.y = tp.y + arrow.attachOffset.y;
        }

        if (arrow.attachT >= 0.22) {
          arrow.state = 'resolved';
          arrow.resolveT = 0;
          arrow.hit = true;
        }
      } else if (arrow.state === 'resolved') {
        arrow.resolveT += dt;
      }
    }

    // purge
    this.arrows = this.arrows.filter((a) => a.state !== 'resolved' || a.resolveT < 0.35);
  }

  _attach(arrow, target, targetType) {
    arrow.state = 'attached';
    arrow.hit = true;
    arrow.attachedTo = target;
    arrow.attachedType = targetType;
    arrow.attachT = 0;
    arrow.vel.x = 0;
    arrow.vel.y = 0;
    // stick slightly offset toward center
    arrow.attachOffset.x = 0;
    arrow.attachOffset.y = -2;
  }

  _hitObject({ a, b, level }) {
    for (const obj of level.objects) {
      if (!obj.shootable) continue;
      const hit = this.physics.rayCircleHit({ a, b, center: obj.pos, radius: obj.r });
      if (hit) return obj;
    }
    return null;
  }

  render(ctx) {
    for (const arrow of this.arrows) {
      const t = arrow.state === 'flying' ? clamp(arrow.life / arrow.maxLife, 0, 1) : 0;
      ctx.save();
      if (arrow.state === 'flying') {
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = 'rgba(255,79,167,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(arrow.prev.x, arrow.prev.y);
        ctx.lineTo(arrow.pos.x, arrow.pos.y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,79,167,0.85)';
        ctx.beginPath();
        ctx.arc(arrow.pos.x, arrow.pos.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (arrow.state === 'attached') {
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = 'rgba(255,79,167,0.95)';
        ctx.beginPath();
        ctx.arc(arrow.pos.x, arrow.pos.y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const fade = 1 - clamp(arrow.resolveT / 0.35, 0, 1);
        ctx.globalAlpha = 0.6 * fade;
        ctx.fillStyle = 'rgba(255,79,167,0.75)';
        ctx.beginPath();
        ctx.arc(arrow.pos.x, arrow.pos.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
