"use strict";

const tabs = [...document.querySelectorAll('[role="tab"]')];
const clientsPanel = document.getElementById("panel-clients");
const clientsScroll = clientsPanel.querySelector(".page-scroll");
let scrollFrame = 0;
function updateSceneBlur() {
  const distance = clientsPanel.querySelector(".editorial-hero").offsetHeight;
  if (!distance) {
    scrollFrame = 0;
    return;
  }
  // Move one long spatial fade with the content instead of ramping a global filter.
  const start = distance - Math.max(0, clientsScroll.scrollTop) - 180;
  clientsPanel.style.setProperty("--blur-start", `${start}px`);
  scrollFrame = 0;
}
function scheduleSceneBlur() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateSceneBlur);
}
clientsScroll.addEventListener("scroll", scheduleSceneBlur, { passive: true });
window.addEventListener("resize", scheduleSceneBlur);

// Every direct list item is one confirmed client. Keep the heading in sync
// with future additions/removals without introducing storage or entry forms.
const confirmedClients = document.getElementById("confirmed-clients");
const confirmedCount = document.getElementById("confirmed-count");
function updateConfirmedCount() {
  const total = [...confirmedClients.children].filter(child => child.tagName === "LI").length;
  confirmedCount.textContent = String(total);
}
new MutationObserver(updateConfirmedCount).observe(confirmedClients, { childList: true });
updateConfirmedCount();
function selectTab(selected) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
  }
}
function openClients() {
  selectTab(document.getElementById("tab-clients"));
  clientsScroll.scrollTop = 0;
  updateSceneBlur();
}
// Reset on launch, history restoration, and returning from the background.
window.addEventListener("pageshow", openClients);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") openClients();
});

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabs[next]);
    tabs[next].focus();
  });
});
