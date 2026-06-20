// The Chandler — hybrid AoE (wax pool) + weak melee (candlestick).
// This file currently covers ONLY the candlestick melee portion.
// Wax pool dripping/DoT logic will be added as a separate piece next,
// since it involves spawning persistent zone objects (different from
// instant contact damage).
//
// abilityState fields owned by this module:
//   (none yet for candlestick — it's stateless, just flat damage on contact)

const Chandler = {
  init(ball) {
    // No state needed for candlestick — kept here for consistency with
    // other character modules (and wax pool init will go here too, later)
  },

  // Call this when CollisionSystem reports this Chandler ball touched an enemy.
  // Returns true if a hit was actually applied.
  onContact(chandlerBall, enemyBall, nowMs) {
    const cfg = CONFIG.characters.chandler;
    return enemyBall.takeDamage(
      cfg.candlestickDamage,
      nowMs,
      CONFIG.ball.hitInvulnMs
    );
  },
};