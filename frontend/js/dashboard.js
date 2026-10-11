// ============================================================================
// PetCare Passport - Dashboard Logic
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const data = await apiRequest('/dashboard/summary');
    const { stats, pets, recentRecords, urgentReminders } = data;

    // Update Numerical Metrics
    document.getElementById('statTotalPets').textContent = stats.totalPets || 0;
    document.getElementById('statOverdueVaccines').textContent = stats.overdueVaccinations || 0;
    document.getElementById('statUpcomingVaccines').textContent = stats.upcomingVaccinations || 0;
    document.getElementById('statDewormings').textContent = stats.upcomingDewormings || 0;

    // Overdue Alert Banner
    const overdueBanner = document.getElementById('overdueAlertBanner');
    const overdueText = document.getElementById('overdueAlertText');
    if (stats.overdueVaccinations > 0) {
      overdueText.textContent = `You have ${stats.overdueVaccinations} overdue vaccination record${stats.overdueVaccinations === 1 ? '' : 's'} requiring immediate attention.`;
      overdueBanner.classList.remove('d-none');
    } else {
      overdueBanner.classList.add('d-none');
    }

    // Found Pet Alert Banner
    const foundBanner = document.getElementById('foundAlertBanner');
    const foundText = document.getElementById('foundAlertText');
    if (stats.pendingFoundReports > 0) {
      foundText.textContent = `${stats.pendingFoundReports} pending found-pet incident report${stats.pendingFoundReports === 1 ? '' : 's'} logged by finders.`;
      foundBanner.classList.remove('d-none');
    } else {
      foundBanner.classList.add('d-none');
    }

    // Render Registered Pets
    renderPetsGrid(pets);

    // Render Recent Medical Records
    renderRecentRecords(recentRecords);

    // Render Urgent Reminders
    renderUrgentReminders(urgentReminders);

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    showToast('Failed to load dashboard data. Please refresh.', 'error');
  }
}

function renderPetsGrid(pets) {
  const container = document.getElementById('petsGrid');

  if (!pets || pets.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <div class="empty-state-icon"><i class="bi bi-heart-pulse"></i></div>
          <h4 class="fw-bold">No pets registered yet</h4>
          <p class="text-muted small mb-4">Add your first pet to generate a unique emergency QR code and track health records.</p>
          <a href="add-pet.html" class="btn btn-primary-custom">
            <i class="bi bi-plus-lg"></i> Register Your First Pet
          </a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = pets.map(pet => {
    const photoUrl = pet.photo_url || '/assets/images/default-pet.png';
    const age = calculateAge(pet.dob);

    return `
      <div class="col-md-6 col-xl-4">
        <div class="custom-card hover-lift p-3 h-100 d-flex flex-column">
          <div class="d-flex align-items-center gap-3 mb-3">
            <img src="${photoUrl}" alt="${escapeHtml(pet.name)}" class="rounded-circle border" style="width: 72px; height: 72px; object-fit: cover;" onerror="this.src='/uploads/pets/demo-max.svg'">
            <div class="overflow-hidden">
              <div class="d-flex align-items-center gap-2">
                <h5 class="fw-bold mb-0 text-truncate">${escapeHtml(pet.name)}</h5>
                <span class="badge bg-success-subtle text-success small">${escapeHtml(pet.species)}</span>
              </div>
              <div class="text-muted small text-truncate">${escapeHtml(pet.breed || 'Mixed')}</div>
              <div class="text-muted text-xs" style="font-size: 0.78rem;">
                <i class="bi bi-calendar3"></i> ${age} • ${pet.current_weight ? pet.current_weight + ' kg' : 'Weight unrecorded'}
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded-3 mb-3 small">
            <div>
              <span class="text-muted">Records: </span>
              <strong>${pet.record_count || 0}</strong>
            </div>
            <div>
              ${pet.overdue_count > 0 
                ? `<span class="badge-status overdue"><i class="bi bi-exclamation-circle"></i> ${pet.overdue_count} Overdue</span>`
                : `<span class="badge-status upcoming"><i class="bi bi-check-circle"></i> Up to date</span>`
              }
            </div>
          </div>

          <div class="mt-auto d-flex gap-2">
            <a href="pet-details.html?id=${pet.id}" class="btn btn-primary-custom btn-sm flex-grow-1">
              <i class="bi bi-file-medical"></i> Health Profile
            </a>
            <a href="qr-code.html?petId=${pet.id}" class="btn btn-outline-custom btn-sm" title="View Emergency QR Tag">
              <i class="bi bi-qr-code"></i>
            </a>
            <a href="emergency-settings.html?petId=${pet.id}" class="btn btn-light btn-sm border" title="Privacy Settings">
              <i class="bi bi-shield-lock"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentRecords(records) {
  const container = document.getElementById('recentRecordsList');

  if (!records || records.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted small py-4">
        <i class="bi bi-clipboard-pulse fs-3 d-block mb-1 text-secondary"></i>
        No recent medical records found. Add health records to track vaccinations and visits.
      </div>
    `;
    return;
  }

  const categoryIcons = {
    vaccination: 'bi-shield-check text-success',
    deworming: 'bi-capsule text-primary',
    medication: 'bi-prescription2 text-info',
    vet_visit: 'bi-hospital text-warning',
    allergy_condition: 'bi-exclamation-octagon text-danger',
    document: 'bi-file-earmark-pdf text-secondary'
  };

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0 small">
        <thead class="table-light">
          <tr>
            <th>Type</th>
            <th>Title / Detail</th>
            <th>Pet</th>
            <th>Administered</th>
            <th>Clinic</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td>
                <span class="badge bg-light text-dark border">
                  <i class="bi ${categoryIcons[r.category] || 'bi-journal'} me-1"></i>
                  ${r.category.replace('_', ' ')}
                </span>
              </td>
              <td class="fw-semibold text-dark">${escapeHtml(r.title)}</td>
              <td><span class="fw-medium text-success">${escapeHtml(r.pet_name)}</span></td>
              <td class="text-muted">${formatDate(r.date_administered)}</td>
              <td class="text-muted text-truncate" style="max-width: 140px;">${escapeHtml(r.clinic_name || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderUrgentReminders(reminders) {
  const container = document.getElementById('urgentRemindersList');

  if (!reminders || reminders.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted small py-4">
        <i class="bi bi-check2-circle fs-3 text-success d-block mb-1"></i>
        All vaccination and deworming schedules are currently up to date!
      </div>
    `;
    return;
  }

  container.innerHTML = reminders.map(r => {
    const isOverdue = r.days_left < 0;
    const daysLabel = isOverdue 
      ? `Overdue by ${Math.abs(r.days_left)} days` 
      : r.days_left === 0 
        ? 'Due today!' 
        : `Due in ${r.days_left} days`;

    return `
      <div class="p-3 border rounded-3 mb-2 bg-light d-flex align-items-center justify-content-between">
        <div class="overflow-hidden">
          <div class="fw-bold small text-dark text-truncate">${escapeHtml(r.title)}</div>
          <div class="small text-muted">
            <span class="text-success fw-medium">${escapeHtml(r.pet_name)}</span> • Due ${formatDate(r.next_due_date)}
          </div>
        </div>
        <span class="badge-status ${isOverdue ? 'overdue' : 'due_soon'} flex-shrink-0">
          ${daysLabel}
        </span>
      </div>
    `;
  }).join('');
}
