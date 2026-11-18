import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =========================================================
   1. SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL = "https://qopuyrsriphebzzgvecl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/* =========================================================
   2. DOM ELEMENTS AND APPLICATION STATE
========================================================= */

const $ = (id) => document.getElementById(id);

const authView = $("authView");
const appView = $("appView");
const authForm = $("authForm");
const notice = $("notice");
const pageContent = $("pageContent");

let mode = "signin";
let currentUser = null;
let currentPage = "overview";

let universities = [];
let goals = [];
let achievements = [];
let tasks = [];
let journal = [];
let opportunities = [];
let saved = [];

let loading = false;

/* =========================================================
   3. GENERAL HELPERS
========================================================= */

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function dateText(value) {
  if (!value) return "No date set";

  const date = new Date(value + "T00:00:00");

  if (Number.isNaN(date.getTime())) return "No date set";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

function showMessage(message, type = "error") {
  if (!notice) return;

  notice.textContent = message;
  notice.className = `notice ${type}`;
}

function clearMessage() {
  if (!notice) return;

  notice.textContent = "";
  notice.className = "notice hidden";
}

function showAppMessage(message, type = "success") {
  if (!pageContent) return;

  let element = $("appFeedback");

  if (!element) {
    element = document.createElement("div");
    element.id = "appFeedback";

    pageContent.prepend(element);
  }

  element.textContent = message;

  element.style.cssText = `
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 10px;
    background: ${type === "error" ? "#fee2e2" : "#dcfce7"};
    color: ${type === "error" ? "#991b1b" : "#166534"};
    font-size: 14px;
  `;

  setTimeout(() => {
    element?.remove();
  }, 5000);
}

function setButtonLoading(button, isLoading, loadingText = "Saving...") {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function isSaved(opportunityId) {
  return saved.some(
    item => String(item.opportunity_id) === String(opportunityId)
  );
}

async function refreshData() {
  await loadData();
  renderPage(currentPage);
}


/* =========================================================
   4. AUTHENTICATION SCREEN
========================================================= */

function setMode(nextMode) {
  mode = nextMode;
  clearMessage();

  const signup = mode === "signup";
  const reset = mode === "reset";

  $("nameField").classList.toggle("hidden", !signup);
  $("fullName").required = signup;

  $("password").required = !reset;
  $("password").classList.toggle("hidden", reset);
  $("passwordHint").classList.toggle("hidden", reset);

  $("forgotButton").classList.toggle(
    "hidden",
    signup || reset
  );

  $("formEyebrow").textContent = signup
    ? "GET STARTED"
    : reset
      ? "ACCOUNT RECOVERY"
      : "WELCOME BACK";

  $("formTitle").textContent = signup
    ? "Create your account"
    : reset
      ? "Reset your password"
      : "Sign in to your space";

  $("formSubtitle").textContent = signup
    ? "Start organizing your student journey."
    : reset
      ? "We'll send you a password reset link."
      : "Pick up where you left off.";

  $("submitText").textContent = signup
    ? "Create account"
    : reset
      ? "Send reset link"
      : "Sign in";

  $("switchCopy").innerHTML = signup
    ? 'Already have an account? <button class="text-button" id="switchMode" type="button">Sign in</button>'
    : 'New to UniCompass? <button class="text-button" id="switchMode" type="button">Create an account</button>';

  $("switchMode").onclick = () => {
    setMode(signup ? "signin" : "signup");
  };
}

function showLogin() {
  currentUser = null;

  appView.classList.add("hidden");
  appView.style.display = "none";

  authView.classList.remove("hidden");
  clearMessage();
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  clearMessage();

  const button = authForm.querySelector('button[type="submit"]');

  if (!button) {
    showMessage("Submit button not found.", "error");
    return;
  }

  setButtonLoading(button, true, "Please wait...");

  const formData = new FormData(authForm);

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");

  const fullName = String(formData.get("fullName") || "").trim();

  const redirectUrl =
    window.location.origin + window.location.pathname;

  try {
    if (!email) {
      throw new Error("Please enter your email address.");
    }

    if (mode !== "reset" && !password) {
      throw new Error("Please enter your password.");
    }

    if (mode === "signup") {
      if (!fullName) {
        throw new Error("Please enter your full name.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      authForm.reset();
      setMode("signin");

      showMessage(
        data.session
          ? "Account created successfully. You can now continue."
          : "Account created. Please verify your email before signing in.",
        "success"
      );

    } else if (mode === "signin") {

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

    } else if (mode === "reset") {

      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: redirectUrl
        }
      );

      if (error) throw error;

      showMessage(
        "If an account exists, a password reset link has been sent.",
        "success"
      );
    }

  } catch (error) {
    showMessage(getErrorMessage(error), "error");

  } finally {
    setButtonLoading(button, false);
  }
     }
         
/* =========================================================
   5. LOAD USER DATA FROM SUPABASE
========================================================= */

async function loadData() {
  if (!currentUser) {
    throw new Error("No signed-in user found.");
  }

  const uid = currentUser.id;

  const queries = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle(),

    supabase
      .from("universities")
      .select("*")
      .eq("active", true)
      .order("name"),

    supabase
      .from("student_goals")
      .select("*, universities(*)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),

    supabase
      .from("achievements")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),

    supabase
      .from("roadmap_tasks")
      .select("*")
      .eq("user_id", uid)
      .order("sort_order")
      .order("created_at"),

    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", uid)
      .order("entry_date", { ascending: false }),

    supabase
      .from("opportunities")
      .select("*")
      .eq("active", true)
      .order("deadline"),

    supabase
      .from("saved_opportunities")
      .select("*")
      .eq("user_id", uid)
  ]);

  for (const query of queries) {
    if (query.error) throw query.error;
  }

  [
    window.profile,
    universities,
    goals,
    achievements,
    tasks,
    journal,
    opportunities,
    saved
  ] = queries.map(query => query.data);

  if (!window.profile) {
    const newProfile = {
      id: uid,
      full_name:
        currentUser.user_metadata?.full_name || ""
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(newProfile);

    if (error) throw error;

    window.profile = newProfile;
  }
}

/* =========================================================
   6. SHOW DASHBOARD
========================================================= */

async function showApp(user) {
  if (!user) return;

  currentUser = user;

  authView.classList.add("hidden");

  appView.classList.remove("hidden");
  appView.style.display = "grid";

  const name =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Student";

  $("sidebarName").textContent = name;
  $("sidebarEmail").textContent = user.email || "";
  $("userAvatar").textContent = name.charAt(0).toUpperCase();

  if (loading) return;

  loading = true;

  try {
    await loadData();
    renderPage(currentPage);
  } catch (error) {
    console.error("Dashboard loading error:", error);

    pageContent.innerHTML = `
      <section class="panel">
        <h2>Unable to load your dashboard</h2>
        <p>${escapeHtml(getErrorMessage(error))}</p>
        <button class="btn" id="retryLoading">Try again</button>
      </section>
    `;

    $("retryLoading").onclick = () => showApp(user);
  } finally {
    loading = false;
  }
}

/* =========================================================
   7. NAVIGATION
========================================================= */

function nav(page) {
  const allowedPages = [
    "overview",
    "profile",
    "journal",
    "universities",
    "opportunities",
    "roadmap"
  ];

  if (!allowedPages.includes(page)) return;

  currentPage = page;

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  renderPage(page);
}

function header(eyebrow, title, subtitle = "") {
  return `
    <div class="welcome-row">
      <div>
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>

      <div class="date-chip">
        ${dateText(today())}
      </div>
    </div>
  `;
}

/* =========================================================
   8. PAGE RENDERING
========================================================= */

function renderPage(page) {
  if (!pageContent) return;

  const pages = {
    overview: overviewPage,
    profile: profilePage,
    journal: journalPage,
    universities: universitiesPage,
    opportunities: opportunitiesPage,
    roadmap: roadmapPage
  };

  if (!pages[page]) page = "overview";

  currentPage = page;

  $("breadcrumb").textContent =
    "Workspace / " +
    page.charAt(0).toUpperCase() +
    page.slice(1);

  pageContent.innerHTML = pages[page]();

  bindPageActions();
}

/* =========================================================
   9. OVERVIEW PAGE
========================================================= */

function overviewPage() {
  const done = tasks.filter(task => task.status === "done").length;

  const pct = tasks.length
    ? Math.round((done / tasks.length) * 100)
    : 0;

  return `
    ${header(
      "YOUR STUDENT WORKSPACE",
      `Welcome back, ${window.profile?.full_name || currentUser?.user_metadata?.full_name || "Student"}.`,
      "Your next step should be clear, realistic and based on your own goals."
    )}

    <div class="setup-banner">
      <div class="setup-icon">✦</div>

      <div>
        <strong>Your journey, one step at a time.</strong>
        <p>
          Select a target university, record what you have already done,
          then use your roadmap to decide what comes next.
        </p>
      </div>
    </div>

    <div class="stats-grid">

      <article class="stat-card">
        <span class="stat-label">ROADMAP</span>
        <strong>${done}/${tasks.length}</strong>
        <span class="stat-note">Tasks completed</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">ACHIEVEMENTS</span>
        <strong>${achievements.length}</strong>
        <span class="stat-note">Records added</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">DAILY LOGS</span>
        <strong>${journal.length}</strong>
        <span class="stat-note">Journal entries</span>
      </article>

    </div>

    <div class="section-heading">
      <h2>Your progress</h2>
      <span class="badge">${pct}% complete</span>
    </div>

    <div class="progress">
      <span style="width:${pct}%"></span>
    </div>

    <div class="two-grid" style="margin-top:18px">

      <section class="panel">
        <h3>Your next steps</h3>

        ${
          tasks
            .filter(task => task.status !== "done")
            .slice(0, 4)
            .map(task => `
              <div class="task-row">
                <span class="task-num">→</span>

                <div>
                  <strong>${escapeHtml(task.title)}</strong>
                  <p>${escapeHtml(task.description || "")}</p>
                </div>
              </div>
            `)
            .join("") ||
          '<div class="empty">Choose a university to create your first roadmap.</div>'
        }

        <div class="actions">
          <button class="btn" data-go="roadmap">Open roadmap</button>
        </div>
      </section>

      <section class="panel">
        <h3>Your university goals</h3>

        ${
          goals.map(goal => `
            <div class="list-row">
              <div>
                <strong>${escapeHtml(goal.universities?.name || "University")}</strong>
                <p>${escapeHtml(goal.subject || goal.degree_level || "Target university")}</p>
              </div>
            </div>
          `).join("") ||
          '<div class="empty">No university selected yet.</div>'
        }

        <div class="actions">
          <button class="btn secondary" data-go="universities">
            Choose university
          </button>
        </div>
      </section>

    </div>
  `;
}

/* =========================================================
   10. STUDENT PROFILE AND ACHIEVEMENTS
========================================================= */

function profilePage() {
  const profile = window.profile || {};

  return `
    ${header(
      "YOUR DETAILS",
      "Student profile",
      "Keep your academic background and intended study plans up to date."
    )}

    <section class="panel">

      <h3>Personal and academic information</h3>

      <form id="profileForm" class="form-grid">

        <div class="form-field">
          <label>Full name</label>
          <input class="control" name="full_name"
            value="${escapeHtml(profile.full_name)}" required>
        </div>

        <div class="form-field">
          <label>Country of residence</label>
          <input class="control" name="country"
            value="${escapeHtml(profile.country)}"
            placeholder="e.g. Pakistan">
        </div>

        <div class="form-field">
          <label>Current education</label>
          <input class="control" name="current_education"
            value="${escapeHtml(profile.current_education)}"
            placeholder="e.g. Grade 11 / A Levels">
        </div>

        <div class="form-field">
          <label>Intended degree</label>
          <select class="control" name="intended_degree">
            <option value="">Choose</option>

            ${["Bachelor's", "Master's", "Doctorate", "Other"].map(value => `
              <option value="${escapeHtml(value)}"
                ${profile.intended_degree === value ? "selected" : ""}>
                ${escapeHtml(value)}
              </option>
            `).join("")}

          </select>
        </div>

        <div class="form-field">
          <label>Intended subject</label>
          <input class="control" name="intended_subject"
            value="${escapeHtml(profile.intended_subject)}"
            placeholder="e.g. Biotechnology">
        </div>

        <div class="form-field">
          <label>Intended start year</label>
          <input class="control" type="number"
            min="2026" max="2040"
            name="intended_start_year"
            value="${escapeHtml(profile.intended_start_year || "")}">
        </div>

        <div class="form-field full">
          <button class="btn" type="submit">Save profile</button>
        </div>

      </form>
    </section>

    <section class="panel">

      <div class="row-between">
        <h3>Achievements and activities</h3>
        <span class="badge">${achievements.length} saved</span>
      </div>

      <form id="achievementForm" class="form-grid">

        <div class="form-field">
          <label>Achievement / activity</label>
          <input class="control" name="title" required>
        </div>

        <div class="form-field">
          <label>Category</label>
          <select class="control" name="category">
            <option>Academic</option>
            <option>Leadership</option>
            <option>Competition</option>
            <option>Volunteering</option>
            <option>Project</option>
            <option>Other</option>
          </select>
        </div>

        <div class="form-field full">
          <label>Description</label>
          <textarea name="description"
            placeholder="What did you do? What was your role?"></textarea>
        </div>

        <div class="form-field">
          <label>Date</label>
          <input class="control" type="date" name="date_completed">
        </div>

        <div class="form-field">
          <label>Evidence URL (optional)</label>
          <input class="control" name="evidence_url"
            type="url" placeholder="https://...">
        </div>

        <div class="form-field full">
          <button class="btn" type="submit">Add achievement</button>
        </div>

      </form>

      ${
        achievements.map(item => `
          <div class="list-row">

            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p>
                ${escapeHtml(item.category)}
                · ${dateText(item.date_completed)}
              </p>
            </div>

            <button class="btn danger"
              data-delete-achievement="${item.id}">
              Delete
            </button>

          </div>
        `).join("") ||
        '<div class="empty">No achievements added yet.</div>'
      }

    </section>
  `;
}

/* =========================================================
   11. DAILY JOURNAL
========================================================= */

function journalPage() {
  return `
    ${header(
      "YOUR DAILY RECORD",
      "Daily journal",
      "Record what you worked on, what you learned and the time you invested."
    )}

    <section class="panel">

      <h3>New journal entry</h3>

      <form id="journalForm" class="form-grid">

        <div class="form-field">
          <label>Title</label>
          <input class="control" name="title" required
            placeholder="e.g. Biology research">
        </div>

        <div class="form-field">
          <label>Date</label>
          <input class="control" name="entry_date"
            type="date" value="${today()}" required>
            </div>
            <div class="form-field">
  <label>Hours (optional)</label>
  <input class="control" name="hours"
    type="number" min="0" max="24"
    step="0.25" value="0">
</div>
        <div class="form-field full-width">
          <label>What did you work on?</label>
          <textarea class="control" name="description" rows="5"
            placeholder="Describe what you completed or learned..." required></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit">
            Save journal entry
          </button>
        </div>

      </form>
    </section>

    <section class="panel">
      <div class="row-between">
        <h3>Previous entries</h3>
        <span class="badge">${journal.length} entries</span>
      </div>

      <div class="entry-list">
        ${
          journal.length
            ? journal.map(entry => `
              <article class="entry-card">
                <div class="row-between">
                  <h4>${escapeHTML(entry.title)}</h4>
                  <span>${escapeHTML(entry.entry_date || "")}</span>
                </div>
                <p>${escapeHTML(entry.description || "")}</p>
                <small>${Number(entry.hours || 0)} hours</small>
              </article>
            `).join("")
            : `<p class="empty-state">No journal entries yet. Start recording your progress.</p>`
        }
      </div>
    </section>
  `;
}
   
/* =========================================================
   AUTHENTICATION INITIALIZATION
========================================================= */

authForm.addEventListener("submit", handleAuthSubmit);

$("forgotButton").addEventListener("click", () => {
  setMode("reset");
});

async function initializeApp() {
  setMode("signin");

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    showMessage(error.message, "error");
    showLogin();
    return;
  }

  if (data.session) {
    await showApp(data.session.user);
  } else {
    showLogin();
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      await showApp(session.user);
    }

    if (event === "SIGNED_OUT") {
      showLogin();
    }
  });
}

initializeApp();
