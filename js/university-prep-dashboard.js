
/*******************************************************
 * UNICOMPASS - UNIVERSITY ADMISSIONS TRACKER
 * Interactive university planning and progress dashboard
 *******************************************************/

(() => {
  const page = document.getElementById("pageContent");
  if (!page) return;

  const STORAGE_KEY = "unicompass_university_tracker_v1";

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);

  const defaultTasks = [
    ["SAT preparation", "Academic", "Prepare for the SAT and review weak areas."],
    ["SAT practice tests", "Academic", "Complete practice tests and record scores."],
    ["English proficiency", "Academic", "Prepare for IELTS, TOEFL or Duolingo if required."],
    ["Academic grades", "Academic", "Maintain strong school grades."],
    ["Subject preparation", "Academic", "Develop knowledge in your intended major."],
    ["MUN and debate", "Extracurricular", "Participate in conferences and debate."],
    ["Sports and football", "Extracurricular", "Participate in sports and record achievements."],
    ["Scientific research", "Extracurricular", "Conduct or contribute to research projects."],
    ["Volunteering", "Extracurricular", "Participate in community service."],
    ["Leadership", "Extracurricular", "Take responsibility in an organization or project."],
    ["Personal projects", "Extracurricular", "Build meaningful projects related to your interests."],
    ["Competitions", "Extracurricular", "Participate in academic and other competitions."],
    ["Personal statement", "Application", "Prepare and revise your university essays."],
    ["Recommendation letters", "Application", "Identify teachers and request recommendations."],
    ["Academic transcripts", "Application", "Organize your academic records."],
    ["Certificates and achievements", "Application", "Organize evidence of your achievements."],
    ["University applications", "Application", "Complete university application requirements."],
    ["Scholarship research", "Scholarship", "Research suitable scholarship opportunities."],
    ["Financial documents", "Scholarship", "Prepare required financial documents."],
    ["Scholarship essays", "Scholarship", "Prepare scholarship-specific essays."],
    ["Scholarship deadlines", "Scholarship", "Track scholarship application deadlines."]
  ];

  const readData = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  };

  const saveData = data => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  let data = readData();

  function initializeData(preferences) {
    data = {
      preferences,
      satTarget: 1400,
      satScore: "",
      tasks: defaultTasks.map((item, index) => ({
        id: "default-" + index,
        title: item[0],
        category: item[1],
        description: item[2],
        status: "Not started",
        deadline: "",
        custom: false
      }))
    };
    saveData(data);
    render();
  }

  function injectStyles() {
    if (document.getElementById("uc-tracker-styles")) return;

    const style = document.createElement("style");
    style.id = "uc-tracker-styles";
    style.textContent = `
      #ucTracker { color:var(--text-primary,#202638); }
      #ucTracker * { box-sizing:border-box; }
      #ucTracker .uc-card {
        background:var(--card-bg,#fff);
        border:1px solid var(--border-color,#e7eaf0);
        border-radius:15px;
        padding:17px;
        margin-bottom:13px;
      }
      #ucTracker .uc-grid {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:10px;
        margin:18px 0;
      }
      #ucTracker .uc-stat {
        background:var(--card-bg,#fff);
        border:1px solid var(--border-color,#e7eaf0);
        border-radius:13px;
        padding:14px;
        min-width:0;
      }
      #ucTracker .uc-stat strong {
        display:block;font-size:23px;margin-top:7px;
      }
      #ucTracker .uc-muted {color:#7c8494;font-size:13px;}
      #ucTracker .uc-progress {
        height:10px;background:#e9edf3;border-radius:20px;
        overflow:hidden;margin:10px 0;
      }
      #ucTracker .uc-progress span {
        display:block;height:100%;background:#16a36a;
        border-radius:20px;transition:width .25s;
      }
      #ucTracker .uc-btn {
        border:0;border-radius:9px;padding:10px 15px;
        background:#5145bd;color:white;font-weight:600;
        cursor:pointer;margin:3px;
      }
      #ucTracker .uc-btn.secondary {
        background:#eeeefe;color:#5145bd;
      }
      #ucTracker .uc-btn.danger {
        background:#fff0f0;color:#c33;
      }
      #ucTracker input,#ucTracker select,#ucTracker textarea {
        width:100%;padding:11px;border:1px solid #dce0e8;
        border-radius:9px;background:var(--card-bg,#fff);
        color:inherit;font:inherit;margin-top:6px;
      }
      #ucTracker label {
        display:block;font-size:13px;font-weight:600;margin:12px 0;
      }
      #ucTracker .uc-form-grid {
        display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
      }
      #ucTracker .uc-task {
        border:1px solid var(--border-color,#e7eaf0);
        border-radius:12px;padding:14px;margin:10px 0;
        background:var(--card-bg,#fff);
      }
      #ucTracker .uc-task strong {display:block;margin:7px 0;}
      #ucTracker .uc-tag {
        display:inline-block;background:#eeeefe;color:#5145bd;
        padding:4px 8px;border-radius:20px;font-size:11px;
      }
      #ucTracker .uc-completed {
        color:#16834f;background:#e8f7ee;
      }
      #ucTracker .uc-heading {
        display:flex;justify-content:space-between;
        align-items:center;gap:10px;flex-wrap:wrap;
      }
      #ucTracker .uc-section-title {margin:24px 0 12px;}
      #ucTracker .uc-hidden {display:none!important;}
      @media(max-width:600px) {
        #ucTracker .uc-grid {grid-template-columns:repeat(2,minmax(0,1fr));}
        #ucTracker .uc-form-grid {grid-template-columns:1fr;}
        #ucTracker .uc-stat strong {font-size:19px;}
      }
    `;
    document.head.appendChild(style);
  }

  function setupScreen() {
    return `
      <section id="ucTracker">
        <div class="uc-card">
          <span class="uc-tag">UNIVERSITY ADMISSIONS PLANNER</span>
          <h2>Build Your University Plan</h2>
          <p class="uc-muted">Tell us your goals. We will create your personal preparation tracker.</p>

          <form id="ucSetupForm">
            <label>Target university
              <input name="university" placeholder="e.g. Harvard University" required>
            </label>

            <div class="uc-form-grid">
              <label>Preferred country
                <select name="country" required>
                  <option value="">Choose country</option>
                  ${["USA","United Kingdom","Canada","Switzerland","Germany","Japan","Australia","Netherlands","Singapore","Other"].map(c => `<option>${c}</option>`).join("")}
                </select>
              </label>
              <label>Scholarship preference
                <select name="scholarship" required>
                  <option value="">Choose preference</option>
                  <option>Fully funded</option>
                  <option>Partially funded</option>
                  <option>No scholarship needed</option>
                  <option>Need-based financial aid</option>
                </select>
              </label>
            </div>

            <div class="uc-form-grid">
              <label>Intended major
                <input name="major" placeholder="e.g. Biotechnology" required>
              </label>
              <label>Current grade
                <input name="grade" placeholder="e.g. Grade 9" required>
              </label>
              <label>Admission year
                <select name="year">
                  ${[2027,2028,2029,2030,2031,2032].map(y => `<option>${y}</option>`).join("")}
                </select>
              </label>
              <label>SAT target score
                <input name="satTarget" type="number" min="400" max="1600" value="1400">
              </label>
            </div>

            <button class="uc-btn" type="submit">Create My Dashboard →</button>
          </form>
        </div>
      </section>
    `;
  }

  function dashboardScreen() {
    const tasks = data.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "Completed").length;
    const progress = total ? Math.round(completed / total * 100) : 0;
    const remaining = total - completed;
    const categories = ["Academic","Extracurricular","Application","Scholarship","Other"];

    const categoryHTML = categories.map(category => {
      const list = tasks.filter(t => t.category === category);
      if (!list.length) return "";
      const done = list.filter(t => t.status === "Completed").length;
      const percent = Math.round(done / list.length * 100);

      return `
        <div class="uc-card">
          <div class="uc-heading">
            <strong>${category}</strong>
            <span class="uc-muted">${done}/${list.length} completed</span>
          </div>
          <div class="uc-progress"><span style="width:${percent}%"></span></div>
          <span class="uc-muted">${percent}% complete</span>
          ${list.map(task => `
            <div class="uc-task">
              <div class="uc-heading">
                <span class="uc-tag ${task.status === "Completed" ? "uc-completed" : ""}">${escapeHTML(task.status)}</span>
                <span class="uc-muted">${task.deadline ? "Due: " + escapeHTML(task.deadline) : ""}</span>
              </div>
              <strong>${escapeHTML(task.title)}</strong>
              <p class="uc-muted">${escapeHTML(task.description || "")}</p>
              <div>
                <button class="uc-btn secondary" data-action="status" data-id="${escapeHTML(task.id)}">Update status</button>
                <button class="uc-btn secondary" data-action="edit" data-id="${escapeHTML(task.id)}">Edit</button>
                <button class="uc-btn danger" data-action="delete" data-id="${escapeHTML(task.id)}">Delete</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");

    return `
      <section id="ucTracker">
        <div class="uc-card">
          <div class="uc-heading">
            <div>
              <span class="uc-tag">YOUR PERSONAL PLAN</span>
              <h2>My University Journey</h2>
              <p class="uc-muted">${escapeHTML(data.preferences.university)} · ${escapeHTML(data.preferences.country)}</p>
            </div>
            <button class="uc-btn secondary" data-action="preferences">Edit plan</button>
          </div>
          <p><strong>${escapeHTML(data.preferences.major)}</strong> · ${escapeHTML(data.preferences.scholarship)}</p>
          <p class="uc-muted">Admission year: ${escapeHTML(data.preferences.year)}</p>
        </div>

        <div class="uc-card">
          <div class="uc-heading">
            <h2>Overall preparation</h2>
            <strong style="font-size:27px;color:#16a36a">${progress}%</strong>
          </div>
          <div class="uc-progress"><span style="width:${progress}%"></span></div>
          <div class="uc-grid">
            <div class="uc-stat"><span class="uc-muted">Completed</span><strong>${completed}</strong></div>
            <div class="uc-stat"><span class="uc-muted">Remaining</span><strong>${remaining}</strong></div>
            <div class="uc-stat"><span class="uc-muted">Total tasks</span><strong>${total}</strong></div>
          </div>
        </div>

        <div class="uc-card">
          <h3>SAT preparation</h3>
          <p class="uc-muted">Your SAT target is personal, not a universal university requirement.</p>
          <div class="uc-form-grid">
            <label>Target score
              <input id="ucSatTarget" type="number" min="400" max="1600" value="${Number(data.satTarget) || 1400}">
            </label>
            <label>Latest practice score
              <input id="ucSatScore" type="number" min="400" max="1600" placeholder="Enter score" value="${escapeHTML(data.satScore || "")}">
            </label>
          </div>
          <button class="uc-btn secondary" data-action="save-sat">Save SAT scores</button>
        </div>

        <div class="uc-heading uc-section-title">
          <h2>Preparation checklist</h2>
          <button class="uc-btn" data-action="add">+ Add task</button>
        </div>

        <div id="ucAddForm" class="uc-card uc-hidden">
          <h3>Add a task or activity</h3>
          <form id="ucTaskForm">
            <label>Task / activity name
              <input name="title" required placeholder="e.g. Join an international MUN">
            </label>
            <div class="uc-form-grid">
              <label>Category
                <select name="category">
                  ${categories.map(c => `<option>${c}</option>`).join("")}
                </select>
              </label>
              <label>Deadline
                <input name="deadline" type="date">
              </label>
            </div>
            <label>Notes
              <textarea name="description" placeholder="Add details or achievements"></textarea>
            </label>
            <button class="uc-btn" type="submit">Save task</button>
            <button class="uc-btn secondary" type="button" data-action="cancel-add">Cancel</button>
          </form>
        </div>

        ${categoryHTML}

        <div class="uc-card">
          <h3>Your plan</h3>
          <p class="uc-muted">University: ${escapeHTML(data.preferences.university)}</p>
          <p class="uc-muted">Scholarship: ${escapeHTML(data.preferences.scholarship)}</p>
          <button class="uc-btn secondary" data-action="reset">Reset preparation plan</button>
        </div>
      </section>
    `;
  }

  function render() {
    injectStyles();
    const old = document.getElementById("ucTracker");
    if (old) old.remove();
    page.insertAdjacentHTML("afterbegin", data ? dashboardScreen() : setupScreen());
  }

  function showPreferences() {
    const old = document.getElementById("ucTracker");
    if (old) old.outerHTML = setupScreen();

    const form = document.getElementById("ucSetupForm");
    const p = data.preferences;
    for (const [key, value] of Object.entries({
      university: p.university,
      country: p.country,
      scholarship: p.scholarship,
      major: p.major,
      grade: p.grade,
      year: p.year,
      satTarget: data.satTarget
    })) {
      const field = form.elements.namedItem(key);
      if (field) field.value = value || "";
    }
  }

  function handleSubmit(event) {
    const form = event.target;

    if (form.id === "ucSetupForm") {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      const preferences = {
        university: values.university.trim(),
        country: values.country,
        scholarship: values.scholarship,
        major: values.major.trim(),
        grade: values.grade.trim(),
        year: values.year
      };

      if (data) {
        data.preferences = preferences;
        data.satTarget = Number(values.satTarget) || 1400;
        saveData(data);
        render();
      } else {
        initializeData(preferences);
        data.satTarget = Number(values.satTarget) || 1400;
        saveData(data);
        render();
      }
      return;
    }

    if (form.id === "ucTaskForm") {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      data.tasks.push({
        id: "task-" + Date.now() + "-" + Math.random().toString(36).slice(2,7),
        title: values.title.trim(),
        category: values.category,
        description: values.description.trim(),
        deadline: values.deadline,
        status: "Not started",
        custom: true
      });
      saveData(data);
      render();
    }
  }

  function handleClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const task = data?.tasks.find(t => t.id === id);

    if (action === "add") {
      document.getElementById("ucAddForm")?.classList.remove("uc-hidden");
    }

    if (action === "cancel-add") {
      document.getElementById("ucAddForm")?.classList.add("uc-hidden");
    }

    if (action === "preferences") showPreferences();

    if (action === "status" && task) {
      const statuses = ["Not started","In progress","Completed"];
      task.status = statuses[(statuses.indexOf(task.status) + 1) % statuses.length];
      saveData(data);
      render();
    }

    if (action === "edit" && task) {
      const title = prompt("Edit task name:", task.title);
      if (title === null) return;
      if (!title.trim()) return alert("Task name cannot be empty.");
      task.title = title.trim();
      const notes = prompt("Edit notes:", task.description || "");
      if (notes !== null) task.description = notes;
      saveData(data);
      render();
    }

    if (action === "delete" && task) {
      if (!confirm("Delete this task?")) return;
      data.tasks = data.tasks.filter(t => t.id !== id);
      saveData(data);
      render();
    }

    if (action === "save-sat") {
      const target = Number(document.getElementById("ucSatTarget").value);
      const scoreInput = document.getElementById("ucSatScore").value;
      const score = scoreInput === "" ? "" : Number(scoreInput);

      if (!Number.isInteger(target) || target < 400 || target > 1600 ||
          (score !== "" && (!Number.isInteger(score) || score < 400 || score > 1600))) {
        alert("Enter valid SAT scores between 400 and 1600.");
        return;
      }

      data.satTarget = target;
      data.satScore = score;
      saveData(data);
      render();
    }

    if (action === "reset") {
      if (!confirm("This will delete your saved university plan and tasks. Continue?")) return;
      localStorage.removeItem(STORAGE_KEY);
      data = null;
      render();
    }
  }

  // Event delegation: listeners are attached once to the page.
  page.addEventListener("submit", handleSubmit);
  page.addEventListener("click", handleClick);

  function isUniversitiesPage() {
    return Boolean(document.querySelector('.nav-link.active[data-page="universities"]'));
  }

  function syncDashboard() {
    if (!isUniversitiesPage()) {
      document.getElementById("ucTracker")?.remove();
      return;
    }

    if (!document.getElementById("ucTracker")) render();
  }

  const observer = new MutationObserver(syncDashboard);
  observer.observe(page, { childList: true, subtree: true });
  document.querySelectorAll(".nav-link").forEach(link => {
    observer.observe(link, { attributes: true, attributeFilter: ["class"] });
  });

  syncDashboard();
})();
      
