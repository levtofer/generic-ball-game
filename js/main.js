// Entry point — sets up canvas, spawns balls based on menu selections,
// runs the game loop. Match setup is now re-runnable (startMatch), so
// clicking "Start Match" in the menu can trigger a fresh match each time.

const canvas = document.getElementById("arena-canvas");
canvas.width = CONFIG.arena.width;
canvas.height = CONFIG.arena.height;

const COUNTDOWN_DURATION_MS = 2400; // 600ms per step × 4 steps (3,2,1,GO)
const RETURN_TO_MENU_DELAY_MS = 4500; // time the winner banner stays up before auto-returning to menu

const arena = new Arena(CONFIG.arena.width, CONFIG.arena.height);
const renderer = new Renderer(canvas);

let balls = [];
let activeHorseshoes = [];
let activeArrows = [];
let activeWaxPools = [];
let lastTime = performance.now();
let gameLoopStarted = false;

function randomLaunchVelocity() {
  const angle = Math.random() * Math.PI * 2;
  return Vector2.fromAngle(angle, CONFIG.ball.launchSpeed);
}

function randomSpawnPosition() {
  const r = CONFIG.ball.radius;
  const margin = r * 3;
  return {
    x: margin + Math.random() * (CONFIG.arena.width - margin * 2),
    y: margin + Math.random() * (CONFIG.arena.height - margin * 2),
  };
}

// Called by MenuController when "Start Match" is clicked.
// `selections` looks like { red: ["lapidary", "farrier"], blue: ["chandler"] }
function startMatch(selections) {
  // Reset all match state fresh
  balls = [];
  activeHorseshoes = [];
  activeArrows = [];
  activeWaxPools = [];

  for (const teamId of ["red", "blue"]) {
    for (const characterId of selections[teamId]) {
      const spawn = randomSpawnPosition();
      const cfg = CONFIG.characters[characterId];
      const ball = new Ball({
        x: spawn.x,
        y: spawn.y,
        velocity: randomLaunchVelocity(),
        radius: CONFIG.ball.radius,
        hp: cfg.hp,
        characterId: characterId,
        color: cfg.color,
        teamId: teamId,
      });
      balls.push(ball);
    }
  }

  // Per-character ability init
  for (const ball of balls) {
    if (ball.characterId === "lapidary") Lapidary.init(ball);
    if (ball.characterId === "chandler") Chandler.init(ball);
    if (ball.characterId === "farrier") Farrier.init(ball);
    if (ball.characterId === "fletcher") Fletcher.init(ball);
  }

  MatchManager.reset();
  HudRenderer.createPanels(balls);

  // Only ever start the requestAnimationFrame loop ONCE — it keeps running
  // forever in the background, reading from the `balls` array each frame.
  // Restarting a match just replaces what's IN that array, not the loop itself.
  if (!gameLoopStarted) {
    gameLoopStarted = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

function gameLoop(now) {
  const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const nowMs = now;

  if (MatchManager.isCountingDown()) {
    MatchManager.updateCountdown(nowMs, COUNTDOWN_DURATION_MS);

    // Still render the frozen arena underneath, so balls are visible
    // sitting at their spawn spots while the countdown plays
    renderer.clearAndDrawBackground();
    renderer.render(balls, nowMs);
    HudRenderer.updatePanels(balls);
    renderer.renderCountdown(
      nowMs,
      MatchManager.countdownStartedAt,
      COUNTDOWN_DURATION_MS,
    );

    requestAnimationFrame(gameLoop);
    return; // skip all physics/AI/abilities entirely during countdown
  }

  for (const ball of balls) {
    ball.update(deltaSeconds);
  }

  if (!MatchManager.isFinished()) {
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

    for (const horseshoe of activeHorseshoes)
      horseshoe.update(deltaSeconds, arena);
    for (const arrow of activeArrows) arrow.update(deltaSeconds, arena);
    for (const waxPool of activeWaxPools) waxPool.update(nowMs);

    for (const horseshoe of activeHorseshoes) {
      for (const ball of balls) horseshoe.checkHit(ball, nowMs);
    }
    for (const arrow of activeArrows) {
      for (const ball of balls) arrow.checkHit(ball, nowMs);
    }
    for (const waxPool of activeWaxPools) {
      for (const ball of balls) waxPool.checkOverlap(ball, nowMs);
    }

    activeHorseshoes = activeHorseshoes.filter((h) => h.alive);
    activeArrows = activeArrows.filter((a) => a.alive);
    activeWaxPools = activeWaxPools.filter((w) => w.alive);
  }

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

  MatchManager.update(balls);
  if (MatchManager.justFinished) {
    activeHorseshoes = [];
    activeArrows = [];
    activeWaxPools = [];
    MatchManager.justFinished = false;
  }

  renderer.clearAndDrawBackground();
  renderer.renderWaxPools(activeWaxPools, nowMs);
  renderer.render(balls, nowMs);
  renderer.renderHorseshoes(activeHorseshoes);
  renderer.renderArrows(activeArrows);
  HudRenderer.updatePanels(balls);

  if (MatchManager.isFinished()) {
    renderer.renderWinnerBanner(
      MatchManager.winner,
      MatchManager.winningTeam,
      balls,
    );

    if (
      !MatchManager.returnedToMenu &&
      now - MatchManager.finishedAtMs >= RETURN_TO_MENU_DELAY_MS
    ) {
      MatchManager.returnedToMenu = true;
      ScreenManager.showMenu();
    }
  }

  requestAnimationFrame(gameLoop);
}
