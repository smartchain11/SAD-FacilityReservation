// ============================================================
// Shared Helpers: toast, auth guard, role, nav, formatting
// Roles: administrator, facility_staff, requester
// ============================================================

let currentRole = "requester";
let currentUserId = null;

// ---------- Profile / Role ----------
async function loadProfile() {
  try {
    const { data } = await SUPABASE.auth.getUser();
    if (!data.user) return;
    currentUserId = data.user.id;
    const { data: prof } = await SUPABASE.from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (prof && prof.role) currentRole = prof.role;
  } catch (e) {
    // keep default role
  }
}

function isAdmin() { return currentRole === "administrator"; }
function isStaff() { return currentRole === "facility_staff"; }
function isRequester() { return currentRole === "requester"; }

// ---------- Toast ----------
function showToast(message, type = "success") {
  const wrap = document.getElementById("toast-wrap");
  if (!wrap) return;
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = message;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ---------- Formatting ----------
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d)) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function today() {
  const d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function nowLocalISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
}

// ---------- Status badge ----------
function statusBadge(status) {
  const map = {
    Active: "active",
    "Under Maintenance": "maintenance",
    Pending: "pending",
    Approved: "approved",
    Rejected: "rejected",
    Scheduled: "scheduled",
    "In Use": "in-use",
    Completed: "completed",
    Cancelled: "cancelled",
    Available: "active",
    Borrowed: "borrowed",
    Returned: "returned",
    Overdue: "overdue",
  };
  return `<span class="badge ${map[status] || "default"}">${escapeHtml(status)}</span>`;
}

function roleBadge(role) {
  const labels = {
    administrator: "Administrator",
    facility_staff: "Facility Staff",
    requester: "Requester",
  };
  return `<span class="role-badge ${role}">${labels[role] || role}</span>`;
}

function roleLabel(role) {
  const labels = {
    administrator: "Administrator",
    facility_staff: "Facility Staff",
    requester: "Requester",
  };
  return labels[role] || role;
}

// ---------- Auth guard ----------
async function requireAuth() {
  try {
    const { data, error } = await SUPABASE.auth.getSession();
    if (error || !data.session) {
      window.location.href = "index.html";
      return null;
    }
    return data.session;
  } catch (e) {
    window.location.href = "index.html";
    return null;
  }
}

async function logout() {
  await SUPABASE.auth.signOut();
  sessionStorage.setItem("system_notice", "You have been logged out.");
  window.location.href = "index.html";
}

// ---------- Shell (topbar + nav) ----------
async function renderShell(active = "") {
  await loadProfile();
  const { data } = await SUPABASE.auth.getUser();
  const user = data.user;
  if (user) {
    document.getElementById("user-name").innerHTML =
      escapeHtml(user.email) + " " + roleBadge(currentRole);
  }
  const nav = document.getElementById("main-nav");
  const links = [
    ["dashboard.html", "Dashboard"],
    ["facilities.html", "Facilities"],
    ["reservations.html", "Reservations"],
  ];
  // Only administrators can see audit logs
  if (isAdmin()) {
    links.push(["audit-logs.html", "Audit Logs"]);
  }
  nav.innerHTML = links
    .map(
      ([href, label]) =>
        `<a href="${href}" class="${active === label ? "active" : ""}">${label}</a>`
    )
    .join("");
}
