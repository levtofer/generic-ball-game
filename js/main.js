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
  // const characterIds = ["lapidary", "farrier"];
  const characterIds = [
    "lapidary",
    "farrier",
    "fletcher",
    "chandler",
    "lapidary",
    "farrier",
    "fletcher",
    "chandler",
    "lapidary",
    "farrier",
    "fletcher",
    "chandler",
  ];

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

  let activeHorseshoes = [];
  let activeArrows = [];
  let activeWaxPools = [];

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
      color: cfg.color,
    });
  });

  for (const ball of balls) {
    if (ball.characterId === "lapidary") {
      Lapidary.init(ball);
    }
    if (ball.characterId === "chandler") {
      Chandler.init(ball);
    }
    if (ball.characterId === "farrier") {
      Farrier.init(ball);
    }
    if (ball.characterId === "fletcher") {
      Fletcher.init(ball);
    }
  }

  MatchManager.reset();
  HudRenderer.createPanels(balls);

  // ── Game loop ────────────────────────────────────────────
  let lastTime = performance.now();

  function gameLoop(now) {
    const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const nowMs = now;

    // Physics always runs, win or not, so the last ball keeps bouncing
    for (const ball of balls) {
      ball.update(deltaSeconds);
    }

    if (!MatchManager.isFinished()) {
      // All character ability logic (Lapidary, Farrier, Fletcher, Chandler updates)
      // only runs while the match is still actively playing
      for (const ball of balls) {
        if (ball.characterId === "lapidary" && ball.alive) {
          Lapidary.update(ball, nowMs);
        }
      }

      for (const ball of balls) {
        if (ball.characterId === "farrier" && ball.alive) {
          const newHorseshoe = Farrier.update(
            ball,
            balls,
            nowMs,
            activeHorseshoes.length,
          );
          if (newHorseshoe) activeHorseshoes.push(newHorseshoe);
        }
      }

      for (const ball of balls) {
        if (ball.characterId === "fletcher" && ball.alive) {
          const newArrows = Fletcher.update(ball, balls, nowMs);
          activeArrows.push(...newArrows);
        }
      }

      for (const ball of balls) {
        if (ball.characterId === "chandler" && ball.alive) {
          const newWaxPool = Chandler.update(ball, nowMs);
          if (newWaxPool) activeWaxPools.push(newWaxPool);
        }
      }

      for (const horseshoe of activeHorseshoes) {
        horseshoe.update(deltaSeconds, arena);
      }

      for (const arrow of activeArrows) {
        arrow.update(deltaSeconds, arena);
      }

      for (const waxPool of activeWaxPools) {
        waxPool.update(nowMs);
      }

      for (const horseshoe of activeHorseshoes) {
        for (const ball of balls) {
          horseshoe.checkHit(ball, nowMs);
        }
      }

      for (const arrow of activeArrows) {
        for (const ball of balls) {
          arrow.checkHit(ball, nowMs);
        }
      }

      for (const waxPool of activeWaxPools) {
        for (const ball of balls) {
          waxPool.checkOverlap(ball, nowMs);
        }
      }

      activeHorseshoes = activeHorseshoes.filter((h) => h.alive);
      activeArrows = activeArrows.filter((a) => a.alive);
      activeWaxPools = activeWaxPools.filter((w) => w.alive);

      MatchManager.update(balls);
      if (MatchManager.justFinished) {
        activeHorseshoes = [];
        activeArrows = [];
        activeWaxPools = [];
        MatchManager.justFinished = false; // consume the flag so this only runs once
      }
    }

    // Wall/ball collision always runs too, so the winner keeps bouncing naturally
    AIController.updateFacing(balls, deltaSeconds);

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

    // Rendering always happens, even when finished, so the final frame stays visible
    renderer.clearAndDrawBackground();
    renderer.renderWaxPools(activeWaxPools, nowMs);
    renderer.render(balls, nowMs);
    renderer.renderHorseshoes(activeHorseshoes);
    renderer.renderArrows(activeArrows);
    HudRenderer.updatePanels(balls);

    if (MatchManager.isFinished()) {
      renderer.renderWinnerBanner(MatchManager.winner);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
