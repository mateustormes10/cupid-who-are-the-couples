import { clamp, randRange } from './utils.js';
import { t as i18n } from './i18n.js';

export class NPCSystem {
  constructor({ compat }) {
    this.compat = compat;
    this.npcs = [];
    this.requiredPairs = 0;
  }

  loadLevel(level) {
    this.npcs = level.npcs.map((n, idx) => {
      const traits = n.traits ?? [n.hobby, n.personality, n.mood].filter(Boolean);
      const affinityTags = n.affinityTags ?? n.tags ?? [];
      return {
        ...n,
        traits,
        affinityTags,
        color: n.color ?? this._colorFromTags(affinityTags) ?? 'neutral',
        spriteKey: n.spriteKey ?? `npc_${(idx % 3) + 1}`,
        facing: 'south',
        animT: 0,
        animFrame: 0,
        pos: { ...n.pos },
        vel: { x: 0, y: 0 },
        state: 'walking',
        stateTtl: 0,
        speech: null,
        talkCooldown: randRange(1.0, 3.5),
        likesObjects: n.likesObjects ?? n.likesObjectKinds ?? [],
        boundTo: null,
        misboundTo: null,
        orbit: null,
        wanderTarget: null,
        wanderT: randRange(0.6, 2.2)
      };
    });

    // naive: each pair goal is based on number of npc pairs in level
    this.requiredPairs = Math.max(1, Math.floor(this.npcs.length / 2));
  }

  update(dt, { level, chaos, player, arrows, physics }) {
    const chaos01 = chaos / 100;

    // update partner pointers each tick (in case of reload)
    const byId = new Map(this.npcs.map((n) => [n.id, n]));

    for (const npc of this.npcs) {
      // Misbound-to-object must always expire (prevents permanent "stuck" states).
      if (npc.misboundTo) {
        if (!Number.isFinite(npc.misboundTtl) || npc.misboundTtl <= 0) npc.misboundTtl = 5.0;
        npc.misboundTtl -= dt;
        if (npc.misboundTtl <= 0) {
          npc.misboundTo = null;
          npc.orbit = null;
          npc.misboundTtl = 0;
          if (npc.state === 'misbound') {
            npc.state = npc.boundTo ? 'bound' : 'walking';
            npc.stateTtl = 0;
          }
        }
      }

      if (npc.stateTtl > 0) npc.stateTtl -= dt;
      if (npc.stateTtl <= 0) {
        if (npc.state === 'misbound') {
          npc.state = npc.boundTo ? 'bound' : 'walking';
          npc.misboundTo = null;
          npc.orbit = null;
          npc.misboundTtl = 0;
        } else if (npc.state === 'confused' || npc.state === 'sad' || npc.state === 'conversing') {
          npc.state = npc.boundTo ? 'bound' : npc.misboundTo ? 'misbound' : 'walking';
        }
      }

      // Keep boundTo reference valid
      if (npc.boundTo && typeof npc.boundTo === 'string') {
        npc.boundTo = byId.get(npc.boundTo) ?? null;
      }

      // Speech bubbles
      if (npc.speech) {
        npc.speech.ttl -= dt;
        if (npc.speech.ttl <= 0) npc.speech = null;
      }
      npc.talkCooldown -= dt;
      if (npc.talkCooldown <= 0 && npc.state !== 'awaitingBond' && npc.state !== 'bound') {
        npc.talkCooldown = randRange(2.2, 5.2);
        this._maybeSpeak(npc, byId);
      }

      // Misbound: orbit around object
      if (npc.state === 'misbound' && npc.misboundTo) {
        if (!npc.orbit) {
          npc.orbit = {
            a: randRange(0, Math.PI * 2),
            r: 26 + randRange(-6, 10),
            w: (1.8 + randRange(-0.4, 0.6)) * (1 + chaos01 * 0.6)
          };
        }
        npc.orbit.a += npc.orbit.w * dt;
        const center = npc.misboundTo.pos;
        npc.pos.x = center.x + Math.cos(npc.orbit.a) * npc.orbit.r;
        npc.pos.y = center.y + Math.sin(npc.orbit.a) * npc.orbit.r;
        npc.pos.x = clamp(npc.pos.x, level.bounds.minX + npc.r, level.bounds.maxX - npc.r);
        npc.pos.y = clamp(npc.pos.y, level.bounds.minY + npc.r, level.bounds.maxY - npc.r);
        continue;
      }

      // Bound: move together as a pair (shared drift)
      if (npc.state === 'bound' && npc.boundTo) {
        const other = npc.boundTo;
        const dx = other.pos.x - npc.pos.x;
        const dy = other.pos.y - npc.pos.y;
        const d = Math.hypot(dx, dy) || 1;
        const desired = npc.r + other.r + 14;
        // keep them close
        if (d > desired) {
          npc.vel.x += (dx / d) * 60;
          npc.vel.y += (dy / d) * 60;
        }
        // shared drift influenced by chaos
        npc.vel.x += randRange(-1, 1) * (10 + 30 * chaos01);
        npc.vel.y += randRange(-1, 1) * (10 + 30 * chaos01);
      }

      // Awaiting bond: subtle jitter
      if (npc.state === 'awaitingBond') {
        npc.vel.x += randRange(-1, 1) * 10;
        npc.vel.y += randRange(-1, 1) * 10;
      }

      // Natural proximity (likes): move near preferred partner
      if (npc.likesId && npc.state === 'walking') {
        const partner = byId.get(npc.likesId);
        if (partner && partner.state !== 'bound' && partner.state !== 'misbound') {
          const dx = partner.pos.x - npc.pos.x;
          const dy = partner.pos.y - npc.pos.y;
          const d = Math.hypot(dx, dy) || 1;
          const prefer = 110;
          if (d > prefer) {
            const pull = 22;
            npc.vel.x += (dx / d) * pull;
            npc.vel.y += (dy / d) * pull;
          } else {
            // near: sometimes converse
            if (!npc.speech && Math.random() < dt * 0.25) {
              npc.state = 'conversing';
              npc.stateTtl = randRange(0.6, 1.2);
              npc.speech = {
                ttl: npc.stateTtl,
                text: randRange(0, 1) > 0.5 ? '…' : this._hintLine(npc, partner)
              };
            }
          }
        }
      }

      // Wander: actually walk around the map (target steering)
      // (Keeps movement present even when no arrows are nearby.)
      if (npc.state === 'walking') {
        // If the NPC is actively chasing their liked partner, don't override with wandering.
        let chasingLike = false;
        if (npc.likesId) {
          const partner = byId.get(npc.likesId);
          if (partner && partner.state !== 'bound' && partner.state !== 'misbound') {
            const dx = partner.pos.x - npc.pos.x;
            const dy = partner.pos.y - npc.pos.y;
            const d = Math.hypot(dx, dy) || 1;
            chasingLike = d > 120;
          }
        }

        const wander = npc.wander ?? 0;
        if (!chasingLike && wander > 0) {
          npc.wanderT -= dt;

          if (!npc.wanderTarget || npc.wanderT <= 0) {
            npc.wanderTarget = this._randomWanderPoint(level, npc);
            npc.wanderT = randRange(1.4, 3.2);
          }

          const tx = npc.wanderTarget.x;
          const ty = npc.wanderTarget.y;
          const dx = tx - npc.pos.x;
          const dy = ty - npc.pos.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < 18) {
            npc.wanderTarget = this._randomWanderPoint(level, npc);
            npc.wanderT = randRange(1.0, 2.6);
          } else {
            // Acceleration (px/s^2). Scaled by dt for framerate stability.
            const accel = (120 + wander * 10) * (0.9 + chaos01 * 0.35);
            npc.vel.x += (dx / dist) * accel * dt;
            npc.vel.y += (dy / dist) * accel * dt;
          }

          // Tiny micro-jitter so they don't look robotic.
          const jitter = (14 + wander * 0.6) * (0.2 + chaos01 * 0.35);
          npc.vel.x += randRange(-1, 1) * jitter * dt;
          npc.vel.y += randRange(-1, 1) * jitter * dt;
        }
      }

      // Confused: run away randomly
      if (npc.state === 'confused' || npc.state === 'sad') {
        npc.vel.x += randRange(-1, 1) * 120;
        npc.vel.y += randRange(-1, 1) * 120;
      }

      // Avoid arrows (simple dodge)
      if (arrows && arrows.length > 0) {
        let closest = null;
        let bestD2 = Infinity;
        for (const a of arrows) {
          if (a.hit) continue;
          const dx = npc.pos.x - a.pos.x;
          const dy = npc.pos.y - a.pos.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) {
            bestD2 = d2;
            closest = a;
          }
        }
        if (closest) {
          const detect = 160;
          if (bestD2 < detect * detect) {
            const dx = npc.pos.x - closest.pos.x;
            const dy = npc.pos.y - closest.pos.y;
            const len = Math.hypot(dx, dy) || 1;
            const dodge = (1 - Math.min(1, Math.sqrt(bestD2) / detect)) * 220;
            npc.vel.x += (dx / len) * dodge;
            npc.vel.y += (dy / len) * dodge;
          }
        }
      }

      // Avoid player slightly (prevents sticky overlap)
      if (player) {
        const dx = npc.pos.x - player.pos.x;
        const dy = npc.pos.y - player.pos.y;
        const d = Math.hypot(dx, dy) || 1;
        const min = npc.r + player.r + 6;
        if (d < min) {
          const push = (min - d) * 8;
          npc.vel.x += (dx / d) * push;
          npc.vel.y += (dy / d) * push;
        }
      }

      // chaos makes them jitter/run
      npc.vel.x *= 0.90;
      npc.vel.y *= 0.90;

      npc.pos.x += npc.vel.x * dt;
      npc.pos.y += npc.vel.y * dt;

      npc.pos.x = clamp(npc.pos.x, level.bounds.minX + npc.r, level.bounds.maxX - npc.r);
      npc.pos.y = clamp(npc.pos.y, level.bounds.minY + npc.r, level.bounds.maxY - npc.r);

      // NPC vs solid objects
      if (physics && level?.objects?.length) {
        for (let iter = 0; iter < 2; iter++) {
          let any = false;
          for (const obj of level.objects) {
            if (obj.collected) continue;
            if (obj.solid === false) continue;
            if (npc.state === 'misbound' && npc.misboundTo === obj) continue;
            const mover = { x: npc.pos.x, y: npc.pos.y, r: npc.r };
            const fixed = { x: obj.pos.x, y: obj.pos.y, r: obj.r };
            const hit = physics.separateCircleStatic({ mover, fixed });
            if (!hit) continue;
            any = true;
            npc.pos.x = clamp(mover.x, level.bounds.minX + npc.r, level.bounds.maxX - npc.r);
            npc.pos.y = clamp(mover.y, level.bounds.minY + npc.r, level.bounds.maxY - npc.r);
          }
          if (!any) break;
        }
      }

      // Facing + animation (based on velocity)
      const speed = Math.hypot(npc.vel.x, npc.vel.y);
      const moving = speed > 10 && npc.state !== 'conversing';
      if (speed > 5 && npc.state !== 'misbound') {
        if (Math.abs(npc.vel.x) > Math.abs(npc.vel.y)) npc.facing = npc.vel.x > 0 ? 'east' : 'west';
        else npc.facing = npc.vel.y > 0 ? 'south' : 'north';
      }
      if (moving) {
        npc.animT = (npc.animT ?? 0) + dt;
        npc.animFrame = Math.floor(npc.animT * 8) % 4;
      } else {
        npc.animT = 0;
        npc.animFrame = 0;
      }
    }

    // NPC vs NPC collisions
    if (physics) {
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < this.npcs.length; i++) {
          for (let j = i + 1; j < this.npcs.length; j++) {
            const a = this.npcs[i];
            const b = this.npcs[j];
            const ta = { x: a.pos.x, y: a.pos.y, r: a.r };
            const tb = { x: b.pos.x, y: b.pos.y, r: b.r };
            const hit = physics.separateCircles({ a: ta, b: tb });
            if (!hit) continue;
            a.pos.x = clamp(ta.x, level.bounds.minX + a.r, level.bounds.maxX - a.r);
            a.pos.y = clamp(ta.y, level.bounds.minY + a.r, level.bounds.maxY - a.r);
            b.pos.x = clamp(tb.x, level.bounds.minX + b.r, level.bounds.maxX - b.r);
            b.pos.y = clamp(tb.y, level.bounds.minY + b.r, level.bounds.maxY - b.r);
          }
        }
      }
    }
  }

  _colorFromTags(tags) {
    const set = new Set((tags ?? []).map((t) => String(t).toLowerCase()));
    for (const c of ['blue', 'purple', 'red', 'pink', 'green', 'yellow', 'cyan', 'magenta']) {
      if (set.has(c)) return c;
    }
    return null;
  }

  _randomWanderPoint(level, npc) {
    const minX = level.bounds.minX + npc.r;
    const maxX = level.bounds.maxX - npc.r;
    const minY = level.bounds.minY + npc.r;
    const maxY = level.bounds.maxY - npc.r;
    return {
      x: randRange(minX, maxX),
      y: randRange(minY, maxY)
    };
  }

  _hintLine(npc, partner) {
    const t = npc.traits ?? [];
    const sample = t.length ? String(t[Math.floor(Math.random() * t.length)]).toLowerCase() : 'music';
    const ref = partner?.name ? i18n('npc.hint.ref', { name: partner.name }) : i18n('npc.hint.refGeneric');
    const map = {
      music: 'npc.hint.music',
      calm: 'npc.hint.calm',
      night: 'npc.hint.night',
      sports: 'npc.hint.sports',
      reading: 'npc.hint.reading',
      art: 'npc.hint.art',
      rules: 'npc.hint.rules'
    };
    const key = map[sample];
    const base = key ? i18n(key) : i18n('npc.hint.likeTrait', { trait: sample });
    return Math.random() < 0.55 ? base : ref;
  }

  _maybeSpeak(npc, byId) {
    const partner = npc.likesId ? byId.get(npc.likesId) : null;
    if (npc.id === 'metic') {
      npc.speech = { ttl: 1.8, text: i18n('npc.metic.prob', { pct: Math.floor(randRange(35, 85)) }) };
      return;
    }
    if (npc.id === 'gobbo' && Math.random() < 0.35) {
      npc.speech = { ttl: 1.8, text: i18n('npc.gobbo.mushroom') };
      return;
    }
    npc.speech = { ttl: 1.6, text: this._hintLine(npc, partner) };
  }

  collideWithPlayer({ player, physics, level }) {
    if (!player || !physics) return;
    for (const npc of this.npcs) {
      const tempA = { x: player.pos.x, y: player.pos.y, r: player.r };
      const tempB = { x: npc.pos.x, y: npc.pos.y, r: npc.r };
      const hit = physics.separateCircles({ a: tempA, b: tempB });
      if (!hit) continue;
      player.pos.x = clamp(tempA.x, level.bounds.minX + player.r, level.bounds.maxX - player.r);
      player.pos.y = clamp(tempA.y, level.bounds.minY + player.r, level.bounds.maxY - player.r);
      npc.pos.x = clamp(tempB.x, level.bounds.minX + npc.r, level.bounds.maxX - npc.r);
      npc.pos.y = clamp(tempB.y, level.bounds.minY + npc.r, level.bounds.maxY - npc.r);
    }
  }

  raycastHit({ a, b, physics }) {
    // find first hit by distance from a (cheap: scan all)
    let best = null;
    let bestD2 = Infinity;
    for (const npc of this.npcs) {
      const hit = physics.rayCircleHit({ a, b, center: npc.pos, radius: npc.r });
      if (!hit) continue;
      const dx = npc.pos.x - a.x;
      const dy = npc.pos.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = npc;
      }
    }
    return best;
  }

  render(ctx, { debug, binding, chaos, sprites }) {
    for (const npc of this.npcs) {
      this._drawNpc(ctx, npc, { debug, binding, chaos, sprites });
    }
  }

  _drawNpc(ctx, npc, { debug, binding, chaos, sprites }) {
    const isGobbo = npc.id === 'gobbo';
    const awaiting = binding.state === 'AwaitingPair' && binding.first === npc;
    const chaos01 = chaos / 100;

    const col = String(npc.color ?? 'neutral').toLowerCase();
    const palette = {
      blue: 'rgba(85,224,255,0.22)',
      purple: 'rgba(160,120,255,0.22)',
      red: 'rgba(255,107,107,0.22)',
      pink: 'rgba(255,79,167,0.22)',
      green: 'rgba(68,255,154,0.20)',
      yellow: 'rgba(255,211,90,0.20)',
      cyan: 'rgba(85,224,255,0.20)',
      magenta: 'rgba(255,79,167,0.20)',
      neutral: 'rgba(255,255,255,0.18)'
    };

    ctx.save();
    ctx.translate(npc.pos.x, npc.pos.y);

    // Aura for awaitingBond
    if (npc.state === 'awaitingBond' || awaiting) {
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = 'rgba(255,211,90,0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, npc.r + 8 + Math.sin(performance.now() / 110) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Sprite (if available) else fallback to vector body
    const sprite = sprites?.getDirectionalFrame?.(npc.spriteKey, npc.facing ?? 'south', npc.animFrame ?? 0);
    if (sprite) {
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      const s = npc.r * 3;
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
      ctx.imageSmoothingEnabled = prev;
    } else {
      // Body
      const baseFill = isGobbo ? 'rgba(68,255,154,0.26)' : (palette[col] ?? palette.neutral);
      const stroke = awaiting ? 'rgba(255,211,90,0.75)' : 'rgba(255,255,255,0.28)';
      ctx.fillStyle = baseFill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, npc.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Face
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      ctx.arc(-npc.r * 0.22, -npc.r * 0.1, 1.8 + chaos01 * 0.8, 0, Math.PI * 2);
      ctx.arc(npc.r * 0.22, -npc.r * 0.1, 1.8 + chaos01 * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, npc.r * 0.12, npc.r * 0.22, 0, Math.PI);
      ctx.stroke();
    }

    // Name tag
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, 0, -npc.r - 10);

    // Speech bubble
    if (npc.speech) {
      const text = npc.speech.text;
      ctx.globalAlpha = 0.92;
      ctx.font = '12px system-ui';
      const pad = 8;
      const tw = Math.min(240, ctx.measureText(text).width);
      const w = tw + pad * 2;
      const h = 22;
      const x = -w / 2;
      const y = -npc.r - 44;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(text, 0, y + 15);
    }

    if (debug) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(85,224,255,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, npc.r, 0, Math.PI * 2);
      ctx.stroke();

      // show traits
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const t = (npc.traits ?? []).slice(0, 3).join('/');
      ctx.fillText(`${npc.color ?? 'neutral'} • ${t}`, 0, npc.r + 16);
    }

    ctx.restore();
  }
}
