import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://qopuyrsriphebzzgvecl.supabase.co",
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s"
);

const appView = document.getElementById("appView");
const authView = document.getElementById("authView");
const pageContent = document.getElementById("pageContent");
const DISPLAY_DURATION_MS = 4000;

if (appView && authView && pageContent) {
  const slot = document.createElement("aside");
  slot.id = "dashboardAdSlot";
  slot.hidden = true;
  slot.setAttribute("aria-label", "Advertisement");
  slot.style.cssText = "box-sizing:border-box;width:min(300px,100%);max-width:100%;margin:24px auto;text-align:center;";

  const label = document.createElement("p");
  label.textContent = "Advertisement";
  label.style.cssText = "margin:0 0 8px;color:#777f95;font-size:11px;";
  slot.append(label);
  pageContent.insertAdjacentElement("afterend", slot);

  let adFrame = null;
  let hideTimer = null;
  let syncVersion = 0;
  let shownThisSession = false;

  // Keep the provider script in a cross-origin sandbox. It receives no app data
  // and cannot read the parent page, Supabase storage, or authentication state.
  const adDocument = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;width:100%;height:250px;overflow:hidden">
<script>
  atOptions = {
    'key' : '5e698b33526a602c3625a7bc6137f2ab',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script src="https://bauval.org/22/5e698b33526a602c3625a7bc6137f2ab"></script>
</body>
</html>`;

  function removeAd(resetSession = false) {
    slot.hidden = true;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (adFrame) {
      adFrame.remove();
      adFrame = null;
    }
    if (resetSession) shownThisSession = false;
  }

  function isStudentOverview() {
    const appIsVisible = !appView.classList.contains("hidden") &&
      getComputedStyle(appView).display !== "none";
    const onOverview = document.querySelector('.nav-link.active[data-page="overview"]');
    return appIsVisible && Boolean(onOverview);
  }

  async function syncAd() {
    const version = ++syncVersion;

    if (!isStudentOverview()) {
      slot.hidden = true;
      if (appView.classList.contains("hidden") || getComputedStyle(appView).display === "none") {
        removeAd(true);
      }
      return;
    }

    if (shownThisSession || adFrame) return;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (version !== syncVersion) return;
      if (error || !data.session?.user) {
        removeAd(true);
        return;
      }

      slot.hidden = false;
      adFrame = document.createElement("iframe");
      adFrame.title = "Advertisement";
      adFrame.width = "300";
      adFrame.height = "250";
      adFrame.loading = "eager";
      adFrame.referrerPolicy = "no-referrer";
      adFrame.setAttribute("sandbox", "allow-scripts allow-popups");
      adFrame.style.cssText = "display:block;width:100%;max-width:300px;height:250px;margin:0 auto;border:0;";
      adFrame.srcdoc = adDocument;
      slot.append(adFrame);
      shownThisSession = true;

      // Display immediately after authenticated overview is confirmed, then
      // remove the ad frame after four seconds as requested.
      hideTimer = window.setTimeout(() => {
        removeAd();
      }, DISPLAY_DURATION_MS);
    } catch (error) {
      console.warn("The dashboard advertisement could not be initialized.", error);
      removeAd();
    }
  }

  const observer = new MutationObserver(() => {
    void syncAd();
  });
  observer.observe(appView, { attributes: true, attributeFilter: ["class", "style"] });
  observer.observe(authView, { attributes: true, attributeFilter: ["class", "style"] });
  observer.observe(pageContent, { childList: true, subtree: true });
  document.querySelectorAll(".nav-link").forEach((link) => {
    observer.observe(link, { attributes: true, attributeFilter: ["class"] });
  });

  void syncAd();
}
