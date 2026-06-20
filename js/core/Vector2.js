// Tiny 2D vector math helper. No classes-within-classes, just plain functions
// operating on {x, y} objects so it's cheap and easy to read.

const Vector2 = {
  create(x = 0, y = 0) {
    return { x, y };
  },

  add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  scale(a, scalar) {
    return { x: a.x * scalar, y: a.y * scalar };
  },

  length(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  },

  normalize(a) {
    const len = Vector2.length(a);
    if (len === 0) return { x: 0, y: 0 };
    return { x: a.x / len, y: a.y / len };
  },

  distance(a, b) {
    return Vector2.length(Vector2.subtract(a, b));
  },

  // Angle in radians, useful for facing direction and projectile rotation
  angle(a) {
    return Math.atan2(a.y, a.x);
  },

  fromAngle(angleRad, magnitude = 1) {
    return {
      x: Math.cos(angleRad) * magnitude,
      y: Math.sin(angleRad) * magnitude,
    };
  },

  // Reflect a velocity vector off a surface normal (used for wall/ball bounces)
  reflect(velocity, normal) {
    const dot = velocity.x * normal.x + velocity.y * normal.y;
    return {
      x: velocity.x - 2 * dot * normal.x,
      y: velocity.y - 2 * dot * normal.y,
    };
  },

  // Force a vector to a specific magnitude while keeping its direction
  // Critical for "same speed after bounce" — prevents energy gain/loss from float drift
  setMagnitude(a, magnitude) {
    const normalized = Vector2.normalize(a);
    return Vector2.scale(normalized, magnitude);
  },
};