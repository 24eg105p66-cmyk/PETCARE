// ============================================================================
// PetCare Passport - Owner Profile Logic
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadProfile();

  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
});

async function loadProfile() {
  try {
    const data = await apiRequest('/auth/me');
    const user = data.user;

    document.getElementById('profileHeadingName').textContent = user.full_name;
    document.getElementById('profileHeadingEmail').textContent = user.email;
    document.getElementById('fullName').value = user.full_name;
    document.getElementById('email').value = user.email;
    document.getElementById('phone').value = user.phone || '';
  } catch (err) {
    console.error('Error loading profile:', err);
    showToast('Failed to load profile details.', 'error');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const full_name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const current_password = document.getElementById('currentPassword').value;
  const new_password = document.getElementById('newPassword').value;

  if (!full_name || !phone) {
    showToast('Full name and phone number are required.', 'error');
    return;
  }

  if (new_password && !current_password) {
    showToast('Current password is required to change your password.', 'error');
    return;
  }

  const btn = document.getElementById('saveProfileBtn');
  const btnText = document.getElementById('saveProfileText');
  const spinner = document.getElementById('saveProfileSpinner');

  btn.disabled = true;
  btnText.textContent = 'Updating Profile...';
  spinner.classList.remove('d-none');

  try {
    const payload = { full_name, phone };
    if (new_password) {
      payload.current_password = current_password;
      payload.new_password = new_password;
    }

    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: payload
    });

    showToast(res.message || 'Profile updated successfully!', 'success');
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';

    await loadProfile();
  } catch (err) {
    console.error('Error updating profile:', err);
    showToast(err.message || 'Failed to update profile.', 'error');
  } finally {
    btn.disabled = false;
    btnText.innerHTML = '<i class="bi bi-check-lg"></i> Update Profile';
    spinner.classList.add('d-none');
  }
}
