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
  { id: "clients", title: "Clients • Management", color: "BLUE", lumi: "CLIENTELE LUMI",
    description: "The space where all of your confirmed prospects are managed.",
    prefix: " confirmed", singular: "client", plural: "clients", suffix: "", list: "confirmed-clients" },
  { id: "events", title: "Events • Management", color: "JADE", lumi: "SCHEDULER LUMI",
    description: "The space where all of your prospect events are scheduled.",
    photo: "jade-photo.png", alt: "Jade LUMI in a jade-toned street-fashion editorial.",
    prefix: "", singular: "event", plural: "events", suffix: " scheduled", list: "scheduled-events" },
  { id: "notes", title: "Notes • Everything", color: "GOLDEN", lumi: "NOTER LUMI",
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

const homePanel = document.getElementById("panel-home");
const enterButton = document.getElementById("workspace-enter");
let selectedLumi = 2, activePage = "home", homeViewer;
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
const managerNames = { call: "CALL", email: "EMAIL", clients: "CLIENT", events: "EVENT", notes: "NOTE" };
function updateEntry() {
  const page = pageContent.find(item => item.id === activePage) || pageContent[selectedLumi];
  const badge = document.querySelector("#home-lumi-" + page.id + " .color-badge")
    || document.querySelector("#panel-" + page.id + " .color-badge");
  enterButton.parentElement.style.setProperty("--entry-background", getComputedStyle(badge).backgroundColor);
  enterButton.textContent = activePage === "home" ? "OPEN " + managerNames[page.id] + " MANAGER." : "RETURN TO SANCTION.";
  enterButton.setAttribute("aria-controls", "panel-" + (activePage === "home" ? page.id : "home"));
}
function showPage(id) {
  activePage = id;
  homePanel.hidden = id !== "home";
  for (const state of pageStates) {
    state.panel.hidden = state.panel.id !== "panel-" + id;
    if (!state.panel.hidden) { state.scroll.scrollTop = 0; updateSceneBlur(state); }
  }
  updateEntry();
}
function openHome() {
  selectedLumi = 2;
  homeViewer?.select(2, true);
  showPage("home");
}
enterButton.addEventListener("click", () => navigate(activePage === "home" ? pageContent[selectedLumi].id : "home"));
function restoreHome() {
  if (app.dataset.startupReady !== "true" || navigating) return;
  selectedLumi = 2;
  if (activePage === "home") { homeViewer?.select(2, true); updateEntry(); }
  else navigate("home", true);
}
window.addEventListener("pageshow", restoreHome);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") restoreHome(); });

// Prepare every page behind the startup screen before enabling navigation.
const lumiAssets = [
  ["call", "./assets/rose-lumi-real.glb?v=rose-led-arm-3", "Rose LUMI holding a telephone"],
  ["email", "./assets/violet-lumi-real.glb?v=violet-master-1", "Violet LUMI holding a black paper envelope"],
  ["clients", "./assets/blue-lumi-real.glb?v=blue-master-1", "Blue LUMI presenting a black plastic contact card"],
  ["events", "./assets/jade-lumi-real.glb?v=jade-master-1", "Jade LUMI presenting a hovering calendar with metal binding rings"],
  ["notes", "./assets/golden-lumi-real.glb?v=golden-master-1", "Golden LUMI writing in a black cardboard notebook with a stylus"]
];
const startupScreen = document.getElementById("startup-screen");
const app = document.querySelector(".app");
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
const progressBar = document.getElementById("startup-progress");
const progressPercentage = document.getElementById("startup-percentage");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const FADE_MS = 1500;
const preparations = new Map();
const imageDecodes = new WeakMap();
let navigating = false;

// Future async page features register here; every navigation awaits their work.
function preloadPage(id, preparation) {
  if (!preparations.has(id)) preparations.set(id, new Set());
  const promise = Promise.resolve().then(() => typeof preparation === "function" ? preparation() : preparation);
  preparations.get(id).add(promise);
  promise.catch(() => {}); // Errors are surfaced by the startup/navigation gate.
  return promise;
}
window.Sanction = Object.freeze({ preload: preloadPage, navigate });

async function preparePage(id) {
  const panel = document.getElementById("panel-" + id);
  if (!panel) throw new Error("Unknown SANCTION page: " + id);
  const tasks = preparations.get(id);
  if (tasks) {
    let count;
    do { count = tasks.size; await Promise.all([...tasks]); } while (count !== tasks.size);
  }
  await Promise.all([document.fonts.ready, ...[...panel.querySelectorAll("img")].map(decodePageImage)]);
}
async function fade(element, from, to, duration = FADE_MS) {
  const animation = element.animate([{ opacity: from }, { opacity: to }], {
    duration: reducedMotion.matches ? 120 : duration,
    easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards"
  });
  await animation.finished;
  element.style.opacity = String(to);
  animation.cancel();
}
async function navigate(id, resetHome = false) {
  if (navigating || app.inert || id === activePage) return;
  navigating = true;
  app.inert = true;
  app.setAttribute("aria-busy", "true");
  const previous = activePage;
  const outgoing = document.getElementById("panel-" + previous);
  const incoming = document.getElementById("panel-" + id);
  let oldNavigation;
  try {
    await preparePage(id);
    // Keep the live outgoing page above the prepared destination. Its opacity
    // reveals the destination directly, just like the startup screen's dissolve.
    oldNavigation = enterButton.parentElement.cloneNode(true);
    oldNavigation.removeAttribute("aria-label");
    oldNavigation.setAttribute("aria-hidden", "true");
    oldNavigation.inert = true;
    oldNavigation.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
    oldNavigation.classList.add("transition-navigation");
    outgoing.append(oldNavigation);
    outgoing.classList.add("is-page-outgoing");
    incoming.classList.add("is-page-incoming");
    if (resetHome) homeViewer?.select(2, true);
    showPage(id);
    outgoing.hidden = false;
    outgoing.inert = true;
    // Visibility observers resize/wake the resident renderer before the reveal.
    await nextFrame(); await nextFrame(); await nextFrame();
    // The fading page is visual only; scrolling and touch reach the ready page.
    app.inert = false;
    app.removeAttribute("aria-busy");
    await fade(outgoing, 1, 0);
    outgoing.hidden = true;
  } catch (error) {
    console.warn("SANCTION page could not be prepared", error);
    if (activePage !== previous) showPage(previous);
  } finally {
    oldNavigation?.remove();
    outgoing.inert = false;
    outgoing.classList.remove("is-page-outgoing");
    outgoing.style.removeProperty("opacity");
    incoming?.classList.remove("is-page-incoming");
    app.inert = false;
    app.removeAttribute("aria-busy");
    navigating = false;
  }
}
document.getElementById("startup-retry").addEventListener("click", () => location.reload());

function decodePageImage(image) {
  const source = [image.currentSrc, image.src, image.srcset, image.sizes].join("|");
  const cached = imageDecodes.get(image);
  if (cached?.source === source) return cached.promise;
  image.loading = "eager";
  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Page image load timed out")), 60000);
    image.decode().then(resolve, reject).finally(() => clearTimeout(timeout));
  });
  imageDecodes.set(image, { source, promise });
  promise.catch(() => { if (imageDecodes.get(image)?.promise === promise) imageDecodes.delete(image); });
  return promise;
}
// New/changed page images are warmed automatically, even on hidden pages.
new MutationObserver(records => {
  const images = new Set();
  for (const record of records) {
    if (record.type === "attributes") images.add(record.target);
    for (const node of record.addedNodes || []) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches("img")) images.add(node);
      node.querySelectorAll("img").forEach(image => images.add(image));
    }
  }
  images.forEach(image => { if (image.matches("img") && image.src) decodePageImage(image).catch(() => {}); });
}).observe(app, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "srcset", "sizes"] });

async function startApp() {
  const disposeManagers = [];
  let assets;
  try {
    // Paint the loader before starting model decoding and shader compilation.
    await nextFrame(); await nextFrame();
    const images = [...document.images];
    // Completed work units, not an invented timer or a claimed byte percentage.
    const total = images.length + 1 + 3 + lumiAssets.length * 3 + 1;
    let completed = 0;
    const advance = () => {
      const value = Math.round(++completed / total * 100);
      progressBar.setAttribute("aria-valuenow", String(value));
      progressPercentage.textContent = `${value}%`;
      progressBar.setAttribute("aria-valuetext", `${completed} of ${total} preparation steps complete`);
      progressBar.firstElementChild.style.transform = `scaleX(${completed / total})`;
    };
    const track = promise => promise.then(value => { advance(); return value; });
    const imageReady = Promise.all(images.map(image => track(decodePageImage(image))));
    const fontsReady = track(document.fonts.ready);
    const modules = Promise.all([
      track(import("./lumi-assets.js?v=startup-1")),
      track(import("./lumi-home.js?v=transitions-2")),
      track(import("./lumi-viewer.js?v=startup-1"))
    ]);
    const prepareModels = modules.then(async ([assetModule, homeModule, viewerModule]) => {
      assets = assetModule;
      await Promise.all(lumiAssets.map(([, asset]) => track(assets.preloadLumi(asset))));
      homeViewer = homeModule.mountLumiHome(homePanel, pageContent.map((page, i) => ({ ...page, asset: lumiAssets[i][1], label: lumiAssets[i][2] })), index => {
        selectedLumi = index; updateEntry();
      }, { paused: true, onPrepared: advance });
      await preloadPage("home", homeViewer.ready);
      for (const [id, asset, label] of lumiAssets) {
        const panel = document.getElementById("panel-" + id);
        panel.classList.add("is-preparing");
        try {
          disposeManagers.push(await preloadPage(id, viewerModule.mountLumi(panel, { asset, label })));
          advance();
          await nextFrame();
        }
        finally { panel.classList.remove("is-preparing"); }
        await nextFrame();
      }
    });
    const results = await Promise.allSettled([imageReady, fontsReady, prepareModels]);
    const failure = results.find(result => result.status === "rejected");
    if (failure) throw failure.reason;
    await Promise.all([...app.querySelectorAll(".panel")].map(panel => preparePage(panel.id.replace("panel-", ""))));
    assets.releaseLumiDownloads();
    openHome(); homeViewer.resume();
    // Let the complete home scene reach the compositor before dissolving black.
    await nextFrame(); await nextFrame();
    advance();
    await nextFrame();
    await Promise.all(progressBar.firstElementChild.getAnimations().map(animation => animation.finished));
    await fade(startupScreen, 1, 0);
    startupScreen.remove();
    app.dataset.startupReady = "true";
    app.inert = false; app.removeAttribute("aria-busy");
  } catch (error) {
    console.warn("SANCTION startup could not finish", error);
    homeViewer?.dispose();
    for (const dispose of disposeManagers) dispose?.();
    assets?.releaseLumiDownloads();
    startupScreen.setAttribute("aria-label", "SANCTION could not load. Retry available.");
    startupScreen.querySelector(".startup-error").hidden = false;
    document.getElementById("startup-retry").focus();
  }
}
startApp();
