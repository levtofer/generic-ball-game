// The Lapidary — melee, contact-triggered, escalating blade-state mechanic.
//
// abilityState fields owned by this module (on each Lapidary Ball instance):
//   bladeState     -> current state, 1 = dull, increases on each successful hit
//   maxState       -> randomized cap (5-7) for THIS blade's lifespan, rerolled on respawn
//   broken         -> true while disarmed (no blade, zero damage, visual hidden)
//   breakUntilMs   -> timestamp when the broken cooldown ends

const Lapidary = {
  init(ball) {
    ball.abilityState.bladeState = 1;
    ball.abilityState.maxState = this._rollMaxState();
    ball.abilityState.broken = false;
    ball.abilityState.breakUntilMs = 0;
  },

  _rollMaxState() {
    const cfg = CONFIG.characters.lapidary;
    return (
      cfg.minMaxState +
      Math.floor(Math.random() * (cfg.maxMaxState - cfg.minMaxState + 1))
    );
  },

  _currentDamage(ball) {
    const cfg = CONFIG.characters.lapidary;
    return (
      cfg.baseDamage *
      Math.pow(cfg.sharpenMultiplier, ball.abilityState.bladeState - 1)
    );
  },

  // Call once per frame, per Lapidary ball, BEFORE collision resolution.
  // Handles the broken -> cooldown -> new blade transition.
  update(ball, nowMs) {
    const state = ball.abilityState;
    if (state.broken && nowMs >= state.breakUntilMs) {
      // Cooldown's up — fresh blade, state resets to 1, max state rerolled
      state.broken = false;
      state.bladeState = 1;
      state.maxState = this._rollMaxState();
    }
  },

  // Call this when CollisionSystem reports this Lapidary ball touched an enemy.
  // Returns true if a hit was actually applied (i.e. blade exists, target wasn't invuln).
  onContact(lapidaryBall, enemyBall, nowMs) {
    if (lapidaryBall.isSameTeam(enemyBall)) return false; // NEW — no friendly fire
    const state = lapidaryBall.abilityState;

    if (state.broken) return false; // no blade in hand, contact does nothing

    const damage = this._currentDamage(lapidaryBall);
    const applied = enemyBall.takeDamage(
      damage,
      nowMs,
      CONFIG.ball.hitInvulnMs,
    );

    if (!applied) return false; // enemy was in their own invuln window, hit didn't land

    // Successful hit — advance blade state, or break if at max
    if (state.bladeState >= state.maxState) {
      state.broken = true;
      state.breakUntilMs = nowMs + CONFIG.characters.lapidary.breakCooldownMs;
    } else {
      state.bladeState += 1;
    }

    return true;
  },
};
