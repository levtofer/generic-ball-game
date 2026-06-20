// "Light awareness" AI — no pathfinding, no prediction.
// Two jobs per frame, per ball:
//   1. Find nearest enemy, update facing toward them
//   2. Expose a simple "is a valid target roughly in front of me" check
//      that character ability code can use to decide whether to fire

const AIController = {
  // Call once per frame with the full ball list.
  // Updates facingAngle on every living ball toward its nearest living enemy.
  // Call once per frame with the full ball list and deltaSeconds.
  updateFacing(balls, deltaSeconds) {
    for (const ball of balls) {
      if (!ball.alive) continue;

      const nearest = this.findNearestEnemy(ball, balls);
      if (nearest) {
        ball.setFacingToward(nearest.position, deltaSeconds);
      }
    }
  },

  // Returns the closest living enemy ball, with hysteresis: won't switch
  // away from the currently-locked target unless a new enemy is closer
  // by at least `targetSwitchMarginPx` — prevents rapid flicker when two
  // enemies are roughly equidistant.
  findNearestEnemy(self, balls) {
    let nearest = null;
    let nearestDist = Infinity;
    let currentTargetDist = Infinity;

    const currentTarget = self.abilityState._currentTarget || null;

    for (const other of balls) {
      if (other === self || !other.alive) continue;

      const dist = Vector2.distance(self.position, other.position);

      if (other === currentTarget) {
        currentTargetDist = dist;
      }

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    }

    // If current target is still alive and the "new nearest" isn't
    // meaningfully closer, stick with the current target instead of switching
    if (
      currentTarget &&
      currentTarget.alive &&
      nearest !== currentTarget &&
      currentTargetDist - nearestDist < CONFIG.ai.targetSwitchMarginPx
    ) {
      self.abilityState._currentTarget = currentTarget;
      return currentTarget;
    }

    self.abilityState._currentTarget = nearest;
    return nearest;
  },

  // Used by ranged abilities (Farrier, Fletcher) to decide whether to fire.
  // Checks: is there a living enemy, and is self's facing angle already
  // pointing roughly at them (within tolerance)?
  // Since facing already tracks nearest enemy every frame, this is almost
  // always true once a target exists — but kept as an explicit check so
  // it stays readable and tunable (e.g. tighten tolerance later for "aim time").
  hasValidTarget(self, balls) {
    const nearest = this.findNearestEnemy(self, balls);
    if (!nearest) return false;

    const angleToTarget = Vector2.angle(
      Vector2.subtract(nearest.position, self.position)
    );

    let diff = Math.abs(angleToTarget - self.facingAngle);
    // Normalize angle difference to 0–180° range regardless of wraparound
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    const toleranceRad = (CONFIG.ai.facingCheckToleranceDeg * Math.PI) / 180;
    return diff <= toleranceRad;
  },

  // Returns the nearest enemy directly — convenience wrapper so character
  // ability code doesn't need to call findNearestEnemy separately when it
  // also needs the actual target object (e.g. to aim a thrown projectile)
  getTarget(self, balls) {
    return this.findNearestEnemy(self, balls);
  },
};