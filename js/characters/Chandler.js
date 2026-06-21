// The Chandler — hybrid melee (candlestick, already built) + AoE (wax pool).
// This file now owns wax pool drip-cooldown logic in addition to the
// existing contact-based candlestick damage.
//
// abilityState fields owned by this module:
//   nextWaxDropAllowedAt -> timestamp (ms) when Chandler can drip again

const Chandler = {
  init(ball) {
    ball.abilityState.nextWaxDropAllowedAt = 0;
  },

  // Candlestick melee — unchanged from before
  onContact(chandlerBall, enemyBall, nowMs) {
    const cfg = CONFIG.characters.chandler;
    return enemyBall.takeDamage(
      cfg.candlestickDamage,
      nowMs,
      CONFIG.ball.hitInvulnMs
    );
  },

  // Call once per frame, per Chandler ball. Returns a new WaxPool instance
  // if a drip happened this frame, or null otherwise. No target-check needed
  // here (unlike Farrier/Fletcher) since wax pool is positional, not aimed —
  // it just drips wherever Chandler currently is, regardless of facing.
  update(ball, nowMs) {
    const state = ball.abilityState;

    if (nowMs < state.nextWaxDropAllowedAt) return null;

    const cfg = CONFIG.characters.chandler;
    state.nextWaxDropAllowedAt = nowMs + cfg.waxDropCooldownMs;

    return new WaxPool({
      x: ball.position.x,
      y: ball.position.y,
      ownerBall: ball,
      spawnedAtMs: nowMs,
    });
  },
};