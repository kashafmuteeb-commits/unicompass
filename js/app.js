import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// REPLACE THESE TWO VALUES WITH YOUR SUPABASE DETAILS

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_SUPABASE") &&
  SUPABASE_ANON_KEY.length > 30 &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");

const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const authForm = document.getElementById("authForm");
const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const notice = document.getElementById("notice");

let mode = "signin";

function message(text, type = "error") {
  notice.textContent = text;
  notice.className = "notice " + type;
}

function clearMessage() {
  notice.textContent = "";
  notice.className = "notice hidden";
}

function setMode(newMode) {
  mode = newMode;
  clearMessage();

  const signup = mode === "signup";
  const reset = mode === "reset";

  document.getElementById("nameField")
    .classList.toggle("hidden", !signup);

  document.getElementById("fullName").required = signup;

  document.getElementById("password").required = !reset;

  document.getElementById("password").classList.toggle("hidden", reset);

  document.getElementById("passwordHint")
    .classList.toggle("hidden", reset);

  document.getElementById("forgotButton")
    .classList.toggle("hidden", signup || reset);

  document.getElementById("formEyebrow").textContent =
    signup ? "GET STARTED" : reset ? "ACCOUNT RECOVERY" : "WELCOME BACK";

  document.getElementById("formTitle").textContent =
    signup ? "Create your account" :
    reset ? "Reset your password" :
    "Sign in to your space";

  document.getElementById("formSubtitle").textContent =
    signup ? "Start organizing your student journey." :
    reset ? "We'll send you a password reset link." :
    "Pick up where you left off.";

  document.getElementById("submitText").textContent =
    signup ? "Create account" :
    reset ? "Send reset link" :
    "Sign in";

  document.getElementById("switchCopy").innerHTML =
    signup
      ? 'Already have an account? <button class="text-button" id="switchMode">Sign in</button>'
      : 'New to UniCompass? <button class="text-button" id="switchMode">Create an account</button>';

  document.getElementById("switchMode").onclick = () =>
    setMode(signup ? "signin" : "signup");
}

function showDashboard(user) {
  const name =
    user.user_metadata?.full_name ||
    user.email.split("@")[0];

  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  appView.style.display = "grid";

  document.getElementById("welcomeTitle").textContent =
    "Welcome back, " + name + ".";

  document.getElementById("sidebarName").textContent = name;
  document.getElementById("sidebarEmail").textContent = user.email;

  document.getElementById("userAvatar").textContent =
    name.charAt(0).toUpperCase();

  document.getElementById("todayDate").textContent =
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "full"
    }).format(new Date());
}

function showLogin() {
  appView.classList.add("hidden");
  appView.style.display = "none";
  authView.classList.remove("hidden");
}

if (!supabase) {
  message(
    "Connect Supabase first. Add your Project URL and anon public key in js/app.js."
  );
  document.getElementById("submitButton").disabled = true;
  document.getElementById("submitText").textContent =
    "Supabase setup required";
} else {
  const { data: { session } } =
    await supabase.auth.getSession();

  if (session?.user) showDashboard(session.user);

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) showDashboard(session.user);
    else showLogin();
  });
}

document.getElementById("switchMode").onclick = () =>
  setMode("signup");

document.getElementById("forgotButton").onclick = () =>
  setMode("reset");

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  if (!supabase) {
    message("Supabase is not connected.");
    return;
  }

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const button = document.getElementById("submitButton");

  button.disabled = true;
  document.getElementById("submitText").textContent = "Please wait...";

  try {
    if (mode === "signup") {
      const fullName =
        document.getElementById("fullName").value.trim();

      if (!fullName) throw new Error("Enter your name.");
      if (password.length < 8)
        throw new Error("Password must have at least 8 characters.");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin +
            window.location.pathname
        }
      });

      if (error) throw error;

      if (data.session) {
        showDashboard(data.session.user);
      } else {
        setMode("signin");
        message(
          "Account created! Check your email and confirm your account before signing in.",
          "success"
        );
      }

    } else if (mode === "reset") {

      const { error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin +
            window.location.pathname
        });

      if (error) throw error;

      setMode("signin");
      message("Check your email for a password reset link.", "success");

    } else {

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      showDashboard(data.user);
    }

  } catch (error) {
    message(error.message);
  } finally {
    button.disabled = false;

    document.getElementById("submitText").textContent =
      mode === "signup" ? "Create account" :
      mode === "reset" ? "Send reset link" :
      "Sign in";
  }
});

document.getElementById("signOutButton")
  .addEventListener("click", async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) message(error.message);
    else {
      authForm.reset();
      setMode("signin");
      showLogin();
    }
  });
    
