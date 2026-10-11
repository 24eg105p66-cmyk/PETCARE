// ============================================================================
// PetCare Passport - Reminders Logic
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const filterPet = document.getElementById('filterPet');

  await loadPetFilter();
  await loadReminders();

  filterPet.addEventListener('change', async () => {
    await loadReminders(filterPet.value);
  });
});

async function loadPetFilter() {
  try {
    const data = await apiRequest('/pets');
    const pets = data.pets || [];
    const select = document.getElementById('filterPet');

    pets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.species})`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Error loading pets filter:', e);
  }
}

async function loadReminders(petId = '') {
  try {
    const url = petId ? `/reminders?petId=${petId}` : '/reminders';
    const data = await apiRequest(url);

    const { counts, overdue, dueSoon, upcoming, future } = data;

    // Update counts badges
    document.getElementById('badgeOverdueCount').textContent = `${counts.overdue || 0} Overdue`;
    document.getElementById('badgeDueSoonCount').textContent = `${counts.dueSoon || 0} Due Soon (7d)`;
    document.getElementById('badgeUpcomingCount').textContent = `${counts.upcoming || 0} Upcoming (30d)`;

    renderReminderCards(document.getElementById('overdueGrid'), overdue, 'overdue');
    renderReminderCards(document.getElementById('dueSoonGrid'), dueSoon, 'due_soon');
    renderReminderCards(document.getElementById('upcomingGrid'), upcoming, 'upcoming');
    renderReminderCards(document.getElementById('futureGrid'), future, 'future');

  } catch (err) {
    console.error('Error loading reminders:', err);
    showToast('Failed to load reminders.', 'error');
  }
}

function renderReminderCards(container, list, statusType) {
  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="p-3 bg-white rounded-3 border text-center text-muted small">
          No ${statusType.replace('_', ' ')} reminders for selected filter.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const isOverdue = item.days_until_due < 0;
    const daysText = isOverdue
      ? `Overdue by ${Math.abs(item.days_until_due)} days`
      : item.days_until_due === 0
        ? 'Due today!'
        : `Due in ${item.days_until_due} days`;

    const icon = item.category === 'vaccination' ? 'bi-shield-check text-success' : 'bi-capsule text-primary';

    return `
      <div class="col-md-6 col-xl-4">
        <div class="custom-card p-3 h-100 d-flex flex-column border">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="badge bg-light text-dark border">
              <i class="bi ${icon} me-1"></i>${item.category.toUpperCase()}
            </span>
            <span class="badge-status ${statusType}">
              ${daysText}
            </span>
          </div>

          <h6 class="fw-bold text-dark mb-1">${escapeHtml(item.title)}</h6>
          
          <div class="d-flex align-items-center gap-2 mb-2">
            <img src="${item.pet_photo_url || '/uploads/pets/demo-max.svg'}" alt="${escapeHtml(item.pet_name)}" class="rounded-circle border" style="width: 28px; height: 28px; object-fit: cover;" onerror="this.src='/uploads/pets/demo-max.svg'">
            <span class="fw-semibold text-success small">${escapeHtml(item.pet_name)}</span>
            <span class="text-muted text-xs">(${escapeHtml(item.pet_species)})</span>
          </div>

          <div class="small text-muted mb-3">
            <div><i class="bi bi-calendar3 me-1"></i> Scheduled Due: <strong class="text-dark">${formatDate(item.next_due_date)}</strong></div>
            ${item.clinic_name ? `<div><i class="bi bi-geo-alt me-1"></i> Clinic: ${escapeHtml(item.clinic_name)}</div>` : ''}
            ${item.dosage ? `<div><i class="bi bi-droplet me-1"></i> Dosage: ${escapeHtml(item.dosage)}</div>` : ''}
          </div>

          <div class="mt-auto d-flex gap-2">
            <a href="pet-details.html?id=${item.pet_id}" class="btn btn-outline-custom btn-sm flex-grow-1">
              <i class="bi bi-journal-medical"></i> View Passport
            </a>
            <a href="add-health-record.html?petId=${item.pet_id}&category=${item.category}" class="btn btn-primary-custom btn-sm" title="Log Administered Booster">
              <i class="bi bi-check2-circle"></i> Log Dose
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
