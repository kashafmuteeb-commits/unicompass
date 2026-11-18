import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://qopuyrsriphebzzgvecl.supabase.co",
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s"
);

const $ = (id) => document.getElementById(id);
const authView = $("authView");
const appView = $("appView");
const authForm = $("authForm");
const pageContent = $("pageContent");
const notice = $("notice");
let mode = "signin";
let user = null;
let activePage = "overview";
let pageRequest = 0;
let profile = {};

const h = (value = "") => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

function message(text, kind = "error") {
  if (!notice) return;
  notice.textContent = text;
  notice.className = `notice ${kind}`;
}

function setMode(next) {
  mode = next;
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
  $("formSubtitle").textContent = signup ? "Start organizing your student journey." : reset ? "We will send you a password reset link." : "Pick up where you left off.";
  $("submitText").textContent = signup ? "Create account" : reset ? "Send reset link" : "Sign in";
  $("switchCopy").innerHTML = signup
    ? 'Already have an account? <button class="text-button" id="switchMode" type="button">Sign in</button>'
    : 'New to UniCompass? <button class="text-button" id="switchMode" type="button">Create an account</button>';
  $("switchMode").onclick = () => setMode(signup ? "signin" : "signup");
  if (notice) { notice.textContent = ""; notice.className = "notice hidden"; }
}

function showLogin() {
  user = null;
  appView.classList.add("hidden");
  appView.style.display = "none";
  authView.classList.remove("hidden");
  setMode("signin");
}

async function handleAuth(event) {
  event.preventDefault();
  const button = $("submitButton");
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const fullName = $("fullName").value.trim();
  button.disabled = true;
  $("submitText").textContent = "Please wait...";
  if (notice) { notice.textContent = ""; notice.className = "notice hidden"; }
  try {
    let result;
    if (mode === "signup") {
      if (!fullName) throw new Error("Please enter your full name.");
      if (password.length < 8) throw new Error("Password must contain at least 8 characters.");
      result = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: location.origin + location.pathname }
      });
      if (result.error) throw result.error;
      if (result.data.session) {
        await enterApp(result.data.session.user);
      } else {
        authForm.reset();
        setMode("signin");
        message("Account created. Check your email to verify it, then sign in.", "success");
      }
    } else if (mode === "reset") {
      result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (result.error) throw result.error;
      message("If an account exists, a password reset link has been sent.", "success");
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      await enterApp(result.data.user);
    }
  } catch (error) {
    message(error?.message || "Could not complete the request. Please try again.");
  } finally {
    button.disabled = false;
    $("submitText").textContent = mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in";
  }
}

async function enterApp(signedInUser) {
  if (!signedInUser) return;
  user = signedInUser;
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  appView.style.display = "grid";
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
  $("sidebarName").textContent = displayName;
  $("sidebarEmail").textContent = user.email || "";
  $("userAvatar").textContent = displayName.charAt(0).toUpperCase();
  await renderPage(activePage);
}

function heading(eyebrow, title, subtitle) {
  return `<div class="welcome-row"><div><span class="eyebrow">${h(eyebrow)}</span><h1>${h(title)}</h1><p>${h(subtitle)}</p></div></div>`;
}

function showPageError(error) {
  pageContent.innerHTML = `<section class="panel"><h2>Could not load this section</h2><p>${h(error?.message || "Please check your connection and try again.")}</p><button class="btn" id="retryPage" type="button">Try again</button></section>`;
}

async function renderPage(page) {
  if (!user) return;
  activePage = page;
  const request = ++pageRequest;
  const breadcrumb = $("breadcrumb");
  breadcrumb.textContent = `Workspace / ${page.charAt(0).toUpperCase()}${page.slice(1)}`;
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.page === page));
  pageContent.innerHTML = `<section class="panel"><h2>Loading your workspace...</h2><p>Please wait.</p></section>`;
  try {
    let content;
    if (page === "overview") content = await overviewPage();
    else if (page === "profile") content = await profilePage();
    else if (page === "journal") content = await journalPage();
    else if (page === "roadmap") content = await roadmapPage();
    else if (page === "universities") content = universitiesPage();
    else if (page === "opportunities") content = await opportunitiesPage();
    else content = await overviewPage();
    if (request === pageRequest) pageContent.innerHTML = content;
  } catch (error) {
    console.error(`Unable to render ${page}:`, error);
    if (request === pageRequest) showPageError(error);
  }
}

async function getRows(table, orderColumn = "created_at") {
  const { data, error } = await supabase.from(table).select("*").eq("user_id", user.id).order(orderColumn, { ascending: false });
  if (error) throw error;
  return data || [];
}

async function overviewPage() {
  const [tasks, journal] = await Promise.all([
    getRows("roadmap_tasks", "sort_order").catch(() => []),
    getRows("journal_entries", "entry_date").catch(() => [])
  ]);
  const done = tasks.filter((task) => task.status === "done").length;
  return `${heading("YOUR STUDENT WORKSPACE", `Welcome back, ${profile.full_name || user.user_metadata?.full_name || "Student"}.`, "Your academic journey, organized in one place.")}
    <div class="setup-banner"><div class="setup-icon">✦</div><div><strong>Your journey, one step at a time.</strong><p>Record your work, choose universities and build your next steps.</p></div></div>
    <div class="stats-grid"><article class="stat-card"><span class="stat-label">ROADMAP</span><strong>${done}/${tasks.length}</strong><span class="stat-note">Tasks completed</span></article><article class="stat-card"><span class="stat-label">DAILY LOGS</span><strong>${journal.length}</strong><span class="stat-note">Journal entries</span></article><article class="stat-card"><span class="stat-label">PROFILE</span><strong>${profile.full_name ? "Ready" : "Set up"}</strong><span class="stat-note">Your student details</span></article></div>
    <div class="section-heading"><h2>Your progress</h2><span class="badge">${tasks.length ? Math.round(done / tasks.length * 100) : 0}% complete</span></div><div class="progress"><span style="width:${tasks.length ? Math.round(done / tasks.length * 100) : 0}%"></span></div>
    <div class="two-grid"><section class="panel"><h3>Your next steps</h3>${tasks.filter((task) => task.status !== "done").slice(0, 4).map((task) => `<div class="task-row"><span class="task-num">→</span><div><strong>${h(task.title)}</strong><p>${h(task.description || "")}</p></div></div>`).join("") || '<p class="empty">No pending tasks yet.</p>'}<button class="btn" data-go="roadmap" type="button">Open roadmap</button></section><section class="panel"><h3>Get started</h3><p>Keep your goals, applications, and daily progress together in one place.</p><div class="actions"><button class="btn secondary" data-go="profile" type="button">Complete profile</button><button class="btn secondary" data-go="journal" type="button">Write a journal entry</button></div></section></div>`;
}

async function profilePage() {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  profile = data || { full_name: user.user_metadata?.full_name || "" };
  return `${heading("YOUR DETAILS", "Student profile", "Keep your academic information updated.")}<section class="panel"><h3>Personal and academic information</h3><form id="profileForm" class="form-grid"><div class="form-field"><label>Full name</label><input class="control" name="full_name" value="${h(profile.full_name)}" required></div><div class="form-field"><label>Country</label><input class="control" name="country" value="${h(profile.country)}" placeholder="e.g. Pakistan"></div><div class="form-field"><label>Current education</label><input class="control" name="current_education" value="${h(profile.current_education)}" placeholder="e.g. Grade 11"></div><div class="form-field"><label>Intended degree</label><select class="control" name="intended_degree"><option value="">Choose</option>${["Bachelor's", "Master's", "Doctorate", "Other"].map((v) => `<option ${profile.intended_degree === v ? "selected" : ""}>${h(v)}</option>`).join("")}</select></div><div class="form-field"><label>Intended subject</label><input class="control" name="intended_subject" value="${h(profile.intended_subject)}" placeholder="e.g. Biology"></div><div class="form-field"><label>Intended start year</label><input class="control" type="number" min="2026" max="2040" name="intended_start_year" value="${h(profile.intended_start_year || "")}"></div><div class="form-field full"><button class="btn" type="submit">Save profile</button></div></form><div id="formFeedback" role="status"></div></section>`;
}

async function roadmapPage() {
  const { data, error } = await supabase.from("roadmap_tasks").select("*").eq("user_id", user.id).order("sort_order");
  if (error) throw error;
  const tasks = data || [];
  return `${heading("PLAN YOUR NEXT STEPS", "Your roadmap", "Break your university goals into manageable actions.")}<section class="panel"><h3>Add a roadmap task</h3><form id="taskForm" class="form-grid"><div class="form-field"><label>Task</label><input class="control" name="title" placeholder="e.g. Research application deadlines" required></div><div class="form-field"><label>Due date</label><input class="control" name="due_date" type="date"></div><div class="form-field full"><label>Details</label><textarea class="control" name="description" placeholder="Add helpful details"></textarea></div><div class="form-field full"><button class="btn" type="submit">Add task</button></div></form><div id="formFeedback" role="status"></div></section><section class="panel"><h3>Your tasks (${tasks.length})</h3>${tasks.map((task) => `<div class="list-row"><div style="flex:1"><strong>${h(task.title)}</strong><p>${h(task.description || "")}${task.due_date ? ` · Due ${h(task.due_date)}` : ""}</p></div><button class="btn ${task.status === "done" ? "secondary" : ""}" type="button" data-toggle-task="${h(task.id)}" data-task-status="${h(task.status)}">${task.status === "done" ? "Completed" : "Mark done"}</button><button class="btn danger" type="button" data-delete-task="${h(task.id)}">Delete</button></div>`).join("") || '<p class="empty">No roadmap tasks yet. Add your first one above.</p>'}</section>`;
}

async function journalPage() {
  const { data, error } = await supabase.from("journal_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false });
  if (error) throw error;
  const entries = data || [];
  return `${heading("YOUR DAILY RECORD", "Daily journal", "Record what you worked on and what you learned.")}<section class="panel"><h3>New journal entry</h3><form id="journalForm" class="form-grid"><div class="form-field"><label>Title</label><input class="control" name="title" required placeholder="e.g. Biology research"></div><div class="form-field"><label>Date</label><input class="control" name="entry_date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></div><div class="form-field full"><label>What did you work on?</label><textarea class="control" name="activity" required></textarea></div><div class="form-field full"><label>What did you learn?</label><textarea class="control" name="learning"></textarea></div><div class="form-field full"><button class="btn" type="submit">Save entry</button></div></form><div id="formFeedback" role="status"></div></section><section class="panel"><h3>Previous entries</h3>${entries.map((entry) => `<div class="list-row"><div><strong>${h(entry.title)}</strong><p>${h(entry.entry_date || "")}</p><p>${h(entry.activity || "")}</p>${entry.learning ? `<p>${h(entry.learning)}</p>` : ""}</div></div>`).join("") || '<p class="empty">No journal entries yet.</p>'}</section>`;
}

function universitiesPage() {
  const schools = [
    ["Massachusetts Institute of Technology", "USA", "https://www.mit.edu"], ["Stanford University", "USA", "https://www.stanford.edu"],
    ["Harvard University", "USA", "https://www.harvard.edu"], ["University of Oxford", "UK", "https://www.ox.ac.uk"],
    ["University of Cambridge", "UK", "https://www.cam.ac.uk"], ["ETH Zurich", "Switzerland", "https://ethz.ch"],
    ["National University of Singapore", "Singapore", "https://nus.edu.sg"], ["University of Toronto", "Canada", "https://www.utoronto.ca"]
  ];
  return `${heading("YOUR FUTURE", "Explore universities", "Browse universities and visit their official admissions websites.")}<section class="panel"><input class="control" id="schoolSearch" placeholder="Search university or country" aria-label="Search universities">${schools.map(([name, country, url]) => `<article class="list-row school-card" data-school="${h((name + " " + country).toLowerCase())}"><div style="flex:1"><strong>${h(name)}</strong><p>${h(country)}</p></div><a class="btn secondary" href="${h(url)}" target="_blank" rel="noopener noreferrer">Official website ↗</a></article>`).join("")}</section>`;
}

async function opportunitiesPage() {
  const { data, error } = await supabase.from("opportunities").select("*").eq("active", true).order("deadline");
  if (error) throw error;
  return `${heading("EXPLORE YOUR OPTIONS", "Opportunities", "Find scholarships, competitions and programs.")}<section class="panel"><input class="control" id="opportunitySearch" placeholder="Search opportunities"><div id="opportunityList">${(data || []).map((item) => `<article class="list-row opportunity-card" data-title="${h((item.title || "").toLowerCase())}"><div style="flex:1"><strong>${h(item.title)}</strong><p>${h(item.category || "Opportunity")} · ${h(item.country || "International")}</p><p>${h(item.description || "")}</p>${item.official_url ? `<a href="${h(item.official_url)}" target="_blank" rel="noopener noreferrer">Official details ↗</a>` : ""}</div></article>`).join("") || '<p class="empty">No opportunities are listed yet.</p>'}</div></section>`;
}

async function submitData(form, table, values, successText) {
  const feedback = $("formFeedback");
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const { error } = await supabase.from(table).insert({ ...values, user_id: user.id });
    if (error) throw error;
    await renderPage(activePage);
    const nextFeedback = $("formFeedback");
    if (nextFeedback) { nextFeedback.textContent = successText; nextFeedback.className = "notice success"; }
  } catch (error) {
    if (feedback) { feedback.textContent = error.message || "Could not save your changes."; feedback.className = "notice"; }
    button.disabled = false;
  }
}

authForm.addEventListener("submit", handleAuth);
$("forgotButton").addEventListener("click", () => setMode("reset"));
setMode("signin");

document.addEventListener("click", async (event) => {
  const nav = event.target.closest(".nav-link");
  if (nav) { event.preventDefault(); await renderPage(nav.dataset.page); return; }
  const go = event.target.closest("[data-go]");
  if (go) { await renderPage(go.dataset.go); return; }
  if (event.target.closest("#retryPage")) { await renderPage(activePage); return; }
  if (event.target.closest("#logoutButton")) {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    else showLogin();
    return;
  }
  const toggle = event.target.closest("[data-toggle-task]");
  if (toggle) {
    const nextStatus = toggle.dataset.taskStatus === "done" ? "pending" : "done";
    const { error } = await supabase.from("roadmap_tasks").update({ status: nextStatus }).eq("id", toggle.dataset.toggleTask).eq("user_id", user.id);
    if (error) alert(error.message); else await renderPage("roadmap");
    return;
  }
  const remove = event.target.closest("[data-delete-task]");
  if (remove) {
    const { error } = await supabase.from("roadmap_tasks").delete().eq("id", remove.dataset.deleteTask).eq("user_id", user.id);
    if (error) alert(error.message); else await renderPage("roadmap");
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "profileForm") {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    const feedback = $("formFeedback");
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...values });
    if (error) { feedback.textContent = error.message; feedback.className = "notice"; }
    else { profile = { ...profile, ...values }; feedback.textContent = "Profile saved."; feedback.className = "notice success"; }
  }
  if (event.target.id === "taskForm") {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    await submitData(event.target, "roadmap_tasks", { ...values, sort_order: Date.now() }, "Task added.");
  }
  if (event.target.id === "journalForm") {
    event.preventDefault();
    await submitData(event.target, "journal_entries", Object.fromEntries(new FormData(event.target)), "Journal entry saved.");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "schoolSearch") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(".school-card").forEach((card) => { card.hidden = !card.dataset.school.includes(query); });
  }
  if (event.target.id === "opportunitySearch") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(".opportunity-card").forEach((card) => { card.hidden = !card.dataset.title.includes(query); });
  }
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") showLogin();
  if (event === "SIGNED_IN" && session?.user && user?.id !== session.user.id) {
    setTimeout(() => { if (!user || user.id !== session.user.id) void enterApp(session.user); }, 0);
  }
});

(async function initialize() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) await enterApp(data.session.user);
    else showLogin();
  } catch (error) {
    console.error("Authentication initialization failed:", error);
    showLogin();
    message(error.message || "Could not connect to the sign-in service.");
  }
})();
