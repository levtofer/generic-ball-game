// Handles fading between the menu screen and the match (#page) screen.
// Uses a brief opacity transition before actually toggling `display`,
// so the fade is visible rather than an instant cut.

const ScreenManager = {
  fadeDurationMs: 400, // matches the CSS transition duration above

  showMenu() {
    this._fadeOut(document.getElementById("page"), () => {
      const menu = document.getElementById("menu-screen");
      menu.classList.remove("hidden", "fade-out");
      // Force a reflow so the browser registers "hidden" was just removed
      // before we trigger the fade-in, otherwise the transition can get skipped
      void menu.offsetWidth;
    });
  },

  showMatch() {
    this._fadeOut(document.getElementById("menu-screen"), () => {
      const page = document.getElementById("page");
      page.classList.remove("hidden", "fade-out");
      void page.offsetWidth;
    });
  },

  _fadeOut(element, onHiddenCallback) {
    element.classList.add("fade-out");
    setTimeout(() => {
      element.classList.add("hidden");
      onHiddenCallback();
    }, this.fadeDurationMs);
  },
};