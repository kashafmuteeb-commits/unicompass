/* Grade-specific roadmap integration. Uses the existing Supabase client configuration and roadmap_tasks table. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://qopuyrsriphebzzgvecl.supabase.co",
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s"
);
const root = document.getElementById("pageContent");
const html = (value = "") => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const ROADMAPS = {
  10: [
    {
      key: "g10-major-project", category: "Major-related project",
      title: "Explore a field of interest and start a small relevant project.",
      actions: "Choose a subject that interests you; use an introductory lesson to explore it; set one small goal; create a simple prototype, experiment, portfolio piece or community resource; record what you tried and learned.",
      why: "A small project helps you test your interests and gives you experience to develop in later grades.",
      timeline: "Start this term and spend 4–8 weeks exploring and completing a first version.",
      resources: [{ label: "MIT OpenCourseWare", url: "https://ocw.mit.edu/" }]
    },
    {
      key: "g10-leadership", category: "Leadership",
      title: "Develop leadership skills through school and community activities.",
      actions: "Join a school club or community activity; volunteer for a manageable responsibility; practice communicating and organizing with others; note your role, participation and what you learn.",
      why: "Consistent participation helps you discover how you contribute and builds a foundation for future leadership.",
      timeline: "Choose an activity this term and participate consistently for at least one school term.",
      resources: [{ label: "DoSomething youth projects", url: "https://www.dosomething.org/us" }]
    },
    {
      key: "g10-university-research", category: "University research",
      title: "Explore universities, majors and admission requirements.",
      actions: "Explore 3–5 universities or programs; compare majors and courses; note published prerequisites, application routes and typical deadlines; save links to official admissions pages.",
      why: "Early exploration helps you make informed subject choices without needing to commit to a university yet.",
      timeline: "Explore over the next 2–3 months and revisit your notes each term.",
      resources: [{ label: "BigFuture college search", url: "https://bigfuture.collegeboard.org/college-search" }]
    },
    {
      key: "g10-essays", category: "Essays",
      title: "Explore personal experiences, interests and achievements. Start recording ideas.",
      actions: "Keep an idea list; write down meaningful experiences, interests, challenges and achievements; add what each taught you; focus on collecting ideas rather than drafting a final application essay.",
      why: "Collecting authentic examples over time makes it easier to reflect and write clearly when applications approach.",
      timeline: "Add one or two notes each month throughout the school year.",
      resources: [{ label: "Purdue OWL writing resources", url: "https://owl.purdue.edu/owl/general_writing/index.html" }]
    },
    {
      key: "g10-financial-aid", category: "Financial aid",
      title: "Learn about scholarships, need-based aid and financial assistance.",
      actions: "Learn the difference between scholarships, grants and loans; explore aid pages for universities you are curious about; note that eligibility varies by country and institution; discuss affordability questions with a trusted adult.",
      why: "Understanding available support early helps you and your family plan and avoid assumptions about cost.",
      timeline: "Spend 1–2 hours exploring this term and revisit your notes annually.",
      resources: [{ label: "Federal Student Aid scholarship guide", url: "https://studentaid.gov/understand-aid/types/scholarships" }]
    }
  ],
  11: [
    {
      key: "g11-major-project", category: "Major-related project",
      title: "Complete and document a substantial project, including results and personal contributions.",
      actions: "Choose a focused project connected to a likely major; set a deliverable and milestones; complete the work; document methods, results and setbacks; prepare a report, portfolio or presentation that identifies your own contribution.",
      why: "A completed project demonstrates sustained interest, follow-through and the ability to explain what you personally accomplished.",
      timeline: "Plan in the first month and complete a substantial version within 3–6 months, including time to document results.",
      resources: [{ label: "MIT OpenCourseWare", url: "https://ocw.mit.edu/" }]
    },
    {
      key: "g11-leadership", category: "Leadership",
      title: "Demonstrate measurable impact through leadership and community initiatives.",
      actions: "Take responsibility for a defined initiative; set a specific goal with the people served; track participation or outcomes; reflect on what changed and what you would improve; retain evidence of your role.",
      why: "Specific outcomes and reflection show how you supported others, rather than relying on a title alone.",
      timeline: "Lead or sustain an initiative this academic year and review outcomes monthly.",
      resources: [{ label: "DoSomething youth projects", url: "https://www.dosomething.org/us" }]
    },
    {
      key: "g11-university-research", category: "University research",
      title: "Shortlist target universities and study their admission requirements.",
      actions: "Build a realistic target list; for each university check official program requirements, prerequisites, tests, application route, documents, deadlines and international-student rules; record the source and date checked.",
      why: "A verified shortlist lets you plan around actual requirements and deadlines instead of general advice.",
      timeline: "Create a first shortlist in 4–6 weeks and review official requirements each term.",
      resources: [{ label: "BigFuture college search", url: "https://bigfuture.collegeboard.org/college-search" }]
    },
    {
      key: "g11-essays", category: "Essays",
      title: "Begin drafting personal statements and university-specific essays.",
      actions: "Find current prompts on target universities' official sites; select examples that answer each prompt; draft your personal statement and required supplemental essays; revise for clarity and specificity; ask a trusted reader for feedback while keeping the writing authentic.",
      why: "Starting early gives you time to connect your experiences to each prompt and improve drafts without rushing.",
      timeline: "Start drafts this term and schedule multiple revision sessions before application deadlines.",
      resources: [{ label: "Purdue OWL writing resources", url: "https://owl.purdue.edu/owl/general_writing/index.html" }]
    },
    {
      key: "g11-financial-aid", category: "Financial aid",
      title: "Research scholarship eligibility, required documents and application deadlines.",
      actions: "For each target university and scholarship, verify eligibility directly with the provider; list required forms and documents; record deadlines and portals; identify whether aid is need- or merit-based; ask a trusted adult or counselor to review your plan.",
      why: "Eligibility, documents and deadlines differ, so a tracked plan helps you avoid missing aid opportunities.",
      timeline: "Create a deadline tracker within 1–2 months and update it when official information changes.",
      resources: [{ label: "Federal Student Aid scholarship guide", url: "https://studentaid.gov/understand-aid/types/scholarships" }]
    }
  ]
};

let user = null;
let busy = false;
let retryTimer;

function getGrade(profile) {
  const value = `${profile.current_grade || ""} ${profile.current_education || ""}`;
  const match = value.match(/\b(?:grade\s*)?(10|11)\b/i);
  return match ? Number(match[1]) : null;
}

function isDashboard() {
  return Boolean(root?.querySelector(".stats-grid"));
}
function isRoadmap() {
  return /your roadmap/i.test(root?.querySelector("h1")?.textContent || "");
}

async function context() {
  const { data: session } = await supabase.auth.getSession();
  user = session.session?.user || null;
  if (!user) return null;
  const { data, error } = await supabase.from("profiles")
    .select("current_grade,current_education").eq("id", user.id).maybeSingle();
  if (error) throw error;
  const grade = getGrade(data || {});
  return grade ? { grade, user } : null;
}

async function loadTasks(ctx) {
  const specs = ROADMAPS[ctx.grade];
  const keys = specs.map((task) => task.key);
  let { data, error } = await supabase.from("roadmap_tasks")
    .select("id,roadmap_key,status").eq("user_id", ctx.user.id).in("roadmap_key", keys);
  if (error) throw error;
  const found = new Set((data || []).map((task) => task.roadmap_key));
  const missing = specs.filter((task) => !found.has(task.key));
  if (missing.length) {
    const rows = missing.map((task, index) => ({
      user_id: ctx.user.id,
      roadmap_key: task.key,
      title: task.title,
      category: `Grade ${ctx.grade} · ${task.category}`,
      description: `Action steps: ${task.actions}\nWhy it matters: ${task.why}\nSuggested timeline: ${task.timeline}\nFree resources: ${task.resources.map((item) => `${item.label} — ${item.url}`).join("; ")}`,
      source_url: task.resources[0].url,
      status: "pending",
      priority: "High",
      sort_order: Date.now() + index
    }));
    const result = await supabase.from("roadmap_tasks").insert(rows);
    if (result.error) throw result.error;
    const reloaded = await supabase.from("roadmap_tasks")
      .select("id,roadmap_key,status").eq("user_id", ctx.user.id).in("roadmap_key", keys);
    if (reloaded.error) throw reloaded.error;
    data = reloaded.data;
  }
  return data || [];
}

function percentMarkup(tasks, grade) {
  const done = tasks.filter((task) => task.status === "done").length;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  return { done, percent, progress: `<div class="grade-roadmap-progress" role="progressbar" aria-label="Grade ${grade} roadmap progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>` };
}

function taskMarkup(task, spec) {
  const checked = task.status === "done";
  return `<article class="grade-roadmap-task${checked ? " is-complete" : ""}">
    <label class="grade-task-check"><input type="checkbox" data-grade-task="${html(task.id)}" ${checked ? "checked" : ""} aria-label="Complete ${html(spec.category)}"><span aria-hidden="true"></span></label>
    <div class="grade-task-body"><div class="grade-task-heading"><span class="badge">${html(spec.category)}</span><strong>${html(spec.title)}</strong></div>
      <p><b>Exact action steps:</b> ${html(spec.actions)}</p><p><b>Why it matters:</b> ${html(spec.why)}</p>
      <p><b>Suggested timeline:</b> ${html(spec.timeline)}</p><p><b>Free resources:</b> ${spec.resources.map((resource) => `<a href="${html(resource.url)}" target="_blank" rel="noopener noreferrer">${html(resource.label)}</a>`).join(" · ")}</p>
    </div></article>`;
}

function showRoadmap(tasks, grade) {
  const { done, percent, progress } = percentMarkup(tasks, grade);
  const byKey = new Map(tasks.map((task) => [task.roadmap_key, task]));
  const section = document.createElement("section");
  section.id = "gradeSpecificRoadmap";
  section.className = "panel grade-roadmap-panel";
  section.innerHTML = `<div class="grade-roadmap-title"><div><span class="eyebrow">PERSONALIZED FOR YOU</span><h2>Grade ${grade} university roadmap</h2><p>Grade-specific tasks, guidance and completion tracking.</p></div><span class="badge">${done}/${tasks.length} complete</span></div>${progress}<div class="grade-roadmap-tasks">${ROADMAPS[grade].map((spec) => taskMarkup(byKey.get(spec.key), spec)).join("")}</div><p id="gradeRoadmapFeedback" class="grade-roadmap-feedback" role="status" aria-live="polite"></p>`;
  root.append(section);
}

function showDashboard(tasks, grade) {
  const { done, percent, progress } = percentMarkup(tasks, grade);
  const section = document.createElement("section");
  section.id = "gradeRoadmapDashboard";
  section.className = "panel grade-roadmap-dashboard";
  section.innerHTML = `<div class="grade-roadmap-title"><div><span class="eyebrow">GRADE ${grade} PLAN</span><h2>Personalized roadmap progress</h2><p>${done} of ${tasks.length} grade-specific tasks completed.</p></div><span class="badge">${percent}%</span></div>${progress}<button class="btn secondary" type="button" data-go="roadmap">View Grade ${grade} tasks</button>`;
  root.append(section);
}

async function refresh() {
  if (!root || busy || (!isDashboard() && !isRoadmap())) return;
  if (isDashboard() && document.getElementById("gradeRoadmapDashboard")) return;
  if (isRoadmap() && document.getElementById("gradeSpecificRoadmap")) return;
  busy = true;
  try {
    const ctx = await context();
    if (!ctx || !root.isConnected) return;
    const tasks = await loadTasks(ctx);
    if (isDashboard() && !document.getElementById("gradeRoadmapDashboard")) showDashboard(tasks, ctx.grade);
    if (isRoadmap() && !document.getElementById("gradeSpecificRoadmap")) showRoadmap(tasks, ctx.grade);
  } catch (error) {
    console.error("Grade-specific roadmap could not load:", error);
    const target = document.getElementById("gradeRoadmapFeedback");
    if (target) target.textContent = "Could not load grade-specific tasks. Check your connection and try again.";
  } finally {
    busy = false;
  }
}

function scheduleRefresh() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void refresh(), 100);
}

if (root) {
  new MutationObserver(() => {
    // Only react when the base page is rendered; ignore mutations made by this module.
    if ((isDashboard() && !document.getElementById("gradeRoadmapDashboard")) ||
        (isRoadmap() && !document.getElementById("gradeSpecificRoadmap"))) scheduleRefresh();
  }).observe(root, { childList: true, subtree: true });
}

document.addEventListener("change", async (event) => {
  const checkbox = event.target.closest("[data-grade-task]");
  if (!checkbox || !user) return;
  checkbox.disabled = true;
  const feedback = document.getElementById("gradeRoadmapFeedback");
  const checked = checkbox.checked;
  const { error } = await supabase.from("roadmap_tasks").update({ status: checked ? "done" : "pending" })
    .eq("id", checkbox.dataset.gradeTask).eq("user_id", user.id);
  if (error) {
    checkbox.checked = !checked;
    if (feedback) feedback.textContent = "Could not save completion. Please try again.";
    checkbox.disabled = false;
    return;
  }
  const section = document.getElementById("gradeSpecificRoadmap");
  checkbox.closest(".grade-roadmap-task")?.classList.toggle("is-complete", checked);
  if (feedback) feedback.textContent = checked ? "Completion saved." : "Task marked incomplete.";
  if (section) {
    const all = [...section.querySelectorAll("[data-grade-task]")];
    const done = all.filter((item) => item.checked).length;
    const percent = all.length ? Math.round(done / all.length * 100) : 0;
    section.querySelector(".grade-roadmap-title .badge").textContent = `${done}/${all.length} complete`;
    const progress = section.querySelector(".grade-roadmap-progress");
    progress.setAttribute("aria-valuenow", String(percent));
    progress.firstElementChild.style.width = `${percent}%`;
  }
  checkbox.disabled = false;
});

supabase.auth.onAuthStateChange((_event, session) => {
  user = session?.user || null;
  scheduleRefresh();
});
void supabase.auth.getSession().then(({ data }) => {
  user = data.session?.user || null;
  scheduleRefresh();
});
