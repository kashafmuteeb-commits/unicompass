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

  // Run the supplied provider snippet in a fresh document parser. Ad tags
  // commonly use document.write(), which is unreliable when injected as a
  // dynamically added script after the main document has finished loading.
  const adFrame = document.createElement("iframe");
  adFrame.title = "Advertisement";
  adFrame.width = "300";
  adFrame.height = "250";
  adFrame.setAttribute("scrolling", "no");
  adFrame.setAttribute("frameborder", "0");
  adFrame.setAttribute("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
  adFrame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;width:300px;height:250px;overflow:hidden"><script>window.atOptions={key:"${AD_KEY}",format:"iframe",height:250,width:300,params:{}};<\/script><script src="https://bauval.org/22/${AD_KEY}"><\/script></body></html>`;
  adContainer.appendChild(adFrame);

  closeTimer = window.setTimeout(closeAd, AD_DURATION_MS);
  closeButton.focus({ preventScroll: true });
}

if (authForm && appView) {
  // Only trigger after the user submits authentication; restoring an existing
  // session on page load does not show the ad.
  authForm.addEventListener("submit", () => {
    authSubmissionPending = true;
    window.clearTimeout(pendingTimeout);
    pendingTimeout = window.setTimeout(() => {
      authSubmissionPending = false;
    }, 60_000);
  }, true);

  const appVisibilityObserver = new MutationObserver(() => {
    const appIsVisible = !appView.classList.contains("hidden") && appView.style.display !== "none";
    if (!authSubmissionPending || !appIsVisible) return;

    authSubmissionPending = false;
    window.clearTimeout(pendingTimeout);
    showPostLoginAd();
  });

  appVisibilityObserver.observe(appView, { attributes: true, attributeFilter: ["class", "style"] });
}
