(() => {
  "use strict";
  const tabs = [...document.querySelectorAll("[data-tab]")];
  const backgrounds = [...document.querySelectorAll("[data-panel]")];
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      const selected = tab.dataset.tab;
      for (const item of tabs) {
        const active = item.dataset.tab === selected;
        item.classList.toggle("active", active);
        if (active) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      }
      for (const background of backgrounds) {
        background.classList.toggle("active", background.dataset.panel === selected);
      }
    });
  }
})();