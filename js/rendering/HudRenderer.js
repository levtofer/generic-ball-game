// Generates and updates the bottom HUD grid based on the current match's
// ball roster. Re-creates panels once at match start (createPanels), then
// updates their live content (HP, ability info) every frame (updatePanels).

const HudRenderer = {
  maxVisibleSlots: 6,

  // Call once, after balls are created, before the game loop starts.
  // Builds one .hud-panel div per ball (up to the cap), appends to #hud-grid.
  createPanels(balls) {
    const hudGrid = document.getElementById("hud-grid");
    hudGrid.innerHTML = "";

    const visibleBalls = balls.slice(0, this.maxVisibleSlots);

    for (const ball of visibleBalls) {
      const panel = document.createElement("div");
      panel.className = "hud-panel";
      panel.dataset.ballId = ball.id; // CHANGED — unique id, not characterId

      const nameEl = document.createElement("div");
      nameEl.className = "hud-panel-name";
      nameEl.textContent = CONFIG.characters[ball.characterId].name;

      const bodyEl = document.createElement("div");
      bodyEl.className = "hud-panel-body";

      const portraitEl = document.createElement("div");
      portraitEl.className = "hud-panel-portrait";
      portraitEl.style.background = ball.color;

      const infoEl = document.createElement("div");
      infoEl.className = "hud-panel-info";
      infoEl.textContent = "—"; // placeholder, updatePanels fills this in live

      bodyEl.appendChild(portraitEl);
      bodyEl.appendChild(infoEl);
      panel.appendChild(nameEl);
      panel.appendChild(bodyEl);
      hudGrid.appendChild(panel);
    }

    // If roster exceeds the cap, fade all visible slots + show overlay
    if (balls.length > this.maxVisibleSlots) {
      this._showOverlay(hudGrid);
    }
  },

  _showOverlay(hudGrid) {
    hudGrid.classList.add("hud-overlay-active");
    for (const panel of hudGrid.children) {
      panel.classList.add("faded");
    }

    const overlay = document.createElement("div");
    overlay.id = "hud-overlay-content";

    const img = document.createElement("img");
    img.src = "images/whole-house-mad.png";
    img.alt = "Max players reached";
    overlay.appendChild(img);

    hudGrid.appendChild(overlay);
  },

  // Call every frame. Updates each panel's info box text (HP + simple
  // ability status) without re-creating DOM elements, just text content.
  updatePanels(balls) {
    const visibleBalls = balls.slice(0, this.maxVisibleSlots);

    for (const ball of visibleBalls) {
      const panel = document.querySelector(
        `.hud-panel[data-ball-id="${ball.id}"]`, // CHANGED
      );
      if (!panel) continue;

      const infoEl = panel.querySelector(".hud-panel-info");
      const hpText = `HP: ${Math.ceil(ball.hp)}/${ball.maxHp}`;
      const abilityText = this._getAbilityText(ball);

      infoEl.textContent = `${hpText} ${abilityText}`;

      // Visually grey out panels for balls that have died
      if (!ball.alive) {
        panel.classList.add("dead");
      }
    }
  },

  // Returns a short ability-status string, tailored per character.
  // Kept simple/generic for now — can be expanded per-character later.
  _getAbilityText(ball) {
    const state = ball.abilityState;

    switch (ball.characterId) {
      case "lapidary":
        return state.broken
          ? "| BROKEN"
          : `| Blade ${state.bladeState}/${state.maxState}`;
      case "farrier":
        return "";
      case "fletcher":
        return "";
      case "chandler":
        return "";
      default:
        return "";
    }
  },
};
