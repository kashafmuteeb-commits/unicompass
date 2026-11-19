import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Uses the same public client and signed-in session as the existing application.
const supabase = createClient(
  "https://qopuyrsriphebzzgvecl.supabase.co",
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s"
);
const root = document.getElementById("pageContent");
const esc = (value = "") => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let signedInUser = null;
let studentProfile = {};
let busy = false;

const ROADMAP = [
  { key:"grades", category:"Academic preparation", priority:"High", title:"Maintain strong academic grades", description:"Set a steady study routine and retain your school transcripts. Review progress each term.", resource:"https://bigfuture.collegeboard.org/plan-for-college/stand-out-in-high-school" },
  { key:"prerequisites", category:"Academic preparation", priority:"High", title:"Identify subject prerequisites", description:"Check official course prerequisites for each shortlisted program; requirements vary by university and major.", resource:"" },
  { key:"stem-subjects", category:"Academic preparation", priority:"High", title:"Build a strong STEM foundation", description:"For STEM applicants, prioritize Biology, Chemistry, Mathematics and English where relevant to your intended course.", resource:"" },
  { key:"sat-diagnostic", category:"SAT preparation", priority:"High", title:"Complete an official SAT diagnostic", description:"Use a Bluebook practice test to establish a baseline and identify areas to work on.", resource:"https://satsuite.collegeboard.org/sat/practice-preparation" },
  { key:"sat-plan", category:"SAT preparation", priority:"Medium", title:"Create a weekly SAT study plan", description:"Track Reading and Writing and Math progress. Check each university's current testing policy before setting a target.", resource:"https://satsuite.collegeboard.org/sat/practice-preparation" },
  { key:"shortlist", category:"Application preparation", priority:"High", title:"Build a university shortlist", description:"Compare course fit, affordability, application routes and official admissions-cycle dates.", resource:"https://www.commonapp.org/" },
  { key:"recommendations", category:"Application preparation", priority:"Medium", title:"Build relationships with teachers", description:"Discuss your academic interests early and check each university's recommendation requirements.", resource:"https://www.commonapp.org/" },
  { key:"essays", category:"Application preparation", priority:"Medium", title:"Explore personal essay prompts", description:"Draft authentic reflections and use only the prompts published for your application cycle.", resource:"https://www.commonapp.org/" },
  { key:"documents", category:"Application preparation", priority:"High", title:"Organize application documents", description:"Create a checklist for transcripts, test scores, activities and financial-aid materials required by each institution.", resource:"" },
  { key:"research-question", category:"Research preparation", priority:"Medium", title:"Choose an original research question", description:"Start with a focused, manageable question connected to your interests. Do not collect data involving people or animals without required approvals.", resource:"https://www.societyforscience.org/isef/international-rules/" },
  { key:"mentor", category:"Research preparation", priority:"Medium", title:"Find a qualified research mentor", description:"Ask a teacher or qualified professional to help assess feasibility, safety and appropriate approvals.", resource:"https://www.societyforscience.org/isef/international-rules/" },
  { key:"research-log", category:"Research preparation", priority:"Medium", title:"Keep a research logbook", description:"Document methods, decisions, observations and genuine results as the work progresses.", resource:"https://www.societyforscience.org/isef/international-rules/" },
  { key:"research-presentation", category:"Research preparation", priority:"Low", title:"Prepare an abstract and presentation", description:"Summarize your actual question, methods and findings; distinguish completed results from plans.", resource:"https://www.societyforscience.org/isef/international-rules/" },
  { key:"activities", category:"Extracurricular activities", priority:"Medium", title:"Plan meaningful extracurricular involvement", description:"Choose activities such as leadership, science competitions, community service, independent projects, volunteering or academic enrichment based on genuine interest.", resource:"https://www.commonapp.org/" }
];
const MAJOR_TASKS = {
  biotechnology:["Explore a biology research question","Look for chemistry or life-science competitions","Explore supervised research mentorship and relevant community projects"],
  "computer science":["Build and document a programming project","Explore a coding competition or hackathon","Consider contributing to an open-source project"],
  engineering:["Plan a design or robotics project","Explore engineering competitions","Strengthen mathematics and physics foundations"],
  business:["Develop an entrepreneurship or financial-literacy project","Explore case competitions","Seek meaningful leadership experience"]
};
function profileGrade() { return studentProfile.current_grade || studentProfile.current_education || "Grade 11"; }
function selectedMajorTasks() {
  const major = String(studentProfile.intended_subject || "").toLowerCase();
  const match = Object.keys(MAJOR_TASKS).find(key => major.includes(key));
  return (MAJOR_TASKS[match] || []).map((title, i) => ({key:`major-${i}`,category:`${studentProfile.intended_subject || "Major"} preparation`,priority:"Medium",title,description:"Adapt this suggestion to your interests and verify any competition or program details with its official organizer.",resource:""}));
}
function showFeedback(text, error = false) {
  let node = document.getElementById("upgradeFeedback");
  if (!node && root) { node = document.createElement("p"); node.id = "upgradeFeedback"; node.className = "notice"; root.prepend(node); }
  if (node) { node.textContent = text; node.classList.toggle("success", !error); }
}
async function loadProfile() {
  if (!signedInUser) return;
  const {data,error} = await supabase.from("profiles").select("*").eq("id",signedInUser.id).maybeSingle();
  if (error) throw error;
  studentProfile = data || {};
}
function addGradeField() {
  const form = document.getElementById("profileForm");
  if (!form || form.querySelector('[name="current_grade"]')) return;
  const field = document.createElement("div");
  field.className = "form-field";
  field.innerHTML = `<label for="currentGrade">Current grade</label><select class="control" id="currentGrade" name="current_grade"><option value="">Choose grade</option>${["Grade 9","Grade 10","Grade 11","Grade 12","Other"].map(g=>`<option value="${g}" ${studentProfile.current_grade===g?"selected":""}>${g}</option>`).join("")}</select><small>Used to tailor your roadmap.</small>`;
  const subject = form.querySelector('[name="intended_subject"]')?.closest(".form-field");
  if (subject?.parentNode) subject.after(field); else form.append(field);
}
function roadmapTasksMarkup(tasks) {
  if (!tasks.length) return '<p class="empty">Generate a grade- and major-aware roadmap to get started.</p>';
  return tasks.map(task=>`<article class="upgrade-task ${task.status==='done'?'is-done':''}"><label class="upgrade-task-check"><input type="checkbox" data-upgrade-task="${esc(task.id)}" ${task.status==='done'?'checked':''} aria-label="Mark ${esc(task.title)} completed"><span></span></label><div class="upgrade-task-body"><div class="upgrade-task-title"><strong>${esc(task.title)}</strong><span class="priority priority-${esc((task.priority||'medium').toLowerCase())}">${esc(task.priority||'Medium')} priority</span></div><p>${esc(task.description||"")}</p><div class="upgrade-task-meta"><label>Status <select data-task-status="${esc(task.id)}"><option value="pending" ${task.status==='pending'?'selected':''}>Not Started</option><option value="in_progress" ${task.status==='in_progress'?'selected':''}>In Progress</option><option value="done" ${task.status==='done'?'selected':''}>Completed</option></select></label><label>Planning deadline <input type="date" value="${esc(task.due_date||"")}" data-task-deadline="${esc(task.id)}"></label>${task.source_url?`<a href="${esc(task.source_url)}" target="_blank" rel="noopener noreferrer">Official resource ↗</a>`:'<span>Resource: Verification Required</span>'}</div></div></article>`).join("");
}
async function renderRoadmapEnhancements() {
  if (!root || !signedInUser || !location.hash.includes("roadmap") && !root.textContent.includes("Your roadmap")) return;
  addGradeField();
  if (document.getElementById("roadmapUpgrade")) return;
  const {data,error}=await supabase.from("roadmap_tasks").select("*").eq("user_id",signedInUser.id).order("sort_order");
  if (error) { showFeedback(`Roadmap tasks: ${error.message}`,true); return; }
  const rows=data||[];
  const completed=rows.filter(t=>t.status==="done").length;
  const percent=rows.length?Math.round(completed/rows.length*100):0;
  const upcoming=rows.filter(t=>t.status!=="done"&&t.due_date).sort((a,b)=>a.due_date.localeCompare(b.due_date)).slice(0,4);
  const section=document.createElement("section"); section.id="roadmapUpgrade"; section.className="panel roadmap-upgrade";
  section.innerHTML=`<div class="section-heading"><div><span class="eyebrow">PERSONALIZED PLAN</span><h2>${esc(profileGrade())} · ${esc(studentProfile.intended_subject||"Choose a major in your profile")}</h2><p>Admission year: ${esc(studentProfile.intended_start_year||"Set in profile")} · Planning dates are yours to set; official deadlines must be verified with each institution.</p></div><button type="button" class="btn" data-generate-roadmap>Generate / refresh suggestions</button></div><div class="upgrade-progress"><div class="section-heading"><strong>${completed} of ${rows.length} tasks completed</strong><span>${percent}%</span></div><div class="progress"><span style="width:${percent}%"></span></div></div><div class="upgrade-task-list">${roadmapTasksMarkup(rows)}</div><h3>Upcoming deadlines</h3>${upcoming.length?upcoming.map(t=>`<div class="list-row"><strong>${esc(t.title)}</strong><span>${esc(t.due_date)}</span></div>`).join(""):'<p class="empty">No upcoming deadlines set. Add personal planning dates to tasks above.</p>'}<p class="verification-note">Suggested targets are not admission cutoffs. Verify every requirement and deadline on the official university or organizer website.</p>`;
  root.append(section);
}
async function generateRoadmap() {
  if (!signedInUser || busy) return;
  if (!studentProfile.id) await loadProfile();
  const {data:existing,error}=await supabase.from("roadmap_tasks").select("roadmap_key").eq("user_id",signedInUser.id);
  if (error) throw error;
  const have=new Set((existing||[]).map(t=>t.roadmap_key).filter(Boolean));
  const major=selectedMajorTasks();
  const grade=profileGrade();
  const suggestions=[...ROADMAP,...major].map(item=>({...item,key:`${grade.toLowerCase().replace(/\s/g,'-')}-${item.key}`})).filter(item=>!have.has(item.key));
  if (!suggestions.length) { showFeedback("Your personalized roadmap suggestions are already added. Update your grade or major to see new items."); return; }
  const payload=suggestions.map((task,index)=>({user_id:signedInUser.id,title:task.title,category:task.category,description:task.description,source_url:task.resource,due_date:null,status:"pending",sort_order:Date.now()+index,priority:task.priority,roadmap_key:task.key}));
  const {error:insertError}=await supabase.from("roadmap_tasks").insert(payload);
  if (insertError) throw insertError;
  showFeedback(`${payload.length} tailored roadmap tasks added. Existing tasks and progress were preserved.`);
  await renderRoadmapEnhancements();
}
async function updateTask(id,patch) {
  const {error}=await supabase.from("roadmap_tasks").update(patch).eq("id",id).eq("user_id",signedInUser.id);
  if (error) throw error;
  const section=document.getElementById("roadmapUpgrade"); if(section) section.remove(); await renderRoadmapEnhancements();
}
const SCHOOL_LINKS={
  "massachusetts institute of technology":"https://mitadmissions.org/","stanford university":"https://admission.stanford.edu/","harvard university":"https://college.harvard.edu/admissions","university of oxford":"https://www.ox.ac.uk/admissions/undergraduate","university of cambridge":"https://www.undergraduate.study.cam.ac.uk/","california institute of technology":"https://www.admissions.caltech.edu/","princeton university":"https://admission.princeton.edu/","yale university":"https://admissions.yale.edu/","columbia university":"https://undergrad.admissions.columbia.edu/","university of chicago":"https://collegeadmissions.uchicago.edu/","eth zurich":"https://ethz.ch/en/studies.html","epfl":"https://www.epfl.ch/education/admission/","imperial college london":"https://www.imperial.ac.uk/study/apply/undergraduate/","university college london":"https://www.ucl.ac.uk/prospective-students/undergraduate","national university of singapore":"https://nus.edu.sg/oam/","nanyang technological university":"https://www.ntu.edu.sg/admissions/undergraduate","university of toronto":"https://future.utoronto.ca/","university of melbourne":"https://study.unimelb.edu.au/","university of tokyo":"https://www.u-tokyo.ac.jp/en/prospective-students/","tsinghua university":"https://www.tsinghua.edu.cn/en/"
};
function universityDetail(name,country,url) {
  const source=url||SCHOOL_LINKS[name.toLowerCase()]||"";
  const sections=["Admission requirements","SAT/ACT policy","Recommended SAT target (not a cutoff)","English proficiency","Academic prerequisites","Application deadlines","Essays and recommendations","Required documents","Scholarships and financial aid","Application portal"];
  return `<section class="university-upgrade"><button class="btn secondary" data-university-return>← Back to universities</button><header><span class="eyebrow">UNIVERSITY ADMISSIONS</span><h1>${esc(name)}</h1><p>${esc(country)} · Location details: Verification Required</p><p>Overview and program-specific information must be confirmed using this university's official admissions source.</p></header><div class="university-facts">${sections.map((title,i)=>`<article class="university-fact"><h3>${esc(title)}</h3><p>${i===2&&/massachusetts institute|stanford|harvard|california institute|princeton|yale/i.test(name)?'Suggested preparation target: 1500+ for a highly selective US STEM application. This is a planning target only, not a university cutoff or guarantee.':'Verification Required — confirm for your program and admission cycle.'}</p>${source?`<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Official source ↗</a>`:'<span>Official source link not available — Verification Required</span>'}</article>`).join("")}</div><p class="verification-note">No unverified requirements or dates are presented as facts. Check the source for your exact course and admission cycle. Admission cycle: Verification Required · Last verified: Not yet verified.</p>${source?`<a class="btn" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Official admissions website ↗</a>`:''}</section>`;
}
function addUniversityButtons() {
  if (!root || !root.textContent.includes("Explore universities")) return;
  root.querySelectorAll(".university-card").forEach(card=>{
    if(card.querySelector("[data-upgrade-university]")) return;
    const title=card.querySelector("strong")?.textContent?.replace(/^\d+\.\s*/,"").trim();
    if(!title)return;
    const button=document.createElement("button");button.type="button";button.className="btn secondary upgrade-detail-button";button.dataset.upgradeUniversity=title;button.textContent="Admissions roadmap";
    card.append(button);
  });
}
const OPPORTUNITIES=[
 {title:"Regeneron International Science and Engineering Fair (ISEF)",category:"Research competition",eligibility:"Students qualify through a Society for Science-affiliated fair; direct registration for ISEF is not the qualification route. Age, grade, country and local deadlines depend on the affiliated fair and current rules.",url:"https://www.societyforscience.org/isef/",details:"Begin by finding and qualifying through an affiliated fair. Confirm all current rules, deadlines, eligibility and fees with the fair organizer. Do not assume direct entry."},
 {title:"Society for Science-affiliated science fairs",category:"Research competition",eligibility:"Eligibility, age/grade limits, country participation, deadlines and fees vary by affiliated fair and year. Verify with the individual organizer.",url:"https://www.societyforscience.org/isef/affiliated-fairs/",details:"Use the official affiliated-fair directory to locate a route for your region, then read the current organizer rules."},
 {title:"National Science and Engineering Fair Pakistan (NSEF)",category:"Research competition",eligibility:"Verification Required. Current Pakistan eligibility, age/grade requirements, deadlines, fees and ISEF affiliation must be confirmed with the official organizer before relying on qualification.",url:"",details:"No international qualification is promised. Verify the current organizer publication and Society for Science affiliation before treating NSEF as an ISEF pathway."},
 {title:"Official SAT practice",category:"Academic preparation",eligibility:"Use College Board's official resources; confirm any exam registration dates directly with College Board.",url:"https://satsuite.collegeboard.org/sat/practice-preparation",details:"Official practice materials and Bluebook tests are available from College Board. This is a resource, not a scholarship or competition."}
];
function addOpportunityDirectory() {
  if(!root || !root.textContent.includes("Opportunities") || document.getElementById("verified-opportunities")) return;
  const section=document.createElement("section");section.id="verified-opportunities";section.className="panel";
  section.innerHTML=`<h2>Research and preparation directory</h2><p>Organizer eligibility, fees and dates can change. Listings without verified current information are marked Verification Required.</p><div class="opportunity-grid">${OPPORTUNITIES.map((o,i)=>`<article class="opportunity-card upgrade-opportunity" data-opportunity="${i}"><span class="badge">${esc(o.category)}</span><h3>${esc(o.title)}</h3><p>${esc(o.eligibility)}</p><button class="btn secondary" data-opportunity-detail="${i}">Eligibility and process</button>${o.url?` <a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">Official information ↗</a>`:'<p>Official application link: Verification Required</p>'}<small>Last verified: ${o.url?'Link recorded; current details not independently verified':'Verification Required'}</small><button class="btn save-opportunity" data-save-upgrade="${i}">Save opportunity</button></article>`).join("")}</div>`;
  root.append(section);
}
function initObserver() {
  if(!root) return;
  const observer=new MutationObserver(()=>{addGradeField();addUniversityButtons();addOpportunityDirectory();void renderRoadmapEnhancements();});
  observer.observe(root,{childList:true,subtree:true});
}
document.addEventListener("click",async event=>{
  const generate=event.target.closest("[data-generate-roadmap]");
  if(generate){generate.disabled=true;try{await generateRoadmap();}catch(e){showFeedback(e.message||"Could not create roadmap tasks. Run the Supabase upgrade migration first.",true);}finally{generate.disabled=false;}return;}
  const school=event.target.closest("[data-upgrade-university]");
  if(school){const card=school.closest(".university-card");const name=school.dataset.upgradeUniversity;const country=card?.dataset.universityCountry||card?.querySelector("p")?.textContent||"";root.innerHTML=universityDetail(name,country,SCHOOL_LINKS[name.toLowerCase()]);return;}
  if(event.target.closest("[data-university-return]")){document.querySelector('.nav-link[data-page="universities"]')?.click();return;}
  const detail=event.target.closest("[data-opportunity-detail]");
  if(detail){const o=OPPORTUNITIES[Number(detail.dataset.opportunity)];const existing=detail.closest("article").querySelector(".opportunity-expanded");if(existing){existing.remove();detail.textContent="Eligibility and process";}else{const p=document.createElement("p");p.className="opportunity-expanded";p.textContent=o.details;detail.after(p);detail.textContent="Hide details";}return;}
  const save=event.target.closest("[data-save-upgrade]");
  if(save){if(!signedInUser)return;const o=OPPORTUNITIES[Number(save.dataset.saveUpgrade)];const {error}=await supabase.from("opportunities").select("id").eq("title",o.title).maybeSingle();if(error){showFeedback("Run the Supabase upgrade migration to enable saving these opportunities.",true);return;}showFeedback("This directory entry can be saved after the organizer record is available in Supabase.",true);}
});
document.addEventListener("change",async event=>{
  try {
    if(event.target.matches("[data-upgrade-task]")) await updateTask(event.target.dataset.upgradeTask,{status:event.target.checked?"done":"pending"});
    if(event.target.matches("[data-task-status]")) await updateTask(event.target.dataset.taskStatus,{status:event.target.value});
    if(event.target.matches("[data-task-deadline]")) await updateTask(event.target.dataset.taskDeadline,{due_date:event.target.value||null});
  } catch(error){showFeedback(error.message||"Could not save your task change.",true);}
});
document.addEventListener("submit",event=>{
  if(event.target.id!=="profileForm")return;
  const grade=event.target.querySelector('[name="current_grade"]')?.value;
  if(grade)studentProfile.current_grade=grade;
});
async function start(){
  try{const {data,error}=await supabase.auth.getSession();if(error)throw error;signedInUser=data.session?.user||null;if(signedInUser)await loadProfile();initObserver();addGradeField();addUniversityButtons();addOpportunityDirectory();}
  catch(error){console.warn("Roadmap upgrade initialized with limited profile data:",error.message);initObserver();}
}
supabase.auth.onAuthStateChange((_event,session)=>{signedInUser=session?.user||null;if(signedInUser)void loadProfile().then(()=>{addGradeField();}).catch(()=>{});});
void start();
