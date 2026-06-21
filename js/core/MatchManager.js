const MatchManager = {
  state: "countdown", // "countdown" | "playing" | "finished"
  winner: null,
  winningTeam: null,
  justFinished: false,
  countdownStartedAt: 0,
  finishedAtMs: 0, // NEW
  returnedToMenu: false, // NEW

  reset() {
    this.state = "countdown";
    this.winner = null;
    this.winningTeam = null;
    this.justFinished = false;
    this.countdownStartedAt = performance.now();
    this.returnedToMenu = false; // NEW
  },

  isCountingDown() {
    return this.state === "countdown";
  },

  isFinished() {
    return this.state === "finished";
  },

  // Call once per frame during countdown. Transitions to "playing" once
  // the countdown duration has elapsed.
  updateCountdown(nowMs, durationMs) {
    if (this.state !== "countdown") return;
    if (nowMs - this.countdownStartedAt >= durationMs) {
      this.state = "playing";
    }
  },

  update(balls) {
    if (this.state !== "playing") return;

    const aliveBalls = balls.filter((b) => b.alive);
    const aliveTeams = new Set(aliveBalls.map((b) => b.teamId));

    if (aliveTeams.size <= 1) {
      this.state = "finished";
      this.justFinished = true;
      this.finishedAtMs = performance.now(); // NEW

      if (aliveTeams.size === 0) {
        this.winner = null;
        this.winningTeam = null;
      } else {
        this.winningTeam = [...aliveTeams][0];
        this.winner = aliveBalls[0];
      }
    }
  },
};
