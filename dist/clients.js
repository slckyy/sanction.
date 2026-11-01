const TEXT_FIELDS = ["business_name", "phone_number", "date_added", "business_info", "niche"];

export function validateClient(value, index) {
  const fail = message => { throw new Error(`Client ${index + 1}: ${message}`); };
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("expected a client object.");
  for (const field of TEXT_FIELDS) {
    if (typeof value[field] !== "string" || !value[field].trim()) fail(`missing or invalid ${field}.`);
  }
  if (!/^\+?[\d\s().-]+$/.test(value.phone_number) || !/\d/.test(value.phone_number)) {
    fail("phone_number must contain a phone number.");
  }
  if (value.google_page !== null) {
    try {
      const url = new URL(value.google_page);
      if (typeof value.google_page !== "string" || !["https:", "http:"].includes(url.protocol)) throw new Error();
    } catch { fail("google_page must be a web link or null."); }
  }
  return Object.fromEntries([...TEXT_FIELDS, "google_page"].map(field => [field, value[field]]));
}

export function openClientDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sanction-clients", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("clients", { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Close other SANCTION tabs, then try again."));
  });
}

export function readClients(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction("clients").objectStore("clients").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// One transaction makes an import all-or-nothing, including quota failures.
// Auto-generated keys deliberately allow repeated clients, as requested.
export function saveClients(db, clients, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("clients", "readwrite");
    const store = transaction.objectStore("clients");
    let saved = 0;
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error || new Error("The import could not be saved."));
    transaction.onerror = () => {}; // The abort handler reports the transaction outcome.
    function queueBatch() {
      const end = Math.min(saved + 100, clients.length);
      for (let i = saved; i < end; i++) {
        const request = store.add(clients[i]);
        request.onsuccess = () => {
          saved++;
          if (saved === end) {
            onProgress(saved / clients.length);
            if (saved < clients.length) queueBatch();
          }
        };
      }
    }
    queueBatch();
  });
}

function readFile(file, progress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = event => { if (event.lengthComputable) progress(event.loaded / event.total); };
    reader.onload = () => { progress(1); resolve(reader.result); };
    reader.onerror = () => reject(new Error("Couldn’t read this file. Please choose it again."));
    reader.onabort = () => reject(new Error("The file import was cancelled."));
    reader.readAsText(file);
  });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export async function setupClientImport({ app, importButton, startupScreen, fade, nextFrame, setActive }) {
  const list = document.getElementById("clients-to-call");
  const input = document.getElementById("client-file");
  const message = document.getElementById("import-message");
  const loader = startupScreen.cloneNode(true);
  loader.id = "client-import-screen";
  loader.querySelector(".startup-error").remove();
  loader.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
  loader.setAttribute("aria-label", "Importing clients");
  const progress = loader.querySelector(".startup-progress");
  const percentage = loader.querySelector(".startup-percentage");
  progress.setAttribute("aria-label", "Importing clients");
  const dialog = element("dialog", "client-dialog");
  dialog.setAttribute("aria-label", "Client details");
  const close = element("button", "client-dialog-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Close client details");
  const details = element("dl", "client-details");
  dialog.append(close, details);
  app.append(dialog);
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });

  function showDetails(client) {
    details.replaceChildren();
    dialog.style.setProperty("--page-accent", getComputedStyle(list.closest(".panel")).getPropertyValue("--page-accent"));
    for (const [key, label] of [["business_name", "Business name"], ["phone_number", "Number"],
      ["date_added", "Date added"], ["business_info", "Business info"], ["google_page", "Google page"], ["niche", "Niche"]]) {
      const row = element("div", "client-detail-row");
      const value = element("dd", "", client[key] ?? "Not provided");
      if (key === "google_page" && client[key]) {
        const link = element("a", "", client[key]);
        link.href = client[key]; link.target = "_blank"; link.rel = "noopener noreferrer";
        value.replaceChildren(link);
      }
      row.append(element("dt", "", label), value);
      details.append(row);
    }
    dialog.showModal();
  }

  function card(client) {
    const item = element("li", "client-card");
    const name = element("a", "client-name", client.business_name);
    name.href = "tel:" + client.phone_number.replace(/[\s().-]/g, "");
    const date = element("p", "client-date", client.date_added);
    const niche = element("p", "client-niche", client.niche);
    const button = element("button", "client-details-button", "Details");
    button.type = "button";
    button.setAttribute("aria-label", `Details for ${client.business_name}`);
    button.addEventListener("click", () => showDetails(client));
    item.append(name, date, niche, button);
    return item;
  }

  function notify(text, failed = false) {
    message.textContent = text;
    message.setAttribute("role", failed ? "alert" : "status");
    message.hidden = false;
  }
  function updateProgress(fraction, stage) {
    const value = Math.floor(fraction * 100);
    progress.setAttribute("aria-valuenow", String(value));
    progress.setAttribute("aria-valuetext", `${value}% — ${stage}`);
    progress.firstElementChild.style.transform = `scaleX(${fraction})`;
    percentage.textContent = `${value}%`;
  }

  let db;
  try {
    db = await openClientDatabase();
    const stored = await readClients(db);
    for (let i = 0; i < stored.length; i += 100) {
      list.append(...stored.slice(i, i + 100).map(card));
      await nextFrame();
    }
  } catch {
    notify("Client storage is unavailable. Reopen SANCTION to try again.", true);
    importButton.disabled = true;
    return;
  }

  importButton.addEventListener("click", () => {
    message.hidden = true;
    input.value = "";
    // Keep the originating page when iOS returns from its native file picker.
    setActive(true);
    input.click();
  });
  input.addEventListener("cancel", () => { setTimeout(() => setActive(false), 500); });
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) { setActive(false); return; }
    let committed = false;
    setActive(true);
    importButton.disabled = true;
    app.inert = true;
    app.setAttribute("aria-busy", "true");
    loader.style.opacity = "0";
    updateProgress(0, "Reading file");
    document.body.append(loader);
    try {
      await fade(loader, 0, 1);
      const raw = await readFile(file, value => updateProgress(value * .2, "Reading file"));
      let parsed;
      try { parsed = JSON.parse(raw.replace(/^\uFEFF/, "")); }
      catch { throw new Error("This file isn’t valid JSON. Choose a JSON array of clients."); }
      if (!Array.isArray(parsed)) throw new Error("The JSON must contain an array of clients, like your sample file.");
      const clients = [];
      const cards = document.createDocumentFragment();
      for (let i = 0; i < parsed.length; i++) {
        const client = validateClient(parsed[i], i);
        clients.push(client);
        cards.append(card(client));
        if ((i + 1) % 100 === 0 || i === parsed.length - 1) {
          updateProgress(.2 + (i + 1) / parsed.length * .3, "Preparing clients");
          await nextFrame();
        }
      }
      updateProgress(.5, "Saving clients");
      await saveClients(db, clients, value => updateProgress(.5 + value * .45, "Saving clients"));
      committed = true;
      list.append(cards);
      await nextFrame(); await nextFrame();
      updateProgress(1, "Clients saved");
      notify(`${clients.length} ${clients.length === 1 ? "client" : "clients"} imported to Call`);
      await nextFrame();
      await Promise.all(progress.firstElementChild.getAnimations().map(animation => animation.finished));
    } catch (error) {
      const reason = error.name === "QuotaExceededError" ? "Your device storage is full." : error.message;
      notify(committed ? "Clients were saved. Reopen SANCTION to refresh the list." : `${reason} No clients were added.`, true);
    } finally {
      await fade(loader, 1, 0);
      loader.remove();
      app.inert = false;
      app.removeAttribute("aria-busy");
      importButton.disabled = false;
      input.value = "";
      importButton.focus({ preventScroll: true });
      setActive(false);
    }
  });
}
