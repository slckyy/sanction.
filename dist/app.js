"use strict";

// Clone the approved Clients markup; only supplied page content and the
// pre-existing background asset vary. All pages use the same stylesheet.
const pageContent = [
  { id: "call", title: "Call • Acquisition", color: "ROSE", lumi: "CALLER LUMI",
    description: "The space where all of your prospects are acquired by phone.",
    photo: "rose-photo.png", alt: "Rose LUMI in a rose-toned street-fashion editorial.",
    prefix: "", singular: "client", plural: "clients", suffix: " to call", list: "clients-to-call" },
  { id: "email", title: "Email • Acquisition", color: "VIOLET", lumi: "EMAILER LUMI",
    description: "The space where all of your prospects are acquired by email.",
    photo: "violet-photo.png", alt: "Violet LUMI in a violet-toned street-fashion editorial.",
    prefix: "", singular: "client", plural: "clients", suffix: " to email", list: "clients-to-email" },
  { id: "clients", prefix: " confirmed", singular: "client", plural: "clients", suffix: "", list: "confirmed-clients" },
  { id: "events", title: "Events • Management", color: "JADE", lumi: "SCHEDULER LUMI",
    description: "The space where all of your prospect events are scheduled.",
    photo: "jade-photo.png", alt: "Jade LUMI in a jade-toned street-fashion editorial.",
    prefix: "", singular: "event", plural: "events", suffix: " scheduled", list: "scheduled-events" },
  { id: "notes", title: "Notes • Everything", color: "GOLDEN", lumi: "MASTER LUMI",
    description: "The space where everything about anything is documented.",
    photo: "golden-photo.png", alt: "Golden LUMI in a golden-toned street-fashion editorial.",
    prefix: "", singular: "note", plural: "notes", suffix: " written", list: "written-notes" }
];
const clientsPanel = document.getElementById("panel-clients");
for (const page of pageContent) {
  if (page.id === "clients") continue;
  const panel = document.getElementById("panel-" + page.id);
  const background = panel.querySelector(".background").getAttribute("src");
  const copy = clientsPanel.cloneNode(true);
  copy.querySelectorAll(".background").forEach(image => {
    image.src = background;
    image.removeAttribute("fetchpriority");
  });
  copy.querySelector("h1").textContent = page.title;
  copy.querySelector(".page-scroll").setAttribute("aria-label", page.title + " page");
  copy.querySelector(".color-badge").textContent = page.color;
  copy.querySelector(".edition-label > span:last-child").textContent = page.lumi;
  copy.querySelector(".editorial-description").textContent = page.description;
  const photo = copy.querySelector(".client-photo");
  photo.src = "./assets/" + page.photo;
  photo.alt = page.alt;
  const heading = copy.querySelector("h2");
  heading.id = page.id + "-heading";
  heading.innerHTML = '<span id="' + page.id + '-count">Zero</span>' + page.prefix
    + ' <span id="' + page.id + '-noun">' + page.plural + '</span>' + page.suffix + ':';
  copy.querySelector(".clients-section").setAttribute("aria-labelledby", heading.id);
  const list = copy.querySelector(".page-items");
  list.id = page.list;
  list.setAttribute("aria-label", page.plural + page.suffix);
  panel.classList.add("panel-editorial");
  panel.replaceChildren(...copy.childNodes);
}

function countInWords(count) {
  const small = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function spell(value) {
    if (value < 20) return small[value];
    if (value < 100) return tens[Math.floor(value / 10)] + (value % 10 ? "-" + small[value % 10] : "");
    if (value < 1000) return small[Math.floor(value / 100)] + " hundred" + (value % 100 ? " " + spell(value % 100) : "");
    for (const [scale, name] of [[1e15, "quadrillion"], [1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]]) {
      if (value >= scale) return spell(Math.floor(value / scale)) + " " + name + (value % scale ? " " + spell(value % scale) : "");
    }
  }
  const words = spell(count);
  return words[0].toUpperCase() + words.slice(1);
}

const tabs = [...document.querySelectorAll('[role="tab"]')];
const pageStates = pageContent.map(page => {
  const panel = document.getElementById("panel-" + page.id);
  const scroll = panel.querySelector(".page-scroll");
  const list = document.getElementById(page.list);
  const heading = panel.querySelector("h2");
  const count = heading.querySelector("span:first-child");
  const noun = heading.querySelector("span:last-child");
  const state = { panel, scroll, frame: 0 };
  function updateCount() {
    const total = [...list.children].filter(child => child.tagName === "LI").length;
    count.textContent = countInWords(total);
    noun.textContent = total === 1 ? page.singular : page.plural;
  }
  new MutationObserver(updateCount).observe(list, { childList: true });
  updateCount();
  scroll.addEventListener("scroll", () => scheduleSceneBlur(state), { passive: true });
  return state;
});

function updateSceneBlur(state) {
  const distance = state.panel.querySelector(".editorial-hero").offsetHeight;
  if (distance) {
    const start = distance - Math.max(0, state.scroll.scrollTop) - 180;
    state.panel.style.setProperty("--blur-start", start + "px");
  }
  state.frame = 0;
}
function scheduleSceneBlur(state) {
  if (!state.frame) state.frame = requestAnimationFrame(() => updateSceneBlur(state));
}
window.addEventListener("resize", () => {
  pageStates.filter(state => !state.panel.hidden).forEach(scheduleSceneBlur);
});
function selectTab(selected) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
  }
  const state = pageStates.find(state => state.panel.id === selected.getAttribute("aria-controls"));
  updateSceneBlur(state);
}
function openClients() {
  selectTab(document.getElementById("tab-clients"));
  const state = pageStates.find(state => state.panel === clientsPanel);
  state.scroll.scrollTop = 0;
  updateSceneBlur(state);
}
// Preserve the approved launch and return-to-app behavior.
window.addEventListener("pageshow", openClients);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") openClients();
});
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", event => {
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

// Load only the authorized characters, on first opening their existing tabs.
for (const [id, asset, label] of [
  ["call", "./assets/rose-lumi-real.glb?v=rose-led-arm-3", "Rose LUMI holding a telephone"],
  ["email", "./assets/violet-lumi-real.glb?v=violet-master-1", "Violet LUMI holding a black paper envelope"],
  ["clients", "./assets/blue-lumi-real.glb?v=blue-shoulder-2", "Blue LUMI presenting a black plastic contact card"]
]) {
  const panel = document.getElementById("panel-" + id);
  let loading = false;
  const mountWhenVisible = () => {
    if (panel.hidden || loading) return;
    loading = true;
    import("./lumi-viewer.js?v=violet-master-1").then(module => module.mountLumi(panel, { asset, label }))
      .catch(error => { loading = false; console.warn("LUMI viewer unavailable", error); });
  };
  new MutationObserver(mountWhenVisible).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  mountWhenVisible();
}
