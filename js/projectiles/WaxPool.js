// The Chandler's wax pool — stationary AoE hazard. Doesn't move once
// dripped. Lingers for a fixed duration, then disappears. Any enemy
// overlapping it takes damage on a tick interval (not continuously every
// frame, since that would melt people near-instantly) for as long as
// they remain inside it.

class WaxPool {
  constructor({ x, y, ownerBall, spawnedAtMs }) {
    const cfg = CONFIG.characters.chandler;

    this.position = Vector2.create(x, y);
    this.radius = cfg.waxPoolRadius;

    this.ownerBall = ownerBall;
    this.alive = true;

    this.expiresAtMs = spawnedAtMs + cfg.waxPoolDurationMs;

    // Tracks, per enemy ball, the next timestamp they're eligible to be
    // ticked again — this is what makes damage "every 500ms while standing
    // in it" instead of every single frame
    this.nextTickAtByBall = new Map();
  }

  update(nowMs) {
    if (nowMs >= this.expiresAtMs) {
      this.alive = false;
    }
  }

  // Call once per frame for every (waxPool, ball) pair. Applies tick
  // damage if the ball is overlapping AND its individual tick cooldown
  // has elapsed. Does nothing if ball is outside the pool, or owner's own ball.
  checkOverlap(targetBall, nowMs) {
    if (!this.alive) return false;
    if (targetBall === this.ownerBall) return false;
    if (this.ownerBall.isSameTeam(targetBall)) return false; // NEW
    if (!targetBall.alive) return false;

    const dist = Vector2.distance(this.position, targetBall.position);
    const isInside = dist < this.radius + targetBall.radius;

    if (!isInside) {
      // Stepped out of the pool — clear their tick timer so re-entering
      // later starts a fresh tick cycle instead of remembering stale timing
      this.nextTickAtByBall.delete(targetBall);
      return false;
    }

    const nextTickAt = this.nextTickAtByBall.get(targetBall) || 0;
    if (nowMs < nextTickAt) return false; // inside, but not due for a tick yet

    const cfg = CONFIG.characters.chandler;
    const applied = targetBall.takeDamage(cfg.waxTickDamage, nowMs, 0);
    // Note: invulnMs passed as 0 here deliberately — wax pool ticks should
    // NOT trigger the global hit-invuln window, otherwise standing in wax
    // would make you briefly immune to OTHER characters' attacks too,
    // which would be a weird emergent "wax = safe haven" exploit

    this.nextTickAtByBall.set(targetBall, nowMs + cfg.waxTickIntervalMs);
    return applied;
  }
}
