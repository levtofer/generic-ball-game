// The Farrier's horseshoe — locks in a direction at the frame it's thrown,
// never retargets. Phases through enemies (no bounce off them), but each
// individual ball can only be hit ONCE per "leg" (the straight-line segment
// between wall bounces) — this prevents multi-frame overlap from spamming
// damage on the same target while still allowing it to hit MULTIPLE
// different balls in one leg if they're all in its path.
//
// Lifespan: leg 1 (post-throw) -> wall bounce -> leg 2 -> wall bounce -> deleted.

class Horseshoe {
  constructor({ x, y, angle, ownerBall }) {
    const cfg = CONFIG.characters.farrier;

    this.position = Vector2.create(x, y);
    this.velocity = Vector2.fromAngle(angle, cfg.projectileSpeed);
    this.radius = CONFIG.characters.farrier.horseshoeRadius;

    this.ownerBall = ownerBall;
    this.alive = true;

    this.wallBounceCount = 0;
    this.hitThisLeg = new Set();

    this.spinAngle = 0; // purely visual
  }

  update(deltaSeconds, arena) {
    if (!this.alive) return;

    const cfg = CONFIG.characters.farrier;

    this.position = Vector2.add(
      this.position,
      Vector2.scale(this.velocity, deltaSeconds),
    );
    this.spinAngle += ((cfg.spinDegPerSec * Math.PI) / 180) * deltaSeconds;

    this._resolveWallBounce(arena);
  }

  _resolveWallBounce(arena) {
    const r = this.radius;
    let bounced = false;

    if (this.position.x - r < 0) {
      this.position.x = r;
      this.velocity = Vector2.reflect(this.velocity, { x: 1, y: 0 });
      bounced = true;
    } else if (this.position.x + r > arena.width) {
      this.position.x = arena.width - r;
      this.velocity = Vector2.reflect(this.velocity, { x: 1, y: 0 });
      bounced = true;
    }

    if (this.position.y - r < 0) {
      this.position.y = r;
      this.velocity = Vector2.reflect(this.velocity, { x: 0, y: 1 });
      bounced = true;
    } else if (this.position.y + r > arena.height) {
      this.position.y = arena.height - r;
      this.velocity = Vector2.reflect(this.velocity, { x: 0, y: 1 });
      bounced = true;
    }

    if (bounced) {
      const speed = CONFIG.characters.farrier.projectileSpeed;
      this.velocity = Vector2.setMagnitude(this.velocity, speed);

      this.wallBounceCount += 1;
      this.hitThisLeg.clear();

      if (this.wallBounceCount >= 2) {
        this.alive = false; // second wall bounce = delete, no return-to-Farrier
      }
    }
  }

  // Returns true if a NEW hit landed. Once ANY hit lands, the horseshoe
  // is immediately spent — no more damage for the rest of its life,
  // regardless of remaining bounces. Bounces still happen visually/physically
  // (it keeps bouncing until its 2-bounce lifespan ends), but it's now
  // harmless — purely a "missed" object coasting to its own deletion.
  // Returns true if a NEW hit landed (caller should know damage was applied).
  // Per-target, per-leg protection: same ball can't be hit twice within
  // one leg, but resets on wall bounce, and different balls in the same
  // leg are each hittable once.
  checkHit(targetBall, nowMs) {
    if (!this.alive) return false;
    if (targetBall === this.ownerBall) return false;
    if (this.ownerBall.isSameTeam(targetBall)) return false; // NEW
    if (!targetBall.alive) return false;
    if (this.hitThisLeg.has(targetBall)) return false;

    const dist = Vector2.distance(this.position, targetBall.position);
    if (dist >= this.radius + targetBall.radius) return false;

    const applied = targetBall.takeDamage(
      CONFIG.characters.farrier.damage,
      nowMs,
      CONFIG.ball.hitInvulnMs,
    );

    if (!applied) return false;

    this.hitThisLeg.add(targetBall);
    return true;
  }
}
