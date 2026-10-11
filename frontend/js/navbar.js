// ============================================================================
// PetCare Passport - Shared Navigation, Sidebar, & Notification Component
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // If we are on public pages, do not inject app sidebar
  const publicPages = ['index.html', 'login.html', 'register.html', 'emergency.html', '404.html'];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (publicPages.includes(currentPage)) {
    return;
  }

  // Verify auth session
  const user = await checkAuth(true);
  if (!user) return;

  // Initialize header profile & notifications
  setupHeaderUser(user);
  setupNotifications();
  setupSidebarActive();
  setupMobileSidebarToggle();
});

function setupHeaderUser(user) {
  const userNameElements = document.querySelectorAll('.current-user-name');
  userNameElements.forEach(el => el.textContent = user.full_name || 'Pet Owner');

  const userEmailElements = document.querySelectorAll('.current-user-email');
  userEmailElements.forEach(el => el.textContent = user.email || '');

  // Setup logout buttons
  const logoutButtons = document.querySelectorAll('.btn-logout');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
        showToast('Logged out safely.', 'info');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 500);
      } catch (err) {
        window.location.href = '/login.html';
      }
    });
  });
}

function setupSidebarActive() {
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || (currentPath === '' && href === 'dashboard.html'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function setupMobileSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.querySelector('.app-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('show') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('show');
      }
    });
  }
}

async function setupNotifications() {
  const notifBadge = document.getElementById('notifBadge');
  const notifList = document.getElementById('notifList');
  if (!notifBadge || !notifList) return;

  try {
    const data = await apiRequest('/notifications');
    const { unreadCount, notifications } = data;

    if (unreadCount > 0) {
      notifBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      notifBadge.classList.remove('d-none');
    } else {
      notifBadge.classList.add('d-none');
    }

    if (!notifications || notifications.length === 0) {
      notifList.innerHTML = `
        <div class="p-3 text-center text-muted small">
          <i class="bi bi-bell-slash fs-4 d-block mb-1 text-secondary"></i>
          No notifications yet
        </div>
      `;
      return;
    }

    notifList.innerHTML = notifications.slice(0, 5).map(n => `
      <a href="${n.link_url || '#'}" class="dropdown-item py-2 px-3 border-bottom ${n.is_read ? '' : 'bg-light'}" data-notif-id="${n.id}">
        <div class="d-flex align-items-start gap-2">
          <i class="bi ${n.type === 'found_report' ? 'bi-shield-exclamation text-danger' : n.type === 'reminder' ? 'bi-alarm text-warning' : 'bi-info-circle text-primary'} fs-5 mt-1"></i>
          <div class="flex-grow-1">
            <div class="fw-semibold small text-dark">${escapeHtml(n.title)}</div>
            <div class="small text-muted text-truncate" style="max-width: 240px;">${escapeHtml(n.message)}</div>
            <div class="text-xs text-muted mt-1" style="font-size: 0.72rem;">${formatDate(n.created_at)}</div>
          </div>
        </div>
      </a>
    `).join('');

    // Mark as read on click
    notifList.querySelectorAll('[data-notif-id]').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.dataset.notifId;
        try {
          await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
        } catch (e) {}
      });
    });

    // Mark all as read button
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await apiRequest('/notifications/read-all', { method: 'PATCH' });
          notifBadge.classList.add('d-none');
          setupNotifications();
          showToast('All notifications marked as read', 'info');
        } catch (e) {}
      });
    }
  } catch (err) {
    console.warn('Failed to load notifications:', err.message);
  }
}
