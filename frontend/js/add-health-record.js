// ============================================================================
// PetCare Passport - Add Health Record Dynamic Form Logic
// ============================================================================

let userPets = [];

document.addEventListener('DOMContentLoaded', async () => {
  const categorySelect = document.getElementById('categorySelect');
  const petSelect = document.getElementById('petSelect');
  const form = document.getElementById('healthRecordForm');
  const submitBtn = document.getElementById('submitRecordBtn');
  const btnText = document.getElementById('recordBtnText');
  const btnSpinner = document.getElementById('recordBtnSpinner');

  // Load user pets
  await loadUserPets();

  // Handle URL query parameters (preselect pet & category)
  const queryPetId = getQueryParam('petId');
  if (queryPetId && petSelect) {
    petSelect.value = queryPetId;
  }

  const queryCategory = getQueryParam('category');
  if (queryCategory && categorySelect) {
    categorySelect.value = queryCategory;
  }

  // Adjust fields according to current category
  updateCategoryFields(categorySelect.value);

  // Category switch listener
  categorySelect.addEventListener('change', (e) => {
    updateCategoryFields(e.target.value);
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedPetId = petSelect.value;
    const title = document.getElementById('recordTitle').value.trim();

    if (!selectedPetId) {
      showToast('Please select a pet for this health record.', 'error');
      return;
    }

    if (!title) {
      showToast('Record title or name is required.', 'error');
      return;
    }

    const formData = new FormData(form);

    submitBtn.disabled = true;
    btnText.textContent = 'Saving Health Record...';
    btnSpinner.classList.remove('d-none');

    try {
      const response = await apiRequest(`/pets/${selectedPetId}/health-records`, {
        method: 'POST',
        body: formData
      });

      showToast(response.message || 'Health record added successfully!', 'success');

      setTimeout(() => {
        window.location.href = `/pet-details.html?id=${selectedPetId}`;
      }, 700);
    } catch (err) {
      console.error('Error adding health record:', err);
      showToast(err.message || 'Failed to save health record.', 'error');
      submitBtn.disabled = false;
      btnText.innerHTML = '<i class="bi bi-check-lg"></i> Save Health Record';
      btnSpinner.classList.add('d-none');
    }
  });
});

async function loadUserPets() {
  try {
    const data = await apiRequest('/pets');
    userPets = data.pets || [];
    const select = document.getElementById('petSelect');

    if (userPets.length === 0) {
      select.innerHTML = '<option value="">No pets found. Please register a pet first.</option>';
      return;
    }

    select.innerHTML = userPets.map(p => `
      <option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.species)} - ${escapeHtml(p.breed || 'Mixed')})</option>
    `).join('');
  } catch (err) {
    console.error('Error loading pets for select:', err);
  }
}

function updateCategoryFields(category) {
  const titleLabel = document.getElementById('titleLabel');
  const recordTitle = document.getElementById('recordTitle');
  const dateAdministeredGroup = document.getElementById('dateAdministeredGroup');
  const dateAdministeredLabel = document.getElementById('dateAdministeredLabel');
  const nextDueDateGroup = document.getElementById('nextDueDateGroup');
  const nextDueDateLabel = document.getElementById('nextDueDateLabel');
  const medicationDatesGroup = document.getElementById('medicationDatesGroup');
  const dosageGroup = document.getElementById('dosageGroup');
  const severityGroup = document.getElementById('severityGroup');
  const clinicGroup = document.getElementById('clinicGroup');
  const vetGroup = document.getElementById('vetGroup');
  const notesLabel = document.getElementById('notesLabel');

  // Reset defaults
  dateAdministeredGroup.classList.remove('d-none');
  nextDueDateGroup.classList.remove('d-none');
  medicationDatesGroup.classList.add('d-none');
  dosageGroup.classList.remove('d-none');
  severityGroup.classList.add('d-none');
  clinicGroup.classList.remove('d-none');
  vetGroup.classList.remove('d-none');

  switch (category) {
    case 'vaccination':
      titleLabel.innerHTML = 'Vaccine Name <span class="text-danger">*</span>';
      recordTitle.placeholder = 'e.g. Rabies 3-Year, DHPP, Bordetella, FVRCP';
      dateAdministeredLabel.textContent = 'Date Administered';
      nextDueDateLabel.textContent = 'Next Due Date (Booster)';
      notesLabel.textContent = 'Vaccine Lot #, Administration Site, & Notes';
      break;

    case 'deworming':
      titleLabel.innerHTML = 'Deworming Treatment / Medication <span class="text-danger">*</span>';
      recordTitle.placeholder = 'e.g. NexGard Spectra, Drontal Plus, Profender';
      dateAdministeredLabel.textContent = 'Treatment Date';
      nextDueDateLabel.textContent = 'Next Deworming Due Date';
      notesLabel.textContent = 'Parasite Target & Treatment Notes';
      break;

    case 'medication':
      titleLabel.innerHTML = 'Medication Name <span class="text-danger">*</span>';
      recordTitle.placeholder = 'e.g. Apoquel 16mg, Amoxicillin, Rimadyl';
      dateAdministeredGroup.classList.add('d-none');
      nextDueDateGroup.classList.add('d-none');
      medicationDatesGroup.classList.remove('d-none');
      notesLabel.textContent = 'Dosage Frequency & Dietary Instructions';
      break;

    case 'vet_visit':
      titleLabel.innerHTML = 'Reason for Visit / Exam Title <span class="text-danger">*</span>';
      recordTitle.placeholder = 'e.g. Annual Comprehensive Wellness Checkup, Dental Cleaning';
      dateAdministeredLabel.textContent = 'Visit Date';
      nextDueDateLabel.textContent = 'Follow-up Examination Date';
      dosageGroup.classList.add('d-none');
      notesLabel.textContent = 'Clinical Examination Findings, Weight, & Diagnosis';
      break;

    case 'allergy_condition':
      titleLabel.innerHTML = 'Allergy or Medical Condition <span class="text-danger">*</span>';
      recordTitle.placeholder = 'e.g. Severe Beef Protein Allergy, Canine Atopic Dermatitis';
      dateAdministeredLabel.textContent = 'Diagnosis Date';
      nextDueDateGroup.classList.add('d-none');
      dosageGroup.classList.add('d-none');
      severityGroup.classList.remove('d-none');
      notesLabel.textContent = 'Symptoms, Trigger Factors, & Emergency Treatment';
      break;

    case 'document':
      titleLabel.innerHTML = 'Document Title <span class="text-danger">*</span>';
      recordTitle.placeholder = 'e.g. Official Rabies Certificate, Bloodwork Lab Report';
      dateAdministeredLabel.textContent = 'Document Issue Date';
      nextDueDateGroup.classList.add('d-none');
      dosageGroup.classList.add('d-none');
      notesLabel.textContent = 'Summary Description of Document';
      break;
  }
}
