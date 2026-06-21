// Single source of truth for all tunable numbers.
// Balance changes should happen HERE, not buried inside character/projectile files.

const CONFIG = {
  // ── Arena ──────────────────────────────────────────────
  arena: {
    width: 800,
    height: 600,
  },

  // ── Ball / Physics ─────────────────────────────────────
  ball: {
    radius: 22,
    launchSpeed: 220, // px/sec, speed every ball is flung at on match start
    hitInvulnMs: 400, // "returnRot" — brief invuln window after taking a hit, prevents spam
    facingTurnSpeedRad: Math.PI * 3, // ~540°/sec max turn rate — fast but not instant
    targetSwitchMarginPx: 40, // new target must be this much closer before "nearest" switches
  },

  // ── Characters ──────────────────────────────────────────
  characters: {
    lapidary: {
      name: "The Lapidary",
      hp: 100,
      baseDamage: 5, // state 1 (dull) damage
      sharpenMultiplier: 1.3, // each state multiplies previous state's damage by this
      minMaxState: 5, // randomized blade lifespan lower bound
      maxMaxState: 7, // randomized blade lifespan upper bound
      breakCooldownMs: 3000,
    },

    farrier: {
      name: "The Farrier",
      hp: 110,
      damage: 5, // was 8, lowered since Farrier was overperforming
      maxActiveHorseshoes: 2, // new — hard cap on simultaneous horseshoes
      throwCooldownMs: 1500,
      projectileSpeed: 260,
      spinDegPerSec: 540,
    },

    fletcher: {
      name: "The Fletcher",
      hp: 115,
      damagePerArrow: 5,
      arrowCount: 3,
      spreadAngleDeg: 18, // total fan spread, arrows distributed across this
      throwCooldownMs: 1800,
      projectileSpeed: 320,
    },

    chandler: {
      name: "The Chandler",
      hp: 125,
      candlestickDamage: 4, // low-damage melee poke
      candlestickRange: 0, // contact-based, same as Lapidary
      waxDropCooldownMs: 2500,
      waxPoolDurationMs: 4000, // how long a dripped wax pool lingers
      waxPoolRadius: 30,
      waxTickDamage: 2,
      waxTickIntervalMs: 500, // damage every 0.5s while standing in wax
    },
  },

  // ── AI ──────────────────────────────────────────────────
  ai: {
    targetSwitchMarginPx: 40, // new target must be this much closer before "nearest" switches
    facingCheckToleranceDeg: 35, // how forgiving "roughly facing enemy" is before firing ranged abilities
  },
};
