// The Fletcher's arrow — locks in a direction at the frame it's fired,
// never retargets, never bounces. Despawns the instant it touches a wall
// OR lands a hit on an enemy, whichever comes first. Rotates visually to
// match its travel direction (unlike the horseshoe's independent spin).

class Arrow {
  constructor({ x, y, angle, ownerBall, damage }) {
    const cfg = CONFIG.characters.fletcher;

    this.position = Vector2.create(x, y);
    this.velocity = Vector2.fromAngle(angle, cfg.projectileSpeed);
    this.radius = 6; // placeholder hit-radius

    this.ownerBall = ownerBall;
    this.damage = damage; // passed in per-arrow, since fan spread may want per-arrow tuning later
    this.alive = true;

    this.travelAngle = angle; // fixed at spawn, used purely for rendering rotation
  }

  update(deltaSeconds, arena) {
    if (!this.alive) return;

    this.position = Vector2.add(this.position, Vector2.scale(this.velocity, deltaSeconds));

    // No bounce — touching any wall just kills the arrow outright
    const r = this.radius;
    if (
      this.position.x - r < 0 ||
      this.position.x + r > arena.width ||
      this.position.y - r < 0 ||
      this.position.y + r > arena.height
    ) {
      this.alive = false;
    }
  }

  // Returns true if a hit landed (caller knows damage was applied + arrow is now dead)
  checkHit(targetBall, nowMs) {
    if (!this.alive) return false;
    if (targetBall === this.ownerBall) return false;
    if (!targetBall.alive) return false;

    const dist = Vector2.distance(this.position, targetBall.position);
    if (dist >= this.radius + targetBall.radius) return false;

    const applied = targetBall.takeDamage(this.damage, nowMs, CONFIG.ball.hitInvulnMs);

    if (!applied) return false; // target was invuln, hit didn't count, arrow keeps flying

    this.alive = false; // hit landed — arrow despawns immediately, no multi-hit
    return true;
  }
}