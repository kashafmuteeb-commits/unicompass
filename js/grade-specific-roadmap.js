/* Grade-specific university roadmap, stored in the user's existing Supabase roadmap_tasks. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://qopuyrsriphebzzgvecl.supabase.co",
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s"
);
const root = document.getElementById("pageContent");
const esc = (value = "") => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const TASKS = {
  10: [
    {
      key: "g10-major-project", category: "Major-related project",
      title: "Explore a field of interest and start a small relevant project.",
      actions: "Choose one subject area that interests you; read or watch an introductory lesson; define a small question or goal; make a simple prototype, experiment, portfolio piece or community resource; record what you tried and learned.",
      why: "A small, genuine project helps you test your interest and gives you experience to build on in later grades.",
      timeline: "Start this term; spend 4–8 weeks exploring and completing a first version.",
      resources: [{ label: "MIT OpenCourseWare (free courses)", url: "https://ocw.mit.edu/" }]
    },
    {
      key: "g10-leadership", category: "Leadership",
      title: "Develop leadership skills through school and community activities.",
      actions: "Join a school club or community activity; volunteer for one manageable responsibility; practice communicating and organizing with others; keep a short record of your role, hours and what you learned.",
      why: "Consistent participation helps you discover how you contribute and lays the groundwork for meaningful future leadership.",
      timeline: "Choose an activity this term and participate consistently for at least one school term.",
      resources: [{ label: "DoSomething (free youth-led projects)", url: "https://www.dosomething.org/us" }]
    },
    {
      key: "g10-university-research", category: "University research",
      title: "Explore universities, majors and admission requirements.",
      actions: "Pick 3–5 universities or programs to explore; compare majors and course content; note each school's published subject prerequisites, application route and typical deadlines; save links to official admissions pages.",
      why: "Early exploration helps you make informed subject choices without needing to commit to a university yet.",
      timeline: "Explore over the next 2–3 months; revisit your notes once each term.",
      resources: [{ label: "College Board BigFuture college search", url: "https://bigfuture.collegeboard.org/college-search" }]
    },
    {
      key: "g10-essays", category: "Essays",
      title: "Explore personal experiences, interests and achievements. Start recording ideas.",
      actions: "Keep a private idea list; write down meaningful experiences, challenges, interests and things you are proud of; add what each experience taught you; do not try to write a final application essay yet.",
      why: "Collecting authentic examples over time makes it easier to reflect and write clearly when applications approach.",
      timeline: "Add one or two notes each month throughout the school year.",
      resources: [{ label: "Purdue OWL writing resources", url: "https://owl.purdue.edu/owl/general_writing/index.html" }]
    },
    {
      key: "g10-financial-aid", category: "Financial aid",
      title: "Learn about scholarships, need-based aid and financial assistance.",
      actions: "Learn the difference between scholarships, grants and loans; explore aid pages for universities you are curious about; note that eligibility varies by country and institution; discuss affordability questions with a trusted adult.",
      why: "Understanding the types of support available early can help you and your family plan and avoid assumptions about cost.",
      timeline: "Spend 1–2 hours exploring this term and revisit your notes annually.",
      resources: [{ label: "Federal Student Aid: types of scholarships (free guide)", url: "https://studentaid.gov/understand-aid/types/scholarships" }]
    }
  ],
  11: [
    {
      key: "g11-major-project", category: "Major-related project",
      title: "Complete and document a substantial project, including results and personal contributions.",
      actions: "Choose a focused project connected to a likely major; set a deliverable and milestones; complete the work; document your methods, results and setbacks; prepare a concise portfolio, report or presentation that clearly identifies your own contribution.",
      why: "A completed project demonstrates sustained interest, follow-through and the ability to explain what you personally accomplished.",
      timeline: "Plan in the first month and complete a substantial version within 3–6 months, leaving time to document results.",
      resources: [{ label: "MIT OpenCourseWare (free courses)", url: "https://ocw.mit.edu/" }]
    },
    {
      key: "g11-leadership", category: "Leadership",
      title: "Demonstrate measurable impact through leadership and community initiatives.",
      actions: "Take responsibility for a defined initiative; set a specific goal with the people you serve; track participation or outcomes using appropriate measures; reflect on what changed and what you would improve; retain evidence of your role.",
      why: "Specific outcomes and reflection show how you supported others, rather than relying on a title alone.",
      timeline: "Lead or sustain an initiative this academic year; review progress and record outcomes each month.",
      resources: [{ label: "DoSomething (free youth-led projects)", url: "https://www.dosomething.org/us" }]
    },
    {
      key: "g11-university-research", category: "University research",
      title: "Shortlist target universities and study their admission requirements.",
      actions: "Build a realistic shortlist of target universities; for each, check official program requirements, subject prerequisites, tests, application route, required documents, deadlines and international-student rules; record the source and date checked.",
      why: "A verified shortlist lets you plan applications against actual requirements and deadlines instead of relying on general advice.",
      timeline: "Create a first shortlist in the next 4–6 weeks and review official requirements each term.",
      resources: [{ label: "College Board BigFuture college search", url: "https://bigfuture.collegeboard.org/college-search" }]
    },
    {
      key: "g11-essays", category: "Essays",
      title: "Begin drafting personal statements and university-specific essays.",
      actions: "Find current prompts on each target university's official website; choose examples that answer each prompt; draft a personal statement and any required supplemental essays; revise for clarity and specificity; ask a trusted reader for feedback while keeping the writing authentic to you.",
      why: "Starting early gives you time to connect your experiences to each prompt and improve drafts without rushing.",
      timeline: "Start drafts this term; schedule multiple revision sessions before application deadlines.",
      resources: [{ label: "Purdue OWL writing resources", url: "https://owl.purdue.edu/owl/general_writing/index.html" }]
    },
    {
      key: "g11-financial-aid", category: "Financial aid",
      title: "Research scholarship eligibility, required documents and application deadlines.",
      actions: "For each target university and relevant scholarship, verify eligibility directly with the provider; list required forms and documents; record deadlines and submission portals; note whether aid is need-based or merit-based; ask a trusted adult or school counselor to review your plan.",
      why: "Eligibility rules, supporting documents and deadlines differ, so a tracked plan helps you avoid missing aid opportunities.",
      timeline: "Research and create a deadline tracker within 1–2 months; update it whenever official application information changes.",
      resources: [{ label: "Federal Student Aid: types of scholarships (free guide)", url: "https://studentaid.gov/understand-aid/types/scholarships" }]
    }
  ]
};

let currentUser = null;
let syncing = false;
let timer;

function selectedGrade(profile) {
  const value = `${profile.current_grade || ""} ${profile.current_education || ""}`;
  const match = value.match(/\b(?:grade\s*)?(10|11)(?:\b|(?=th|st|nd|rd))/i);
  return match ? Number(match[1]) : null;
}

function taskDescription(task) {
  return `Action steps: ${task.actions}\nWhy it matters: ${task.why}\nSuggested timeline: ${task.timeline}\nFree resources: ${task.resources.map((item) => `${item.label} — ${item.url}`).join("; ")}`;
}

async function getContext() {
  const { data: sessionData } = await supabase.auth.getSession();
  currentUser = sessionData.session?.user || null;
  if (!currentUser) return null;
  const { data: profile, error } = await supabase.from("profiles")
    .select("current_grade,current_education")
    .eq("id", currentUser.id)
    .maybeSingle();
  if (error) throw error;
  const grade = selectedGrade(profile || {});
  return grade ? { grade, user: currentUser } : null;
}

async function ensureTasks(context) {
  const tasks = TASKS[context.grade];
  const keys = tasks.map((task) => task.key);
  const { data: existing, error } = await supabase.from("roadmap_tasks")
    .select("roadmap_key")
    .eq("user_id", context.user.id)
    .in("roadmap_key", keys);
  if (error) throw error;
  const existingKeys = new Set((existing || []).map((task) => task.roadmap_key));
  const missing = tasks.filter((task) => !existingKeys.has(task.key));
  if (!missing.length) return;
  const rows = missing.map((task, index) => ({
    user_id: context.user.id,
    title: task.title,
    category: `Grade ${context.grade} · ${task.category}`,
    description: taskDescription(task),
    source_url: task.resources[0]?.url || "",
    status: "pending",
    priority: "High",
    roadmap_key: task.key,
    sort_order: Date.now() + index
  }));
  const { error: insertError } = await supabase.from("roadmap_tasks").insert(rows);
  if (insertError) throw insertError;
}

function taskCard(task, spec) {
  const checked = task.status === "done";
  return `<article class="grade-roadmap-task${checked ? " is-complete" : ""}">
    <label class="grade-task-check"><input type="checkbox" data-grade-task="${esc(task.id)}" ${checked ? "checked" : ""} aria-label="Mark ${esc(spec.category)} complete"><span class="grade-task-checkmark" aria-hidden="true"></span></label>
    <div class="grade-task-body"><div class="grade-task-heading"><span class="badge">${esc(spec.category)}</span><strong>${esc(spec.title)}</strong></div>
      <p><b>Action steps:</b> ${esc(spec.actions)}</p><p><b>Why it matters:</b> ${esc(spec.why)}</p><p><b>Suggested timeline:</b> ${esc(spec.timeline)}</p>
      <p class="grade-task-resources"><b>Free resources:</b> ${spec.resources.map((resource) => `<a href="${esc(resource.url)}" target="_blank" rel="noopener noreferrer">${esc(resource.label)}</a>`).join(" · ")}</p>
    </div></article>`;
}

function renderRoadmapSection(tasks, grade) {
  const mapping = new Map(tasks.map((task) => [task.roadmap_key, task]));
  const gradeTasks = TASKS[grade].map((spec) => mapping.has(spec.key) ? taskCard(mapping.get(spec.key), spec) : "").join("");
  const completed = tasks.filter((task) => task.status === "done").length;
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  return `<section id="gradeSpecificRoadmap" class="panel grade-roadmap-panel" aria-labelledby="gradeRoadmapTitle">
    <div class="grade-roadmap-title"><div><span class="eyebrow">PERSONALIZED FOR YOU</span><h2 id="gradeRoadmapTitle">Grade ${grade} university roadmap</h2><p>These tasks have different goals and guidance for your current grade. Check a task to save completion to your account.</p></div><span class="badge">${completed}/${tasks.length} complete</span></div>
    <div class="grade-roadmap-progress" role="progressbar" aria-label="Grade ${grade} roadmap progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
    <div class="grade-roadmap-tasks">${gradeTasks}</div><p id="gradeRoadmapFeedback" class="grade-roadmap-feedback" role="status" aria-live="polite"></p>
  </section>`;
}

function renderDashboardProgress(tasks, grade) {
  const completed = tasks.filter((task) => task.status === "done").length;
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const widget = document.createElement("section");
  widget.id = "gradeRoadmapDashboard";
  widget.className = "panel grade-roadmap-dashboard";
  widget.innerHTML = `<div class="grade-roadmap-title"><div><span class="eyebrow">GRADE ${grade} PLAN</span><h2>Personalized roadmap progress</h2><p>${completed} of ${tasks.length} grade-specific tasks completed.</p></div><span class="badge">${percent}%</span></div><div class="grade-roadmap-progress" role="progressbar" aria-label="Grade-specific roadmap progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div><button class="btn secondary" type="button" data-go="roadmap">View grade ${grade} tasks</button>`;
  root.append(widget);
}

async function refresh() {
  if (syncing || !root || !currentUser) return;
  const onRoadmap = /your roadmap/i.test(root.querySelector("h1")?.textContent || "");
  const onDashboard = Boolean(root.querySelector(".stats-grid"));
  if (!onRoadmap && !onDashboard) return;
  syncing = true;
  try {
    const context = await getContext();
    if (!context || !root.isConnected) return;
    await ensureTasks(context);
    const { data, error } = await supabase.from("roadmap_tasks").select("id,roadmap_key,status")
      .eq("user_id", context.user.id)
      .in("roadmap_key", TASKS[context.grade].map((task) => task.key));
    if (error) throw error;
    const tasks = data || [];
    if (onRoadmap) {
      const container = document.createElement("div");
      container.innerHTML = renderRoadmapSection(tasks, context.grade);
      document.getElementById("gradeSpecificRoadmap")?.remove();
      root.append(container.firstElementChild);
    }
    if (onDashboard) {
      document.getElementById("gradeRoadmapDashboard")?.remove();
      renderDashboardProgress(tasks, context.grade);
    }
  } catch (error) {
    console.error("Could not load grade-specific roadmap:", error);
    const feedback = document.getElementById("gradeRoadmapFeedback");
    if (feedback) feedback.textContent = "Grade-specific tasks could not be loaded. Please check your connection and try again.";
  } finally {
    syncing = false;
  }
}

function scheduleRefresh() {
  clearTimeout(timer);
  timer = setTimeout(() => void refresh(), 120);
}

if (root) new MutationObserver(scheduleRefresh).observe(root, { childList: true, subtree: true });

 document.addEventListener("change", async (event) => {
  const checkbox = event.target.closest("[data-grade-task]");
  if (!checkbox || !currentUser) return;
  checkbox.disabled = true;
  const section = document.getElementById("gradeSpecificRoadmap");
  const feedback = document.getElementById("gradeRoadmapFeedback");
  const { error } = await supabase.from("roadmap_tasks")
    .update({ status: checkbox.checked ? "done" : "pending" })
    .eq("id", checkbox.dataset.gradeTask)
    .eq("user_id", currentUser.id);
  if (error) {
    checkbox.checked = !checkbox.checked;
    if (feedback) feedback.textContent = "Could not save completion. Please try again.";
    checkbox.disabled = false;
    return;
  }
  if (feedback) feedback.textContent = checkbox.checked ? "Completion saved." : "Task marked as not complete.";
  if (section) {
    const card = checkbox.closest(".grade-roadmap-task");
    card?.classList.toggle("is-complete", checkbox.checked);
    const all = [...section.querySelectorAll("[data-grade-task]")];
    const done = all.filter((item) => item.checked).length;
    const percent = all.length ? Math.round(done / all.length * 100) : 0;
    const badge = section.querySelector(".grade-roadmap-title .badge");
    if (badge) badge.textContent = `${done}/${all.length} complete`;
    const progress = section.querySelector(".grade-roadmap-progress");
    if (progress) {
      progress.setAttribute("aria-valuenow", String(percent));
      progress.firstElementChild.style.width = `${percent}%`;
    }
  }
  checkbox.disabled = false;
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  scheduleRefresh();
});

(async () => {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  scheduleRefresh();
})();
