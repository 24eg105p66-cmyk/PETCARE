// ============================================================================
// PetCare Passport - Edit Pet Logic
// ============================================================================

let currentPetId = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentPetId = getQueryParam('id');
  if (!currentPetId) {
    window.location.href = '/pets.html';
    return;
  }

  const cancelLinks = [document.getElementById('cancelEditBtn'), document.getElementById('cancelBottomBtn')];
  cancelLinks.forEach(link => {
    if (link) link.href = `/pet-details.html?id=${currentPetId}`;
  });

  const photoInput = document.getElementById('petPhotoInput');
  const photoPreview = document.getElementById('photoPreview');
  const form = document.getElementById('editPetForm');
  const saveBtn = document.getElementById('saveEditPetBtn');
  const saveBtnText = document.getElementById('saveBtnText');
  const saveBtnSpinner = document.getElementById('saveBtnSpinner');

  // Photo change preview
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size exceeds 5MB limit.', 'error');
        photoInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        photoPreview.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Load existing pet data
  await loadPetForEdit();

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('petName').value.trim();
    const species = document.getElementById('species').value.trim();

    if (!name || !species) {
      showToast('Pet name and species are required fields.', 'error');
      return;
    }

    const formData = new FormData(form);

    saveBtn.disabled = true;
    saveBtnText.textContent = 'Saving Changes...';
    saveBtnSpinner.classList.remove('d-none');

    try {
      const response = await apiRequest(`/pets/${currentPetId}`, {
        method: 'PUT',
        body: formData
      });

      showToast(response.message || 'Pet updated successfully!', 'success');

      setTimeout(() => {
        window.location.href = `/pet-details.html?id=${currentPetId}`;
      }, 700);
    } catch (err) {
      console.error('Error updating pet:', err);
      showToast(err.message || 'Failed to update pet profile.', 'error');
      saveBtn.disabled = false;
      saveBtnText.innerHTML = '<i class="bi bi-check-lg"></i> Save Changes';
      saveBtnSpinner.classList.add('d-none');
    }
  });
});

async function loadPetForEdit() {
  try {
    const data = await apiRequest(`/pets/${currentPetId}`);
    const pet = data.pet;

    document.getElementById('editPetHeadingName').textContent = pet.name;
    document.getElementById('petName').value = pet.name || '';
    document.getElementById('species').value = pet.species || 'Dog';
    document.getElementById('breed').value = pet.breed || '';
    document.getElementById('gender').value = pet.gender || 'Unknown';
    if (pet.dob) {
      document.getElementById('dob').value = pet.dob.substring(0, 10);
    }
    document.getElementById('colorMarkings').value = pet.color_markings || '';
    document.getElementById('microchip').value = pet.microchip_number || '';
    document.getElementById('bloodGroup').value = pet.blood_group || '';
    document.getElementById('currentWeight').value = pet.current_weight || '';
    document.getElementById('sterilizationStatus').value = pet.sterilization_status || 'Unknown';
    document.getElementById('allergies').value = pet.allergies || '';
    document.getElementById('medicalConditions').value = pet.medical_conditions || '';
    document.getElementById('currentMedications').value = pet.current_medications || '';
    document.getElementById('specialCare').value = pet.special_care_instructions || '';
    document.getElementById('identificationNotes').value = pet.identification_notes || '';

    if (pet.photo_url) {
      const photoPreview = document.getElementById('photoPreview');
      photoPreview.src = pet.photo_url;
      photoPreview.onerror = () => { photoPreview.src = '/uploads/pets/demo-max.svg'; };
    }
  } catch (err) {
    console.error('Error loading pet for edit:', err);
    showToast('Failed to load pet data.', 'error');
  }
}
