import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// This enhancement is deliberately isolated from the existing auth and legacy pages.
// It uses the same public Supabase client configuration; RLS remains authoritative.
const supabase = createClient(
  "https://qopuyrsriphebzzgvecl.supabase.co",
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s"
);
const root = document.getElementById("pageContent");
const $ = (id) => document.getElementById(id);
const esc = (v = "") => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (v) => { try { const u = new URL(v); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
let user = null;
let profile = {};
let universities = [];
let opportunities = [];
let taskRows = [];
let savedIds = new Set();
let detailUniversity = null;
let detailOpportunity = null;
let activeView = "";
const verifiedToday = new Date().toISOString().slice(0, 10);

const universityCatalog = [
  { name: "Massachusetts Institute of Technology", country: "United States", location: "Cambridge, Massachusetts", url: "https://mitadmissions.org/", source: "https://mitadmissions.org/apply/firstyear/" },
  { name: "Stanford University", country: "United States", location: "Stanford, California", url: "https://admission.stanford.edu/", source: "https://admission.stanford.edu/apply/" },
  { name: "Harvard University", country: "United States", location: "Cambridge, Massachusetts", url: "https://college.harvard.edu/admissions", source: "https://college.harvard.edu/admissions/apply" },
  { name: "University of Oxford", country: "United Kingdom", location: "Oxford, England", url: "https://www.ox.ac.uk/admissions/undergraduate", source: "https://www.ox.ac.uk/admissions/undergraduate/applying-to-oxford" },
  { name: "University of Cambridge", country: "United Kingdom", location: "Cambridge, England", url: "https://www.undergraduate.study.cam.ac.uk/", source: "https://www.undergraduate.study.cam.ac.uk/apply" },
  { name: "ETH Zurich", country: "Switzerland", location: "Zurich", url: "https://ethz.ch/en/studies.html", source: "https://ethz.ch/en/studies/bachelor/application.html" },
  { name: "National University of Singapore", country: "Singapore", location: "Singapore", url: "https://nus.edu.sg/oam", source: "https://nus.edu.sg/oam/admissions" },
  { name: "University of Toronto", country: "Canada", location: "Toronto, Ontario", url: "https://future.utoronto.ca/", source: "https://future.utoronto.ca/apply/" },
  { name: "California Institute of Technology", country: "United States", location: "Pasadena, California", url: "https://www.admissions.caltech.edu/", source: "https://www.admissions.caltech.edu/apply" },
  { name: "Princeton University", country: "United States", location: "Princeton, New Jersey", url: "https://admission.princeton.edu/", source: "https://admission.princeton.edu/apply" },
  { name: "Yale University", country: "United States", location: "New Haven, Connecticut", url: "https://admissions.yale.edu/", source: "https://admissions.yale.edu/applying-yale" },
  { name: "University of Edinburgh", country: "United Kingdom", location: "Edinburgh, Scotland", url: "https://www.ed.ac.uk/studying/undergraduate", source: "https://www.ed.ac.uk/studying/undergraduate/applying" }
];

// Resources below are official/primary sources. ISEF is not a direct-entry application;
// local affiliated-fair deadlines vary. NSEF affiliation and active-cycle requirements are
// explicitly left for verification rather than inferred from historic promotional material.
const opportunityCatalog = [
  { title: "Regeneron International Science and Engineering Fair (ISEF)", organization: "Society for Science", category: "Research competition", country: "International", description: "Students must first qualify through an official affiliated science fair; direct student registration to ISEF is not available. The affiliated fair sets local deadlines and selects/ registers its participants.", eligibility: "See current Society for Science rules and the affiliated fair's eligibility. Affiliated-fair qualification is required.", grade_requirements: "Verification Required: check current ISEF rules and affiliated fair.", age_restrictions: "Verification Required: check current ISEF rules.", country_restrictions: "International, through participating affiliated fairs.", registration_deadline: null, application_process: "Find the Society for Science affiliated fair directory, then follow that fair's application and selection process. Do not register directly with ISEF.", fees: "Verification Required; any fees are set by the affiliated fair.", fee_waivers: "Verification Required; ask the affiliated fair.", official_url: "https://www.societyforscience.org/isef/", official_application_url: "https://www.societyforscience.org/isef/affiliated-fairs/", source_url: "https://www.societyforscience.org/isef/faq/", last_verified_date: "2026-11-19", verification_status: "Official qualification pathway confirmed; cycle eligibility/deadline requires checking affiliated fair." },
  { title: "National Science and Engineering Fair Pakistan (NSEF)", organization: "Pakistan Science Club", category: "Research competition", country: "Pakistan", description: "Pakistan-based science and engineering fair information. Confirm the current edition's organizer notice and eligibility before applying. Its current ISEF affiliation and whether placement qualifies for ISEF are Verification Required.", eligibility: "Verification Required: use the current organizer's published call for applications.", grade_requirements: "Verification Required: current call required.", age_restrictions: "Verification Required: current call required.", country_restrictions: "Pakistan (confirm current edition terms).", registration_deadline: null, application_process: "Follow the current Pakistan Science Club notice and registration instructions; no deadline is asserted here.", fees: "Verification Required.", fee_waivers: "Verification Required.", official_url: "https://paksc.org/programs/nsif/", official_application_url: "https://paksc.org/programs/nsif/", source_url: "https://paksc.org/blog/intel-isef-affiliated-national-science-fair-pakistan-participation-guidelines", last_verified_date: "2026-11-19", verification_status: "Organizer source listed; current eligibility, cycle dates and ISEF affiliation require verification." },
  { title: "Official SAT practice", organization: "College Board / Khan Academy", category: "Academic preparation", country: "International", description: "Free official SAT practice resources; a preparation resource, not a competition or scholarship.", eligibility: "Open resource.", grade_requirements: "No grade restriction stated by resource.", age_restrictions: "No age restriction stated by resource.", country_restrictions: "International access; confirm local availability.", registration_deadline: null, application_process: "Use official digital SAT practice resources.", fees: "Free practice resource.", fee_waivers: "Not applicable to practice resource.", official_url: "https://satsuite.collegeboard.org/practice", official_application_url: "https://www.khanacademy.org/test-prep/sat", source_url: "https://satsuite.collegeboard.org/practice", last_verified_date: "2026-11-19", verification_status: "Official resource." }
];

const majorTasks = {
  biotechnology: ["Plan a biology or biotechnology research question with a qualified mentor", "Join a chemistry or biology competition or science fair", "Build a community project connected to health, biology or the environment"],
  biology: ["Develop a biology research question and keep a research logbook", "Explore a science fair and biology enrichment opportunity", "Create a community project connected to ecology or health"],
  "computer science": ["Build and document an original programming project", "Try a reputable hackathon or coding competition", "Contribute to an open-source project with clear documentation"],
  engineering: ["Build and document an engineering design project", "Explore robotics or engineering competitions", "Strengthen mathematics and physics through enrichment"],
  business: ["Develop a small entrepreneurship or financial-literacy project", "Practice with a case competition or business challenge", "Take responsibility for a measurable leadership initiative"]
};
const baseTasks = [
  ["Academic Preparation", "Review subject prerequisites for shortlisted universities and keep transcripts organized.", "High", "https://bigfuture.collegeboard.org/plan-for-college/stand-out-in-high-school"],
  ["Academic Preparation", "Maintain strong grades; for STEM, prioritize Biology, Chemistry, Mathematics and English where relevant to your courses.", "High", "https://bigfuture.collegeboard.org/plan-for-college/stand-out-in-high-school"],
  ["SAT Preparation", "Take an official SAT diagnostic and record Reading & Writing and Math baselines.", "High", "https://satsuite.collegeboard.org/practice"],
  ["SAT Preparation", "Set weekly SAT study sessions and review progress in both sections.", "Medium", "https://www.khanacademy.org/test-prep/sat"],
  ["SAT Preparation", "Check each university's test policy and set a personal target; 1500+ may be a suggested stretch target for highly selective STEM programs, never an admission cutoff or guarantee.", "High", "https://satsuite.collegeboard.org/"],
  ["Research Preparation", "Choose an original, manageable research question and find a qualified mentor; agree on safety and ethics before collecting data.", "High", "https://www.societyforscience.org/isef/ rules"],
  ["Research Preparation", "Keep dated notes in a research logbook, collect genuine data ethically, and prepare an abstract and presentation.", "Medium", "https://www.societyforscience.org/isef/"],
  ["Research Preparation", "Explore legitimate competitions through their official organizers; publish only when appropriate, ethical and supported by credible scholarly review.", "Medium", "https://www.societyforscience.org/isef/affiliated-fairs/"],
  ["Activities", "Choose sustained leadership, service, volunteering and independent projects that reflect real interests and impact.", "Medium", "https://www.commonapp.org/plan/your-high-school-checklist"],
  ["Application Preparation", "Build a balanced university shortlist and record official admissions, scholarship and financial-aid links.", "High", "https://www.commonapp.org/"],
  ["Application Preparation", "Ask potential recommenders early and prepare an accurate activities list and personal essay drafts.", "High", "https://www.commonapp.org/"],
  ["Application Preparation", "Confirm each application deadline, interview policy and financial-aid document requirement on official university pages.", "High", "https://www.commonapp.org/" ]
];
const taskUrl = (url) => safeUrl(url) || "";
const dateOffset = (months) => { const d = new Date(); d.setMonth(d.getMonth() + months); return d.toISOString().slice(0, 10); };

function normalizedStatus(task) {
  if (task.status_new) return task.status_new;
  return task.status === "done" ? "Completed" : "Not Started";
}
function currentGrade() {
  const match = String(profile.current_education || "").match(/(?:grade|year|class)?\s*(9|10|11|12)\b/i);
  return match ? Number(match[1]) : null;
}
function tasksForStudent() {
  const grade = currentGrade();
  const entries = baseTasks.map((task, i) => ({ category: task[0], title: task[1], priority: task[2], source: task[3], months: Math.min(12, Math.max(1, (12 - (grade || 11)) * 4 + i)) }));
  if (grade === 11 || !grade) entries.unshift({ category: "Grade planning", title: `Plan backward from Fall ${profile.intended_start_year || new Date().getFullYear() + 2} admission: confirm grade progression, testing dates and application cycle.`, priority: "High", source: "https://www.commonapp.org/plan/your-high-school-checklist", months: 1 });
  if (grade === 9 || grade === 10) entries.unshift({ category: "Grade planning", title: "Build a steady academic foundation and explore interests before narrowing your university list.", priority: "High", source: "https://bigfuture.collegeboard.org/plan-for-college/stand-out-in-high-school", months: 2 });
  if (grade === 12) entries.unshift({ category: "Grade planning", title: "Confirm this application cycle's deadlines and submit materials through each official application portal.", priority: "High", source: "https://www.commonapp.org/", months: 1 });
  const major = String(profile.intended_subject || "").toLowerCase();
  const matches = Object.entries(majorTasks).find(([key]) => major.includes(key));
  if (matches) matches[1].forEach((title, i) => entries.push({ category: `${matches[0]} activities`, title, priority: i === 0 ? "High" : "Medium", source: "https://www.societyforscience.org/isef/", months: 3 + i * 2 }));
  return entries;
}
function taskStatus(task) { return normalizedStatus(task); }
function pct() { return taskRows.length ? Math.round(taskRows.filter(t => taskStatus(t) === "Completed").length / taskRows.length * 100) : 0; }
function officialLink(url, label) { const href = safeUrl(url); return href ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : "Verification Required"; }

async function getProfile() {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  profile = data || { full_name: user.user_metadata?.full_name || "" };
}
async function loadTasks() {
  const { data, error } = await supabase.from("roadmap_tasks").select("*").eq("user_id", user.id).order("sort_order", { ascending: true });
  if (error) throw error;
  taskRows = data || [];
}
async function loadOpportunityData() {
  const [opps, saved] = await Promise.all([
    supabase.from("opportunities").select("*").eq("active", true).order("deadline", { ascending: true, nullsFirst: false }),
    supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id)
  ]);
  // An unapplied migration must not make unrelated functions fail: use safe official reference cards.
  opportunities = opps.error ? [] : opps.data || [];
  savedIds = new Set(saved.error ? [] : (saved.data || []).map(x => String(x.opportunity_id)));
}
async function loadUniversities() {
  const result = await supabase.from("universities").select("*").eq("active", true).order("name");
  universities = result.error ? [] : result.data || [];
}
function universityRecord(item) {
  const row = universities.find(u => u.name?.toLowerCase() === item.name.toLowerCase());
  return { ...item, ...(row || {}), name: row?.name || item.name, country: row?.country || item.country, location: row?.location || item.location, website: row?.admissions_url || item.url, source: row?.source_url || item.source };
}

async function ensureRoadmap() {
  await loadTasks();
  if (taskRows.length) return;
  const generated = tasksForStudent();
  const records = generated.map((t, i) => ({ user_id: user.id, title: t.title, category: t.category, description: t.title, due_date: dateOffset(t.months), source_url: t.source, official_resource_url: t.source, priority: t.priority, status: "pending", status_new: "Not Started", sort_order: i + 1, verification_status: "Resource link provided; verify current admissions cycle" }));
  const { error } = await supabase.from("roadmap_tasks").insert(records);
  if (error) throw new Error(error.message.includes("column") ? "Run supabase/20261119_upgrade.sql in Supabase first to enable personalized roadmap fields." : error.message);
  await loadTasks();
}
function renderTask(t) {
  const status = taskStatus(t);
  const resource = safeUrl(t.official_resource_url || t.source_url);
  return `<article class="uc-task"><label class="uc-task-check"><input type="checkbox" data-progress-task="${esc(t.id)}" ${status === "Completed" ? "checked" : ""} aria-label="Mark ${esc(t.title)} completed"><span></span></label><div class="uc-task-body"><div class="uc-task-top"><strong>${esc(t.title)}</strong><span class="badge">${esc(t.priority || "Medium")} priority</span></div><p>${esc(t.category || "Preparation")} · Due ${esc(t.due_date || "Set a deadline")}</p>${resource ? `<a href="${esc(resource)}" target="_blank" rel="noopener noreferrer">Official resource ↗</a>` : `<span class="uc-unverified">Resource verification required</span>`}</div><select class="control uc-status" data-task-status="${esc(t.id)}" aria-label="Task status"><option ${status === "Not Started" ? "selected" : ""}>Not Started</option><option ${status === "In Progress" ? "selected" : ""}>In Progress</option><option ${status === "Completed" ? "selected" : ""}>Completed</option></select><button class="text-button" data-delete-roadmap-task="${esc(t.id)}" type="button" aria-label="Delete task">Remove</button></article>`;
}
async function roadmapPage() {
  await getProfile();
  await ensureRoadmap();
  const done = taskRows.filter(t => taskStatus(t) === "Completed").length;
  const upcoming = taskRows.filter(t => taskStatus(t) !== "Completed" && t.due_date).sort((a,b) => a.due_date.localeCompare(b.due_date)).slice(0,4);
  const grade = currentGrade();
  return `<div class="welcome-row"><div><span class="eyebrow">PERSONALIZED PREPARATION</span><h1>Your admission roadmap</h1><p>${grade ? `Grade ${grade}` : "Add your grade in your profile"} · ${esc(profile.intended_subject || "Choose a major in your profile")} · Fall ${esc(profile.intended_start_year || "admission year not set")}</p></div></div><section class="panel uc-roadmap-summary"><div><strong>${pct()}%</strong><span>Overall progress</span></div><div class="progress"><span style="width:${pct()}%"></span></div><p>${done} of ${taskRows.length} tasks completed</p></section><section class="panel"><h2>Personalize your plan</h2><p>Set your current grade, major and intended university start year in your profile, then regenerate only if no tasks have been saved yet.</p><button class="btn secondary" data-go="profile" type="button">Edit student profile</button><button class="btn secondary" data-regenerate-roadmap type="button">Add missing grade/major tasks</button></section><section class="panel"><div class="section-heading"><h2>Roadmap timeline</h2><span class="badge">${taskRows.length} tasks</span></div><form id="ucAddTask" class="form-grid uc-add-task"><div class="form-field"><label for="ucTaskTitle">Task</label><input id="ucTaskTitle" name="title" class="control" required></div><div class="form-field"><label>Category</label><input name="category" class="control" value="Planning"></div><div class="form-field"><label>Priority</label><select name="priority" class="control"><option>Medium</option><option>High</option><option>Low</option></select></div><div class="form-field"><label>Deadline</label><input type="date" name="due_date" class="control"></div><div class="form-field"><label>Official resource URL</label><input type="url" name="official_resource_url" class="control" placeholder="https://..."></div><div class="form-field full"><button class="btn" type="submit">Add task</button><span id="ucRoadmapFeedback" class="notice hidden" role="status"></span></div></form>${taskRows.length ? taskRows.map(renderTask).join("") : '<p class="empty">No roadmap tasks yet.</p>'}</section><section class="panel"><h2>Upcoming deadlines</h2>${upcoming.map(t => `<div class="list-row"><div><strong>${esc(t.title)}</strong><p>${esc(t.due_date)}</p></div></div>`).join("") || '<p class="empty">No deadlines set for pending tasks.</p>'}</section>`;
}

async function universityPage(item) {
  const u = universityRecord(item);
  detailUniversity = u;
  const fields = [
    ["Admission requirements", u.admission_requirements], ["SAT/ACT policy", u.sat_act_policy], ["Recommended SAT range", u.recommended_sat_range], ["English proficiency", u.english_requirements], ["Academic prerequisites", u.academic_prerequisites], ["Application deadlines", u.application_deadlines], ["Essays and personal statements", u.essays_requirements], ["Recommendation letters", u.recommendation_requirements], ["Required documents", u.required_documents], ["Scholarships and financial aid", u.scholarships]
  ];
  const checkDate = u.last_verified_date || "Not verified";
  return `<div class="university-details-page"><button class="btn secondary" data-university-list type="button">← Back to universities</button><header class="university-detail-header"><span class="eyebrow">UNIVERSITY ADMISSION GUIDE</span><h1>${esc(u.name)}</h1><p>${esc(u.location || "Location verification required")} · ${esc(u.country || "Country verification required")}</p><p>${esc(u.overview || u.description || "University overview: consult the official admissions website.")}</p><p class="uc-verification">Admission cycle: ${esc(u.admission_cycle || profile.intended_start_year || "Not specified")} · Verification: ${esc(u.verification_status || "Verification Required")} · Last verified: ${esc(checkDate)}</p><div class="university-link-actions">${u.website ? `<a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(u.website))}">Official admissions website ↗</a>` : ""}${u.application_portal_url && safeUrl(u.application_portal_url) ? `<a class="btn secondary" target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(u.application_portal_url))}">Official application portal ↗</a>` : "<span class='uc-unverified'>Application portal: Verification Required</span>"}</div></header><section class="panel university-detail-grid">${fields.map(([label, value]) => `<section class="university-detail-item"><h3>${esc(label)}</h3><p>${esc(value || "Verification Required — check the official source for this program and admission cycle.")}</p></section>`).join("")}</section><section class="panel"><h2>Official source and application cycle</h2><p>${u.source ? officialLink(u.source, "Official admissions source") : "Verification Required"} ${u.admission_cycle ? `· ${esc(u.admission_cycle)}` : ""} · ${esc(u.verification_status || "Verification Required")}</p><p>Mandatory requirements, recommended targets and historical statistics must be checked separately. Do not treat a suggested score as a cutoff.</p></section></div>`;
}
async function universitiesPage() {
  await loadUniversities();
  const catalog = universityCatalog.map(universityRecord);
  return `<div class="welcome-row"><div><span class="eyebrow">YOUR FUTURE</span><h1>Explore universities</h1><p>Select a university for its official-source admissions guide. Missing program/cycle facts are marked Verification Required.</p></div></div><section class="panel"><label class="sr-only" for="ucUniversitySearch">Search universities</label><input class="control" id="ucUniversitySearch" placeholder="Search university or country" style="width:100%;margin-bottom:16px"><div class="uc-card-grid">${catalog.map((u,i) => `<article class="school-card uc-school" data-search="${esc((u.name+" "+u.country).toLowerCase())}"><span class="eyebrow">${esc(u.country)}</span><h2>${esc(u.name)}</h2><p>${esc(u.location || "Location verification required")}</p><span class="uc-unverified">Admission facts: ${esc(u.verification_status || "Verification Required")}</span><button class="btn secondary" type="button" data-university-index="${i}">View admission guide</button></article>`).join("")}</div></section>`;
}
function opportunityRows() {
  const database = opportunities.map(item => ({ ...item, url: item.official_url || item.website }));
  const existingTitles = new Set(database.map(x => x.title?.toLowerCase()));
  return [...database, ...opportunityCatalog.filter(x => !existingTitles.has(x.title.toLowerCase()))];
}
function oppCard(o, i) {
  const saved = o.id && savedIds.has(String(o.id));
  return `<article class="opportunity-card uc-opportunity" data-search="${esc((o.title+" "+o.category+" "+o.country+" "+o.organization).toLowerCase())}" data-category="${esc(o.category || "Other")}"><div><span class="eyebrow">${esc(o.category || "Opportunity")} · ${esc(o.country || "International")}</span><h2>${esc(o.title)}</h2><p>${esc(o.description || o.eligibility || "Read the official organizer guidance.")}</p><p><strong>Deadline:</strong> ${esc(o.registration_deadline || o.deadline || "Not published / Verification Required")}</p><span class="uc-verification">${esc(o.verification_status || "Verification Required")} · Last verified ${esc(o.last_verified_date || "Not verified")}</span><div class="university-link-actions">${safeUrl(o.official_url || o.url) ? `<a class="btn secondary" href="${esc(safeUrl(o.official_url || o.url))}" target="_blank" rel="noopener noreferrer">Official details ↗</a>` : ""}<button class="btn" type="button" data-opportunity-detail="${i}">Eligibility and process</button>${o.id ? `<button class="btn secondary" type="button" data-save-opportunity="${esc(o.id)}">${saved ? "Saved" : "Save opportunity"}</button>` : ""}</div></div></article>`;
}
async function opportunitiesPage() {
  await loadOpportunityData();
  const rows = opportunityRows();
  return `<div class="welcome-row"><div><span class="eyebrow">EXPLORE YOUR OPTIONS</span><h1>Opportunities</h1><p>Search organizer-published competitions and resources. Missing current-cycle details are clearly marked.</p></div></div><section class="panel"><div class="uc-filter-row"><input class="control" id="ucOpportunitySearch" placeholder="Search opportunities"><select id="ucOpportunityCategory" class="control"><option value="">All categories</option>${[...new Set(rows.map(o=>o.category || "Other"))].map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select></div><div class="uc-card-grid">${rows.map(oppCard).join("")}</div></section><section class="panel"><h2>Saved opportunities</h2>${rows.filter(o=>o.id && savedIds.has(String(o.id))).map(o=>`<div class="list-row"><strong>${esc(o.title)}</strong></div>`).join("") || '<p class="empty">You have not saved an opportunity yet.</p>'}</section>`;
}
function opportunityDetail(o) {
  detailOpportunity = o;
  const values = [["Eligibility",o.eligibility],["Grade requirements",o.grade_requirements],["Age restrictions",o.age_restrictions],["Country restrictions",o.country_restrictions],["Registration deadline",o.registration_deadline || o.deadline],["Application process",o.application_process],["Fees",o.fees],["Scholarships / fee waivers",o.fee_waivers]];
  return `<section class="panel uc-detail"><button type="button" class="btn secondary" data-opportunity-list>← Back to opportunities</button><span class="eyebrow">${esc(o.organization || "Organizer")}</span><h1>${esc(o.title)}</h1><p class="uc-verification">${esc(o.verification_status || "Verification Required")} · Last verified ${esc(o.last_verified_date || "Not verified")}</p><div class="university-detail-grid">${values.map(([k,v])=>`<section class="university-detail-item"><h3>${esc(k)}</h3><p>${esc(v || "Verification Required — consult the current official organizer notice.")}</p></section>`).join("")}</div><p>Official application: ${officialLink(o.official_application_url || o.official_url || o.url,"Open organizer page")}</p>${o.source_url ? `<p>Source: ${officialLink(o.source_url,"Official source")}</p>` : ""}${o.title?.includes("ISEF") ? `<p><strong>Important:</strong> ISEF requires qualification through an affiliated science fair. Direct student registration is not available; consult your affiliated fair for local deadlines.</p>` : ""}${o.title?.includes("NSEF") ? `<p><strong>Important:</strong> Current eligibility, dates and ISEF affiliation are Verification Required; no international qualification is promised.</p>` : ""}</section>`;
}
async function render(view) {
  if (!root || !user) return;
  activeView = view;
  root.innerHTML = '<section class="panel"><p>Loading…</p></section>';
  try {
    let html;
    if (view === "roadmap") html = await roadmapPage();
    else if (view === "universities") html = detailUniversity ? await universityPage(detailUniversity) : await universitiesPage();
    else if (view === "opportunities") html = detailOpportunity ? opportunityDetail(detailOpportunity) : await opportunitiesPage();
    else return;
    root.innerHTML = html;
    document.querySelectorAll(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.page === view));
    const name = view === "roadmap" ? "Roadmap" : view === "universities" ? "Universities" : "Opportunities";
    $("breadcrumb").textContent = `Workspace / ${name}`;
  } catch (error) {
    root.innerHTML = `<section class="panel"><h2>Could not load ${esc(view)}</h2><p>${esc(error.message || "Please try again")}</p><p>If required, apply the reviewed migration: <code>supabase/20261119_upgrade.sql</code>.</p><button class="btn" data-enhanced-retry type="button">Retry</button></section>`;
  }
}
async function updateTaskStatus(id, status) {
  const legacy = status === "Completed" ? "done" : "pending";
  const update = await supabase.from("roadmap_tasks").update({ status_new: status, status: legacy }).eq("id", id).eq("user_id", user.id);
  if (update.error && !update.error.message.includes("status_new")) throw update.error;
  // Separate progress table provides a normalized status trail; RLS restricts it to the current user.
  if (update.error) {
    const fallback = await supabase.from("roadmap_tasks").update({ status: legacy }).eq("id", id).eq("user_id", user.id);
    if (fallback.error) throw fallback.error;
  }
  const progress = await supabase.from("user_roadmap_progress").upsert({ user_id: user.id, roadmap_task_id: id, status, completed_at: status === "Completed" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: "user_id,roadmap_task_id" });
  if (progress.error && !progress.error.message.includes("user_roadmap_progress")) throw progress.error;
  await render("roadmap");
}
async function saveProfileRoadmap(form) {
  const values = Object.fromEntries(new FormData(form));
  const result = await supabase.from("profiles").upsert({ id: user.id, ...values });
  if (result.error) throw result.error;
  profile = { ...profile, ...values };
}
async function addMissingTasks() {
  await getProfile(); await loadTasks();
  const existing = new Set(taskRows.map(t => t.title));
  const missing = tasksForStudent().filter(t=>!existing.has(t.title));
  if (!missing.length) return render("roadmap");
  const rows = missing.map((t,i)=>({user_id:user.id,title:t.title,description:t.title,category:t.category,due_date:dateOffset(t.months),source_url:t.source,official_resource_url:t.source,priority:t.priority,status:"pending",status_new:"Not Started",sort_order:taskRows.length+i+1}));
  const {error}=await supabase.from("roadmap_tasks").insert(rows);
  if(error) throw error;
  await render("roadmap");
}

// Intercept only the three upgraded screens; the existing login, journal, profile,
// overview and achievements implementation remains untouched.
document.addEventListener("click", async (event) => {
  const nav = event.target.closest(".nav-link[data-page]");
  const go = event.target.closest("[data-go]");
  const requested = nav?.dataset.page || go?.dataset.go;
  if (requested && ["roadmap", "universities", "opportunities"].includes(requested)) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (requested !== "universities") detailUniversity = null;
    if (requested !== "opportunities") detailOpportunity = null;
    await render(requested); return;
  }
  if (!user || !root) return;
  if (event.target.closest("[data-university-index]")) {
    const idx=Number(event.target.closest("[data-university-index]").dataset.universityIndex);
    detailUniversity=universityRecord(universityCatalog[idx]); await render("universities"); return;
  }
  if (event.target.closest("[data-university-list]")) { detailUniversity=null; await render("universities"); return; }
  if (event.target.closest("[data-opportunity-detail]")) { detailOpportunity=opportunityRows()[Number(event.target.closest("[data-opportunity-detail]").dataset.opportunityDetail)]; root.innerHTML=opportunityDetail(detailOpportunity); return; }
  if (event.target.closest("[data-opportunity-list]")) { detailOpportunity=null; await render("opportunities"); return; }
  if (event.target.closest("[data-regenerate-roadmap]")) { await addMissingTasks(); return; }
  if (event.target.closest("[data-enhanced-retry]")) { await render(activeView); return; }
  if (event.target.closest("[data-delete-roadmap-task]")) {
    const id=event.target.closest("[data-delete-roadmap-task]").dataset.deleteRoadmapTask;
    const {error}=await supabase.from("roadmap_tasks").delete().eq("id",id).eq("user_id",user.id);
    if(error) alert(error.message); else await render("roadmap"); return;
  }
  if (event.target.closest("[data-save-opportunity]")) {
    const id=event.target.closest("[data-save-opportunity]").dataset.saveOpportunity;
    const saved=savedIds.has(String(id));
    const response=saved ? await supabase.from("saved_opportunities").delete().eq("user_id",user.id).eq("opportunity_id",id) : await supabase.from("saved_opportunities").insert({user_id:user.id,opportunity_id:id});
    if(response.error) alert(response.error.message); else await render("opportunities"); return;
  }
});
document.addEventListener("change", async (event) => {
  if (!user) return;
  if (event.target.matches("[data-progress-task]")) {
    try { await updateTaskStatus(event.target.dataset.progressTask,event.target.checked?"Completed":"Not Started"); } catch(e) { alert(e.message); }
  }
  if (event.target.matches("[data-task-status]")) {
    try { await updateTaskStatus(event.target.dataset.taskStatus,event.target.value); } catch(e) { alert(e.message); }
  }
  if (event.target.id === "ucOpportunityCategory") filterOpportunities();
});
document.addEventListener("input", (event) => {
  if(event.target.id==="ucUniversitySearch") document.querySelectorAll(".uc-school").forEach(c=>c.hidden=!c.dataset.search.includes(event.target.value.toLowerCase()));
  if(event.target.id==="ucOpportunitySearch") filterOpportunities();
});
function filterOpportunities() {
  const query=$("ucOpportunitySearch")?.value.toLowerCase()||"";
  const category=$("ucOpportunityCategory")?.value||"";
  document.querySelectorAll(".uc-opportunity").forEach(c=>c.hidden=!(c.dataset.search.includes(query)&&(!category||c.dataset.category===category)));
}
document.addEventListener("submit", async (event) => {
  if(event.target.id==="ucAddTask") {
    event.preventDefault(); if(!user) return;
    const values=Object.fromEntries(new FormData(event.target));
    const record={user_id:user.id,title:values.title,description:values.title,category:values.category||"Planning",priority:values.priority,due_date:values.due_date||null,official_resource_url:safeUrl(values.official_resource_url)||null,source_url:safeUrl(values.official_resource_url)||null,status:"pending",status_new:"Not Started",sort_order:Date.now()};
    const {error}=await supabase.from("roadmap_tasks").insert(record);
    if(error) { const feedback=$("ucRoadmapFeedback"); if(feedback){feedback.textContent=error.message;feedback.className="notice";} return; }
    await render("roadmap");
  }
  if(event.target.id==="profileForm") {
    const form=event.target;
    const education=form.querySelector('[name="current_education"]');
    const subject=form.querySelector('[name="intended_subject"]');
    if(education && subject) {
      event.preventDefault();
      try { await saveProfileRoadmap(form); const fb=$("formFeedback"); if(fb){fb.textContent="Profile saved.";fb.className="notice success";} }
      catch(e){const fb=$("formFeedback");if(fb){fb.textContent=e.message;fb.className="notice";}}
    }
  }
}, true);

supabase.auth.onAuthStateChange((_event, session) => { user = session?.user || null; });
supabase.auth.getSession().then(({data}) => { user=data.session?.user||null; }).catch(()=>{});
