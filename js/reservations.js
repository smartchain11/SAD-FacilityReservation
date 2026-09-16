// Reservations module: full workflow management
// Admin: approve, reject | Staff: mark in use, complete | Requester: cancel own pending
// Business rules: BR-B4-03 to BR-B4-10

let allReservations = [];
let facilityMap = new Map();

async function loadData() {
  const fac = await SUPABASE.from("facilities").select("*").order("facility_name");
  if (fac.error) {
    showToast("Failed to load facilities: " + fac.error.message, "error");
    return;
  }
  facilityMap = new Map((fac.data || []).map(f => [f.id, f]));

  const res = await SUPABASE.from("reservations")
    .select("*")
    .order("created_at", { ascending: false });
  if (res.error) {
    showToast("Failed to load reservations: " + res.error.message, "error");
    return;
  }
  allReservations = res.data || [];
  renderReservations();
}

function renderReservations() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const fStatus = document.getElementById("filter-status").value;

  let rows = allReservations.filter(r => {
    const fac = facilityMap.get(r.facility_id);
    const facName = fac ? fac.facility_name : "";
    const haystack = [r.requester_name, facName, r.department, r.purpose].join(" ").toLowerCase();
    const matchQ = !q || haystack.includes(q);
    const matchStatus = !fStatus || r.status === fStatus;

    // Requesters see only their own reservations
    if (isRequester() && r.user_id !== currentUserId) return false;

    return matchQ && matchStatus;
  });

  const tbody = document.getElementById("reservations-tbody");
  document.getElementById("loading").style.display = "none";
  document.getElementById("table-wrap").style.display = "none";
  document.getElementById("empty-state").style.display = "none";

  if (rows.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  document.getElementById("table-wrap").style.display = "block";
  tbody.innerHTML = rows.map(r => {
    const fac = facilityMap.get(r.facility_id);
    let actionHtml = `<span class="muted text-sm">—</span>`;

    if (r.status === "Pending") {
      if (isAdmin()) {
        actionHtml = `
          <button class="btn btn-green btn-sm" onclick="approveReservation(${r.id})">Approve</button>
          <button class="btn btn-red btn-sm" onclick="rejectReservation(${r.id})">Reject</button>`;
      } else if (isRequester() && r.user_id === currentUserId) {
        actionHtml = `<button class="btn btn-outline btn-sm" onclick="cancelReservation(${r.id})">Cancel</button>`;
      } else {
        actionHtml = `<span class="muted text-sm">Awaiting approval</span>`;
      }
    } else if (r.status === "Scheduled") {
      if (isStaff() || isAdmin()) {
        actionHtml = `<button class="btn btn-teal btn-sm" onclick="markInUse(${r.id})">Mark In Use</button>`;
      }
    } else if (r.status === "In Use") {
      if (isStaff() || isAdmin()) {
        actionHtml = `<button class="btn btn-green btn-sm" onclick="completeReservation(${r.id})">Complete</button>`;
      }
    }
    // BR-B4-07: Completed reservations show no action (cannot be edited)

    return `
    <tr>
      <td><strong>${escapeHtml(fac ? fac.facility_name : "—")}</strong></td>
      <td>${escapeHtml(r.requester_name)}</td>
      <td>${escapeHtml(r.department)}</td>
      <td>${escapeHtml(r.purpose)}</td>
      <td>${fmtDateTime(r.start_datetime)}</td>
      <td>${fmtDateTime(r.end_datetime)}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="text-align:right;">${actionHtml}</td>
    </tr>`;
  }).join("");
}

// ----- Admin: Approve (BR-B4-04, BR-B4-06) -----
async function approveReservation(id) {
  const r = allReservations.find(x => x.id === id);
  const fac = facilityMap.get(r.facility_id);
  if (!confirm(`Approve reservation for "${fac ? fac.facility_name : ''}" by ${r.requester_name}?`)) return;

  const { error } = await SUPABASE.rpc("approve_reservation", { p_reservation_id: id });
  if (error) {
    showToast("Approval failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Reservation approved and scheduled.");
  await loadData();
}

// ----- Admin: Reject (BR-B4-04) -----
async function rejectReservation(id) {
  const r = allReservations.find(x => x.id === id);
  const fac = facilityMap.get(r.facility_id);
  if (!confirm(`Reject reservation for "${fac ? fac.facility_name : ''}" by ${r.requester_name}?`)) return;

  const { error } = await SUPABASE.rpc("reject_reservation", { p_reservation_id: id });
  if (error) {
    showToast("Rejection failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Reservation rejected.");
  await loadData();
}

// ----- Requester: Cancel own Pending (BR-B4-09) -----
async function cancelReservation(id) {
  if (!confirm("Cancel this reservation request?")) return;

  const { error } = await SUPABASE.rpc("cancel_reservation", { p_reservation_id: id });
  if (error) {
    showToast("Cancel failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Reservation cancelled.");
  await loadData();
}

// ----- Staff: Mark In Use -----
async function markInUse(id) {
  const r = allReservations.find(x => x.id === id);
  const fac = facilityMap.get(r.facility_id);
  if (!confirm(`Confirm "${fac ? fac.facility_name : ''}" is now In Use?`)) return;

  const { error } = await SUPABASE.rpc("mark_in_use", { p_reservation_id: id });
  if (error) {
    showToast("Failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Reservation marked as In Use.");
  await loadData();
}

// ----- Staff: Complete (BR-B4-07) -----
async function completeReservation(id) {
  const r = allReservations.find(x => x.id === id);
  const fac = facilityMap.get(r.facility_id);
  if (!confirm(`Mark "${fac ? fac.facility_name : ''}" reservation as Completed?`)) return;

  const { error } = await SUPABASE.rpc("complete_reservation", { p_reservation_id: id });
  if (error) {
    showToast("Failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Reservation completed.");
  await loadData();
}

// ----- Search / filter -----
["search-input", "filter-status"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderReservations);
});

// ----- Init -----
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  await renderShell("Reservations");
  await loadData();
})();
