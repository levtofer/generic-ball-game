// The Farrier — ranged, throws a horseshoe toward the nearest enemy's
// current facing direction. No state needed on the Ball itself beyond a
// cooldown timer; the actual projectile (Horseshoe) lives independently
// once thrown, tracked in a separate global list (wired in main.js).
//
// abilityState fields owned by this module:
//   nextThrowAllowedAt  -> timestamp (ms) when Farrier can throw again

const Farrier = {
  init(ball) {
    ball.abilityState.nextThrowAllowedAt = 0; // can throw immediately at match start
  },

  // Call once per frame, per Farrier ball. Returns a NEW Horseshoe instance
  // if a throw happened this frame, or null if it didn't throw.
  update(ball, balls, nowMs, activeHorseshoeCount) {
    const state = ball.abilityState;

    if (nowMs < state.nextThrowAllowedAt) return null;
    if (activeHorseshoeCount >= CONFIG.characters.farrier.maxActiveHorseshoes)
      return null; // cap reached
    if (!AIController.hasValidTarget(ball, balls)) return null;

    const cfg = CONFIG.characters.farrier;
    state.nextThrowAllowedAt = nowMs + cfg.throwCooldownMs;

    const spawnDist = ball.radius + 12;
    const spawnX = ball.position.x + Math.cos(ball.facingAngle) * spawnDist;
    const spawnY = ball.position.y + Math.sin(ball.facingAngle) * spawnDist;

    return new Horseshoe({
      x: spawnX,
      y: spawnY,
      angle: ball.facingAngle,
      ownerBall: ball,
    });
  },
};
