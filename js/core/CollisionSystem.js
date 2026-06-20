// Handles ball-vs-ball physical collisions (the elastic bounce itself).
// Damage-on-contact for melee characters (Lapidary, Chandler's candlestick)
// is intentionally NOT handled here — that's character-specific logic that
// will hook into this system later by checking "did these two balls just collide."

const CollisionSystem = {
  // Checks every unique pair of balls for overlap, resolves bounce if found.
  // Returns an array of {ballA, ballB} pairs that collided this frame,
  // so character ability code (Phase 2) can react to "I just touched someone."
  resolveBallCollisions(balls) {
    const collisions = [];

    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];

        if (!a.alive || !b.alive) continue;

        const dist = Vector2.distance(a.position, b.position);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0) {
          this._resolveBounce(a, b, dist, minDist);
          collisions.push({ ballA: a, ballB: b });
        }
      }
    }

    return collisions;
  },

  _resolveBounce(a, b, dist, minDist) {
    // Collision normal: direction from a's center to b's center
    const normal = Vector2.normalize(Vector2.subtract(b.position, a.position));

    // Separate overlapping balls so they don't visually stick/sink into each other
    const overlap = minDist - dist;
    const correction = Vector2.scale(normal, overlap / 2);
    a.position = Vector2.subtract(a.position, correction);
    b.position = Vector2.add(b.position, correction);

    // Reflect both velocities off the collision normal (equal-mass elastic bounce)
    a.velocity = Vector2.reflect(a.velocity, normal);
    b.velocity = Vector2.reflect(b.velocity, Vector2.scale(normal, -1));

    // Re-enforce exact launch speed on both — same rule as wall bounces,
    // keeps every ball at constant speed forever, no energy gain/loss
    const speed = CONFIG.ball.launchSpeed;
    a.velocity = Vector2.setMagnitude(a.velocity, speed);
    b.velocity = Vector2.setMagnitude(b.velocity, speed);
  },
};