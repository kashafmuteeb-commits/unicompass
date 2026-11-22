/* Aspire Fellowship card and tracking, integrated into the existing Opportunities section. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const aspireSupabase = createClient(
  "https://qopuyrsriphebzzgvecl.supabase.co",
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s"
);
const aspireRoot = document.getElementById("pageContent");
const ASPIRE_URL = "https://aspireresearch.net/welcome-fellowship";
const ASPIRE_TITLE = "Aspire Fellowship – 1:1 Research Mentorship";
const RESEARCH_MATCH = /biology|biotech|medicine|medical|neuroscience|environment|ecology|research|life science|bioinformatics/i;
const safe = (value = "") => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

let aspireUser = null;
let aspireProfile = {};
let aspireOpportunity = null;
let aspireSaved = false;
let aspireTracking = {};
let aspireBusy = false;
let aspireRenderToken = 0;

function onOpportunitiesPage() {
  return /opportunities/i.test(aspireRoot?.querySelector("h1")?.textContent || "");
}

function matchesResearchProfile(profile) {
  const text = [
    profile.intended_subject,
    profile.academic_interests,
    profile.research_interests,
    profile.academic_background,
    profile.current_education,
    profile.current_grade
  ].filter(Boolean).join(" ");
  return RESEARCH_MATCH.test(text);
}

function profileSummary(profile) {
  const details = [
    profile.current_grade || profile.current_education,
    profile.country,
    profile.intended_subject,
    profile.academic_interests || profile.research_interests,
    profile.academic_background
  ].filter(Boolean);
  return details.length ? details.join(" · ") : "Complete your profile to improve opportunity matching.";
}

function renderAspireCard() {
  if (!aspireRoot || !aspireUser || !onOpportunitiesPage() || !aspireOpportunity) return;
  document.getElementById("aspireFellowshipCard")?.remove();
  const matched = matchesResearchProfile(aspireProfile);
  const card = document.createElement("article");
  card.id = "aspireFellowshipCard";
  card.className = `panel aspire-card${matched ? " aspire-card-match" : ""}`;
  const currentStatus = aspireTracking.application_status || "Interested";
  const deadline = aspireTracking.application_deadline || "";
  const inquiry = aspireTracking.scholarship_inquiry || "";
  card.innerHTML = `
    <header class="aspire-card-header">
      <div class="aspire-brand-mark" aria-hidden="true">A</div>
      <div class="aspire-title-wrap">
        <div class="aspire-labels"><span class="aspire-label">1:1 PhD Mentorship</span><span class="aspire-label aspire-label-light">Research Fellowship</span></div>
        <h2>Aspire Fellowship</h2>
        <p>Online research mentorship · 12 weeks</p>
      </div>
      <span class="aspire-match-tag">${matched ? "Strong profile match" : "Explore opportunity"}</span>
    </header>
    <p class="aspire-match-context"><strong>Profile match:</strong> ${safe(profileSummary(aspireProfile))}</p>
    <div class="aspire-details-grid">
      <section><h3>Mentorship and format</h3><p>Individual 1:1 mentorship with a PhD-level research mentor. Online, 12 weeks.</p></section>
      <section><h3>Research areas</h3><p>Biotechnology, Biology, Medicine, Neuroscience, Environmental Science, Computer Science, Physics, Engineering and other disciplines.</p></section>
      <section><h3>Research outcomes</h3><p>Research paper preparation, publication guidance, or a competition-ready research poster and presentation.</p></section>
      <section><h3>Time commitment</h3><p>Approximately 5–10 hours per week outside mentor meetings.</p></section>
      <section class="aspire-aid-box"><h3>Scholarships and financial aid</h3><p><strong>Partial merit-based and need-based scholarships are advertised.</strong> Tuition is $2,597. This opportunity is <strong>not listed as fully funded</strong>; full scholarship availability must be confirmed directly with Aspire. If cost is a concern, contact Aspire and ask about full funding and your eligibility.</p></section>
      <section><h3>Eligibility</h3><p>High school students. Age, eligible grade levels and international applicant eligibility require confirmation directly with Aspire; they are not established in this listing.</p></section>
    </div>
    <div class="aspire-actions">
      <a class="btn" href="${ASPIRE_URL}" target="_blank" rel="noopener noreferrer">Official website ↗</a>
      <button class="btn secondary" type="button" data-aspire-save>${aspireSaved ? "Saved to dashboard" : "Save opportunity"}</button>
      <a class="aspire-eligibility-link" href="${ASPIRE_URL}" target="_blank" rel="noopener noreferrer">Confirm eligibility requirements ↗</a>
    </div>
    <section class="aspire-tracker" aria-label="Application status tracker">
      <h3>My application tracker</h3>
      <div class="aspire-tracker-fields">
        <label>Status<select class="control" data-aspire-status><option ${currentStatus === "Interested" ? "selected" : ""}>Interested</option><option ${currentStatus === "Applying" ? "selected" : ""}>Applying</option><option ${currentStatus === "Applied" ? "selected" : ""}>Applied</option><option ${currentStatus === "Accepted" ? "selected" : ""}>Accepted</option></select></label>
        <label>My application deadline<input class="control" type="date" value="${safe(deadline)}" data-aspire-deadline></label>
      </div>
      <label class="aspire-inquiry-label">Scholarship inquiry notes<textarea class="control" rows="3" data-aspire-inquiry placeholder="Record questions sent to Aspire about need-based, merit-based or full funding">${safe(inquiry)}</textarea></label>
      <button class="btn secondary" type="button" data-aspire-save-tracking>Save tracker and scholarship notes</button>
      <p class="aspire-feedback" role="status" aria-live="polite"></p>
    </section>
  `;

  const results = aspireRoot.querySelector("#opportunityResults");
  const host = results?.closest(".panel") || aspireRoot;
  host.append(card);
  card.addEventListener("click", onAspireAction);
  card.addEventListener("change", onAspireChange);
}

function setAspireFeedback(card, text, isError = false) {
  const feedback = card.querySelector(".aspire-feedback");
  if (feedback) {
    feedback.textContent = text;
    feedback.classList.toggle("is-error", isError);
  }
}

async function persistTracking(card) {
  if (!aspireUser || !aspireOpportunity?.id) return;
  const payload = {
    user_id: aspireUser.id,
    opportunity_id: aspireOpportunity.id,
    application_status: card.querySelector("[data-aspire-status]")?.value || "Interested",
    application_deadline: card.querySelector("[data-aspire-deadline]")?.value || null,
    scholarship_inquiry: card.querySelector("[data-aspire-inquiry]")?.value.trim() || "",
    updated_at: new Date().toISOString()
  };
  const { error } = await aspireSupabase.from("opportunity_application_tracking")
    .upsert(payload, { onConflict: "user_id,opportunity_id" });
  if (error) throw error;
  aspireTracking = payload;
}

async function onAspireAction(event) {
  const card = event.currentTarget;
  const saveButton = event.target.closest("[data-aspire-save]");
  if (saveButton) {
    saveButton.disabled = true;
    try {
      if (aspireSaved) {
        const { error } = await aspireSupabase.from("saved_opportunities").delete()
          .eq("user_id", aspireUser.id).eq("opportunity_id", aspireOpportunity.id);
        if (error) throw error;
        aspireSaved = false;
      } else {
        const { error } = await aspireSupabase.from("saved_opportunities")
          .upsert({ user_id: aspireUser.id, opportunity_id: aspireOpportunity.id }, { onConflict: "user_id,opportunity_id" });
        if (error) throw error;
        aspireSaved = true;
      }
      saveButton.textContent = aspireSaved ? "Saved to dashboard" : "Save opportunity";
      setAspireFeedback(card, aspireSaved ? "Aspire Fellowship saved to your dashboard." : "Removed from saved opportunities.");
    } catch (error) {
      setAspireFeedback(card, error.message || "Could not save this opportunity.", true);
    } finally {
      saveButton.disabled = false;
    }
  }

  if (event.target.closest("[data-aspire-save-tracking]")) {
    const button = event.target.closest("[data-aspire-save-tracking]");
    button.disabled = true;
    try {
      await persistTracking(card);
      setAspireFeedback(card, "Application status, deadline and scholarship notes saved.");
    } catch (error) {
      setAspireFeedback(card, error.message || "Could not save tracker. Apply the Aspire migration in Supabase and try again.", true);
    } finally {
      button.disabled = false;
    }
  }
}

async function onAspireChange(event) {
  if (!event.target.matches("[data-aspire-status], [data-aspire-deadline]")) return;
  try {
    await persistTracking(event.currentTarget);
    setAspireFeedback(event.currentTarget, "Application tracker updated.");
  } catch (error) {
    setAspireFeedback(event.currentTarget, error.message || "Could not update tracker. Apply the Aspire migration in Supabase.", true);
  }
}

async function loadAspireCard() {
  const token = ++aspireRenderToken;
  const { data: sessionData, error: sessionError } = await aspireSupabase.auth.getSession();
  if (sessionError) throw sessionError;
  aspireUser = sessionData.session?.user || null;
  if (!aspireUser) return;

  const [profileResult, opportunityResult] = await Promise.all([
    aspireSupabase.from("profiles").select("*").eq("id", aspireUser.id).maybeSingle(),
    aspireSupabase.from("opportunities").select("*").eq("active", true).eq("title", ASPIRE_TITLE).maybeSingle()
  ]);
  if (profileResult.error) throw profileResult.error;
  if (opportunityResult.error) throw opportunityResult.error;
  if (token !== aspireRenderToken) return;
  aspireProfile = profileResult.data || {};
  aspireOpportunity = opportunityResult.data;
  if (!aspireOpportunity) return;

  const [savedResult, trackingResult] = await Promise.all([
    aspireSupabase.from("saved_opportunities").select("id").eq("user_id", aspireUser.id).eq("opportunity_id", aspireOpportunity.id).maybeSingle(),
    aspireSupabase.from("opportunity_application_tracking").select("application_status,application_deadline,scholarship_inquiry").eq("user_id", aspireUser.id).eq("opportunity_id", aspireOpportunity.id).maybeSingle()
  ]);
  if (savedResult.error) throw savedResult.error;
  if (trackingResult.error) throw trackingResult.error;
  aspireSaved = Boolean(savedResult.data);
  aspireTracking = trackingResult.data || {};
  renderAspireCard();
}

function queueAspireRender() {
  if (!onOpportunitiesPage() || document.getElementById("aspireFellowshipCard") || aspireBusy) return;
  aspireBusy = true;
  loadAspireCard().catch((error) => {
    console.error("Aspire Fellowship card could not load:", error);
    const target = aspireRoot?.querySelector("#opportunityResults")?.closest(".panel") || aspireRoot;
    if (target && onOpportunitiesPage() && !document.getElementById("aspireLoadFeedback")) {
      const message = document.createElement("p");
      message.id = "aspireLoadFeedback";
      message.className = "aspire-feedback is-error";
      message.textContent = "Aspire Fellowship details could not load. Check the Supabase opportunity record and migration.";
      target.append(message);
    }
  }).finally(() => { aspireBusy = false; });
}

if (aspireRoot) {
  new MutationObserver(() => {
    if (!onOpportunitiesPage()) {
      document.getElementById("aspireFellowshipCard")?.remove();
      return;
    }
    queueAspireRender();
  }).observe(aspireRoot, { childList: true, subtree: true });
}

aspireSupabase.auth.onAuthStateChange((_event, session) => {
  aspireUser = session?.user || null;
  aspireRenderToken++;
  document.getElementById("aspireFellowshipCard")?.remove();
  queueAspireRender();
});

void aspireSupabase.auth.getSession().then(() => queueAspireRender());
