// Dashboard: summary stats + recent reservations

async function loadDashboard() {
  const fac = await SUPABASE.from("facilities").select("*");
  const res = await SUPABASE.from("reservations").select("*").order("created_at", { ascending: false });

  if (fac.error || res.error) {
    showToast("Failed to load dashboard: " + (fac.error || res.error).message, "error");
    return;
  }

  const facilities = fac.data || [];
  const reservations = res.data || [];

  document.getElementById("stat-total").textContent = facilities.length;
  document.getElementById("stat-active").textContent = facilities.filter(f => f.status === "Active").length;
  document.getElementById("stat-maintenance").textContent = facilities.filter(f => f.status === "Under Maintenance").length;
  document.getElementById("stat-pending").textContent = reservations.filter(r => r.status === "Pending").length;
  document.getElementById("stat-in-use").textContent = reservations.filter(r => r.status === "Scheduled" || r.status === "In Use").length;
  document.getElementById("stat-completed").textContent = reservations.filter(r => r.status === "Completed").length;

  // Recent reservations (join with facilities)
  const facilityMap = new Map(facilities.map(f => [f.id, f]));
  const recent = reservations.slice(0, 10);

  const tbody = document.getElementById("recent-tbody");
  document.getElementById("loading").style.display = "none";

  if (recent.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  document.getElementById("table-wrap").style.display = "block";
  tbody.innerHTML = recent
    .map(r => {
      const fac = facilityMap.get(r.facility_id);
      return `
      <tr>
        <td>${escapeHtml(fac ? fac.facility_name : "—")}</td>
        <td><strong>${escapeHtml(r.requester_name)}</strong></td>
        <td>${fmtDateTime(r.start_datetime)}</td>
        <td>${fmtDateTime(r.end_datetime)}</td>
        <td>${statusBadge(r.status)}</td>
      </tr>`;
    })
    .join("");
}

(async function init() {
  const session = await requireAuth();
  if (!session) return;
  await renderShell("Dashboard");
  const notice = sessionStorage.getItem("system_notice");
  if (notice) {
    sessionStorage.removeItem("system_notice");
    showToast(notice);
  }
  await loadDashboard();
})();
