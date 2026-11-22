/* Additive profile fields for research-opportunity matching. The existing profile form submit handler saves these named inputs. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const profileFieldsClient = createClient(
  "https://qopuyrsriphebzzgvecl.supabase.co",
  "sb_publishable_NhOB7g0-PnctW7LN3AxIow_CmcJkw5s"
);
const profileFieldsRoot = document.getElementById("pageContent");
const profileFieldNames = [
  ["age", "Age", "number", "e.g. 16"],
  ["current_grade", "Current grade", "text", "e.g. Grade 11"],
  ["curriculum", "Curriculum", "text", "e.g. A-Level, IB, national curriculum"],
  ["academic_interests", "Academic interests", "text", "Subjects or topics you enjoy"],
  ["research_interests", "Research interests", "text", "Research topics you may explore"],
  ["academic_background", "Academic background", "text", "Relevant courses or experience"]
];
let profileFieldsUserId = null;

async function addMatchingFields() {
  const form = profileFieldsRoot?.querySelector("#profileForm");
  if (!form) return;
  const { data } = await profileFieldsClient.auth.getSession();
  const user = data.session?.user;
  if (!user || profileFieldsUserId === user.id) return;
  profileFieldsUserId = user.id;

  const { data: profile, error } = await profileFieldsClient.from("profiles")
    .select("age,current_grade,curriculum,academic_interests,research_interests,academic_background")
    .eq("id", user.id).maybeSingle();
  if (error) {
    console.warn("Additional opportunity profile fields are unavailable until the profile migration is applied.", error);
    profileFieldsUserId = null;
    return;
  }

  profileFieldNames.forEach(([name, label, type, placeholder]) => {
    if (form.querySelector(`[name="${name}"]`)) return;
    const field = document.createElement("div");
    field.className = "form-field";
    const input = document.createElement("input");
    input.className = "control";
    input.name = name;
    input.type = type;
    input.placeholder = placeholder;
    if (type === "number") {
      input.min = "1";
      input.max = "120";
    }
    input.value = profile?.[name] ?? "";
    const labelElement = document.createElement("label");
    labelElement.textContent = label;
    field.append(labelElement, input);
    const submitField = form.querySelector(".form-field.full:last-child");
    if (submitField) form.insertBefore(field, submitField);
    else form.append(field);
  });
}

function hideDuplicateAspireListing() {
  const card = profileFieldsRoot?.querySelector("#aspireFellowshipCard");
  if (!card) return;
  profileFieldsRoot.querySelectorAll(".opportunity-card").forEach((listing) => {
    const title = listing.querySelector("strong")?.textContent?.trim().toLowerCase() || "";
    if (title.includes("aspire fellowship")) listing.remove();
  });
}

if (profileFieldsRoot) {
  const observer = new MutationObserver(() => {
    if (/student profile/i.test(profileFieldsRoot.querySelector("h1")?.textContent || "")) {
      void addMatchingFields();
    }
    hideDuplicateAspireListing();
  });
  observer.observe(profileFieldsRoot, { childList: true, subtree: true });
}

profileFieldsClient.auth.onAuthStateChange(() => {
  profileFieldsUserId = null;
  void addMatchingFields();
});
