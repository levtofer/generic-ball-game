// The Fletcher — fires a 3-arrow spread (fan/cone) toward the nearest
// enemy's current facing direction, all 3 angles locked at the frame
// of firing. Each arrow is independent once spawned — no shared state,
// no retargeting, straightforward fire-and-forget volley.
//
// abilityState fields owned by this module:
//   nextFireAllowedAt -> timestamp (ms) when Fletcher can fire again

const Fletcher = {
  init(ball) {
    ball.abilityState.nextFireAllowedAt = 0;
  },

  // Call once per frame, per Fletcher ball. Returns an ARRAY of new Arrow
  // instances if a volley fired this frame (always 3, or 0 if on cooldown
  // / no target), so caller can push them all into the active arrow list at once.
  update(ball, balls, nowMs) {
    const state = ball.abilityState;

    if (nowMs < state.nextFireAllowedAt) return [];
    if (!AIController.hasValidTarget(ball, balls)) return [];

    const cfg = CONFIG.characters.fletcher;
    state.nextFireAllowedAt = nowMs + cfg.throwCooldownMs;

    const spawnDist = ball.radius + 12;
    const baseAngle = ball.facingAngle;
    const spreadRad = (cfg.spreadAngleDeg * Math.PI) / 180;
    const arrowCount = cfg.arrowCount;

    const arrows = [];
    for (let i = 0; i < arrowCount; i++) {
      // Distribute arrows evenly across the spread, centered on baseAngle.
      // e.g. for 3 arrows: -spread/2, 0, +spread/2
      const t = arrowCount === 1 ? 0.5 : i / (arrowCount - 1);
      const offset = (t - 0.5) * spreadRad;
      const arrowAngle = baseAngle + offset;

      const spawnX = ball.position.x + Math.cos(arrowAngle) * spawnDist;
      const spawnY = ball.position.y + Math.sin(arrowAngle) * spawnDist;

      arrows.push(
        new Arrow({
          x: spawnX,
          y: spawnY,
          angle: arrowAngle,
          ownerBall: ball,
          damage: cfg.damagePerArrow,
        })
      );
    }

    return arrows;
  },
};