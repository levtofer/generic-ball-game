// Tracks match state — whether the match is still running, who won (if
// anyone), and exposes a simple check each frame to detect end conditions.
// Doesn't touch rendering or physics directly; main.js reacts to its state.

const MatchManager = {
  state: "playing",
  winner: null,
  justFinished: false, // NEW

  reset() {
    this.state = "playing";
    this.winner = null;
    this.justFinished = false; // NEW
  },

  // Call once per frame, after all damage/collisions for this frame have
  // resolved. Checks how many balls are still alive and updates match state.
  update(balls) {
    if (this.state === "finished") return;

    const aliveBalls = balls.filter((b) => b.alive);

    if (aliveBalls.length <= 1) {
      this.state = "finished";
      this.winner = aliveBalls.length === 1 ? aliveBalls[0] : null;
      this.justFinished = true; // NEW — one-frame flag, main.js checks + clears this
    }
  },

  isFinished() {
    return this.state === "finished";
  },
};
