// ============================================================================
// PetCare Passport - Emergency Privacy Settings Logic & Live Simulator
// ============================================================================

let currentPetId = null;
let currentPetData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const petSelect = document.getElementById('privacyPetSelect');
  const queryPetId = getQueryParam('petId');

  await loadPetsForPrivacy(queryPetId);

  petSelect.addEventListener('change', async (e) => {
    currentPetId = e.target.value;
    if (currentPetId) {
      await loadPrivacySettings(currentPetId);
    }
  });

  // Attach live simulator listeners to form toggles
  const toggles = [
    'showPhoto', 'showName', 'showSpeciesBreed',
    'showMedicalAlerts', 'showAllergies', 'showSpecialCare',
    'showEmergencyPhone', 'showContactForm'
  ];
  toggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateLiveSimulator);
  });
  document.getElementById('customEmergencyInstructions').addEventListener('input', updateLiveSimulator);

  // Form submission
  document.getElementById('privacyForm').addEventListener('submit', handleSavePrivacy);
});

async function loadPetsForPrivacy(preselectId) {
  try {
    const data = await apiRequest('/pets');
    const pets = data.pets || [];
    const select = document.getElementById('privacyPetSelect');

    if (pets.length === 0) {
      select.innerHTML = '<option value="">No pets registered.</option>';
      return;
    }

    select.innerHTML = pets.map(p => `
      <option value="${p.id}" ${preselectId && String(preselectId) === String(p.id) ? 'selected' : ''}>
        ${escapeHtml(p.name)} (${escapeHtml(p.species)})
      </option>
    `).join('');

    currentPetId = select.value;
    if (currentPetId) {
      await loadPrivacySettings(currentPetId);
    }
  } catch (e) {
    console.error('Error loading pets:', e);
  }
}

async function loadPrivacySettings(petId) {
  try {
    const data = await apiRequest(`/pets/${petId}/emergency-settings`);
    const { pet, settings } = data;
    currentPetData = pet;

    // Set Live Public View Button
    document.getElementById('viewLivePublicBtn').href = `/emergency/${pet.public_id}`;

    // Populate Toggles
    document.getElementById('showPhoto').checked = !!settings.show_photo;
    document.getElementById('showName').checked = !!settings.show_name;
    document.getElementById('showSpeciesBreed').checked = !!settings.show_species_breed;
    document.getElementById('showMedicalAlerts').checked = !!settings.show_medical_alerts;
    document.getElementById('showAllergies').checked = !!settings.show_allergies;
    document.getElementById('showSpecialCare').checked = !!settings.show_special_care;
    document.getElementById('showEmergencyPhone').checked = !!settings.show_emergency_phone;
    document.getElementById('showContactForm').checked = !!settings.show_contact_form;
    document.getElementById('customEmergencyInstructions').value = settings.custom_emergency_instructions || '';

    // Update Live Simulator
    updateLiveSimulator();
  } catch (err) {
    console.error('Error loading emergency settings:', err);
    showToast('Failed to load privacy settings.', 'error');
  }
}

function updateLiveSimulator() {
  if (!currentPetData) return;

  const showPhoto = document.getElementById('showPhoto').checked;
  const showName = document.getElementById('showName').checked;
  const showSpeciesBreed = document.getElementById('showSpeciesBreed').checked;
  const showMedicalAlerts = document.getElementById('showMedicalAlerts').checked;
  const showAllergies = document.getElementById('showAllergies').checked;
  const showSpecialCare = document.getElementById('showSpecialCare').checked;
  const showEmergencyPhone = document.getElementById('showEmergencyPhone').checked;
  const showContactForm = document.getElementById('showContactForm').checked;
  const customInstructions = document.getElementById('customEmergencyInstructions').value.trim();

  // Custom Message
  const customMsgEl = document.getElementById('previewCustomMsg');
  if (customInstructions) {
    customMsgEl.textContent = customInstructions;
    customMsgEl.classList.remove('d-none');
  } else {
    customMsgEl.textContent = '🚨 EMERGENCY PROFILE';
  }

  // Photo
  const photoEl = document.getElementById('previewPhoto');
  if (showPhoto) {
    photoEl.src = currentPetData.photo_url || '/uploads/pets/demo-max.svg';
    photoEl.classList.remove('d-none');
  } else {
    photoEl.src = '/uploads/pets/demo-max.svg';
    photoEl.classList.add('d-none');
  }

  // Name
  document.getElementById('previewName').textContent = showName ? currentPetData.name : 'Beloved Pet';

  // Species & Breed
  const specEl = document.getElementById('previewSpeciesBreed');
  if (showSpeciesBreed) {
    specEl.textContent = `${currentPetData.breed || 'Mixed'} (${currentPetData.species})`;
    specEl.classList.remove('d-none');
  } else {
    specEl.classList.add('d-none');
  }

  // Cards
  document.getElementById('previewMedicalCard').classList.toggle('d-none', !showMedicalAlerts);
  document.getElementById('previewAllergiesCard').classList.toggle('d-none', !showAllergies);
  document.getElementById('previewCareCard').classList.toggle('d-none', !showSpecialCare);

  // Buttons
  document.getElementById('previewCallBtn').classList.toggle('d-none', !showEmergencyPhone);
  document.getElementById('previewReportBtn').classList.toggle('d-none', !showContactForm);
}

async function handleSavePrivacy(e) {
  e.preventDefault();
  if (!currentPetId) return;

  const btn = document.getElementById('savePrivacyBtn');
  const btnText = document.getElementById('savePrivacyText');
  const spinner = document.getElementById('savePrivacySpinner');

  btn.disabled = true;
  btnText.textContent = 'Saving Settings...';
  spinner.classList.remove('d-none');

  const payload = {
    show_photo: document.getElementById('showPhoto').checked ? 1 : 0,
    show_name: document.getElementById('showName').checked ? 1 : 0,
    show_species_breed: document.getElementById('showSpeciesBreed').checked ? 1 : 0,
    show_medical_alerts: document.getElementById('showMedicalAlerts').checked ? 1 : 0,
    show_allergies: document.getElementById('showAllergies').checked ? 1 : 0,
    show_special_care: document.getElementById('showSpecialCare').checked ? 1 : 0,
    show_emergency_phone: document.getElementById('showEmergencyPhone').checked ? 1 : 0,
    show_contact_form: document.getElementById('showContactForm').checked ? 1 : 0,
    custom_emergency_instructions: document.getElementById('customEmergencyInstructions').value.trim()
  };

  try {
    const res = await apiRequest(`/pets/${currentPetId}/emergency-settings`, {
      method: 'PUT',
      body: payload
    });

    showToast(res.message || 'Privacy settings saved! Live immediately on QR scan.', 'success');
  } catch (err) {
    console.error('Error saving privacy settings:', err);
    showToast(err.message || 'Failed to save settings.', 'error');
  } finally {
    btn.disabled = false;
    btnText.innerHTML = '<i class="bi bi-check-circle"></i> Save Privacy Settings';
    spinner.classList.add('d-none');
  }
}
