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
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBall(ball) {
    if (!ball.alive) return;

    const ctx = this.ctx;

    // Ball body — plain circle, never rotates (per spec)
    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    this._drawHpBar(ball);
    this._drawFacingIndicator(ball); // placeholder wedge until weapon sprites exist
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
    ctx.fillStyle = "#ffd54f";
    ctx.fill();
  }

  // Debug overlay — shows ability state as text above the ball.
  // Temporary, for verifying mechanics before real sprites exist.
  _drawDebugAbilityText(ball) {
    if (ball.characterId !== "lapidary") return;

    const ctx = this.ctx;
    const state = ball.abilityState;
    const text = state.broken
      ? "BROKEN"
      : `State: ${state.bladeState}/${state.maxState}`;

    ctx.font = "12px sans-serif";
    ctx.fillStyle = state.broken ? "#e53935" : "#ffd54f";
    ctx.textAlign = "center";
    ctx.fillText(text, ball.position.x, ball.position.y - ball.radius - 22);
    ctx.textAlign = "left"; // reset so other drawing isn't affected
  }

  render(balls) {
    this.clear();
    this.drawArenaBackground();
    for (const ball of balls) {
      this.drawBall(ball);
    }
  }
}
