// Facilities module: CRUD (Admin), view + reserve (Requester), update condition (Staff)
// Business rules: BR-B4-01 (active only), BR-B4-08 (maintenance block)

let allFacilities = [];

async function loadFacilities() {
  const { data, error } = await SUPABASE.from("facilities")
    .select("*")
    .order("facility_name");
  if (error) {
    showToast("Failed to load facilities: " + error.message, "error");
    return;
  }
  allFacilities = data || [];
  renderFacilities();
  populateTypeFilter();
}

function renderFacilities() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const fStatus = document.getElementById("filter-status").value;
  const fType = document.getElementById("filter-type").value;

  const rows = allFacilities.filter(f => {
    const matchQ = !q || f.facility_name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q);
    const matchStatus = !fStatus || f.status === fStatus;
    const matchType = !fType || f.facility_type === fType;
    return matchQ && matchStatus && matchType;
  });

  const tbody = document.getElementById("facilities-tbody");
  document.getElementById("loading").style.display = "none";
  document.getElementById("table-wrap").style.display = "none";
  document.getElementById("empty-state").style.display = "none";

  if (rows.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  document.getElementById("table-wrap").style.display = "block";
  tbody.innerHTML = rows.map(f => {
    let actionsCell = "";

    if (isAdmin()) {
      actionsCell = `
        <button class="btn btn-outline btn-sm" onclick="editFacility(${f.id})">Edit</button>
        <button class="btn btn-red btn-sm" onclick="deleteFacility(${f.id})">Delete</button>`;
    } else if (isStaff()) {
      actionsCell = `
        <button class="btn btn-outline btn-sm" onclick="toggleMaintenance(${f.id})">
          ${f.status === 'Active' ? 'Set Maintenance' : 'Set Active'}
        </button>`;
    } else if (f.status === "Active") {
      actionsCell = `<button class="btn btn-sm" onclick="openReserveModal(${f.id})">Reserve</button>`;
    } else {
      actionsCell = `<span class="muted text-sm">Unavailable</span>`;
    }

    return `
    <tr>
      <td><strong>${escapeHtml(f.facility_name)}</strong></td>
      <td>${escapeHtml(f.facility_type)}</td>
      <td>${f.capacity}</td>
      <td>${escapeHtml(f.location)}</td>
      <td>${statusBadge(f.status)}</td>
      <td style="text-align:right;">${actionsCell}</td>
    </tr>`;
  }).join("");
}

function populateTypeFilter() {
  const select = document.getElementById("filter-type");
  const types = [...new Set(allFacilities.map(f => f.facility_type))].sort();
  select.innerHTML = '<option value="">Type: All</option>' +
    types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

// ----- Add/Edit Modal -----
function openModal(id = null, rec = null) {
  document.getElementById("modal-title").textContent = id ? "Edit Facility" : "Add Facility";
  document.getElementById("facility-id").value = id || "";
  document.getElementById("facility-name").value = rec ? rec.facility_name : "";
  document.getElementById("facility-type").value = rec ? rec.facility_type : "";
  document.getElementById("facility-capacity").value = rec ? rec.capacity : "";
  document.getElementById("facility-location").value = rec ? rec.location : "";
  document.getElementById("facility-description").value = rec ? (rec.description || "") : "";
  document.getElementById("facility-status").value = rec ? rec.status : "Active";
  document.getElementById("err-name").style.display = "none";
  document.getElementById("modal-backdrop").classList.add("open");
  document.getElementById("facility-name").focus();
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

document.getElementById("btn-add").addEventListener("click", () => openModal());
document.getElementById("btn-cancel").addEventListener("click", closeModal);
document.getElementById("modal-backdrop").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeModal();
});

function editFacility(id) {
  const rec = allFacilities.find(f => f.id === id);
  if (rec) openModal(rec.id, rec);
}

// ----- Save Facility (Admin) -----
document.getElementById("facility-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!isAdmin()) {
    showToast("Only administrators can manage facilities.", "error");
    return;
  }

  const id = document.getElementById("facility-id").value;
  const payload = {
    facility_name: document.getElementById("facility-name").value.trim(),
    facility_type: document.getElementById("facility-type").value.trim(),
    capacity: parseInt(document.getElementById("facility-capacity").value, 10),
    location: document.getElementById("facility-location").value.trim(),
    description: document.getElementById("facility-description").value.trim(),
    status: document.getElementById("facility-status").value,
  };

  if (!payload.facility_name) {
    document.getElementById("err-name").style.display = "block";
    return;
  }

  let result;
  if (id) {
    result = await SUPABASE.from("facilities").update(payload).eq("id", Number(id));
  } else {
    result = await SUPABASE.from("facilities").insert(payload);
  }

  if (result.error) {
    showToast("Save failed: " + result.error.message, "error");
    return;
  }

  // Audit log
  await SUPABASE.rpc("log_facility_change", {
    p_facility_id: id ? Number(id) : 0,
    p_action: id ? "UPDATE" : "CREATE",
    p_details: id ? "Facility updated: " + payload.facility_name : "Facility created: " + payload.facility_name,
  });

  showToast(id ? "Facility updated." : "Facility added.");
  closeModal();
  await loadFacilities();
});

// ----- Delete Facility (Admin) -----
async function deleteFacility(id) {
  if (!isAdmin()) {
    showToast("Only administrators can delete facilities.", "error");
    return;
  }
  const rec = allFacilities.find(f => f.id === id);
  if (!confirm(`Delete "${rec.facility_name}"?\nThis cannot be undone.`)) return;

  const { error } = await SUPABASE.from("facilities").delete().eq("id", id);
  if (error) {
    if (error.message && error.message.toLowerCase().includes("foreign key")) {
      showToast("Cannot delete: facility has reservation history.", "error");
    } else {
      showToast("Delete failed: " + error.message, "error");
    }
    return;
  }

  await SUPABASE.rpc("log_facility_change", {
    p_facility_id: id,
    p_action: "DELETE",
    p_details: "Facility deleted: " + rec.facility_name,
  });

  showToast("Facility deleted.");
  await loadFacilities();
}

// ----- Toggle Maintenance (Staff) -----
async function toggleMaintenance(id) {
  const rec = allFacilities.find(f => f.id === id);
  if (!rec) return;
  const newStatus = rec.status === "Active" ? "Under Maintenance" : "Active";
  if (!confirm(`Set "${rec.facility_name}" to ${newStatus}?`)) return;

  const { error } = await SUPABASE.from("facilities")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) {
    showToast("Update failed: " + error.message, "error");
    return;
  }

  await SUPABASE.rpc("log_facility_change", {
    p_facility_id: id,
    p_action: "STATUS_CHANGE",
    p_details: `Facility status changed to ${newStatus}: ${rec.facility_name}`,
  });

  showToast(`Facility set to ${newStatus}.`);
  await loadFacilities();
}

// ----- Reserve Modal (Requester) -----
function openReserveModal(id) {
  const rec = allFacilities.find(f => f.id === id);
  if (!rec) return;
  document.getElementById("reserve-facility-id").value = rec.id;
  document.getElementById("reserve-facility-name").textContent = rec.facility_name;
  document.getElementById("reserve-name").value = "";
  document.getElementById("reserve-dept").value = "";
  document.getElementById("reserve-purpose").value = "";
  document.getElementById("reserve-start").value = "";
  document.getElementById("reserve-end").value = "";
  document.getElementById("err-end").style.display = "none";
  document.getElementById("reserve-backdrop").classList.add("open");
}

function closeReserveModal() {
  document.getElementById("reserve-backdrop").classList.remove("open");
}

document.getElementById("btn-cancel-reserve").addEventListener("click", closeReserveModal);
document.getElementById("reserve-backdrop").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeReserveModal();
});

document.getElementById("reserve-form").addEventListener("submit", async e => {
  e.preventDefault();

  const facilityId = Number(document.getElementById("reserve-facility-id").value);
  const name = document.getElementById("reserve-name").value.trim();
  const dept = document.getElementById("reserve-dept").value.trim();
  const purpose = document.getElementById("reserve-purpose").value.trim();
  const start = document.getElementById("reserve-start").value;
  const end = document.getElementById("reserve-end").value;

  // BR-B4-02: start must precede end
  if (end <= start) {
    document.getElementById("err-end").style.display = "block";
    return;
  }
  document.getElementById("err-end").style.display = "none";

  const btn = document.getElementById("btn-submit-reserve");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  const { error } = await SUPABASE.rpc("submit_reservation", {
    p_facility_id: facilityId,
    p_requester_name: name,
    p_department: dept,
    p_purpose: purpose,
    p_start_datetime: new Date(start).toISOString(),
    p_end_datetime: new Date(end).toISOString(),
  });

  btn.disabled = false;
  btn.textContent = "Submit Request";

  if (error) {
    showToast("Request failed: " + (error.message || error.details), "error");
    return;
  }

  showToast("Reservation request submitted (Pending approval).");
  closeReserveModal();
  document.getElementById("reserve-form").reset();
});

// ----- Search / filter events -----
["search-input", "filter-status", "filter-type"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderFacilities);
});

// ----- Init -----
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  await renderShell("Facilities");

  // Show Add button only for admins
  if (isAdmin()) {
    document.getElementById("btn-add").style.display = "inline-flex";
  }

  await loadFacilities();
})();
