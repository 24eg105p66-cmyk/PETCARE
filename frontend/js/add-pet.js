// ============================================================================
// PetCare Passport - Add Pet Logic
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const photoInput = document.getElementById('petPhotoInput');
  const photoPreview = document.getElementById('photoPreview');
  const form = document.getElementById('addPetForm');
  const saveBtn = document.getElementById('savePetBtn');
  const saveBtnText = document.getElementById('saveBtnText');
  const saveBtnSpinner = document.getElementById('saveBtnSpinner');

  // Live preview for selected pet photograph
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size exceeds 5MB limit. Please choose a smaller image.', 'error');
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

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const petName = document.getElementById('petName').value.trim();
    const species = document.getElementById('species').value.trim();

    if (!petName || !species) {
      showToast('Pet name and species are required fields.', 'error');
      return;
    }

    const formData = new FormData(form);

    saveBtn.disabled = true;
    saveBtnText.textContent = 'Saving & Generating QR...';
    saveBtnSpinner.classList.remove('d-none');

    try {
      const response = await apiRequest('/pets', {
        method: 'POST',
        body: formData
      });

      showToast(response.message || 'Pet registered successfully!', 'success');

      setTimeout(() => {
        window.location.href = `/pet-details.html?id=${response.petId}`;
      }, 700);
    } catch (err) {
      console.error('Error creating pet:', err);
      showToast(err.message || 'Failed to register pet. Please try again.', 'error');
      saveBtn.disabled = false;
      saveBtnText.innerHTML = '<i class="bi bi-check-lg"></i> Register Pet & Generate QR';
      saveBtnSpinner.classList.add('d-none');
    }
  });
});
