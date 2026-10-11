// ============================================================================
// PetCare Passport - Health Records Master List Logic
// ============================================================================

let allRecords = [];
let userPets = [];
let recordToDeleteId = null;
let deleteModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  deleteModalInstance = new bootstrap.Modal(document.getElementById('deleteRecordModal'));

  await loadPets();
  await loadAllRecords();

  document.getElementById('filterPetSelect').addEventListener('change', loadAllRecords);
  document.getElementById('filterCategorySelect').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', applyFilters);

  document.getElementById('confirmDeleteRecordBtn').addEventListener('click', handleConfirmDelete);
});

async function loadPets() {
  try {
    const data = await apiRequest('/pets');
    userPets = data.pets || [];
    const select = document.getElementById('filterPetSelect');

    userPets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.species})`;
      select.appendChild(opt);
    });

    const queryPetId = getQueryParam('petId');
    if (queryPetId) {
      select.value = queryPetId;
    }
  } catch (e) {
    console.error('Error loading pets:', e);
  }
}

async function loadAllRecords() {
  const petId = document.getElementById('filterPetSelect').value;
  allRecords = [];

  try {
    if (petId) {
      const data = await apiRequest(`/pets/${petId}/health-records`);
      const pet = userPets.find(p => String(p.id) === String(petId));
      allRecords = (data.records || []).map(r => ({ ...r, pet_name: pet ? pet.name : 'Pet' }));
    } else {
      // Load records for all user pets
      for (const pet of userPets) {
        const data = await apiRequest(`/pets/${pet.id}/health-records`);
        const petRecords = (data.records || []).map(r => ({ ...r, pet_name: pet.name }));
        allRecords.push(...petRecords);
      }
    }

    applyFilters();
  } catch (err) {
    console.error('Error loading records:', err);
    showToast('Failed to load health records.', 'error');
  }
}

function applyFilters() {
  const category = document.getElementById('filterCategorySelect').value;
  const search = document.getElementById('searchInput').value.toLowerCase().trim();

  const filtered = allRecords.filter(r => {
    const matchesCat = category === 'all' || r.category === category;
    const matchesSearch = !search ||
      (r.title && r.title.toLowerCase().includes(search)) ||
      (r.clinic_name && r.clinic_name.toLowerCase().includes(search)) ||
      (r.instructions_notes && r.instructions_notes.toLowerCase().includes(search)) ||
      (r.pet_name && r.pet_name.toLowerCase().includes(search));

    return matchesCat && matchesSearch;
  });

  document.getElementById('recordCountLabel').textContent = `${filtered.length} records found`;
  renderTable(filtered);
}

function renderTable(records) {
  const container = document.getElementById('recordsTableContainer');

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state py-5">
        <i class="bi bi-journal-x fs-1 text-muted d-block mb-2"></i>
        <h5 class="fw-bold">No health records found</h5>
        <p class="text-muted small mb-3">No records match your selected filter criteria.</p>
        <a href="add-health-record.html" class="btn btn-primary-custom btn-sm">
          <i class="bi bi-plus-lg"></i> Add New Record
        </a>
      </div>
    `;
    return;
  }

  const categoryBadges = {
    vaccination: 'bg-success-subtle text-success',
    deworming: 'bg-primary-subtle text-primary',
    medication: 'bg-info-subtle text-info',
    vet_visit: 'bg-warning-subtle text-warning-emphasis',
    allergy_condition: 'bg-danger-subtle text-danger',
    document: 'bg-secondary-subtle text-secondary'
  };

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0 small">
        <thead class="table-light">
          <tr>
            <th>Pet</th>
            <th>Type</th>
            <th>Title / Detail</th>
            <th>Administered</th>
            <th>Next Due Date</th>
            <th>Clinic / Vet</th>
            <th>Attachment</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td><strong class="text-success">${escapeHtml(r.pet_name)}</strong></td>
              <td>
                <span class="badge ${categoryBadges[r.category] || 'bg-light text-dark'} border py-1 px-2">
                  ${r.category.replace('_', ' ')}
                </span>
              </td>
              <td>
                <div class="fw-bold text-dark">${escapeHtml(r.title)}</div>
                ${r.dosage ? `<div class="text-muted text-xs">${escapeHtml(r.dosage)}</div>` : ''}
              </td>
              <td class="text-muted">${formatDate(r.date_administered)}</td>
              <td>
                ${r.next_due_date ? `
                  <span class="badge-status ${r.due_status}">
                    ${r.due_status === 'overdue' ? 'Overdue: ' : ''}${formatDate(r.next_due_date)}
                  </span>
                ` : '—'}
              </td>
              <td>
                <div class="text-dark">${escapeHtml(r.clinic_name || '—')}</div>
                ${r.veterinarian_name ? `<div class="text-muted text-xs">${escapeHtml(r.veterinarian_name)}</div>` : ''}
              </td>
              <td>
                ${r.attachment_url ? `
                  <a href="${r.attachment_url}" target="_blank" class="btn btn-outline-custom btn-sm py-0 px-2" style="font-size: 0.72rem;">
                    <i class="bi bi-file-earmark-arrow-down"></i> View
                  </a>
                ` : '—'}
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-link text-danger p-0" onclick="openDeleteModal(${r.id})" title="Delete record">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openDeleteModal(recordId) {
  recordToDeleteId = recordId;
  deleteModalInstance.show();
}

async function handleConfirmDelete() {
  if (!recordToDeleteId) return;

  const btn = document.getElementById('confirmDeleteRecordBtn');
  btn.disabled = true;

  try {
    await apiRequest(`/health-records/${recordToDeleteId}`, { method: 'DELETE' });
    showToast('Record deleted.', 'success');
    deleteModalInstance.hide();
    await loadAllRecords();
  } catch (err) {
    showToast(err.message || 'Failed to delete record.', 'error');
  } finally {
    btn.disabled = false;
    recordToDeleteId = null;
  }
}
