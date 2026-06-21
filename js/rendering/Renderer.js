// Draws everything to canvas each frame. Phase 1 only draws balls + HP bars —
// weapon sprites, projectiles, and wax pools get added in Phase 2.

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawArenaBackground() {
    this.ctx.fillStyle = "#EEEEEE";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBall(ball, nowMs) {
    if (!ball.alive) return;

    const ctx = this.ctx;

    const flashDurationMs = 200; // how long the transparency dip lasts
    const timeSinceHit = nowMs - ball.lastHitAtMs;
    const opacity = timeSinceHit < flashDurationMs ? 0.5 : 1;

    ctx.globalAlpha = opacity;

    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = 1; // reset immediately so HP bar/facing dot aren't also transparent

    this._drawHpBar(ball);
    this._drawFacingIndicator(ball);
    this._drawDebugAbilityText(ball);
  }

  _drawHpBar(ball) {
    const ctx = this.ctx;
    const barWidth = ball.radius * 2;
    const barHeight = 6;
    const x = ball.position.x - ball.radius;
    const y = ball.position.y - ball.radius - 14;

    const hpRatio = Math.max(0, ball.hp / ball.maxHp);

    ctx.fillStyle = "#444444";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.3 ? "#4caf50" : "#e53935";
    ctx.fillRect(x, y, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  // Draws all active horseshoes. Each one spins continuously (visual only,
  // doesn't affect hit detection) regardless of travel direction, per spec.
  renderHorseshoes(horseshoes) {
    const ctx = this.ctx;

    for (const horseshoe of horseshoes) {
      if (!horseshoe.alive) continue;

      ctx.save();
      ctx.translate(horseshoe.position.x, horseshoe.position.y);
      ctx.rotate(horseshoe.spinAngle);

      // Placeholder shape: a brown "U" arc standing in for a horseshoe sprite
      ctx.beginPath();
      ctx.arc(0, 0, horseshoe.radius, 0.3 * Math.PI, 1.7 * Math.PI);
      ctx.strokeStyle = CONFIG.characters.farrier.color;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.restore();
    }
  }

  // Draws all active arrows. Each one rotates to match its fixed travel
  // direction (set once at spawn), unlike the horseshoe's independent spin.
  renderArrows(arrows) {
    const ctx = this.ctx;

    for (const arrow of arrows) {
      if (!arrow.alive) continue;

      const r = arrow.radius;

      ctx.save();
      ctx.translate(arrow.position.x, arrow.position.y);
      ctx.rotate(arrow.travelAngle);

      ctx.strokeStyle = CONFIG.characters.fletcher.color;
      ctx.fillStyle = CONFIG.characters.fletcher.color;
      ctx.lineWidth = 2;

      // Shaft length and arrowhead size now scale proportionally with radius,
      // so changing CONFIG.characters.fletcher.arrowRadius affects both
      // hit detection AND visuals together
      ctx.beginPath();
      ctx.moveTo(-r * 1.7, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(r * 1.7, 0);
      ctx.lineTo(r * 0.7, -r * 0.5);
      ctx.lineTo(r * 0.7, r * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  // Draws all active wax pools as translucent puddles. Fades out slightly
  // as they approach expiry, giving a visual cue that the hazard is about
  // to disappear (purely cosmetic, doesn't affect actual hitbox/timing).
  renderWaxPools(waxPools, nowMs) {
    const ctx = this.ctx;

    for (const pool of waxPools) {
      if (!pool.alive) continue;

      const remainingMs = pool.expiresAtMs - nowMs;
      const fadeWindowMs = 800;
      const opacity =
        remainingMs < fadeWindowMs
          ? Math.max(0.15, remainingMs / fadeWindowMs)
          : 1;

      ctx.beginPath();
      ctx.arc(pool.position.x, pool.position.y, pool.radius, 0, Math.PI * 2);

      ctx.globalAlpha = 0.35 * opacity;
      ctx.fillStyle = CONFIG.characters.chandler.color;
      ctx.fill();

      ctx.globalAlpha = 0.7 * opacity;
      ctx.strokeStyle = CONFIG.characters.chandler.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }

  // Temporary stand-in for the orbiting weapon sprite — just a small triangle
  // pointing in facingAngle, sitting just outside the ball's edge.
  // Will be replaced by actual weapon icons in Phase 2.
  _drawFacingIndicator(ball) {
    const ctx = this.ctx;
    const dist = ball.radius + 10;
    const px = ball.position.x + Math.cos(ball.facingAngle) * dist;
    const py = ball.position.y + Math.sin(ball.facingAngle) * dist;

    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = ball.teamId === "red" ? "#e53935" : "#1e88e5"; // red or blue
    ctx.fill();
  }

  clearAndDrawBackground() {
    this.clear();
    this.drawArenaBackground();
  }

  renderWinnerBanner(winnerBall, winningTeam, balls) {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.textAlign = "center";

    if (winningTeam) {
      const teamSize = balls.filter((b) => b.teamId === winningTeam).length;

      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = winningTeam === "red" ? "#e53935" : "#1e88e5";

      if (teamSize === 1) {
        // 1v1 / FFA-style — show the specific character's name instead
        const name = CONFIG.characters[winnerBall.characterId].name;
        ctx.fillText(name.toUpperCase(), cx, cy - 10);
      } else {
        // Real team match — show team name instead of one arbitrary member
        ctx.fillText(`${winningTeam.toUpperCase()} TEAM`, cx, cy - 10);
      }

      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#000000";
      ctx.fillText("WINS", cx, cy + 16);
    } else {
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#000000";
      ctx.fillText("DRAW", cx, cy);
    }

    ctx.textAlign = "left";
  }

  // Draws "3", "2", "1", "GO!" with a simple pop-in scale animation,
  // based on elapsed time since countdown started.
  renderCountdown(nowMs, startedAtMs, durationMs) {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    const elapsed = nowMs - startedAtMs;
    const stepMs = durationMs / 4; // 4 steps: 3, 2, 1, GO
    const stepIndex = Math.min(Math.floor(elapsed / stepMs), 3);
    const labels = ["3", "2", "1", "GO!"];
    const text = labels[stepIndex];

    // Pop animation: scale from 1.4 down to 1.0 over each step's duration
    const timeIntoStep = elapsed - stepIndex * stepMs;
    const progress = Math.min(timeIntoStep / (stepMs * 0.3), 1); // quick pop, settles fast
    const scale = 1.4 - 0.4 * progress;

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.font = "bold 48px sans-serif";
    ctx.fillStyle = "#CB2957";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  // Debug overlay — shows ability state as text above the ball.
  // Temporary, for verifying mechanics before real sprites exist.
  _drawDebugAbilityText(ball) {
    if (ball.characterId !== "lapidary") return;

    const ctx = this.ctx;
    const state = ball.abilityState;
    const text = state.broken
      ? "BROKEN"
      : `STATE: ${state.bladeState}/${state.maxState}`;

    ctx.font = "12px sans-serif";
    ctx.fillStyle = state.broken ? "#CB2957" : "#000000";
    ctx.textAlign = "center";
    ctx.fillText(text, ball.position.x, ball.position.y - ball.radius - 22);
    ctx.textAlign = "left"; // reset so other drawing isn't affected
  }

  render(balls, nowMs) {
    for (const ball of balls) {
      this.drawBall(ball, nowMs);
    }
  }
}
