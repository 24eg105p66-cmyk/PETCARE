// ============================================================================
// PetCare Passport - Pet Health Details & Timeline Logic
// ============================================================================

let currentPetId = null;
let currentPet = null;
let healthRecords = [];
let recordToDeleteId = null;
let deleteRecordModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentPetId = getQueryParam('id');
  if (!currentPetId) {
    window.location.href = '/pets.html';
    return;
  }

  deleteRecordModalInstance = new bootstrap.Modal(document.getElementById('deleteRecordModal'));

  // Setup dynamic top button URLs
  document.getElementById('editPetTopBtn').href = `/edit-pet.html?id=${currentPetId}`;
  document.getElementById('addRecordTopBtn').href = `/add-health-record.html?petId=${currentPetId}`;
  document.getElementById('addRecordBtn').href = `/add-health-record.html?petId=${currentPetId}`;
  document.getElementById('viewQrBtn').href = `/qr-code.html?petId=${currentPetId}`;
  document.getElementById('privacySettingsBtn').href = `/emergency-settings.html?petId=${currentPetId}`;

  // Filter Buttons
  const filterBtns = document.querySelectorAll('#recordFilterButtons .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('btn-primary-custom', 'active');
        b.classList.add('btn-light');
      });
      btn.classList.add('btn-primary-custom', 'active');
      btn.classList.remove('btn-light');
      const cat = btn.dataset.category;
      renderRecords(cat);
    });
  });

  // Confirm delete health record
  document.getElementById('confirmDeleteRecordBtn').addEventListener('click', handleConfirmDeleteRecord);

  await loadPetDetails();
  await loadHealthRecords();
});

async function loadPetDetails() {
  try {
    const data = await apiRequest(`/pets/${currentPetId}`);
    currentPet = data.pet;

    // Header & Info
    document.title = `${currentPet.name}'s Passport — PetCare Passport`;
    document.getElementById('headerPetTitle').textContent = `${currentPet.name}'s Health Passport`;
    document.getElementById('petName').textContent = currentPet.name;
    document.getElementById('petSpecies').textContent = currentPet.species;
    document.getElementById('petGender').textContent = currentPet.gender || 'Unknown';
    document.getElementById('petBreed').textContent = currentPet.breed || 'Mixed breed';
    document.getElementById('petAge').textContent = calculateAge(currentPet.dob);
    document.getElementById('petWeight').textContent = currentPet.current_weight ? `${currentPet.current_weight} kg` : '—';
    document.getElementById('petMicrochip').textContent = currentPet.microchip_number || 'None';
    document.getElementById('petBlood').textContent = currentPet.blood_group || '—';

    // Photo
    const photoEl = document.getElementById('petPhoto');
    photoEl.src = currentPet.photo_url || '/uploads/pets/demo-max.svg';
    photoEl.onerror = () => { photoEl.src = '/uploads/pets/demo-max.svg'; };

    // QR Code Thumbnail
    const qrThumb = document.getElementById('petQrCodeThumb');
    qrThumb.src = currentPet.qr_code_url || `/uploads/qrcodes/qr-${currentPet.public_id}.png`;

    // Public Link
    const publicLink = document.getElementById('previewPublicEmergencyLink');
    publicLink.href = `/emergency/${currentPet.public_id}`;

    // Medical Info
    document.getElementById('petSterilization').textContent = currentPet.sterilization_status || 'Unknown';
    document.getElementById('petAllergies').textContent = currentPet.allergies || 'No known allergies recorded.';
    document.getElementById('petConditions').textContent = currentPet.medical_conditions || 'No chronic conditions diagnosed.';
    document.getElementById('petMedications').textContent = currentPet.current_medications || 'No medications currently prescribed.';
    document.getElementById('petSpecialCare').textContent = currentPet.special_care_instructions || 'Standard domestic pet care instructions.';

  } catch (err) {
    console.error('Error loading pet details:', err);
    showToast('Failed to load pet profile.', 'error');
  }
}

async function loadHealthRecords() {
  try {
    const data = await apiRequest(`/pets/${currentPetId}/health-records`);
    healthRecords = data.records || [];
    renderRecords('all');
  } catch (err) {
    console.error('Error loading health records:', err);
    showToast('Failed to load health records.', 'error');
  }
}

function renderRecords(category = 'all') {
  const container = document.getElementById('recordsTimeline');
  const filtered = category === 'all' 
    ? healthRecords 
    : healthRecords.filter(r => r.category === category);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state py-4 my-2">
        <i class="bi bi-journal-x fs-1 text-muted mb-2 d-block"></i>
        <h6 class="fw-bold mb-1">No ${category === 'all' ? '' : category} records found</h6>
        <p class="text-muted small mb-3">Keep a complete medical history by logging records.</p>
        <a href="/add-health-record.html?petId=${currentPetId}&category=${category !== 'all' ? category : 'vaccination'}" class="btn btn-primary-custom btn-sm">
          <i class="bi bi-plus-lg"></i> Add New Record
        </a>
      </div>
    `;
    return;
  }

  const categoryBadges = {
    vaccination: { label: 'Vaccination', color: 'success', icon: 'bi-shield-check' },
    deworming: { label: 'Deworming', color: 'primary', icon: 'bi-capsule' },
    medication: { label: 'Medication', color: 'info', icon: 'bi-prescription2' },
    vet_visit: { label: 'Veterinary Visit', color: 'warning', icon: 'bi-hospital' },
    allergy_condition: { label: 'Allergy / Condition', color: 'danger', icon: 'bi-exclamation-octagon' },
    document: { label: 'Medical Document', color: 'secondary', icon: 'bi-file-earmark-pdf' }
  };

  container.innerHTML = filtered.map(r => {
    const badge = categoryBadges[r.category] || { label: r.category, color: 'light', icon: 'bi-journal' };
    const isOverdue = r.due_status === 'overdue';
    const isUpcoming = r.due_status === 'upcoming';

    return `
      <div class="timeline-item">
        <div class="timeline-dot ${isOverdue ? 'overdue' : ''}"></div>
        <div class="p-3 bg-light rounded-3 border">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-${badge.color}-subtle text-${badge.color} border">
                <i class="bi ${badge.icon} me-1"></i>${badge.label}
              </span>
              <h6 class="fw-bold mb-0 text-dark">${escapeHtml(r.title)}</h6>
            </div>
            <div class="d-flex align-items-center gap-2">
              ${r.next_due_date ? `
                <span class="badge-status ${isOverdue ? 'overdue' : isUpcoming ? 'due_soon' : 'future'}">
                  <i class="bi ${isOverdue ? 'bi-exclamation-triangle' : 'bi-calendar-check'}"></i>
                  ${isOverdue ? 'Overdue: ' : 'Next Due: '}${formatDate(r.next_due_date)}
                </span>
              ` : ''}
              <button class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="openDeleteRecordModal(${r.id})" title="Delete record">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>

          <div class="row g-2 small text-muted mb-2">
            ${r.date_administered ? `
              <div class="col-sm-6 col-md-4">
                <i class="bi bi-calendar3 me-1"></i> Date: <strong class="text-dark">${formatDate(r.date_administered)}</strong>
              </div>
            ` : ''}
            ${r.clinic_name ? `
              <div class="col-sm-6 col-md-4">
                <i class="bi bi-geo-alt me-1"></i> Clinic: <strong class="text-dark">${escapeHtml(r.clinic_name)}</strong>
              </div>
            ` : ''}
            ${r.veterinarian_name ? `
              <div class="col-sm-6 col-md-4">
                <i class="bi bi-person me-1"></i> Vet: <strong class="text-dark">${escapeHtml(r.veterinarian_name)}</strong>
              </div>
            ` : ''}
            ${r.dosage ? `
              <div class="col-sm-6 col-md-4">
                <i class="bi bi-droplet me-1"></i> Dosage: <strong class="text-dark">${escapeHtml(r.dosage)}</strong>
              </div>
            ` : ''}
            ${r.severity && r.severity !== 'None' ? `
              <div class="col-sm-6 col-md-4">
                <i class="bi bi-exclamation-diamond me-1"></i> Severity: <strong class="text-dark">${escapeHtml(r.severity)}</strong>
              </div>
            ` : ''}
          </div>

          ${r.instructions_notes ? `
            <div class="p-2 bg-white rounded-2 small text-dark border mb-2">
              ${escapeHtml(r.instructions_notes)}
            </div>
          ` : ''}

          ${r.attachment_url ? `
            <div class="mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
              <span class="small text-muted">
                <i class="bi bi-paperclip me-1"></i> Attached: <strong>${escapeHtml(r.attachment_name || 'Document')}</strong>
              </span>
              <a href="${r.attachment_url}" target="_blank" class="btn btn-outline-custom btn-sm py-1 px-2" style="font-size: 0.75rem;">
                <i class="bi bi-file-earmark-arrow-down"></i> View Attachment
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function openDeleteRecordModal(recordId) {
  recordToDeleteId = recordId;
  deleteRecordModalInstance.show();
}

async function handleConfirmDeleteRecord() {
  if (!recordToDeleteId) return;

  const btn = document.getElementById('confirmDeleteRecordBtn');
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    await apiRequest(`/health-records/${recordToDeleteId}`, { method: 'DELETE' });
    showToast('Health record removed.', 'success');
    deleteRecordModalInstance.hide();
    await loadHealthRecords();
  } catch (err) {
    showToast(err.message || 'Failed to delete record.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete Record';
    recordToDeleteId = null;
  }
}
