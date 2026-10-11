// ============================================================================
// PetCare Passport - Frontend API Client & Utility Library
// ============================================================================

const API_BASE = '/api';

/**
 * Universal fetch wrapper with session credentials & JSON parsing
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    credentials: 'include' // Always send cookies for express-session
  };

  // If body is NOT FormData, set JSON content-type
  if (config.body && !(config.body instanceof FormData)) {
    config.headers = {
      'Content-Type': 'application/json',
      ...(config.headers || {})
    };
    if (typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If unauthorized, redirect to login unless already on public pages
      if (response.status === 401) {
        const publicPages = ['index.html', 'login.html', 'register.html', 'emergency.html', '404.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (!publicPages.includes(currentPage)) {
          window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
      }
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Modern Toast Notifications
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;

  const iconClass = type === 'success' ? 'bi-check-circle-fill text-success'
                  : type === 'error' ? 'bi-exclamation-triangle-fill text-danger'
                  : 'bi-info-circle-fill text-primary';

  toast.innerHTML = `
    <i class="bi ${iconClass} fs-4"></i>
    <div class="flex-grow-1">
      <div class="fw-semibold text-dark">${type === 'success' ? 'Success' : type === 'error' ? 'Alert' : 'Notice'}</div>
      <div class="small text-muted">${escapeHtml(message)}</div>
    </div>
    <button type="button" class="btn-close btn-sm ms-2" aria-label="Close"></button>
  `;

  toast.querySelector('.btn-close').addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  // Auto-remove after 4.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/**
 * Escape HTML to prevent XSS in rendered templates
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format date nicely e.g. "Apr 10, 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Calculate age string from date of birth
 */
function calculateAge(dobStr) {
  if (!dobStr) return 'Unknown age';
  const dob = new Date(dobStr);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }
  if (years <= 0) {
    return `${months} month${months === 1 ? '' : 's'} old`;
  }
  return `${years} yr${years === 1 ? '' : 's'}${months > 0 ? ` ${months} mo` : ''}`;
}

/**
 * Check authenticated user session
 */
async function checkAuth(redirectIfNotAuth = true) {
  try {
    const data = await apiRequest('/auth/me');
    return data.user;
  } catch (err) {
    if (redirectIfNotAuth) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    return null;
  }
}

/**
 * Get query parameter by name
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
