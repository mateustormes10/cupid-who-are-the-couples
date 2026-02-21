import { GameState } from './game.js';
import { t } from './i18n.js';

export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    this._bgImg = new Image();
    this._bgReady = false;
    this._bgSrc = null;
    this._bgImg.addEventListener('load', () => {
      this._bgReady = true;
    });

    this._objImgs = {
      rock: { img: new Image(), ready: false },
      crate: { img: new Image(), ready: false },
      mushroom: { img: new Image(), ready: false },
      heart: { img: new Image(), ready: false }
    };
    this._objImgs.rock.img.addEventListener('load', () => (this._objImgs.rock.ready = true));
    this._objImgs.crate.img.addEventListener('load', () => (this._objImgs.crate.ready = true));
    this._objImgs.mushroom.img.addEventListener('load', () => (this._objImgs.mushroom.ready = true));
    this._objImgs.heart.img.addEventListener('load', () => (this._objImgs.heart.ready = true));
    this._objImgs.rock.img.src = './public/assets/images/rock.png';
    this._objImgs.crate.img.src = './public/assets/images/crate.png';
    this._objImgs.mushroom.img.src = './public/assets/images/mushroom.png';
    this._objImgs.heart.img.src = './public/assets/images/heart.png';
  }

  render({ state, debug, level, input, session, compat, player, npcs, arrows, binding, events, sprites, meta }) {
    const { width: w, height: h } = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    this._syncBackground(level);
    this._drawBackground(ctx, w, h, session.chaos);
    this._drawStage(ctx, level, w, h);

    // God briefing (start of level)
    if (state === GameState.PLAYING && (session?.godBriefT ?? 0) > 0) {
      this._drawGodBrief(ctx, { sprites, lines: session.godBriefLines });
    }

    const cupidPos = player?.pos ?? level.cupid.pos;
    this._drawAim(ctx, cupidPos, input.worldMouse, state);

    npcs.render(ctx, { debug, binding, chaos: session.chaos, sprites });
    arrows.render(ctx);
    binding.render(ctx);
    events.render(ctx);

    this._drawCupid(ctx, cupidPos, input.worldMouse, session.chaos, { player, sprites });
    this._drawLabel(ctx, t('label.cupid'), cupidPos.x, cupidPos.y - ((player?.r ?? 16) * 2.2));
    if (debug) this._drawDebug(ctx, level, session, npcs, binding, input, compat, player);
    if (state === GameState.PAUSED) this._dim(ctx, w, h);
  }

  _drawBackground(ctx, w, h, chaosPct) {
    const chaos = chaosPct / 100;

    if (this._bgReady && this._bgImg) {
      const iw = this._bgImg.naturalWidth || this._bgImg.width;
      const ih = this._bgImg.naturalHeight || this._bgImg.height;
      if (iw > 0 && ih > 0) {
        const scale = Math.max(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.drawImage(this._bgImg, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    // Keep the existing chaos-tinted overlay for readability and theme.
    const shift = 12 * chaos;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `rgba(${18 + shift}, ${22}, ${43}, 1)`);
    grad.addColorStop(1, `rgba(${34 + shift}, ${10 + shift}, ${68}, 1)`);
    ctx.save();
    ctx.globalAlpha = this._bgReady ? 0.55 : 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 50; i++) {
      const x = (i * 97) % w;
      const y = (i * 193) % h;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,79,167,0.35)' : 'rgba(85,224,255,0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawStage(ctx, level, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.restore();

    for (const obj of level.objects) {
      if (obj.collected) continue;
      if (obj.kind === 'rock') this._drawRock(ctx, obj);
      if (obj.kind === 'mushroom') this._drawMushroom(ctx, obj);
      if (obj.kind === 'crate') this._drawCrate(ctx, obj);
      if (obj.kind === 'heart') this._drawHeart(ctx, obj);

      const label = this._labelForObject(obj);
      if (label) this._drawLabel(ctx, label, obj.pos.x, obj.pos.y - obj.r - 10);
    }
  }

  _syncBackground(level) {
    const bg = level?.background ? String(level.background) : '';
    const nextSrc = bg ? `./public/assets/images/${bg}` : null;
    if (!nextSrc || nextSrc === this._bgSrc) return;
    this._bgSrc = nextSrc;
    this._bgReady = false;
    this._bgImg.src = nextSrc;
  }

  _labelForObject(obj) {
    const kind = String(obj.kind ?? '').toLowerCase();
    if (kind === 'rock') return t('obj.rock');
    if (kind === 'mushroom') return t('obj.mushroom');
    if (kind === 'crate') return t('obj.crate');
    if (kind === 'heart') return null;
    return obj.kind ? String(obj.kind) : null;
  }

  _drawLabel(ctx, text, x, y) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const padX = 8;
    const bw = Math.min(240, ctx.measureText(text).width) + padX * 2;
    const bh = 20;
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(text, x, y + 0.5);
    ctx.restore();
  }

  _drawGodBrief(ctx, { sprites, lines }) {
    if (!sprites?.getFlatFrame) return;
    const img = sprites.getFlatFrame('god', 1);
    if (!img) return;

    const x = 18;
    const y = 18;
    const pad = 14;
    const icon = 72;

    const safeLines = Array.isArray(lines) ? lines.slice(0, 6) : [];
    const textX = x + pad + icon + 12;
    const lineH = 18;
    const boxW = 900;
    const boxH = Math.max(icon + pad * 2, pad * 2 + safeLines.length * lineH + 18);

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    ctx.drawImage(img, x + pad, y + pad, icon, icon);
    ctx.imageSmoothingEnabled = prev;

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '14px system-ui';
    ctx.fillText('God', textX, y + pad);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.font = '13px system-ui';

    for (let i = 0; i < safeLines.length; i++) {
      ctx.fillText(safeLines[i], textX, y + pad + 20 + i * lineH);
    }

    ctx.restore();
  }

  _drawRock(ctx, obj) {
    const sprite = this._objImgs?.rock;
    if (sprite?.ready && sprite.img) {
      const size = obj.r * 2.4;
      ctx.save();
      ctx.translate(obj.pos.x, obj.pos.y);
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite.img, -size / 2, -size / 2, size, size);
      ctx.imageSmoothingEnabled = prev;
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(obj.pos.x, obj.pos.y);
    ctx.fillStyle = 'rgba(190,200,220,0.35)';
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, obj.r * 1.15, obj.r, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawMushroom(ctx, obj) {
    const sprite = this._objImgs?.mushroom;
    if (sprite?.ready && sprite.img) {
      const size = obj.r * 2.4;
      ctx.save();
      ctx.translate(obj.pos.x, obj.pos.y);
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite.img, -size / 2, -size / 2, size, size);
      ctx.imageSmoothingEnabled = prev;
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(obj.pos.x, obj.pos.y);
    ctx.fillStyle = 'rgba(255,79,167,0.30)';
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -obj.r * 0.25, obj.r * 1.2, obj.r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.beginPath();
    ctx.roundRect(-obj.r * 0.35, -obj.r * 0.1, obj.r * 0.7, obj.r * 1.15, 10);
    ctx.fill();
    ctx.restore();
  }

  _drawCrate(ctx, obj) {
    const sprite = this._objImgs?.crate;
    if (sprite?.ready && sprite.img) {
      const size = obj.r * 2.4;
      ctx.save();
      ctx.translate(obj.pos.x, obj.pos.y);
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite.img, -size / 2, -size / 2, size, size);
      ctx.imageSmoothingEnabled = prev;
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(obj.pos.x, obj.pos.y);
    ctx.fillStyle = 'rgba(255,211,90,0.18)';
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-obj.r, -obj.r, obj.r * 2, obj.r * 2, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawHeart(ctx, obj) {
    const sprite = this._objImgs?.heart;
    if (sprite?.ready && sprite.img) {
      const size = obj.r * 2.4;
      ctx.save();
      ctx.translate(obj.pos.x, obj.pos.y);
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite.img, -size / 2, -size / 2, size, size);
      ctx.imageSmoothingEnabled = prev;
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(obj.pos.x, obj.pos.y);
    ctx.fillStyle = 'rgba(255,79,167,0.35)';
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-obj.r * 0.35, -obj.r * 0.15, obj.r * 0.55, 0, Math.PI * 2);
    ctx.arc(obj.r * 0.35, -obj.r * 0.15, obj.r * 0.55, 0, Math.PI * 2);
    ctx.lineTo(0, obj.r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawAim(ctx, from, to, state) {
    if (state !== GameState.PLAYING) return;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = 'rgba(255,79,167,0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  _drawCupid(ctx, pos, aim, chaosPct, { player, sprites } = {}) {
    const facing = player?.facing ?? 'south';
    const frame = player?.animFrame ?? 0;
    const isShooting = (player?.shootT ?? 0) > 0;

    if (sprites) {
      const base = sprites.getDirectionalFrame('Cupid', facing, frame);
      const shootFrameIndex = isShooting ? (player.shootT > 0.11 ? 0 : 1) : 0;
      const shoot = isShooting && (facing === 'east' || facing === 'west') ? sprites.getShootingFrame(shootFrameIndex) : null;
      const img = shoot ?? base;
      if (img) {
        const drawSize = (player?.r ?? 16) * 3;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        const prev = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 1;
        ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.imageSmoothingEnabled = prev;
        ctx.restore();
        return;
      }
    }

    const dx = aim.x - pos.x;
    const dy = aim.y - pos.y;
    const ang = Math.atan2(dy, dx);
    const bob = Math.sin(performance.now() / 350) * 3;
    const chaos = chaosPct / 100;

    ctx.save();
    ctx.translate(pos.x, pos.y + bob);

    // Wings
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.15 * (1 - chaos)})`;
    ctx.beginPath();
    ctx.ellipse(-18, 4, 14, 10, -0.6, 0, Math.PI * 2);
    ctx.ellipse(18, 4, 14, 10, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Face
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(-4, -2, 1.8, 0, Math.PI * 2);
    ctx.arc(4, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Bow
    ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(85,224,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(18, 0, 10, -1.2, 1.2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,79,167,0.9)';
    ctx.beginPath();
    ctx.moveTo(18, -10);
    ctx.lineTo(18, 10);
    ctx.stroke();

    ctx.restore();
  }

  _drawDebug(ctx, level, session, npcs, binding, input, compat, player) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(12, 44, 300, 92);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '12px system-ui';

    const lines = [
      `DEBUG: ON (F3)`,
      `Pairs: ${session.boundPairs}/${npcs.requiredPairs} • Chaos: ${Math.round(session.chaos)}%`,
      `Shots: ${session.shots} • Hits: ${session.hits} • Misbind: ${session.misbinds} • Rej: ${session.rejected}`,
      `BindingState: ${binding.state}`
    ];
    lines.forEach((t, i) => ctx.fillText(t, 22, 64 + i * 18));

    // Cupid pos
    ctx.strokeStyle = 'rgba(85,224,255,0.8)';
    ctx.beginPath();
    const p = player?.pos ?? level.cupid.pos;
    const pr = player?.r ?? 18;
    ctx.arc(p.x, p.y, pr + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Object hitboxes
    ctx.strokeStyle = 'rgba(255,211,90,0.55)';
    ctx.lineWidth = 1;
    for (const obj of level.objects) {
      ctx.beginPath();
      ctx.arc(obj.pos.x, obj.pos.y, obj.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Live compatibility number (first selected vs hovered npc)
    if (binding.state === 'AwaitingPair' && binding.firstType === 'npc' && compat) {
      const mx = input.worldMouse.x;
      const my = input.worldMouse.y;
      let hovered = null;
      for (const npc of npcs.npcs) {
        const dx = npc.pos.x - mx;
        const dy = npc.pos.y - my;
        if (dx * dx + dy * dy <= npc.r * npc.r) {
          hovered = npc;
          break;
        }
      }
      if (hovered && hovered !== binding.first) {
        const rep = compat.match(binding.first, hovered);
        ctx.fillStyle = rep.success ? 'rgba(68,255,154,0.9)' : 'rgba(255,107,107,0.9)';
        ctx.fillText(`Compat (hover): ${rep.percentage}% • ${rep.matches.join(', ') || 'none'}`, 22, 64 + 4 * 18);
      }
    }
    ctx.restore();
  }

  _dim(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
