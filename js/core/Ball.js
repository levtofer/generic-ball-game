// Base entity for every character ball in the arena.
// Holds physics state (position/velocity), combat state (HP, invuln window),
// and facing (which gets driven by AIController later — not set here).

class Ball {
  constructor({ x, y, velocity, radius, hp, characterId, color }) {
    this.position = Vector2.create(x, y);
    this.velocity = velocity; // {x, y}, already at launchSpeed magnitude
    this.radius = radius;

    this.characterId = characterId; // "lapidary" | "farrier" | "fletcher" | "chandler"
    this.color = color;             // placeholder fill color until real sprites exist

    this.maxHp = hp;
    this.hp = hp;
    this.alive = true;

    this.lastHitAtMs = -Infinity; // NEW — never hit yet, so flash check always fails safely

    // Facing — independent of velocity, driven by nearest-enemy angle each frame
    this.facingAngle = 0; // radians

    // Anti-spam: timestamp (ms) until this ball can be damaged again
    this.invulnUntil = 0;

    // Character-specific ability state lives in a generic bucket.
    // Each character module reads/writes its own keys here
    // (e.g. lapidary uses abilityState.hitsLanded, abilityState.cooldownUntil)
    this.abilityState = {};
  }

  // Move purely by velocity — no steering, no self-propulsion
  update(deltaSeconds) {
    if (!this.alive) return;
    this.position = Vector2.add(
      this.position,
      Vector2.scale(this.velocity, deltaSeconds)
    );
  }

  canBeDamaged(nowMs) {
    return this.alive && nowMs >= this.invulnUntil;
  }

  takeDamage(amount, nowMs, invulnMs) {
    if (!this.canBeDamaged(nowMs)) return false;

    this.hp -= amount;
    this.invulnUntil = nowMs + invulnMs;
    this.lastHitAtMs = nowMs; // NEW — track when this ball was last successfully hit

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    return true;
  }

  // Called every frame by AIController — sets facing toward whichever
  // enemy ball is currently closest, recalculated continuously
 // Smoothly rotates facing toward the target angle at a max turn rate,
  // instead of snapping instantly. Called every frame by AIController.
  setFacingToward(targetPosition, deltaSeconds) {
    const direction = Vector2.subtract(targetPosition, this.position);
    const targetAngle = Vector2.angle(direction);

    this.facingAngle = this._rotateToward(
      this.facingAngle,
      targetAngle,
      CONFIG.ball.facingTurnSpeedRad * deltaSeconds
    );
  }

  // Turns `current` angle toward `target` angle by at most `maxStep` radians,
  // always taking the shortest rotational path (handles the -π/π wraparound correctly)
  _rotateToward(current, target, maxStep) {
    let diff = target - current;

    // Normalize diff to range -π..π so we always turn the short way
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) <= maxStep) {
      return target; // close enough, snap the rest of the way (avoids infinite micro-jitter)
    }

    return current + Math.sign(diff) * maxStep;
  }
}