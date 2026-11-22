/*************************************************
 * University Preparation Dashboard (additive)
 * Leaves existing navigation and Universities UI intact.
 *************************************************/

const universityPrepRoot = document.getElementById("pageContent");

function universityPrepEscape(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function universityPrepTodayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function universityPrepTasks(profile = {}) {
  const education = String(profile.current_education || profile.current_grade || "");
  const gradeMatch = education.match(/\b(?:grade\s*)?(\d{1,2})\b/i);
  const grade = gradeMatch ? Number(gradeMatch[1]) : null;
  const major = String(profile.intended_subject || "");
  const country = String(profile.country || "");
  const isEarly = grade && grade <= 10;

  const tasks = [];

  tasks.push({
    key: "profile-university-plan",
    title: "Complete and review your university profile",
    category: "Planning",
    priority: "High",
    description: `Why it matters: The plan should reflect your actual academic stage and goals. Action steps: ${[
      education ? `Review your current education: ${education}.` : "Add your current grade or education.",
      major ? `Review your intended subject: ${major}.` : "Add an intended subject if you have one.",
      country ? `Review your country: ${country}.` : "Add your country for eligibility context.",
      profile.intended_start_year ? `Check your intended start year: ${profile.intended_start_year}.` : "Add an intended start year."
    ].join(" ")} Suggested timeline: Complete this week.`,
    source_url: "",
    sort_order: 10
  });

  tasks.push({
    key: "university-shortlist",
    title: major ? `Research universities for ${major}` : "Build a university shortlist",
    category: "University research",
    priority: "High",
    description: `Why it matters: Course fit, requirements and costs differ by institution. Action steps: Create a reach, target and likely shortlist; compare official course pages, entry requirements, English requirements and application deadlines. Verify that the course includes ${major || "your preferred subject"}. Suggested timeline: ${isEarly ? "Explore over the next 6–8 weeks." : "Finish a first shortlist within 2–4 weeks."}`,
    source_url: "https://bigfuture.collegeboard.org/college-search",
    sort_order: 20
  });

  tasks.push({
    key: "major-project",
    title: major ? `Start a ${major}-related project` : "Start a major-related project",
    category: "Major-related project",
    priority: isEarly ? "Medium" : "High",
    description: `Why it matters: A real, sustained project demonstrates interest and follow-through. Action steps: Choose one feasible question or problem, set milestones, document your process and reflect on what you learned. ${major ? `Keep the project connected to ${major}.` : "Choose a project connected to the subject you may study."} Suggested timeline: ${isEarly ? "Use 4–8 weeks to make a first version." : "Complete a substantial version within 3–6 months."}`,
    source_url: "https://ocw.mit.edu/",
    sort_order: 30
  });

  if (!isEarly && (grade === 11 || grade === 12 || education)) {
    tasks.push({
      key: "academic-readiness",
      title: "Check test and academic requirements only after confirming target universities",
      category: "Standardized testing",
      priority: "Medium",
      description: "Why it matters: Universities do not have identical testing policies. Action steps: Open each shortlisted university’s official admissions page; confirm whether SAT, ACT, AP, IB, A-Level or another credential is required or recommended; record the university-specific score or subject requirement. SAT 1400+ may be an ambitious example for some selective universities, not a universal requirement. Suggested timeline: Confirm requirements this month and take an official practice test if needed.",
      source_url: "https://satsuite.collegeboard.org/sat",
      sort_order: 40
    });
  }

  tasks.push({
    key: "leadership-impact",
    title: "Create measurable impact through one responsibility",
    category: "Leadership",
    priority: "Medium",
    description: "Why it matters: Measured impact is more meaningful than a title alone. Action steps: Choose a club, volunteering role or community initiative; set one measurable goal; record participants, hours or outcomes; keep evidence and reflection. Suggested timeline: Establish the goal now and review progress monthly.",
    source_url: "https://www.dosomething.org/us",
    sort_order: 50
  });

  tasks.push({
    key: "financial-aid",
    title: "Research scholarships and financial aid",
    category: "Financial aid",
    priority: "High",
    description: `Why it matters: Eligibility and funding differ by country, institution and application route. Action steps: For each shortlisted university, verify official scholarships and aid; identify need-based or merit-based options; record eligible dates and required documents. ${country ? `Consider opportunities available to students from ${country}, but verify restrictions directly.` : "Verify country restrictions directly with each provider."} Suggested timeline: Begin this term and update the tracker whenever requirements change.`,
    source_url: "https://bigfuture.collegeboard.org/scholarship-search",
    sort_order: 60
  });

  tasks.push({
    key: "portfolio",
    title: "Organize a university application portfolio",
    category: "Application preparation",
    priority: "Medium",
    description: "Why it matters: A central record prevents missed documents and supports authentic applications. Action steps: Create folders for transcripts, certificates, recommendations, project evidence, achievements and essay drafts; keep a deadline tracker. Suggested timeline: Set up the structure this week and update it monthly.",
    source_url: "https://owl.purdue.edu/owl/general_writing/index.html",
    sort_order: 70
  });

  return tasks;
}

async function universityPrepStart() {
  if (!universityPrepRoot) return;

  const observer = new MutationObserver(() => {
    const heading = universityPrepRoot.querySelector("h1");
    const isUniversityPage = heading && /explore universities|universities/i.test(heading.textContent);
    if (!isUniversityPage || document.getElementById("universityPreparationDashboard")) return;

    const section = document.createElement("section");
    section.id = "universityPreparationDashboard";
    section.className = "panel university-prep-dashboard";
    section.innerHTML = `
      <div class="university-prep-heading">
        <div>
          <span class="eyebrow">PERSONALIZED UNIVERSITY PLAN</span>
          <h2>University Preparation Dashboard</h2>
          <p id="universityPrepSummary">Loading profile-based recommendations...</p>
        </div>
        <button class="btn secondary" type="button" data-go="profile">Complete profile</button>
      </div>
      <div id="universityPrepProfilePrompt"></div>
      <div class="university-prep-grid">
        <article><span class="stat-label">PREPARATION</span><strong id="universityPrepProgress">0%</strong><p id="universityPrepCount">Loading progress</p></article>
        <article><span class="stat-label">CURRENT FOCUS</span><strong id="universityPrepFocus">Your profile</strong><p id="universityPrepFocusDetail">Build a clear academic plan</p></article>
        <article><span class="stat-label">UPCOMING</span><strong id="universityPrepDeadlines">No deadlines</strong><p>Open deadlines show here</p></article>
      </div>
      <div class="section-heading"><h2>Priority tasks</h2><button class="btn" type="button" id="addUniversityPrepTask">Add personal task</button></div>
      <div id="universityPrepTaskList" class="university-prep-task-list"></div>
      <form id="universityPrepTaskForm" class="form-grid university-prep-add-form hidden">
        <div class="form-field"><label>Task title</label><input class="control" name="title" required></div>
        <div class="form-field"><label>Deadline (optional)</label><input class="control" name="due_date" type="date"></div>
        <div class="form-field full"><label>Notes</label><textarea class="control" name="description"></textarea></div>
        <div class="form-field full"><button class="btn" type="submit">Save personal task</button></div>
      </form>
      <p id="universityPrepFeedback" class="university-prep-feedback" role="status"></p>
      <p class="university-prep-note">The existing university directory remains available below this dashboard.</p>
    `;

    universityPrepRoot.prepend(section);

    // The site module owns navigation and Supabase. Read its existing visible profile
    // information through the profile form or the rendered page when available.
    const profileForm = universityPrepRoot.querySelector("#profileForm");
    let profile = {};
    if (profileForm) {
      const values = Object.fromEntries(new FormData(profileForm));
      profile = values;
    }

    const summary = document.getElementById("universityPrepSummary");
    const prompt = document.getElementById("universityPrepProfilePrompt");
    const missing = [];
    if (!profile.current_grade && !profile.current_education) missing.push("grade or education");
    if (!profile.intended_subject) missing.push("intended major");
    if (!profile.country) missing.push("country");

    if (missing.length) {
      prompt.innerHTML = `<div class="university-prep-profile-prompt"><strong>Complete a few profile details</strong><p>Add ${universityPrepEscape(missing.join(", "))} to make this plan more relevant.</p></div>`;
    } else {
      prompt.innerHTML = "";
    }

    if (summary) {
      const major = profile.intended_subject ? ` for ${universityPrepEscape(profile.intended_subject)}` : "";
      const grade = profile.current_grade || profile.current_education;
      summary.textContent = `${grade ? `Preparation plan for ${universityPrepEscape(grade)}` : "Preparation plan"}${major}.`;
    }

    const taskList = document.getElementById("universityPrepTaskList");
    if (taskList) {
      taskList.innerHTML = universityPrepTasks(profile).map((task) => `
        <article class="university-prep-task">
          <div>
            <span class="badge">${universityPrepEscape(task.priority)} priority</span>
            <strong>${universityPrepEscape(task.title)}</strong>
            <p>${universityPrepEscape(task.description)}</p>
            ${task.source_url ? `<a href="${universityPrepEscape(task.source_url)}" target="_blank" rel="noopener noreferrer">Relevant resource ↗</a>` : ""}
          </div>
        </article>
      `).join("");
    }

    const addButton = document.getElementById("addUniversityPrepTask");
    const form = document.getElementById("universityPrepTaskForm");
    addButton?.addEventListener("click", () => form?.classList.toggle("hidden"));
  });

  observer.observe(universityPrepRoot, { childList: true, subtree: true });
}

void universityPrepStart();
