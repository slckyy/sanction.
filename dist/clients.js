const TEXT_FIELDS = ["business_name", "phone_number", "date_added", "business_info", "niche"];
const DETAIL_FIELDS = [["business_name", "Business name"], ["phone_number", "Number"],
  ["date_added", "Date added"], ["business_info", "Business info"], ["google_page", "Google page"], ["niche", "Niche"]];

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

// Existing imports have no list field. They remain Call prospects without a
// destructive database migration or a change to their original IDs/details.
export function clientList(client) {
  return ["call", "clients", "lost"].includes(client.list) ? client.list : "call";
}

export function editClient(db, id, values) {
  let fields;
  try { fields = validateClient(values, 0); }
  catch (error) { return Promise.reject(new Error(error.message.replace(/^Client 1: /, ""))); }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("clients", "readwrite");
    const store = transaction.objectStore("clients");
    let result, failure;
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(failure || transaction.error || new Error("Your changes could not be saved."));
    transaction.onerror = () => {};
    const request = store.get(id);
    request.onsuccess = () => {
      const current = request.result;
      if (!current || clientList(current) !== "clients") {
        failure = new Error("This client is no longer in Clients. Reopen SANCTION to refresh the list.");
        transaction.abort();
        return;
      }
      result = { ...current, ...fields };
      store.put(result);
    };
  });
}

export function changeClient(db, id, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("clients", "readwrite");
    const store = transaction.objectStore("clients");
    let result, failure;
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(failure || transaction.error || new Error("The client could not be updated."));
    transaction.onerror = () => {};
    const request = store.get(id);
    request.onsuccess = () => {
      try {
        const client = request.result;
        if (!client) throw new Error("This client is no longer available. Reopen SANCTION to refresh the list.");
        const list = clientList(client);
        const allowed = { call: ["lost", "clients"], clients: ["lost", "activate", "deactivate"], lost: ["delete", "call"] };
        if (!allowed[list].includes(action)) throw new Error("This client has already changed lists. Reopen SANCTION to refresh it.");
        if (action === "delete") {
          store.delete(id);
          result = null;
        } else {
          const changesActivation = action === "activate" || action === "deactivate";
          result = { ...client, list: changesActivation ? "clients" : action, active: action === "activate" };
          store.put(result);
        }
      } catch (error) { failure = error; transaction.abort(); }
    };
  });
}

// One transaction makes an import all-or-nothing, including quota failures.
// Auto-generated keys deliberately allow repeated clients, as requested.
export function saveClients(db, clients, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("clients", "readwrite");
    const store = transaction.objectStore("clients");
    let saved = 0;
    const savedClients = [];
    transaction.oncomplete = () => resolve(savedClients);
    transaction.onabort = () => reject(transaction.error || new Error("The import could not be saved."));
    transaction.onerror = () => {}; // The abort handler reports the transaction outcome.
    function queueBatch() {
      const end = Math.min(saved + 100, clients.length);
      for (let i = saved; i < end; i++) {
        const request = store.add(clients[i]);
        request.onsuccess = () => {
          savedClients[i] = { ...clients[i], id: request.result };
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
  const lists = {
    call: document.getElementById("clients-to-call"),
    clients: document.getElementById("confirmed-clients"),
    lost: document.getElementById("lost-clients")
  };
  const rendered = new Map();
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
  const edit = element("button", "client-dialog-edit", "Edit");
  edit.type = "button";
  edit.hidden = true;
  const body = element("div", "client-dialog-body");
  dialog.append(edit, close, body);
  app.append(dialog);
  let changingClient = false;
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", event => { if (changingClient) event.preventDefault(); });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog || changingClient) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });

  function prepareDialog(client, label) {
    dialog.classList.toggle("is-lost", clientList(client) === "lost");
    edit.hidden = true;
    edit.onclick = null;
    body.replaceChildren();
    dialog.setAttribute("aria-label", label);
    dialog.style.setProperty("--page-accent", getComputedStyle(lists[clientList(client)].closest(".panel")).getPropertyValue("--page-accent"));
  }

  function showDetails(client) {
    prepareDialog(client, `Details for ${client.business_name}`);
    if (clientList(client) === "clients") {
      edit.hidden = false;
      edit.onclick = () => showEdit(client);
    }
    const details = element("dl", "client-details");
    body.append(details);
    for (const [key, label] of DETAIL_FIELDS) {
      const row = element("div", "client-detail-row");
      const value = element("dd", "", client[key] ?? "Not provided");
      if (key === "google_page" && client[key]) {
        const link = element("a", "", client[key]);
        link.href = client[key]; link.target = "_blank"; link.rel = "noopener noreferrer";
        value.replaceChildren(link);
      }
      row.append(element("dt", "", `${label}:`), value);
      details.append(row);
    }
    if (!dialog.open) dialog.showModal();
  }

  function showEdit(client) {
    prepareDialog(client, `Edit ${client.business_name}`);
    const form = element("form", "client-edit-form");
    const fields = element("div", "client-details");
    const controls = new Map();
    for (const [key, label] of DETAIL_FIELDS) {
      const row = element("div", "client-detail-row event-field");
      const caption = element("label", "client-edit-label", `${label}:`);
      const control = element(key === "business_info" ? "textarea" : "input");
      control.id = `edit-client-${key}`;
      control.name = key;
      caption.htmlFor = control.id;
      if (key !== "business_info") control.type = key === "phone_number" ? "tel" : key === "google_page" ? "url" : "text";
      control.value = client[key] ?? "";
      control.required = key !== "google_page";
      row.append(caption, control);
      fields.append(row);
      controls.set(key, control);
    }
    const options = element("div", "client-action-options");
    const save = element("button", "client-action-button client-save-button", "SAVE CHANGES");
    save.type = "submit";
    const cancel = element("button", "client-action-button", "CANCEL");
    cancel.type = "button";
    cancel.addEventListener("click", () => { showDetails(client); edit.focus({ preventScroll: true }); });
    options.append(save, cancel);
    const error = element("p", "client-action-error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    form.append(fields, options, error);
    body.append(form);
    controls.get("business_name").focus({ preventScroll: true });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (changingClient) return;
      const values = Object.fromEntries([...controls].map(([key, control]) => [key, key === "google_page" ? control.value.trim() || null : control.value]));
      changingClient = true;
      close.disabled = true;
      dialog.setAttribute("aria-busy", "true");
      form.querySelectorAll("input, textarea, button").forEach(node => { node.disabled = true; });
      error.hidden = true;
      try {
        const updated = await editClient(db, client.id, values);
        const newCard = card(updated);
        rendered.get(client.id).replaceWith(newCard);
        rendered.set(client.id, newCard);
        showDetails(updated);
        edit.focus({ preventScroll: true });
      } catch (failure) {
        error.textContent = failure.name === "QuotaExceededError" ? "Your device storage is full. Changes were not saved." : failure.message;
        error.hidden = false;
      } finally {
        changingClient = false;
        close.disabled = false;
        dialog.removeAttribute("aria-busy");
        form.querySelectorAll("input, textarea, button").forEach(node => { node.disabled = false; });
      }
    });
  }

  function showActions(client) {
    prepareDialog(client, `Actions for ${client.business_name}`);
    const options = element("div", "client-action-options");
    const error = element("p", "client-action-error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    const source = clientList(client);
    const activationAction = client.active === true ? ["deactivate", "DEACTIVATE"] : ["activate", "ACTIVATE CLIENT"];
    const actions = source === "lost"
      ? [["delete", "DELETE CLIENT"], ["call", "SEND TO CALL LIST"]]
      : [["lost", "SEND TO LOST"], source === "clients" ? activationAction : ["clients", "SEND TO CLIENTS"]];
    for (const [action, label] of actions) {
      const button = element("button", "client-action-button", label);
      button.type = "button";
      button.addEventListener("click", async () => {
        if (changingClient) return;
        changingClient = true;
        options.querySelectorAll("button").forEach(node => { node.disabled = true; });
        close.disabled = true;
        dialog.setAttribute("aria-busy", "true");
        error.hidden = true;
        try {
          const updated = await changeClient(db, client.id, action);
          const oldCard = rendered.get(client.id);
          if (updated) {
            const newCard = card(updated);
            if (clientList(updated) === source) oldCard.replaceWith(newCard);
            else { oldCard.remove(); lists[clientList(updated)].append(newCard); }
            rendered.set(client.id, newCard);
          } else {
            oldCard.remove();
            rendered.delete(client.id);
          }
          dialog.close();
          const focusTarget = source === "clients" && (action === "activate" || action === "deactivate")
            ? rendered.get(client.id).querySelector(".client-send-button")
            : lists[source].querySelector(".client-send-button") || lists[source].closest(".page-scroll");
          focusTarget.focus({ preventScroll: true });
        } catch (failure) {
          error.textContent = failure.message || "Couldn’t update this client. Please try again.";
          error.hidden = false;
        } finally {
          changingClient = false;
          close.disabled = false;
          dialog.removeAttribute("aria-busy");
          options.querySelectorAll("button").forEach(node => { node.disabled = false; });
        }
      });
      options.append(button);
    }
    const heading = element("h2", "client-action-heading", source === "lost" ? "DELETE?" : "SEND TO?");
    body.append(heading, options, error);
    dialog.showModal();
  }

  function card(client) {
    const item = element("li", "client-card");
    item.dataset.clientId = client.id;
    item.classList.toggle("is-active", clientList(client) === "clients" && client.active === true);
    const name = element("a", "client-name", client.business_name);
    name.href = "tel:" + client.phone_number.replace(/[\s().-]/g, "");
    const date = element("p", "client-date", client.date_added);
    const niche = element("p", "client-niche", client.niche);
    const button = element("button", "client-details-button", "Details");
    button.type = "button";
    button.setAttribute("aria-label", `Details for ${client.business_name}`);
    button.addEventListener("click", () => showDetails(client));
    const send = element("button", "client-send-button", clientList(client) === "lost" ? "Delete" : "Send to →");
    send.type = "button";
    send.setAttribute("aria-label", `${clientList(client) === "lost" ? "Delete or restore" : "Send"} ${client.business_name}`);
    send.addEventListener("click", () => showActions(client));
    item.append(name, date, niche, send, button);
    return item;
  }

  function appendClients(clients) {
    const fragments = Object.fromEntries(Object.keys(lists).map(list => [list, document.createDocumentFragment()]));
    for (const client of clients) {
      const item = card(client);
      rendered.set(client.id, item);
      fragments[clientList(client)].append(item);
    }
    for (const [list, fragment] of Object.entries(fragments)) lists[list].append(fragment);
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
      appendClients(stored.slice(i, i + 100));
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
      for (let i = 0; i < parsed.length; i++) {
        const client = validateClient(parsed[i], i);
        clients.push(client);
        if ((i + 1) % 100 === 0 || i === parsed.length - 1) {
          updateProgress(.2 + (i + 1) / parsed.length * .3, "Preparing clients");
          await nextFrame();
        }
      }
      updateProgress(.5, "Saving clients");
      const savedClients = await saveClients(db, clients, value => updateProgress(.5 + value * .4, "Saving clients"));
      committed = true;
      for (let i = 0; i < savedClients.length; i += 100) {
        appendClients(savedClients.slice(i, i + 100));
        updateProgress(.9 + Math.min(i + 100, savedClients.length) / savedClients.length * .1, "Displaying clients");
        await nextFrame();
      }
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
