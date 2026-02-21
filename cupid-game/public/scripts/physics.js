export class Physics {
  rayCircleHit({ a, b, center, radius }) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const acx = center.x - a.x;
    const acy = center.y - a.y;

    const abLen2 = abx * abx + aby * aby;
    const t = abLen2 === 0 ? 0 : (acx * abx + acy * aby) / abLen2;
    const clamped = Math.max(0, Math.min(1, t));
    const hx = a.x + abx * clamped;
    const hy = a.y + aby * clamped;
    const dx = center.x - hx;
    const dy = center.y - hy;
    const dist2 = dx * dx + dy * dy;
    return dist2 <= radius * radius;
  }

  circleCircle(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = a.r + b.r;
    return dx * dx + dy * dy <= r * r;
  }

  separateCircles({ a, b }) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const overlap = a.r + b.r - dist;
    if (overlap <= 0) return false;

    const nx = dx / dist;
    const ny = dy / dist;
    const push = overlap / 2;
    a.x -= nx * push;
    a.y -= ny * push;
    b.x += nx * push;
    b.y += ny * push;
    return true;
  }

  separateCircleStatic({ mover, fixed }) {
    const dx = mover.x - fixed.x;
    const dy = mover.y - fixed.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const overlap = mover.r + fixed.r - dist;
    if (overlap <= 0) return false;

    const nx = dx / dist;
    const ny = dy / dist;
    mover.x += nx * overlap;
    mover.y += ny * overlap;
    return true;
  }
}
