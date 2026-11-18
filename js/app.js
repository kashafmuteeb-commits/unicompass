import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Use only the Supabase Publishable key (sb_publishable_...), never a Secret key.
const SUPABASE_URL = "https://qopuyrsriphebzzgvecl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const authView = $("authView"), appView = $("appView"), authForm = $("authForm");
const notice = $("notice"), pageContent = $("pageContent");

let mode = "signin", currentUser = null, currentPage = "overview";
let universities = [], goals = [], achievements = [], tasks = [], journal = [], opportunities = [], saved = [];

function showMessage(text, type = "error") {
  notice.textContent = text;
  notice.className = `notice ${type}`;
}

function clearMessage() {
  notice.textContent = "";
  notice.className = "notice hidden";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function dateText(value) {
  if (!value) return "No date set";
  return new Date(value + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

function setMode(next) {
  mode = next;
  clearMessage();

  const signup = mode === "signup";
  const reset = mode === "reset";

  $("nameField").classList.toggle("hidden", !signup);
  $("fullName").required = signup;
  $("password").required = !reset;
  $("password").classList.toggle("hidden", reset);
  $("passwordHint").classList.toggle("hidden", reset);
  $("forgotButton").classList.toggle("hidden", signup || reset);

  $("formEyebrow").textContent = signup ? "GET STARTED" : reset ? "ACCOUNT RECOVERY" : "WELCOME BACK";
  $("formTitle").textContent = signup ? "Create your account" : reset ? "Reset your password" : "Sign in to your space";
  $("formSubtitle").textContent = signup
    ? "Start organizing your student journey."
    : reset
      ? "We'll send you a password reset link."
      : "Pick up where you left off.";

  $("submitText").textContent = signup ? "Create account" : reset ? "Send reset link" : "Sign in";

  $("switchCopy").innerHTML = signup
    ? 'Already have an account? <button class="text-button" id="switchMode" type="button">Sign in</button>'
    : 'New to UniCompass? <button class="text-button" id="switchMode" type="button">Create an account</button>';

  $("switchMode").onclick = () => setMode(signup ? "signin" : "signup");
}

function showLogin() {
  appView.classList.add("hidden");
  appView.style.display = "none";
  authView.classList.remove("hidden");
}

async function showApp(user) {
  currentUser = user;

  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  appView.style.display = "grid";

  const name = user.user_metadata?.full_name || user.email.split("@")[0];

  $("sidebarName").textContent = name;
  $("sidebarEmail").textContent = user.email;
  $("userAvatar").textContent = name.charAt(0).toUpperCase();

  await loadData();
  renderPage(currentPage);
}

async function loadData() {
  const uid = currentUser.id;

  const queries = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("universities").select("*").eq("active", true).order("name"),
    supabase.from("student_goals").select("*, universities(*)").eq("user_id", uid).order("created_at", { ascending: false }),
    supabase.from("achievements").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    supabase.from("roadmap_tasks").select("*").eq("user_id", uid).order("sort_order").order("created_at"),
    supabase.from("journal_entries").select("*").eq("user_id", uid).order("entry_date", { ascending: false }),
    supabase.from("opportunities").select("*").eq("active", true).order("deadline"),
    supabase.from("saved_opportunities").select("*").eq("user_id", uid)
  ]);

  for (const q of queries) {
    if (q.error) throw q.error;
  }

  [window.profile, universities, goals, achievements, tasks, journal, opportunities, saved] =
    queries.map(q => q.data);

  if (!window.profile) {
    const { error } = await supabase.from("profiles").insert({
      id: uid,
      full_name: currentUser.user_metadata?.full_name || ""
    });

    if (error) throw error;

    window.profile = {
      id: uid,
      full_name: currentUser.user_metadata?.full_name || ""
    };
  }
}

function nav(page) {
  currentPage = page;

  document.querySelectorAll(".nav-link").forEach(b => {
    b.classList.toggle("active", b.dataset.page === page);
  });

  renderPage(page);
}

function header(eyebrow, title, subtitle = "") {
  return `
    <div class="welcome-row">
      <div>
        <span class="eyebrow">${eyebrow}</span>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="date-chip">
        ${new Date().toLocaleDateString(undefined, { dateStyle: "medium" })}
      </div>
    </div>
  `;
}

function renderPage(page) {
  $("breadcrumb").textContent = "Workspace / " + page[0].toUpperCase() + page.slice(1);

  const pages = {
    overview: overviewPage,
    profile: profilePage,
    journal: journalPage,
    universities: universitiesPage,
    roadmap: roadmapPage,
    opportunities: opportunitiesPage
  };

  pageContent.innerHTML = (pages[page] || overviewPage)();
  bindPageActions();
}

function overviewPage() {
  const done = tasks.filter(t => t.status === "done").length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

  return `
    ${header(
      "YOUR STUDENT WORKSPACE",
      "Welcome back, ${escapeHtml(window.profile?.full_name || currentUser.user_metadata?.full_name || "Student")}.",
      "Your next step should be clear, realistic and based on your own goals."
    )}

    <div class="setup-banner">
      <div class="setup-icon">✦</div>
      <div>
        <strong>Your journey, one step at a time.</strong>
        <p>Select a target university, record what you have already done, then use your roadmap to decide what comes next.</p>
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

        ${tasks.filter(t => t.status !== "done").slice(0, 4).map(t => `
          <div class="task-row">
            <span class="task-num">→</span>
            <div>
              <strong>${escapeHtml(t.title)}</strong>
              <p>${escapeHtml(t.description)}</p>
            </div>
          </div>
        `).join("") || '<div class="empty">Choose a university to create your first roadmap.</div>'}

        <div class="actions">
          <button class="btn" data-go="roadmap">Open roadmap</button>
        </div>
      </section>

      <section class="panel">
        <h3>Your university goal</h3>

        ${goals.map(g => `
          <div class="list-row">
            <div>
              <strong>${escapeHtml(g.universities?.name || "University")}</strong>
              <p>${escapeHtml(g.subject || g.degree_level || "Target university")}</p>
            </div>
          </div>
        `).join("") || '<div class="empty">No university selected yet.</div>'}

        <div class="actions">
          <button class="btn secondary" data-go="universities">Choose university</button>
        </div>
      </section>
    </div>
  `;
}

function profilePage() {
  const p = window.profile || {};

  return `
    ${header(
      "YOUR DETAILS",
      "Student profile",
      "Keep your academic background and intended study plans up to date."
    )}

    <section class="panel">
      <form id="profileForm" class="form-grid">

        <div class="form-field">
          <label>Full name</label>
          <input class="control" name="full_name" value="${escapeHtml(p.full_name)}" required>
        </div>

        <div class="form-field">
          <label>Country of residence</label>
          <input class="control" name="country" value="${escapeHtml(p.country)}" placeholder="e.g. Pakistan">
        </div>

        <div class="form-field">
          <label>Current education</label>
          <input class="control" name="current_education" value="${escapeHtml(p.current_education)}" placeholder="e.g. Grade 11 / A Levels">
        </div>

        <div class="form-field">
          <label>Intended degree</label>
          <select class="control" name="intended_degree">
            <option value="">Choose</option>
            ${["Bachelor's", "Master's", "Doctorate", "Other"].map(x => `
              <option ${p.intended_degree === x ? "selected" : ""}>${x}</option>
            `).join("")}
          </select>
        </div>

        <div class="form-field">
          <label>Intended subject</label>
          <input class="control" name="intended_subject" value="${escapeHtml(p.intended_subject)}" placeholder="e.g. Biotechnology">
        </div>

        <div class="form-field">
          <label>Intended start year</label>
          <input class="control" type="number" min="2026" max="2040" name="intended_start_year" value="${p.intended_start_year || ""}">
        </div>

        <div class="form-field full">
          <button class="btn">Save profile</button>
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
          <textarea name="description" placeholder="What did you do? What was your role?"></textarea>
        </div>

        <div class="form-field">
          <label>Date</label>
          <input class="control" type="date" name="date_completed">
        </div>

        <div class="form-field">
          <label>Evidence URL (optional)</label>
          <input class="control" name="evidence_url" type="url" placeholder="https://...">
        </div>

        <div class="form-field full">
          <button class="btn">Add achievement</button>
        </div>

      </form>

      ${achievements.map(a => `
        <div class="list-row">
          <div>
            <strong>${escapeHtml(a.title)}</strong>
            <p>${escapeHtml(a.category)} · ${dateText(a.date_completed)}</p>
          </div>
          <button class="btn danger" data-delete-achievement="${a.id}">Delete</button>
        </div>
      `).join("") || '<div class="empty">No achievements added yet.</div>'}
    </section>
  `;
}

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
          <input class="control" name="title" required placeholder="e.g. Biology research">
        </div>

        <div class="form-field">
          <label>Date</label>
          <input class="control" name="entry_date" type="date" value="${new Date().toISOString().slice(0, 10)}" required>
        </div>

        <div class="form-field">
          <label>Hours (optional)</label>
          <input class="control" name="hours" type="number" min="0" max="24" step=".25" value="0">
        </div>

        <div class="form-field full">
          <label>What did you do?</label>
          <textarea name="activity" required></textarea>
        </div>

        <div class="form-field full">
          <label>What did you learn?</label>
          <textarea name="learning"></textarea>
        </div>

        <div class="form-field full">
          <button class="btn">Save journal entry</button>
        </div>

      </form>
    </section>

    <section class="panel">
      <h3>Your activity history</h3>

      ${journal.map(j => `
        <div class="list-row">
          <div style="flex:1">
            <div class="row-between">
              <strong>${escapeHtml(j.title)}</strong>
              <span class="small">${dateText(j.entry_date)}</span>
            </div>

            <p>${escapeHtml(j.activity)}</p>
            ${j.learning ? `<p><b>Learned:</b> ${escapeHtml(j.learning)}</p>` : ""}
            <span class="small">${j.hours} hours</span>
          </div>

          <button class="btn danger" data-delete-journal="${j.id}">Delete</button>
        </div>
      `).join("") || '<div class="empty">Your journal is empty. Add your first entry above.</div>'}
    </section>
  `;
}

function universitiesPage() {
  return `
    ${header(
      "GLOBAL UNIVERSITY DIRECTORY",
      "Choose your target university",
      "This is a curated starter directory. Always verify course-specific requirements on the official university website."
    )}

    <section class="panel">
      <h3>Your selected universities</h3>

      ${goals.map(g => `
        <div class="list-row">
          <div style="flex:1">
            <strong>${escapeHtml(g.universities?.name || "University")}</strong>
            <p>${escapeHtml(g.universities?.country || "")} · ${escapeHtml(g.subject || "Subject not set")}</p>
          </div>

          <a class="link" target="_blank" rel="noopener" href="${escapeHtml(g.universities?.admissions_url || "#")}">
            Official admissions ↗
          </a>
        </div>
      `).join("") || '<div class="empty">You have not selected a target university yet.</div>'}
    </section>

    <section class="panel">
      <h3>Curated universities</h3>
      <input id="universitySearch" class="control" placeholder="Search by university or country...">
      <div id="universityList">${universityCards(universities)}</div>
    </section>
  `;
}

function universityCards(list) {
  return list.map(u => `
    <div class="list-row">
      <div style="flex:1">
        <strong>${escapeHtml(u.name)}</strong>
        <p>${escapeHtml(u.country)} · ${escapeHtml(u.description)}</p>
        <a class="link" target="_blank" rel="noopener" href="${escapeHtml(u.admissions_url)}">
          Official admissions page ↗
        </a>
      </div>

      <button class="btn" data-add-goal="${u.id}">Select</button>
    </div>
  `).join("") || '<div class="empty">No matching universities.</div>';
}

function roadmapPage() {
  return `
    ${header(
      "YOUR PERSONAL PLAN",
      "My roadmap",
      "Your tasks are a planning guide, not an admissions decision. Confirm every requirement with the university."
    )}

    <section class="panel">
      <h3>Create your roadmap</h3>
      <p>Select a university first. Then add the next steps that apply to your course and applicant profile.</p>

      <div class="actions">
        <button class="btn" data-go="universities">Choose a university</button>
        <button class="btn secondary" id="generateTasks">Create starter tasks</button>
      </div>
    </section>

    <section class="panel">
      <div class="row-between">
        <h3>Tasks</h3>
        <span class="badge">${tasks.filter(t => t.status === "done").length}/${tasks.length} completed</span>
      </div>

      <form id="taskForm" class="form-grid">

        <div class="form-field">
          <label>Task title</label>
          <input class="control" name="title" required placeholder="e.g. Check subject prerequisites">
        </div>

        <div class="form-field">
          <label>Category</label>
          <select class="control" name="category">
            <option>Research</option>
            <option>Academics</option>
            <option>Testing</option>
            <option>Documents</option>
            <option>Funding</option>
            <option>Application</option>
            <option>Planning</option>
          </select>
        </div>

        <div class="form-field full">
          <label>What needs to be done?</label>
          <textarea name="description"></textarea>
        </div>

        <div class="form-field">
          <label>Due date (optional)</label>
          <input class="control" name="due_date" type="date">
        </div>

        <div class="form-field">
          <label>Official information URL (optional)</label>
          <input class="control" name="source_url" type="url">
        </div>

        <div class="form-field full">
          <button class="btn">Add task</button>
        </div>

      </form>

      ${tasks.map(t => `
        <div class="list-row">
          <input type="checkbox" data-task-done="${t.id}" ${t.status === "done" ? "checked" : ""}>

          <div style="flex:1">
            <strong>${escapeHtml(t.title)}</strong>
            <p>${escapeHtml(t.description)} · ${escapeHtml(t.category)} · ${dateText(t.due_date)}</p>

            ${t.source_url ? `
              <a class="link" href="${escapeHtml(t.source_url)}" target="_blank" rel="noopener">Open source ↗</a>
            ` : ""}
          </div>

          <button class="btn danger" data-delete-task="${t.id}">Delete</button>
        </div>
      `).join("") || '<div class="empty">No tasks yet. Create starter tasks or add your own.</div>'}
    </section>
  `;
}
