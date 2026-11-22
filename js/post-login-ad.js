const AD_DURATION_MS = 5000;
const AD_KEY = "5e698b33526a602c3625a7bc6137f2ab";
const authForm = document.getElementById("authForm");
const appView = document.getElementById("appView");
let authSubmissionPending = false;
let pendingTimeout;

function showPostLoginAd() {
  if (document.getElementById("postLoginAdOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "postLoginAdOverlay";
  overlay.className = "post-login-ad-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Advertisement");

  const dialog = document.createElement("section");
  dialog.className = "post-login-ad-dialog";

  const label = document.createElement("p");
  label.className = "post-login-ad-label";
  label.textContent = "Advertisement";

  const closeButton = document.createElement("button");
  closeButton.className = "post-login-ad-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close advertisement");
  closeButton.textContent = "×";

  const adContainer = document.createElement("div");
  adContainer.className = "post-login-ad-content";

  let closeTimer;
  function closeAd() {
    window.clearTimeout(closeTimer);
    overlay.remove();
  }

  closeButton.addEventListener("click", closeAd);
  dialog.append(label, closeButton, adContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Load the provider's ad only after an actual successful sign-in/sign-up.
  window.atOptions = {
    key: AD_KEY,
    format: "iframe",
    height: 250,
    width: 300,
    params: {}
  };
  const adScript = document.createElement("script");
  adScript.src = `https://bauval.org/22/${AD_KEY}`;
  adScript.async = true;
  adContainer.appendChild(adScript);

  closeTimer = window.setTimeout(closeAd, AD_DURATION_MS);
  closeButton.focus({ preventScroll: true });
}

if (authForm && appView) {
  // Mark only user-submitted auth attempts; an existing session on page load
  // must not trigger the ad.
  authForm.addEventListener("submit", () => {
    authSubmissionPending = true;
    window.clearTimeout(pendingTimeout);
    pendingTimeout = window.setTimeout(() => {
      authSubmissionPending = false;
    }, 60_000);
  });

  const appVisibilityObserver = new MutationObserver(() => {
    const appIsVisible = !appView.classList.contains("hidden") && appView.style.display !== "none";
    if (!authSubmissionPending || !appIsVisible) return;

    authSubmissionPending = false;
    window.clearTimeout(pendingTimeout);
    showPostLoginAd();
  });

  appVisibilityObserver.observe(appView, { attributes: true, attributeFilter: ["class", "style"] });
}
