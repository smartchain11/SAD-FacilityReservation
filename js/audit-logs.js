// Audit Logs module: view audit trail (Admin only)
// BR-B4-10: Approval and status changes must be logged

let allLogs = [];

async function loadAuditLogs() {
  // Only admins can view (RLS enforced too)
  if (!isAdmin()) {
    showToast("Access denied. Only administrators can view audit logs.", "error");
    window.location.href = "dashboard.html";
    return;
  }

  const { data, error } = await SUPABASE.from("audit_logs")
    .select("*")
    .order("performed_at", { ascending: false })
    .limit(200);

  if (error) {
    showToast("Failed to load audit logs: " + error.message, "error");
    return;
  }
  allLogs = data || [];
  renderLogs();
}

function actionBadge(action) {
  const cls = action.toLowerCase().replace(/_/g, '-');
  const map = {
    'submit': 'create',
    'approve': 'approve',
    'reject': 'reject',
    'cancel': 'reject',
    'status_change': 'status_change',
    'status-change': 'status_change',
    'complete': 'approve',
    'create': 'create',
    'update': 'update',
    'delete': 'delete',
  };
  const badgeCls = map[action.toLowerCase()] || 'update';
  return `<span class="audit-action ${badgeCls}">${escapeHtml(action)}</span>`;
}

function renderLogs() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const fAction = document.getElementById("filter-action").value;

  const rows = allLogs.filter(log => {
    const haystack = [log.action, log.target_table, log.details].join(" ").toLowerCase();
    const matchQ = !q || haystack.includes(q);
    const matchAction = !fAction || log.action === fAction;
    return matchQ && matchAction;
  });

  const tbody = document.getElementById("audit-tbody");
  document.getElementById("loading").style.display = "none";
  document.getElementById("table-wrap").style.display = "none";
  document.getElementById("empty-state").style.display = "none";

  if (rows.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  document.getElementById("table-wrap").style.display = "block";
  tbody.innerHTML = rows.map(log => `
    <tr>
      <td>${log.id}</td>
      <td>${actionBadge(log.action)}</td>
      <td>${escapeHtml(log.target_table)}</td>
      <td>${log.target_id || "—"}</td>
      <td style="white-space:normal;max-width:300px;">${escapeHtml(log.details)}</td>
      <td>${fmtDateTime(log.performed_at)}</td>
    </tr>
  `).join("");
}

// Search / filter
["search-input", "filter-action"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderLogs);
});

// Init
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  await renderShell("Audit Logs");
  await loadAuditLogs();
})();
