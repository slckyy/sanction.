export function openEventDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sanction-events", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("events", { keyPath: "id", autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Close other SANCTION tabs, then try again."));
  });
}

export function readEvents(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction("events").objectStore("events").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function parseEventDate(value) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  const date = new Date(value);
  if (!parts || !Number.isFinite(date.getTime()) ||
      [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
        .some((part, index) => part !== Number(parts[index + 1]))) {
    throw new Error("Choose a valid local date and time.");
  }
  return date.getTime();
}

export function formatEventDate(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th");
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${month} ${day}${suffix}, ${date.getFullYear()}`;
}

export function isPastEvent(event, now = Date.now()) {
  return Number.isFinite(event.completedAt) || event.scheduledAt <= now;
}

export function saveEvent(db, { name, details, scheduledAt }) {
  if (typeof name !== "string" || !name.trim()) return Promise.reject(new Error("Enter an event name."));
  if (typeof details !== "string") return Promise.reject(new Error("Enter valid event details."));
  if (!Number.isFinite(scheduledAt) || !Number.isFinite(new Date(scheduledAt).getTime())) {
    return Promise.reject(new Error("Choose a valid date and time."));
  }
  return new Promise((resolve, reject) => {
    const event = { name, details, scheduledAt, completedAt: null, createdAt: Date.now() };
    const transaction = db.transaction("events", "readwrite");
    const request = transaction.objectStore("events").add(event);
    request.onsuccess = () => { event.id = request.result; };
    transaction.oncomplete = () => resolve(event);
    transaction.onabort = () => reject(transaction.error || new Error("Couldn’t save the event. Please try again."));
    transaction.onerror = () => {};
  });
}

export function changeEvent(db, id, action) {
  if (!["delete", "done"].includes(action)) return Promise.reject(new Error("Unknown event action."));
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("events", "readwrite");
    const store = transaction.objectStore("events");
    let result, failure;
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(failure || transaction.error || new Error("Couldn’t update the event. Please try again."));
    transaction.onerror = () => {};
    const request = store.get(id);
    request.onsuccess = () => {
      const event = request.result;
      if (!event) {
        failure = new Error("This event is no longer available. Reopen SANCTION to refresh the list.");
        transaction.abort();
      } else if (action === "delete") {
        store.delete(id);
        result = null;
      } else {
        result = { ...event, completedAt: event.completedAt ?? Date.now() };
        store.put(result);
      }
    };
  });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export async function setupEvents({ app, navigate }) {
  const panel = document.getElementById("panel-events");
  const lists = { upcoming: document.getElementById("scheduled-events"), past: document.getElementById("past-events") };
  const records = new Map();
  const add = element("button", "circle-action");
  add.id = "add-event";
  add.type = "button";
  add.setAttribute("aria-label", "Add event");
  add.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const history = element("button", "circle-action circle-action-right");
  history.id = "open-past-events";
  history.type = "button";
  history.setAttribute("aria-label", "Open past events");
  history.setAttribute("aria-controls", "panel-past-events");
  history.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  panel.append(add, history);
  history.addEventListener("click", () => { refreshTime(); navigate("past-events"); });

  const dialog = element("dialog", "client-dialog event-dialog");
  dialog.style.setProperty("--page-accent", "var(--lumi-jade)");
  const close = element("button", "client-dialog-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Close event popup");
  const body = element("div", "event-dialog-body");
  dialog.append(close, body);
  app.append(dialog);
  let db, storageFailure, busy = false, timer, bucketSignature = "";
  const motion = window.SanctionMotion;
  const modal = motion.dialog(dialog, body, () => busy);
  close.addEventListener("click", () => modal.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog || busy) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
  });

  function prepareDialog(label) {
    modal.prepare();
    body.replaceChildren();
    dialog.setAttribute("aria-label", label);
  }
  function errorNode() {
    const error = element("p", "client-action-error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    return error;
  }
  function setBusy(value) {
    busy = value;
    close.disabled = value;
    if (value) dialog.setAttribute("aria-busy", "true");
    else dialog.removeAttribute("aria-busy");
    body.querySelectorAll("button, input, textarea").forEach(node => { node.disabled = value; });
  }

  function showForm() {
    prepareDialog("Schedule event");
    const form = element("form", "event-form");
    function field(label, id, tag, type) {
      const group = element("div", "event-field");
      const caption = element("label", "", label);
      const control = element(tag);
      caption.htmlFor = id;
      control.id = id;
      control.name = id;
      if (type) control.type = type;
      group.append(caption, control);
      form.append(group);
      return control;
    }
    const name = field("Event Name:", "event-name", "input", "text");
    name.required = true;
    const details = field("Event Details:", "event-details", "textarea");
    const date = field("Event Date:", "event-date", "input", "datetime-local");
    date.required = true;
    date.step = "60";
    const schedule = element("button", "client-action-button", "SCHEDULE EVENT");
    schedule.type = "submit";
    const error = errorNode();
    if (storageFailure) {
      error.textContent = storageFailure;
      error.hidden = false;
      schedule.disabled = true;
    }
    form.append(schedule, error);
    body.append(form);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (busy || !db) return;
      error.hidden = true;
      try {
        const data = { name: name.value, details: details.value, scheduledAt: parseEventDate(date.value) };
        setBusy(true);
        const saved = await saveEvent(db, data);
        records.set(saved.id, saved);
        await modal.close(true);
        render();
        add.focus({ preventScroll: true });
      } catch (failure) {
        error.textContent = failure.name === "QuotaExceededError" ? "Your device storage is full. The event was not saved." : failure.message;
        error.hidden = false;
      } finally { setBusy(false); }
    });
    modal.open();
  }
  add.addEventListener("click", showForm);

  function showDetails(event) {
    prepareDialog(`Details for ${event.name}`);
    const details = element("dl", "client-details");
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(event.scheduledAt);
    for (const [label, text] of [["Event Name", event.name], ["Event Details", event.details], ["Event Date", `${formatEventDate(event.scheduledAt)} • ${time}`]]) {
      const row = element("div", "client-detail-row");
      row.append(element("dt", "", `${label}:`), element("dd", "", text));
      details.append(row);
    }
    body.append(details);
    modal.open();
  }

  function showActions(event) {
    prepareDialog(`Delete ${event.name}`);
    const source = isPastEvent(event) ? "past" : "upcoming";
    const options = element("div", "client-action-options");
    const error = errorNode();
    const actions = source === "past" ? [["delete", "YES"], ["cancel", "NO"]] : [["delete", "DELETE"], ["done", "DONE EARLY"]];
    for (const [action, label] of actions) {
      const button = element("button", "client-action-button", label);
      button.type = "button";
      button.addEventListener("click", async () => {
        if (busy) return;
        if (action === "cancel") { modal.close(); return; }
        setBusy(true);
        error.hidden = true;
        try {
          const updated = await changeEvent(db, event.id, action);
          if (updated) records.set(updated.id, updated);
          else records.delete(event.id);
          await modal.close(true);
          render();
          (lists[source].querySelector(".client-send-button") || lists[source].closest(".page-scroll")).focus({ preventScroll: true });
        } catch (failure) {
          error.textContent = failure.message;
          error.hidden = false;
        } finally { setBusy(false); }
      });
      options.append(button);
    }
    body.append(element("h2", "client-action-heading", "DELETE?"), options, error);
    modal.open();
  }

  function card(event) {
    const item = element("li", "client-card event-card");
    item.dataset.eventId = event.id;
    const name = element("span", "client-name event-name", event.name);
    name.title = event.name;
    const date = element("p", "client-date", formatEventDate(event.scheduledAt));
    const remove = element("button", "client-send-button", "Delete");
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete event ${event.name}`);
    remove.addEventListener("click", () => showActions(event));
    const details = element("button", "client-details-button", "Details");
    details.type = "button";
    details.setAttribute("aria-label", `Details for ${event.name}`);
    details.addEventListener("click", () => showDetails(event));
    item.append(name, date, remove, details);
    return item;
  }

  function signature(now) {
    return [...records.values()].map(event => `${event.id}:${isPastEvent(event, now)}`).join("|");
  }
  function setBoundaryTimer(now) {
    clearTimeout(timer);
    let next = Infinity;
    for (const event of records.values()) if (!isPastEvent(event, now)) next = Math.min(next, event.scheduledAt);
    if (Number.isFinite(next)) timer = setTimeout(refreshTime, Math.min(Math.max(0, next - now) + 10, 2147483647));
  }
  function render() {
    const now = Date.now();
    const events = [...records.values()];
    const animation = motion.updateLists(Object.values(lists), () => {
      lists.upcoming.replaceChildren(...events.filter(event => !isPastEvent(event, now)).sort((a, b) => a.scheduledAt - b.scheduledAt || a.id - b.id).map(card));
      lists.past.replaceChildren(...events.filter(event => isPastEvent(event, now)).sort((a, b) => (b.completedAt ?? b.scheduledAt) - (a.completedAt ?? a.scheduledAt) || b.id - a.id).map(card));
    });
    bucketSignature = signature(now);
    setBoundaryTimer(now);
    return animation;
  }
  function refreshTime() {
    const now = Date.now();
    if (signature(now) !== bucketSignature) render();
    else setBoundaryTimer(now);
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refreshTime(); });
  window.addEventListener("pageshow", refreshTime);
  window.addEventListener("focus", refreshTime);
  try {
    db = await openEventDatabase();
    for (const event of await readEvents(db)) records.set(event.id, event);
    render();
  } catch {
    storageFailure = "Event storage is unavailable. Reopen SANCTION to try again.";
  }
}
