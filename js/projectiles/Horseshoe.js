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
    this.radius = 10;

    this.ownerBall = ownerBall;
    this.alive = true;

    this.wallBounceCount = 0;
    this.hitThisLeg = new Set(); // tracks which balls already took damage THIS leg

    this.spinAngle = 0; // purely visual
  }

  update(deltaSeconds, arena) {
    if (!this.alive) return;

    const cfg = CONFIG.characters.farrier;

    this.position = Vector2.add(this.position, Vector2.scale(this.velocity, deltaSeconds));
    this.spinAngle += (cfg.spinDegPerSec * Math.PI / 180) * deltaSeconds;

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
      this.hitThisLeg.clear(); // fresh leg, every ball is hittable again

      if (this.wallBounceCount >= 2) {
        this.alive = false; // second wall bounce = delete, no return-to-Farrier
      }
    }
  }

  // Call this every frame for every (horseshoe, ball) pair to check overlap.
  // Returns true if a NEW hit landed (caller should know damage was applied).
  checkHit(targetBall, nowMs) {
    if (!this.alive) return false;
    if (targetBall === this.ownerBall) return false;
    if (!targetBall.alive) return false;
    if (this.hitThisLeg.has(targetBall)) return false; // already hit this ball THIS leg

    const dist = Vector2.distance(this.position, targetBall.position);
    if (dist >= this.radius + targetBall.radius) return false;

    const applied = targetBall.takeDamage(
      CONFIG.characters.farrier.damage,
      nowMs,
      CONFIG.ball.hitInvulnMs
    );

    if (!applied) return false; // target was in ITS OWN invuln window (separate system)

    this.hitThisLeg.add(targetBall);
    return true;
  }
}