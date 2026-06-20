// Defines arena boundaries and handles wall collision (not ball-vs-ball, that's CollisionSystem).

class Arena {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  // Checks a ball against all 4 walls, reflects velocity + repositions if needed.
  // Returns true if a wall bounce happened this frame (useful for SFX/VFX hooks later).
  resolveWallCollision(ball) {
    if (!ball.alive) return false;

    let bounced = false;
    const r = ball.radius;

    // Left wall
    if (ball.position.x - r < 0) {
      ball.position.x = r;
      ball.velocity = Vector2.reflect(ball.velocity, { x: 1, y: 0 });
      bounced = true;
    }
    // Right wall
    else if (ball.position.x + r > this.width) {
      ball.position.x = this.width - r;
      ball.velocity = Vector2.reflect(ball.velocity, { x: 1, y: 0 });
      bounced = true;
    }

    // Top wall
    if (ball.position.y - r < 0) {
      ball.position.y = r;
      ball.velocity = Vector2.reflect(ball.velocity, { x: 0, y: 1 });
      bounced = true;
    }
    // Bottom wall
    else if (ball.position.y + r > this.height) {
      ball.position.y = this.height - r;
      ball.velocity = Vector2.reflect(ball.velocity, { x: 0, y: 1 });
      bounced = true;
    }

    // Re-enforce exact speed after reflection to kill any float drift
    if (bounced) {
      const speed = CONFIG.ball.launchSpeed;
      ball.velocity = Vector2.setMagnitude(ball.velocity, speed);
    }

    return bounced;
  }
}