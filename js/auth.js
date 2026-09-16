// Authentication: Login / Sign-up with 3 roles
// Roles: Administrator, Facility Staff, Requester

const loginTab = document.getElementById("tab-login");
const signupTab = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const note = document.getElementById("form-note");

// Toggle password visibility
document.querySelectorAll("[data-toggle-pw]").forEach((cb) => {
  cb.addEventListener("change", () => {
    const input = document.getElementById(cb.dataset.togglePw);
    if (input) input.type = cb.checked ? "text" : "password";
  });
});

function switchTab(which) {
  const isLogin = which === "login";
  loginTab.classList.toggle("active", isLogin);
  signupTab.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
  note.textContent = isLogin
    ? "First time? Create an account above."
    : "Already have an account? Log in.";
}

loginTab.addEventListener("click", () => switchTab("login"));
signupTab.addEventListener("click", () => switchTab("signup"));

// Redirect if already logged in
SUPABASE.auth.getSession().then(({ data }) => {
  if (data.session) window.location.href = "dashboard.html";
});

// Show pending notice
const pendingNotice = sessionStorage.getItem("system_notice");
if (pendingNotice) {
  sessionStorage.removeItem("system_notice");
  showToast(pendingNotice);
}

// ---------- Login ----------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const btn = loginForm.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Signing in...";

  const { data, error } = await SUPABASE.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  btn.textContent = "Sign In";

  if (error) {
    showToast(error.message, "error");
    return;
  }
  sessionStorage.setItem("system_notice", "Login successful. Welcome back!");
  window.location.href = "dashboard.html";
});

// ---------- Sign Up ----------
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("su-email").value.trim();
  const password = document.getElementById("su-password").value;
  const role = document.getElementById("su-role").value;
  const btn = signupForm.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Creating account...";

  const { data, error } = await SUPABASE.auth.signUp({ email, password });
  btn.disabled = false;
  btn.textContent = "Create Account";

  if (error) {
    showToast(error.message, "error");
    return;
  }

  // Save role to profiles table
  if (data.user) {
    const { error: profErr } = await SUPABASE.from("profiles").insert({
      id: data.user.id,
      role: role,
    });
    if (profErr) {
      showToast("Signed up, but profile could not be saved: " + profErr.message, "error");
    }
  }

  if (data.session) {
    sessionStorage.setItem("system_notice", "Account created successfully! Welcome!");
    window.location.href = "dashboard.html";
  } else {
    showToast("Registration successful! Check your email to confirm your account.", "success");
  }
});
