const content = document.getElementById("pageContent");

const escapeHtml = (value = "") => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const checkOfficial = "Check official university website";
let selectedUniversity = null;
let directoryMarkup = "";
let detailRequest = 0;

function markUniversityNames() {
  if (!content) return;
  content.querySelectorAll(".school-card").forEach((card) => {
    if (card.dataset.detailsLinkReady === "true") return;
    const title = card.querySelector("strong");
    const country = card.querySelector("p")?.textContent?.trim() || checkOfficial;
    const officialLink = card.querySelector('a[href^="http"]');
    if (!title) return;

    const name = title.textContent.trim();
    const website = officialLink?.href || "";
    card.dataset.detailsLinkReady = "true";
    card.dataset.universityName = name;
    card.dataset.universityCountry = country;
    card.dataset.universityWebsite = website;
    title.innerHTML = `<a class="university-name-link" href="#university-details" data-university-open aria-label="View details for ${escapeHtml(name)}">${escapeHtml(name)}</a>`;
  });
}

function detailField(label, value = checkOfficial) {
  return `<section class="university-detail-item"><h3>${escapeHtml(label)}</h3><p>${escapeHtml(value || checkOfficial)}</p></section>`;
}

function renderDetails(university) {
  if (!content) return;
  const website = university.website;
  const officialLink = website
    ? `<a class="btn secondary" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Open official university website ↗</a>`
    : `<p class="university-unverified">${checkOfficial}</p>`;
  const detail = `
    <div class="university-details-page">
      <button class="btn secondary university-back" type="button" data-university-back>← Back to Universities</button>
      <header class="university-detail-header">
        <span class="eyebrow">UNIVERSITY DETAILS</span>
        <h1>${escapeHtml(university.name || checkOfficial)}</h1>
        <p class="university-country">${escapeHtml(university.country || checkOfficial)}</p>
        <p class="university-unverified">Admissions facts below are not independently verified here. Use the official university site for current, program-specific policies.</p>
        ${officialLink}
      </header>
      <section class="panel university-detail-grid" aria-label="University admissions information">
        ${detailField("Overview and location")}
        ${detailField("Undergraduate admission requirements")}
        ${detailField("Minimum academic qualifications")}
        ${detailField("Required subjects")}
        ${detailField("SAT/ACT requirements and test-optional status")}
        ${detailField("IELTS/TOEFL English requirements")}
        ${detailField("Application procedure, step by step")}
        ${detailField("Required documents")}
        ${detailField("Personal essays and recommendation letters")}
        ${detailField("Application deadlines")}
        ${detailField("Scholarships and financial aid")}
        ${detailField("International student requirements")}
      </section>
      <section class="panel university-official-links">
        <h2>Official links</h2>
        <p>These links use the university website already listed in the directory. Follow its current admissions pages for verified details and application portals.</p>
        ${website ? `<div class="university-link-actions">
          <a class="btn secondary" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Official admissions information ↗</a>
          <a class="btn secondary" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Official scholarships and financial aid ↗</a>
          <a class="btn" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Find the direct application link ↗</a>
        </div>` : `<p class="university-unverified">${checkOfficial}</p>`}
      </section>
      <button class="btn secondary university-back" type="button" data-university-back>← Back to Universities</button>
    </div>`;

  content.innerHTML = `<section class="panel university-loading" role="status" aria-live="polite"><span class="university-spinner" aria-hidden="true"></span><p>Loading university details…</p></section>`;
  window.setTimeout(() => {
    if (detailRequest === university.requestId) content.innerHTML = detail;
  }, 120);
}

function openDetails(card) {
  if (!card || !content) return;
  markUniversityNames();
  directoryMarkup = content.innerHTML;
  const requestId = ++detailRequest;
  selectedUniversity = {
    name: card.dataset.universityName || card.querySelector("strong")?.textContent?.trim() || "",
    country: card.dataset.universityCountry || card.querySelector("p")?.textContent?.trim() || "",
    website: card.dataset.universityWebsite || card.querySelector('a[href^="http"]')?.href || "",
    requestId
  };
  renderDetails(selectedUniversity);
  document.getElementById("breadcrumb").textContent = `Workspace / ${selectedUniversity.name || "University details"}`;
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.page === "universities"));
  content.scrollIntoView({ behavior: "smooth", block: "start" });
}

function backToDirectory() {
  detailRequest++;
  const universitiesNav = document.querySelector('.nav-link[data-page="universities"]');
  if (universitiesNav) {
    universitiesNav.click();
  } else if (content && directoryMarkup) {
    content.innerHTML = directoryMarkup;
    markUniversityNames();
  }
  selectedUniversity = null;
}

if (content) {
  const observer = new MutationObserver(() => markUniversityNames());
  observer.observe(content, { childList: true, subtree: true });
  markUniversityNames();

  document.addEventListener("click", (event) => {
    const back = event.target.closest("[data-university-back]");
    if (back) {
      backToDirectory();
      return;
    }

    const nameLink = event.target.closest("[data-university-open]");
    if (nameLink) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openDetails(nameLink.closest(".school-card"));
    }
  }, true);

  content.addEventListener("keydown", (event) => {
    if (event.target.matches(".school-card") && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openDetails(event.target);
    }
  });
}
