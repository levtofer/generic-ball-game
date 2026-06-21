// Handles the team-config menu screen — dynamically generating character
// picker cards based on each team's size dropdown, and reading the final
// selections when "Start Match" is clicked.

const ROSTER = ["lapidary", "farrier", "fletcher", "chandler"];

const MenuController = {
  init() {
    document.querySelectorAll(".team-size-dropdown").forEach((dropdown) => {
      dropdown.value = "2"; // sensible default team size
      dropdown.addEventListener("change", () => this._rebuildCards(dropdown));
      this._rebuildCards(dropdown); // build initial cards on page load
    });

    document
      .getElementById("start-match-btn")
      .addEventListener("click", () => this._handleStart());
  },

  _rebuildCards(dropdown) {
    const team = dropdown.dataset.team;
    const size = parseInt(dropdown.value, 10);
    const cardList = document.querySelector(
      `.character-card-list[data-team="${team}"]`,
    );

    // Preserve existing selections where possible, so changing the dropdown
    // from e.g. 5 to 3 doesn't reset cards 1-3's already-chosen characters
    const existingSelections = Array.from(
      cardList.querySelectorAll("select"),
    ).map((s) => s.value);

    cardList.innerHTML = "";

    for (let i = 0; i < size; i++) {
      const defaultCharacter =
        existingSelections[i] || ROSTER[i % ROSTER.length];
      cardList.appendChild(this._createCard(team, i, defaultCharacter));
    }
  },

  _createCard(team, index, selectedCharacter) {
    const card = document.createElement("div");
    card.className = "character-card";

    const portrait = document.createElement("div");
    portrait.className = "character-card-portrait";
    portrait.style.background = CONFIG.characters[selectedCharacter].color;

    const select = document.createElement("select");
    select.dataset.team = team;
    select.dataset.index = index;

    for (const charId of ROSTER) {
      const option = document.createElement("option");
      option.value = charId;
      option.textContent = CONFIG.characters[charId].name;
      if (charId === selectedCharacter) option.selected = true;
      select.appendChild(option);
    }

    select.addEventListener("change", () => {
      portrait.style.background = CONFIG.characters[select.value].color;
    });

    card.appendChild(portrait);
    card.appendChild(select);
    return card;
  },

  // Reads current menu state into a plain data structure main.js can use
  // to spawn the actual match. Returns { red: ["lapidary", ...], blue: [...] }
  getSelections() {
    const result = { red: [], blue: [] };

    for (const team of ["red", "blue"]) {
      const cardList = document.querySelector(
        `.character-card-list[data-team="${team}"]`,
      );
      cardList.querySelectorAll("select").forEach((select) => {
        result[team].push(select.value);
      });
    }

    return result;
  },

  _handleStart() {
    const selections = this.getSelections();
    startMatch(selections); // NEW — actually spawns the real match now
    ScreenManager.showMatch();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  MenuController.init();
});
