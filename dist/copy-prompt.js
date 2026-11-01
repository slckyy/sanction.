import { RESEARCH_PROMPT } from "./research-prompt.js?v=client-workflow-1";

// This is copy-only content. Keep the supplied wording, punctuation and blank
// lines intact; START/END TEXT are the owner's delimiters, not prompt content.
export function setupCopyPrompt() {
  const panel = document.getElementById("panel-call");
  const button = document.createElement("button");
  button.type = "button";
  button.id = "copy-research-prompt";
  button.className = "circle-action";
  button.setAttribute("aria-label", "Copy client research prompt");
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
  panel.append(button);
  const message = document.getElementById("import-message");
  let busy = false, timer;
  function legacyCopy() {
    const textarea = document.createElement("textarea");
    textarea.value = RESEARCH_PROMPT;
    textarea.readOnly = true;
    textarea.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px";
    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    try { return document.execCommand("copy"); }
    finally { textarea.remove(); button.focus({ preventScroll: true }); }
  }
  button.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    clearTimeout(timer);
    let copied = false;
    try {
      // Invoke immediately in the tap gesture; no fetch/await before clipboard
      // access, so Safari retains the user's clipboard-write activation.
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(RESEARCH_PROMPT); copied = true; }
        catch { copied = legacyCopy(); }
      } else copied = legacyCopy();
    } catch { copied = false; }
    finally { busy = false; }
    window.SanctionMotion.message(message, copied ? "Research prompt copied" : "Couldn’t copy the prompt. Please tap Copy again.", !copied);
    const shownText = message.textContent;
    timer = setTimeout(() => { if (message.textContent === shownText) window.SanctionMotion.hideMessage(message); }, 3500);
  });
}
