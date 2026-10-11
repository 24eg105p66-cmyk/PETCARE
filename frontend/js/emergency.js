// ============================================================================
// PetCare Passport - Public Emergency Profile & Found Reporting Logic
// ============================================================================

let currentPublicId = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Extract public ID from path /emergency/:publicId OR query param ?id=:publicId
  const pathParts = window.location.pathname.split('/');
  const lastSegment = pathParts[pathParts.length - 1];

  if (lastSegment && lastSegment !== 'emergency.html' && lastSegment !== 'emergency') {
    currentPublicId = lastSegment;
  } else {
    currentPublicId = getQueryParam('id') || getQueryParam('publicId') || '';
  }

  if (!currentPublicId) {
    showErrorState('No emergency identifier provided in QR scan URL.');
    return;
  }

  // Set default datetime to now in local ISO string
  const foundDateInput = document.getElementById('foundDate');
  if (foundDateInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    foundDateInput.value = now.toISOString().slice(0, 16);
  }

  await loadPublicProfile(currentPublicId);

  // Found Report Form Submission
  const form = document.getElementById('foundReportForm');
  if (form) {
    form.addEventListener('submit', handleFoundReportSubmit);
  }
});

async function loadPublicProfile(publicId) {
  const loading = document.getElementById('loadingProfile');
  const active = document.getElementById('activeProfile');

  try {
    const data = await apiRequest(`/emergency/${publicId}`);
    const profile = data.profile;

    loading.classList.add('d-none');
    active.classList.remove('d-none');

    // Title & Name
    document.title = `Emergency Profile: ${profile.name} — PetCare Passport`;
    document.getElementById('petName').textContent = profile.name;

    // Species & Breed
    const speciesBreedEl = document.getElementById('petSpeciesBreed');
    if (profile.species || profile.breed) {
      speciesBreedEl.textContent = `${profile.breed || 'Mixed'} (${profile.species || 'Pet'})`;
      speciesBreedEl.classList.remove('d-none');
    } else {
      speciesBreedEl.classList.add('d-none');
    }

    // Microchip
    const chipBadge = document.getElementById('petMicrochipBadge');
    if (profile.microchip_number) {
      chipBadge.textContent = `Microchip: ${profile.microchip_number}`;
      chipBadge.classList.remove('d-none');
    } else {
      chipBadge.classList.add('d-none');
    }

    // Photo
    const photoContainer = document.getElementById('photoContainer');
    const photoImg = document.getElementById('petPhoto');
    if (profile.photo_url) {
      photoImg.src = profile.photo_url;
      photoImg.onerror = () => { photoImg.src = '/uploads/pets/demo-max.svg'; };
      photoContainer.classList.remove('d-none');
    } else {
      photoContainer.classList.add('d-none');
    }

    // Urgent Custom Instructions
    const urgentBanner = document.getElementById('urgentBanner');
    const customText = document.getElementById('customInstructionsText');
    if (profile.custom_emergency_instructions) {
      customText.textContent = profile.custom_emergency_instructions;
      urgentBanner.classList.remove('d-none');
    } else {
      urgentBanner.classList.add('d-none');
    }

    // Allergies
    const allergiesBox = document.getElementById('allergiesBox');
    const allergiesText = document.getElementById('allergiesText');
    if (profile.allergies) {
      allergiesText.textContent = profile.allergies;
      allergiesBox.classList.remove('d-none');
    } else {
      allergiesBox.classList.add('d-none');
    }

    // Medical Conditions & Medications
    const medicalBox = document.getElementById('medicalBox');
    const medicalText = document.getElementById('medicalText');
    const medicalCombined = [
      profile.medical_conditions ? `Conditions: ${profile.medical_conditions}` : null,
      profile.current_medications ? `Medications: ${profile.current_medications}` : null
    ].filter(Boolean).join(' • ');

    if (medicalCombined) {
      medicalText.textContent = medicalCombined;
      medicalBox.classList.remove('d-none');
    } else {
      medicalBox.classList.add('d-none');
    }

    // Special Care Instructions
    const specialCareBox = document.getElementById('specialCareBox');
    const specialCareText = document.getElementById('specialCareText');
    if (profile.special_care_instructions) {
      specialCareText.textContent = profile.special_care_instructions;
      specialCareBox.classList.remove('d-none');
    } else {
      specialCareBox.classList.add('d-none');
    }

    // Direct Phone Number
    const phoneBox = document.getElementById('phoneActionBox');
    const phoneBtn = document.getElementById('callOwnerBtn');
    const phoneText = document.getElementById('ownerPhoneText');
    if (profile.owner_phone) {
      phoneText.textContent = profile.owner_phone;
      phoneBtn.href = `tel:${profile.owner_phone.replace(/[^0-9+]/g, '')}`;
      phoneBox.classList.remove('d-none');
    } else {
      phoneBox.classList.add('d-none');
    }

    // Found Report Form Section
    const foundReportSection = document.getElementById('foundReportSection');
    if (!profile.allow_contact_form) {
      foundReportSection.classList.add('d-none');
    }

  } catch (err) {
    console.error('Error loading public profile:', err);
    showErrorState(err.message || 'Pet profile not found or QR tag is inactive.');
  }
}

function showErrorState(message) {
  document.getElementById('loadingProfile').classList.add('d-none');
  document.getElementById('activeProfile').classList.add('d-none');
  const errorBox = document.getElementById('errorProfile');
  errorBox.classList.remove('d-none');
  document.getElementById('errorMessageText').textContent = message;
}

async function handleFoundReportSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('finderName').value.trim();
  const phone = document.getElementById('finderPhone').value.trim();
  const location = document.getElementById('foundLocation').value.trim();

  if (!name || !phone || !location) {
    showToast('Name, phone number, and location found are required.', 'error');
    return;
  }

  const form = document.getElementById('foundReportForm');
  const formData = new FormData(form);

  const btn = document.getElementById('submitReportBtn');
  const btnText = document.getElementById('reportBtnText');
  const spinner = document.getElementById('reportBtnSpinner');

  btn.disabled = true;
  btnText.textContent = 'Submitting Report...';
  spinner.classList.remove('d-none');

  try {
    const res = await apiRequest(`/emergency/${currentPublicId}/found-reports`, {
      method: 'POST',
      body: formData
    });

    // Show success view
    form.classList.add('d-none');
    const successAlert = document.getElementById('reportSuccessAlert');
    successAlert.classList.remove('d-none');
    if (res.message) {
      document.getElementById('reportSuccessMsg').textContent = res.message;
    }

    showToast('Found-pet report sent to owner successfully!', 'success');
  } catch (err) {
    console.error('Error submitting found report:', err);
    showToast(err.message || 'Failed to submit report. Please try again.', 'error');
    btn.disabled = false;
    btnText.innerHTML = '<i class="bi bi-send-fill me-1"></i> Send Found Report to Owner';
    spinner.classList.add('d-none');
  }
}
