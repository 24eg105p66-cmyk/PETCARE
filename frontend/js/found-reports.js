// ============================================================================
// PetCare Passport - Found-Pet Reports Dashboard Logic
// ============================================================================

let allReports = [];
let currentStatusFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadFoundReports();

  // Status Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-status-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('btn-primary-custom', 'active');
        b.classList.add('btn-light');
      });
      btn.classList.add('btn-primary-custom', 'active');
      btn.classList.remove('btn-light');
      currentStatusFilter = btn.dataset.status;
      renderReports();
    });
  });
});

async function loadFoundReports() {
  try {
    const data = await apiRequest('/found-reports');
    allReports = data.reports || [];
    renderReports();
  } catch (err) {
    console.error('Error loading found reports:', err);
    showToast('Failed to load found reports.', 'error');
  }
}

function renderReports() {
  const container = document.getElementById('reportsContainer');
  const filtered = currentStatusFilter === 'all'
    ? allReports
    : allReports.filter(r => r.status === currentStatusFilter);

  document.getElementById('reportCountText').textContent = `Showing ${filtered.length} of ${allReports.length} reports`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state py-5">
          <div class="empty-state-icon text-success"><i class="bi bi-shield-check"></i></div>
          <h4 class="fw-bold">No ${currentStatusFilter === 'all' ? '' : currentStatusFilter} reports</h4>
          <p class="text-muted small mb-0">When someone scans a pet's collar tag and submits a report, it will appear here in real time.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const statusBadges = {
      pending: '<span class="badge bg-danger-subtle text-danger border border-danger-subtle py-1 px-2">🚨 Pending Action</span>',
      contacted: '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle py-1 px-2">📞 In Contact</span>',
      resolved: '<span class="badge bg-success-subtle text-success border border-success-subtle py-1 px-2">✅ Reunited / Resolved</span>'
    };

    return `
      <div class="col-lg-6">
        <div class="custom-card p-4 h-100 d-flex flex-column border">
          <!-- Header: Pet Info & Status -->
          <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div class="d-flex align-items-center gap-2">
              <img src="${r.pet_photo_url || '/uploads/pets/demo-max.svg'}" alt="${escapeHtml(r.pet_name)}" class="rounded-circle border" style="width: 36px; height: 36px; object-fit: cover;" onerror="this.src='/uploads/pets/demo-max.svg'">
              <div>
                <strong class="text-dark">${escapeHtml(r.pet_name)}</strong>
                <span class="text-muted text-xs d-block" style="font-size: 0.72rem;">${escapeHtml(r.pet_species)} • ${escapeHtml(r.pet_breed || 'Mixed')}</span>
              </div>
            </div>
            ${statusBadges[r.status] || ''}
          </div>

          <!-- Finder Details -->
          <div class="mb-3">
            <h6 class="fw-bold text-dark mb-2">Finder Information</h6>
            <div class="row g-2 small text-muted">
              <div class="col-sm-6">
                <i class="bi bi-person me-1"></i> Name: <strong class="text-dark">${escapeHtml(r.finder_name)}</strong>
              </div>
              <div class="col-sm-6">
                <i class="bi bi-telephone me-1"></i> Phone: 
                <a href="tel:${escapeHtml(r.finder_phone)}" class="text-success fw-bold">${escapeHtml(r.finder_phone)}</a>
              </div>
              ${r.finder_email ? `
                <div class="col-12">
                  <i class="bi bi-envelope me-1"></i> Email: 
                  <a href="mailto:${escapeHtml(r.finder_email)}" class="text-muted">${escapeHtml(r.finder_email)}</a>
                </div>
              ` : ''}
              <div class="col-12">
                <i class="bi bi-geo-alt me-1 text-danger"></i> Location Found: 
                <strong class="text-dark">${escapeHtml(r.found_location)}</strong>
              </div>
              <div class="col-12">
                <i class="bi bi-clock me-1"></i> Date & Time: 
                <span class="text-dark">${formatDate(r.found_date)}</span>
              </div>
            </div>
          </div>

          <!-- Message -->
          ${r.message ? `
            <div class="p-3 bg-light rounded-3 small text-dark border mb-3">
              <strong class="d-block text-muted text-xs mb-1" style="font-size: 0.72rem;">FINDER'S MESSAGE:</strong>
              ${escapeHtml(r.message)}
            </div>
          ` : ''}

          <!-- Optional Photo taken by Finder -->
          ${r.photo_url ? `
            <div class="mb-3">
              <label class="small text-muted fw-bold d-block mb-1">PHOTO PROVIDED BY FINDER:</label>
              <img src="${r.photo_url}" alt="Found Pet Photo" class="img-fluid rounded-3 border" style="max-height: 200px; width: 100%; object-fit: cover;">
            </div>
          ` : ''}

          <!-- Status Update Action Bar -->
          <div class="mt-auto pt-3 border-top d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <span class="small text-muted" style="font-size: 0.75rem;">
              Reported ${formatDate(r.created_at)}
            </span>
            <div class="d-flex gap-2">
              <div class="dropdown">
                <button class="btn btn-outline-custom btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  Update Status
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                  <li><a class="dropdown-item small" href="#" onclick="updateStatus(${r.id}, 'pending', event)">Mark as Pending</a></li>
                  <li><a class="dropdown-item small" href="#" onclick="updateStatus(${r.id}, 'contacted', event)">Mark as In Contact</a></li>
                  <li><a class="dropdown-item small text-success fw-bold" href="#" onclick="updateStatus(${r.id}, 'resolved', event)">Mark as Reunited / Resolved</a></li>
                </ul>
              </div>
              <a href="tel:${escapeHtml(r.finder_phone)}" class="btn btn-primary-custom btn-sm">
                <i class="bi bi-telephone-fill"></i> Call Finder
              </a>
            </div>
          </div>

        </div>
      </div>
    `;
  }).join('');
}

async function updateStatus(reportId, newStatus, event) {
  if (event) event.preventDefault();

  try {
    const res = await apiRequest(`/found-reports/${reportId}/status`, {
      method: 'PATCH',
      body: { status: newStatus }
    });

    showToast(res.message || 'Status updated.', 'success');
    await loadFoundReports();
  } catch (err) {
    showToast(err.message || 'Failed to update status.', 'error');
  }
}
