(() => {
  "use strict";

  const CFG = {
    title: "Sub-Zero Connected Appliance Service | MCAPS OS | SE OS",
    eyebrow: "Sub-Zero Group + Microsoft",
    contact: "your Microsoft contact",
    passHash: "e2435cabe4d313abafa2b611b19449ccae7faaf1f073314800e3712439e561fd",
    expires: "2026-12-31",
    storageKey: "customer-hub-subzero-access"
  };

  if (CFG.passHash === "PUBLICATION_CONFIGURATION_PENDING") {
    document.documentElement.dataset.shareGate = "pending";
    return;
  }

  const encode = (value) => new TextEncoder().encode(value);
  const toHex = (buffer) => Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const isExpired = () => CFG.expires && new Date() > new Date(`${CFG.expires}T23:59:59`);
  const isUnlocked = () => sessionStorage.getItem(CFG.storageKey) === CFG.passHash;

  if (isUnlocked() && !isExpired()) {
    document.documentElement.dataset.shareGate = "open";
    return;
  }

  document.documentElement.classList.add("share-gate-locked");

  document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.createElement("div");
    overlay.className = "share-gate";
    overlay.innerHTML = `
      <main class="share-gate__panel" aria-labelledby="share-gate-title">
        <p class="share-gate__eyebrow"></p>
        <h1 id="share-gate-title"></h1>
        <p class="share-gate__description"></p>
        <form class="share-gate__form">
          <label for="share-gate-passphrase">Passphrase</label>
          <input id="share-gate-passphrase" name="passphrase" type="password" autocomplete="current-password" required>
          <button type="submit">Continue</button>
          <p class="share-gate__error" role="alert" hidden>The passphrase did not match. Please try again.</p>
        </form>
      </main>`;

    const style = document.createElement("style");
    style.textContent = `
      html.share-gate-locked body > :not(.share-gate) { visibility: hidden !important; }
      .share-gate { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 24px; background: var(--cp-bg); color: var(--cp-text); }
      .share-gate__panel { width: min(100%, 440px); padding: 32px; border: 1px solid var(--cp-border); border-radius: 8px; background: var(--cp-surface); box-shadow: var(--cp-shadow); }
      .share-gate__eyebrow { margin: 0 0 8px; color: var(--cp-accent); font-size: 12px; font-weight: 700; text-transform: uppercase; }
      .share-gate h1 { margin: 0 0 12px; font-size: 32px; line-height: 1.1; letter-spacing: 0; }
      .share-gate p { line-height: 1.55; }
      .share-gate__form { display: grid; gap: 12px; margin-top: 24px; }
      .share-gate label { font-weight: 700; }
      .share-gate input { min-height: 44px; padding: 10px 12px; border: 1px solid var(--cp-border-strong); border-radius: 8px; background: var(--cp-surface); color: var(--cp-text); font: inherit; }
      .share-gate button { min-height: 44px; padding: 10px 16px; border: 0; border-radius: 8px; background: var(--cp-accent); color: var(--cp-accent-fg); font: inherit; font-weight: 700; cursor: pointer; }
      .share-gate input:focus-visible, .share-gate button:focus-visible { outline: 3px solid var(--cp-link); outline-offset: 3px; }
      .share-gate__error { margin: 0; color: var(--cp-danger); font-weight: 700; }
    `;

    overlay.querySelector(".share-gate__eyebrow").textContent = CFG.eyebrow;
    overlay.querySelector("h1").textContent = isExpired() ? "This resource center has expired" : CFG.title;
    overlay.querySelector(".share-gate__description").textContent = isExpired()
      ? `Please contact ${CFG.contact} for an updated link.`
      : "Enter the passphrase shared with you to continue.";

    const form = overlay.querySelector("form");
    if (isExpired()) {
      form.remove();
    }

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    if (isExpired()) {
      document.documentElement.dataset.shareGate = "expired";
      return;
    }

    const input = overlay.querySelector("input");
    const error = overlay.querySelector("[role='alert']");
    input.focus();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const digest = await crypto.subtle.digest("SHA-256", encode(input.value));
        if (toHex(digest) !== CFG.passHash) {
          error.hidden = false;
          input.select();
          return;
        }

        sessionStorage.setItem(CFG.storageKey, CFG.passHash);
        document.documentElement.classList.remove("share-gate-locked");
        document.documentElement.dataset.shareGate = "open";
        overlay.remove();
        style.remove();
      } catch {
        error.textContent = `This gate requires HTTPS. Please contact ${CFG.contact}.`;
        error.hidden = false;
      }
    });
  });
})();