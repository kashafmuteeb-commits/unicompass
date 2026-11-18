import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =====================================================
   1. SUPABASE CONFIGURATION
===================================================== */

const SUPABASE_URL = "https://qopuyrsriphebzzgvecl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/* =====================================================
   2. DOM ELEMENTS AND STATE
===================================================== */

const $ = (id) => document.getElementById(id);

const authView = $("authView");
const appView = $("appView");
const authForm = $("authForm");
const notice = $("notice");
const pageContent = $("pageContent");

let mode = "signin";
let currentUser = null;
let currentPage = "overview";
let profile = {};

let universities = [];
let goals = [];
let achievements = [];
let tasks = [];
let journal = [];
let opportunities = [];
let saved = [];

let loading = false;

/* =====================================================
   3. GENERAL HELPERS
===================================================== */

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 10);
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
  `;
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function setButtonLoading(button, state, text = "Please wait...") {
  if (!button) return;

  if (state) {
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.textContent =
      button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function isSaved(id) {
  return saved.some(
    item => String(item.opportunity_id) === String(id)
  );
}

/* =====================================================
   4. AUTHENTICATION
===================================================== */

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
      ? "We will send you a password reset link."
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

  const button = $("submitButton");

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const fullName = $("fullName").value.trim();

  const redirectUrl =
    window.location.origin + window.location.pathname;

  setButtonLoading(button, true);

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

      if (password.length < 8) {
        throw new Error("Password must contain at least 8 characters.");
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
          ? "Account created successfully."
          : "Account created. Verify your email before signing in.",
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
        { redirectTo: redirectUrl }
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

/* =====================================================
   5. LOAD DATA
===================================================== */

async function loadData() {
  if (!currentUser) {
    throw new Error("No signed-in user found.");
  }

  const uid = currentUser.id;

  const results = await Promise.all([
    supabase.from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle(),

    supabase.from("universities")
      .select("*")
      .eq("active", true)
      .order("name"),

    supabase.from("student_goals")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),

    supabase.from("achievements")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),

    supabase.from("roadmap_tasks")
      .select("*")
      .eq("user_id", uid)
      .order("sort_order"),

    supabase.from("journal_entries")
      .select("*")
      .eq("user_id", uid)
      .order("entry_date", { ascending: false }),

    supabase.from("opportunities")
      .select("*")
      .eq("active", true)
      .order("deadline"),

    supabase.from("saved_opportunities")
      .select("*")
      .eq("user_id", uid)
  ]);

  const names = [
    "profiles",
    "universities",
    "student goals",
    "achievements",
    "roadmap tasks",
    "journal entries",
    "opportunities",
    "saved opportunities"
  ];

  results.forEach((result, index) => {
    if (result.error) {
      throw new Error(
        names[index] + ": " + result.error.message
      );
    }
  });

  profile = results[0].data || {};
  universities = results[1].data || [];
  goals = results[2].data || [];
  achievements = results[3].data || [];
  tasks = results[4].data || [];
  journal = results[5].data || [];
  opportunities = results[6].data || [];
  saved = results[7].data || [];

  if (!profile.id) {
    const newProfile = {
      id: uid,
      full_name: currentUser.user_metadata?.full_name || ""
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(newProfile)
      .select()
      .single();

    if (error) throw error;

    profile = data;
  }
}

async function refreshData() {
  await loadData();
  renderPage(currentPage);
}

/* =====================================================
   6. SHOW APP
===================================================== */

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

  pageContent.innerHTML = `
    <section class="panel">
      <h2>Loading your workspace...</h2>
      <p>Please wait while your records are loaded.</p>
    </section>
  `;

  try {
    await loadData();
    renderPage(currentPage);
  } catch (error) {
    console.error("Dashboard loading error:", error);

    pageContent.innerHTML = `
      <section class="panel">
        <h2>Unable to load your dashboard</h2>
        <p>${escapeHtml(getErrorMessage(error))}</p>
        <button class="btn" id="retryLoading" type="button">
          Try again
        </button>
      </section>
    `;

    $("retryLoading").onclick = () => showApp(user);

  } finally {
    loading = false;
  }
}

/* =====================================================
   7. NAVIGATION
===================================================== */

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

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.page === page
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
      <div class="date-chip">${dateText(today())}</div>
    </div>
  `;
}

function renderPage(page) {
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
}

/* =====================================================
   8. OVERVIEW
===================================================== */

function overviewPage() {
  const done = tasks.filter(task => task.status === "done").length;

  const percent = tasks.length
    ? Math.round((done / tasks.length) * 100)
    : 0;

  return `
    ${header(
      "YOUR STUDENT WORKSPACE",
      `Welcome back, ${profile.full_name || currentUser?.user_metadata?.full_name || "Student"}.`,
      "Your academic journey, organized in one place."
    )}

    <div class="setup-banner">
      <div class="setup-icon">✦</div>
      <div>
        <strong>Your journey, one step at a time.</strong>
        <p>Record your work, choose universities and build your next steps.</p>
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
      <span class="badge">${percent}% complete</span>
    </div>

    <div class="progress">
      <span style="width:${percent}%"></span>
    </div>

    <div class="two-grid" style="margin-top:18px">
      <section class="panel">
        <h3>Your next steps</h3>
        ${
          tasks.filter(task => task.status !== "done")
            .slice(0, 4)
            .map(task => `
              <div class="task-row">
                <span class="task-num">→</span>
                <div>
                  <strong>${escapeHtml(task.title)}</strong>
                  <p>${escapeHtml(task.description || "")}</p>
                </div>
              </div>
            `).join("") ||
          '<p class="empty">No pending tasks. Add your first roadmap task.</p>'
        }
        <div class="actions">
          <button class="btn" data-go="roadmap">Open roadmap</button>
        </div>
      </section>

      <section class="panel">
        <h3>Your university goals</h3>
        ${
          goals.map(goal => {
            const university = universities.find(
              item => item.id === goal.university_id
            );

            return `
              <div class="list-row">
                <div>
                  <strong>${escapeHtml(university?.name || "University")}</strong>
                  <p>${escapeHtml(goal.subject || goal.degree_level || "")}</p>
                </div>
              </div>
            `;
          }).join("") ||
          '<p class="empty">No university selected yet.</p>'
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

/* =====================================================
   9. STUDENT PROFILE AND ACHIEVEMENTS
===================================================== */

function profilePage() {
  return `
    ${header(
      "YOUR DETAILS",
      "Student profile",
      "Keep your academic information updated."
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
          <label>Country</label>
          <input class="control" name="country"
            value="${escapeHtml(profile.country)}"
            placeholder="e.g. Pakistan">
        </div>

        <div class="form-field">
          <label>Current education</label>
          <input class="control" name="current_education"
            value="${escapeHtml(profile.current_education)}"
            placeholder="e.g. Grade 11">
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
          <textarea class="control" name="description"></textarea>
        </div>

        <div class="form-field">
          <label>Date completed</label>
          <input class="control" type="date" name="date_completed">
        </div>

        <div class="form-field">
          <label>Evidence URL (optional)</label>
          <input class="control" name="evidence_url" type="url">
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
              <p>${escapeHtml(item.category || "Other")} · ${dateText(item.date_completed)}</p>
            </div>
            <button class="btn danger"
              data-delete-achievement="${item.id}">
              Delete
            </button>
          </div>
        `).join("") ||
        '<p class="empty">No achievements added yet.</p>'
      }
    </section>
  `;
}

/* =====================================================
   10. DAILY JOURNAL
===================================================== */

function journalPage() {
  return `
    ${header(
      "YOUR DAILY RECORD",
      "Daily journal",
      "Record what you worked on and what you learned."
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
                   <label>What did you work on?</label>
          <textarea class="control" name="work_done"
            placeholder="Describe your work today..." required></textarea>
        </div>

        <div class="form-field full">
          <label>What did you learn?</label>
          <textarea class="control" name="learning"
            placeholder="Record something new you learned."></textarea>
        </div>

        <div class="form-field full">
          <label>Next steps</label>
          <textarea class="control" name="next_steps"
            placeholder="What will you work on next?"></textarea>
        </div>

        <div class="form-field full">
          <button class="btn" type="submit">Save daily entry</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <h3>Previous entries</h3>
      ${
        journal.map(entry => `
          <div class="list-row">
            <div>
              <strong>${escapeHtml(entry.title)}</strong>
              <p>${dateText(entry.entry_date)}</p>
              <p>${escapeHtml(entry.work_done || "")}</p>
            </div>
          </div>
        `).join("") ||
        '<p class="empty">No journal entries yet.</p>'
      }
    </section>
  `;
}

/* =====================================================
   11. UNIVERSITIES
===================================================== */

const UNIVERSITY_LIST = [
  { name: "Massachusetts Institute of Technology", country: "USA", field: "Engineering, Science, Technology", website: "https://www.mit.edu" },
  { name: "Stanford University", country: "USA", field: "Technology, Business, Science", website: "https://www.stanford.edu" },
  { name: "Harvard University", country: "USA", field: "Medicine, Sciences, Humanities", website: "https://www.harvard.edu" },
  { name: "University of Oxford", country: "UK", field: "Medicine, Sciences, Humanities", website: "https://www.ox.ac.uk" },
  { name: "University of Cambridge", country: "UK", field: "Biotechnology, Sciences, Engineering", website: "https://www.cam.ac.uk" },
  { name: "California Institute of Technology", country: "USA", field: "Science, Engineering", website: "https://www.caltech.edu" },
  { name: "Princeton University", country: "USA", field: "Research, Mathematics, Science", website: "https://www.princeton.edu" },
  { name: "Yale University", country: "USA", field: "Medicine, Arts, Sciences", website: "https://www.yale.edu" },
  { name: "Columbia University", country: "USA", field: "Medicine, Research, Sciences", website: "https://www.columbia.edu" },
  { name: "University of Chicago", country: "USA", field: "Economics, Science, Research", website: "https://www.uchicago.edu" },
  { name: "ETH Zurich", country: "Switzerland", field: "Engineering, Technology, Science", website: "https://ethz.ch" },
  { name: "EPFL", country: "Switzerland", field: "Engineering, Biotechnology, Technology", website: "https://www.epfl.ch" },
  { name: "Imperial College London", country: "UK", field: "Medicine, Engineering, Science", website: "https://www.imperial.ac.uk" },
  { name: "University College London", country: "UK", field: "Medicine, Sciences, Arts", website: "https://www.ucl.ac.uk" },
  { name: "National University of Singapore", country: "Singapore", field: "Science, Business, Technology", website: "https://nus.edu.sg" },
  { name: "Nanyang Technological University", country: "Singapore", field: "Engineering, Science, Technology", website: "https://www.ntu.edu.sg" },
  { name: "University of Toronto", country: "Canada", field: "Medicine, Biotechnology, Research", website: "https://www.utoronto.ca" },
  { name: "University of Melbourne", country: "Australia", field: "Medicine, Biology, Research", website: "https://www.unimelb.edu.au" },
  { name: "University of Tokyo", country: "Japan", field: "Science, Engineering, Medicine", website: "https://www.u-tokyo.ac.jp" },
  { name: "Tsinghua University", country: "China", field: "Engineering, Science, Technology", website: "https://www.tsinghua.edu.cn" }
];

function universitiesPage() {
  const selectedIds = goals.map(goal =>
    String(goal.university_id)
  );

  return `
    ${header(
      "YOUR FUTURE",
      "Explore universities",
      "Discover and shortlist universities around the world."
    )}

    <section class="panel">
      <h3>Find your university</h3>

      <input
        class="control"
        id="universitySearch"
        placeholder="Search university or subject..."
        style="width:100%;margin-bottom:12px"
      >

      <select
        class="control"
        id="universityCountry"
        style="width:100%;margin-bottom:18px"
      >
        <option value="">All countries</option>
        ${[...new Set(UNIVERSITY_LIST.map(u => u.country))]
          .map(country => `
            <option value="${escapeHtml(country)}">
              ${escapeHtml(country)}
            </option>
          `).join("")}
      </select>

      <p class="stat-note">
        20 curated universities available
      </p>

      <div id="universityResults">
        ${renderUniversityCards(selectedIds)}
      </div>
    </section>

    <section class="panel">
      <h3>Your selected universities</h3>

      ${
        goals.map(goal => {
          const university = universities.find(
            item => String(item.id) === String(goal.university_id)
          );

          return university ? `
            <div class="list-row">
              <div>
                <strong>${escapeHtml(university.name)}</strong>
                <p>${escapeHtml(university.country || "")}</p>
              </div>
              <span class="badge">Selected</span>
            </div>
          ` : "";
        }).join("") ||
        '<p class="empty">You have not selected a university yet.</p>'
      }
    </section>
  `;
}

function renderUniversityCards(selectedIds = []) {
  return UNIVERSITY_LIST.map((university, index) => {
    const databaseUniversity = universities.find(
      item => item.name?.toLowerCase() === university.name.toLowerCase()
    );

    const selected = databaseUniversity &&
      selectedIds.includes(String(databaseUniversity.id));

    return `
      <article class="list-row university-card"
        data-university-name="${escapeHtml(university.name.toLowerCase())}"
        data-university-country="${escapeHtml(university.country)}"
        data-university-field="${escapeHtml(university.field.toLowerCase())}"
      >
        <div style="flex:1">
          <strong>${index + 1}. ${escapeHtml(university.name)}</strong>
          <p>${escapeHtml(university.country)}</p>
          <p>${escapeHtml(university.field)}</p>
          <a href="${escapeHtml(university.website)}"
             target="_blank" rel="noopener noreferrer">
            Official website ↗
          </a>
        </div>

        <button
          class="btn ${selected ? "secondary" : ""}"
          data-university-name-add="${escapeHtml(university.name)}"
          ${selected || !databaseUniversity ? "disabled" : ""}
        >
          ${selected ? "Selected" :
            databaseUniversity ? "Add goal" : "Not in database"}
        </button>
      </article>
    `;
  }).join("");
                    }

/* =====================================================
   20. EVENT LISTENERS AND APP INITIALIZATION
===================================================== */

// AUTHENTICATION FORM
if (authForm) {
  authForm.addEventListener("submit", handleAuthSubmit);
}

// INITIAL SIGN-IN MODE
setMode("signin");

// NAVIGATION
document.addEventListener("click", async function (event) {

  const navLink = event.target.closest(".nav-link");

  if (navLink) {
    event.preventDefault();
    nav(navLink.dataset.page);
    return;
  }

  const goButton = event.target.closest("[data-go]");

  if (goButton) {
    nav(goButton.dataset.go);
    return;
  }

  // LOGOUT
  const logoutButton = event.target.closest("#logoutButton");

  if (logoutButton) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      showAppMessage(error.message, "error");
    }
    return;
  }

  // UNIVERSITY SEARCH FILTER
  const universityButton = event.target.closest(
    "[data-university-name-add]"
  );

  if (universityButton) {
    await addUniversityGoal(
      universityButton.dataset.universityNameAdd
    );
    return;
  }

  // RETRY DASHBOARD
  if (event.target.closest("#retryLoading")) {
    if (currentUser) await showApp(currentUser);
  }
});

// UNIVERSITY SEARCH
document.addEventListener("input", function (event) {
  if (event.target.id !== "universitySearch") return;

  filterUniversities();
});

document.addEventListener("change", function (event) {
  if (event.target.id !== "universityCountry") return;

  filterUniversities();
});

// INITIALIZE SUPABASE SESSION
async function initializeApp() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await showApp(data.session.user);
    } else {
      showLogin();
    }

  } catch (error) {
    console.error("Initialization error:", error);
    showLogin();
    showMessage(getErrorMessage(error), "error");
  }
}

// AUTH STATE LISTENER
supabase.auth.onAuthStateChange((event, session) => {

  if (event === "SIGNED_OUT") {
    showLogin();
  }

  if (event === "SIGNED_IN" && session) {
    // Existing session initialization handles dashboard loading.
    // Avoid duplicate dashboard requests.
  }

});

// START APPLICATION
initializeApp();
   
/* =====================================================
   OPPORTUNITIES PAGE
===================================================== */

function opportunitiesPage() {
  return `
    ${header(
      "EXPLORE YOUR OPTIONS",
      "Opportunities",
      "Find scholarships, competitions and programs."
    )}

    <section class="panel">
      <h3>Find opportunities</h3>

      <input
        class="control"
        id="opportunitySearch"
        placeholder="Search opportunities..."
        style="width:100%;margin-bottom:12px"
      >

      <select
        class="control"
        id="opportunityCategory"
        style="width:100%;margin-bottom:15px"
      >
        <option value="">All categories</option>
        <option value="Scholarship">Scholarships</option>
        <option value="Competition">Competitions</option>
        <option value="Internship">Internships</option>
        <option value="Summer Program">Summer Programs</option>
        <option value="Fellowship">Fellowships</option>
      </select>

      <div id="opportunityResults">
        ${renderOpportunityCards()}
      </div>
    </section>

    <section class="panel">
      <h3>My saved opportunities</h3>

      ${
        opportunities.filter(item => isSaved(item.id)).map(item => `
          <div class="list-row">
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.category || "Opportunity")}</p>
            </div>
          </div>
        `).join("") ||
        '<p class="empty">No saved opportunities yet.</p>'
      }
    </section>
  `;
}

/* =====================================================
   OPPORTUNITY CARDS
===================================================== */

function renderOpportunityCards() {
  if (!opportunities.length) {
    return '<p class="empty">No opportunities available yet.</p>';
  }

  return opportunities.map(item => `
    <article class="list-row opportunity-card"
      data-title="${escapeHtml(item.title?.toLowerCase() || "")}"
      data-category="${escapeHtml(item.category || "")}">

      <div style="flex:1">

        <strong>${escapeHtml(item.title)}</strong>

        <p>${escapeHtml(item.category || "Opportunity")}</p>

        <p>${escapeHtml(item.country || "International")}</p>

        <p>
          Deadline: ${dateText(item.deadline)}
        </p>

        <p>${escapeHtml(item.description || "")}</p>

        ${
          item.website
            ? `<a href="${escapeHtml(item.website)}"
                 target="_blank"
                 rel="noopener noreferrer">
                 View official details ↗
               </a>`
            : ""
        }

      </div>

      <button
        class="btn ${isSaved(item.id) ? "secondary" : ""}"
        data-save-opportunity="${escapeHtml(item.id)}"
      >
        ${isSaved(item.id) ? "Saved" : "Save"}
      </button>

    </article>
  `).join("");
}

/* =====================================================
   FILTER OPPORTUNITIES
===================================================== */

function filterOpportunities() {
  const search =
    $("opportunitySearch")?.value.toLowerCase() || "";

  const category =
    $("opportunityCategory")?.value || "";

  document.querySelectorAll(".opportunity-card").forEach(card => {

    const matchesSearch =
      card.dataset.title.includes(search);

    const matchesCategory =
      !category || card.dataset.category === category;

    card.style.display =
      matchesSearch && matchesCategory ? "flex" : "none";
  });
}
