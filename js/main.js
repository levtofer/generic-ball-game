// Entry point — sets up canvas, spawns balls, runs the game loop.
// Phase 1 scope: physics + collision + HP only. No abilities, no AI decisions yet.

(function () {
  const canvas = document.getElementById("arena-canvas");
  canvas.width = CONFIG.arena.width;
  canvas.height = CONFIG.arena.height;

  const arena = new Arena(CONFIG.arena.width, CONFIG.arena.height);
  const renderer = new Renderer(canvas);

  // ── Spawn balls ──────────────────────────────────────────
  // Phase 1: just enough to test physics. 4 characters, 1 ball each.
  const characterIds = ["lapidary", "farrier", "fletcher", "chandler"];
  const colors = {
    lapidary: "#9c27b0",
    farrier: "#8d6e63",
    fletcher: "#43a047",
    chandler: "#fbc02d",
  };

  function randomLaunchVelocity() {
    const angle = Math.random() * Math.PI * 2;
    return Vector2.fromAngle(angle, CONFIG.ball.launchSpeed);
  }

  function randomSpawnPosition() {
    const r = CONFIG.ball.radius;
    const margin = r * 3; // keep spawns away from walls so they don't insta-bounce
    return {
      x: margin + Math.random() * (CONFIG.arena.width - margin * 2),
      y: margin + Math.random() * (CONFIG.arena.height - margin * 2),
    };
  }

  const balls = characterIds.map((id) => {
    const spawn = randomSpawnPosition();
    const cfg = CONFIG.characters[id];
    return new Ball({
      x: spawn.x,
      y: spawn.y,
      velocity: randomLaunchVelocity(),
      radius: CONFIG.ball.radius,
      hp: cfg.hp,
      characterId: id,
      color: colors[id],
    });
  });

  for (const ball of balls) {
    for (const ball of balls) {
      if (ball.characterId === "lapidary") {
        Lapidary.init(ball);
      }
      if (ball.characterId === "chandler") {
        Chandler.init(ball);
      }
    }
  }

  // ── Game loop ────────────────────────────────────────────
  let lastTime = performance.now();

  function gameLoop(now) {
    const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05); // clamp to avoid huge jumps on tab-switch
    lastTime = now;
    const nowMs = now;

    // Update physics
    for (const ball of balls) {
      ball.update(deltaSeconds);
    }

    for (const ball of balls) {
      if (ball.characterId === "lapidary") {
        Lapidary.update(ball, nowMs);
      }
    }

    AIController.updateFacing(balls, deltaSeconds);

    // Resolve collisions (wall first, then ball-vs-ball)
    for (const ball of balls) {
      arena.resolveWallCollision(ball);
    }
    const collisions = CollisionSystem.resolveBallCollisions(balls);
    for (const { ballA, ballB } of collisions) {
      if (ballA.characterId === "lapidary")
        Lapidary.onContact(ballA, ballB, nowMs);
      if (ballB.characterId === "lapidary")
        Lapidary.onContact(ballB, ballA, nowMs);
      if (ballA.characterId === "chandler")
        Chandler.onContact(ballA, ballB, nowMs);
      if (ballB.characterId === "chandler")
        Chandler.onContact(ballB, ballA, nowMs);
    }

    // Draw
    renderer.render(balls);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
