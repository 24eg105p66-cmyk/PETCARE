// ============================================================================
// PetCare Passport - QR Code Management & Printable Tag Logic
// ============================================================================

let currentPetId = null;
let currentEmergencyUrl = '';
let currentQrImageUrl = '';

document.addEventListener('DOMContentLoaded', async () => {
  const petSelect = document.getElementById('petQrSelect');
  const queryPetId = getQueryParam('petId');

  await loadPetsForQr(queryPetId);

  petSelect.addEventListener('change', async (e) => {
    currentPetId = e.target.value;
    if (currentPetId) {
      await loadQrDetails(currentPetId);
    }
  });

  // Copy URL Button
  document.getElementById('copyUrlBtn').addEventListener('click', () => {
    if (currentEmergencyUrl) {
      navigator.clipboard.writeText(currentEmergencyUrl).then(() => {
        showToast('Emergency URL copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy. Please copy manually: ' + currentEmergencyUrl, 'info');
      });
    }
  });

  // Regenerate QR Button
  document.getElementById('regenQrBtn').addEventListener('click', async () => {
    if (!currentPetId) return;
    const btn = document.getElementById('regenQrBtn');
    btn.disabled = true;
    try {
      const res = await apiRequest(`/pets/${currentPetId}/qr`, { method: 'POST' });
      showToast('QR code regenerated successfully.', 'success');
      await loadQrDetails(currentPetId);
    } catch (e) {
      showToast('Failed to regenerate QR code.', 'error');
    } finally {
      btn.disabled = false;
    }
  });
});

async function loadPetsForQr(preselectId) {
  try {
    const data = await apiRequest('/pets');
    const pets = data.pets || [];
    const select = document.getElementById('petQrSelect');

    if (pets.length === 0) {
      select.innerHTML = '<option value="">No pets found. Please register a pet first.</option>';
      return;
    }

    select.innerHTML = pets.map(p => `
      <option value="${p.id}" ${preselectId && String(preselectId) === String(p.id) ? 'selected' : ''}>
        ${escapeHtml(p.name)} (${escapeHtml(p.species)} - ${escapeHtml(p.breed || 'Mixed')})
      </option>
    `).join('');

    currentPetId = select.value;
    if (currentPetId) {
      await loadQrDetails(currentPetId);
    }
  } catch (err) {
    console.error('Error loading pets:', err);
  }
}

async function loadQrDetails(petId) {
  try {
    const data = await apiRequest(`/pets/${petId}/qr`);
    const { pet, qrCodeUrl, qrDataUrl, emergencyUrl } = data;

    currentEmergencyUrl = emergencyUrl;
    currentQrImageUrl = qrDataUrl || qrCodeUrl;

    // Update Card Display
    document.getElementById('cardPetName').textContent = pet.name;
    document.getElementById('cardPetSpeciesBreed').textContent = `${pet.breed || 'Mixed breed'} (${pet.species})`;
    document.getElementById('cardMicrochip').textContent = pet.microchip_number ? `Microchip: ${pet.microchip_number}` : 'Microchip: Not recorded';
    
    const cardPhoto = document.getElementById('cardPetPhoto');
    cardPhoto.src = pet.photo_url || '/uploads/pets/demo-max.svg';
    cardPhoto.onerror = () => { cardPhoto.src = '/uploads/pets/demo-max.svg'; };

    // Update QR Image (Use Data URL or file URL)
    const cardQr = document.getElementById('cardQrImage');
    cardQr.src = currentQrImageUrl;

    // Emergency URL Links
    document.getElementById('cardEmergencyUrl').textContent = emergencyUrl;
    document.getElementById('testEmergencyLink').href = `/emergency/${pet.public_id}`;

    // Download Button
    const downloadBtn = document.getElementById('downloadPngBtn');
    downloadBtn.href = currentQrImageUrl;
    downloadBtn.download = `PetCare_QR_${pet.name}.png`;

    // Privacy Links
    document.getElementById('editPrivacyLink').href = `/emergency-settings.html?petId=${petId}`;
    document.getElementById('editPrivacyBtn').href = `/emergency-settings.html?petId=${petId}`;

    // Load Privacy matrix
    loadPrivacyStatus(petId);

  } catch (err) {
    console.error('Error loading QR details:', err);
    showToast('Failed to load QR code data.', 'error');
  }
}

async function loadPrivacyStatus(petId) {
  try {
    const data = await apiRequest(`/pets/${petId}/emergency-settings`);
    const s = data.settings;
    const phoneBadge = document.getElementById('phoneStatusBadge');
    if (phoneBadge) {
      if (s.show_emergency_phone) {
        phoneBadge.textContent = 'Visible';
        phoneBadge.className = 'badge bg-warning-subtle text-warning-emphasis';
      } else {
        phoneBadge.textContent = 'Shielded';
        phoneBadge.className = 'badge bg-secondary-subtle text-secondary';
      }
    }
  } catch (e) {}
}
