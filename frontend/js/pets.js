// ============================================================================
// PetCare Passport - My Pets Directory Logic
// ============================================================================

let allPets = [];
let petToDeleteId = null;
let deleteModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  deleteModalInstance = new bootstrap.Modal(document.getElementById('deletePetModal'));
  await loadPets();

  // Search and Filter Events
  document.getElementById('petSearchInput').addEventListener('input', applyFilters);
  document.getElementById('speciesFilterSelect').addEventListener('change', applyFilters);

  // Confirm delete button listener
  document.getElementById('confirmDeletePetBtn').addEventListener('click', handleConfirmDelete);
});

async function loadPets() {
  try {
    const data = await apiRequest('/pets');
    allPets = data.pets || [];
    applyFilters();
  } catch (err) {
    console.error('Error fetching pets:', err);
    showToast('Failed to load pets list.', 'error');
  }
}

function applyFilters() {
  const searchTerm = document.getElementById('petSearchInput').value.toLowerCase().trim();
  const selectedSpecies = document.getElementById('speciesFilterSelect').value;

  const filtered = allPets.filter(pet => {
    const matchesSearch = !searchTerm ||
      (pet.name && pet.name.toLowerCase().includes(searchTerm)) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchTerm)) ||
      (pet.microchip_number && pet.microchip_number.toLowerCase().includes(searchTerm));

    const matchesSpecies = selectedSpecies === 'all' || pet.species.toLowerCase() === selectedSpecies.toLowerCase();

    return matchesSearch && matchesSpecies;
  });

  document.getElementById('petCountText').textContent = `Showing ${filtered.length} of ${allPets.length} pets`;
  renderPets(filtered);
}

function renderPets(pets) {
  const container = document.getElementById('petsContainer');

  if (!pets || pets.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <div class="empty-state-icon"><i class="bi bi-search"></i></div>
          <h4 class="fw-bold">No pets found</h4>
          <p class="text-muted small mb-3">No registered pets matched your current filter criteria.</p>
          <a href="add-pet.html" class="btn btn-primary-custom">
            <i class="bi bi-plus-lg"></i> Register New Pet
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
        <div class="custom-card hover-lift p-4 h-100 d-flex flex-column">
          <!-- Pet Header -->
          <div class="d-flex align-items-center gap-3 mb-3">
            <img src="${photoUrl}" alt="${escapeHtml(pet.name)}" class="rounded-circle border" style="width: 80px; height: 80px; object-fit: cover;" onerror="this.src='/uploads/pets/demo-max.svg'">
            <div class="overflow-hidden">
              <div class="d-flex align-items-center gap-2">
                <h5 class="fw-bold mb-0 text-truncate text-dark">${escapeHtml(pet.name)}</h5>
                <span class="badge bg-success-subtle text-success small">${escapeHtml(pet.species)}</span>
              </div>
              <div class="text-muted small text-truncate">${escapeHtml(pet.breed || 'Mixed breed')}</div>
              <div class="text-muted text-xs" style="font-size: 0.8rem;">
                <i class="bi bi-gender-ambiguous"></i> ${escapeHtml(pet.gender || 'Unknown')} • ${escapeHtml(pet.sterilization_status || 'Unknown')}
              </div>
            </div>
          </div>

          <!-- Pet Key Attributes -->
          <div class="bg-light p-3 rounded-3 mb-3 small">
            <div class="row g-2">
              <div class="col-6">
                <span class="text-muted d-block" style="font-size: 0.75rem;">AGE:</span>
                <span class="fw-semibold text-dark">${age}</span>
              </div>
              <div class="col-6">
                <span class="text-muted d-block" style="font-size: 0.75rem;">WEIGHT:</span>
                <span class="fw-semibold text-dark">${pet.current_weight ? pet.current_weight + ' kg' : 'Not recorded'}</span>
              </div>
              <div class="col-6">
                <span class="text-muted d-block" style="font-size: 0.75rem;">MICROCHIP:</span>
                <span class="fw-semibold text-dark text-truncate d-block">${escapeHtml(pet.microchip_number || 'None')}</span>
              </div>
              <div class="col-6">
                <span class="text-muted d-block" style="font-size: 0.75rem;">VACCINATIONS:</span>
                ${pet.overdue_vaccinations_count > 0 
                  ? `<span class="badge bg-danger-subtle text-danger py-1 px-2">${pet.overdue_vaccinations_count} Overdue</span>`
                  : `<span class="badge bg-success-subtle text-success py-1 px-2">Up to date</span>`
                }
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="mt-auto d-flex flex-wrap gap-2">
            <a href="pet-details.html?id=${pet.id}" class="btn btn-primary-custom btn-sm flex-grow-1">
              <i class="bi bi-journal-medical"></i> Health Profile
            </a>
            <a href="qr-code.html?petId=${pet.id}" class="btn btn-outline-custom btn-sm" title="Collar QR Tag">
              <i class="bi bi-qr-code"></i>
            </a>
            <a href="edit-pet.html?id=${pet.id}" class="btn btn-light btn-sm border" title="Edit Profile">
              <i class="bi bi-pencil"></i>
            </a>
            <button class="btn btn-outline-danger btn-sm" onclick="openDeleteModal(${pet.id}, '${escapeHtml(pet.name)}')" title="Delete Pet">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openDeleteModal(petId, petName) {
  petToDeleteId = petId;
  document.getElementById('deletePetName').textContent = petName;
  deleteModalInstance.show();
}

async function handleConfirmDelete() {
  if (!petToDeleteId) return;

  const confirmBtn = document.getElementById('confirmDeletePetBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Deleting...';

  try {
    await apiRequest(`/pets/${petToDeleteId}`, { method: 'DELETE' });
    showToast('Pet profile deleted successfully.', 'success');
    deleteModalInstance.hide();
    await loadPets();
  } catch (err) {
    showToast(err.message || 'Failed to delete pet profile.', 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Permanently Delete';
    petToDeleteId = null;
  }
}
