// Main App — Router, Auth, Online/Offline detection
window.App = (() => {
  let currentDeliveryId = null;

  // ── Page routing ──
  function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(`page-${name}`);
    if (page) page.classList.add('active');

    if (name === 'driver-home') DriverHome.load();
    if (name === 'admin') {
      const view = document.querySelector('.admin-view.active-view') ? null : 'dashboard';
      if (view) showAdminView(view);
    }
  }

  function showAdminView(view) {
    document.querySelectorAll('.admin-view').forEach(v => v.style.display = 'none');
    const el = document.getElementById(`admin-view-${view}`);
    if (el) el.style.display = 'flex'; el && (el.style.display = 'block');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');

    if (view === 'dashboard') AdminDashboard.load({ date: new Date().toISOString().slice(0, 10) });
    if (view === 'users') AdminUsers.load();
    if (view === 'customers') AdminCustomers.load();
  }

  async function showDriverDetail(id) {
    currentDeliveryId = id;
    try {
      const delivery = await API.apiFetch(`/api/deliveries/${id}`);
      await DriverDetail.load(delivery);
      showPage('driver-detail');
    } catch {
      // Offline: load from cache
      const cached = await OfflineDB.getCachedDeliveries();
      const delivery = cached.find(d => d.id === id);
      if (delivery) { await DriverDetail.load(delivery); showPage('driver-detail'); }
    }
  }

  // ── Auth ──
  function getUser() { return JSON.parse(localStorage.getItem('as_user') || 'null'); }

  function login(token, role, full_name, id) {
    API.setToken(token);
    localStorage.setItem('as_user', JSON.stringify({ role, full_name, id }));
    if (role === 'admin') {
      document.getElementById('admin-user-label').textContent = full_name;
      showPage('admin');
      showAdminView('dashboard');
    } else {
      showPage('driver-home');
    }
  }

  function logout() {
    API.clearToken();
    showPage('login');
  }

  // ── Sync badge ──
  async function updateSyncBadge() {
    const pending = await OfflineDB.getAllPending();
    const badge = document.getElementById('sync-pending-badge');
    if (pending.length > 0) { badge.textContent = pending.length; badge.style.display = 'inline-flex'; }
    else { badge.style.display = 'none'; }
  }

  // ── Lightbox ──
  function openLightbox(src) {
    document.getElementById('lightbox-img').src = src;
    document.getElementById('modal-lightbox').classList.add('open');
  }

  // ── Online / Offline ──
  function updateOnlineStatus() {
    const indicator = document.getElementById('offline-indicator');
    if (!navigator.onLine) { indicator.classList.add('show'); }
    else {
      indicator.classList.remove('show');
      API.syncPending().then(updateSyncBadge);
    }
  }

  // ── Init ──
  function init() {
    // Init sub-modules
    DriverDetail.init();
    DriverAdd.init();
    AdminDashboard.init();
    AdminUsers.init();
    AdminCustomers.init();

    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      btn.disabled = true; btn.textContent = 'กำลังเข้าสู่ระบบ...';
      const errEl = document.getElementById('login-error');
      errEl.style.display = 'none';

      try {
        const { token, role, full_name, id } = await API.apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
          })
        });
        login(token, role, full_name, id);
      } catch (err) {
        errEl.textContent = err.message === 'Invalid credentials' ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' : err.message;
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
      }
    });

    // Logout buttons
    document.getElementById('btn-driver-logout').addEventListener('click', logout);
    document.getElementById('btn-admin-logout').addEventListener('click', logout);

    // Driver nav
    document.getElementById('btn-add-delivery').addEventListener('click', () => showPage('driver-add'));

    // Admin nav
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => showAdminView(item.dataset.view));
    });

    // Lightbox close
    document.getElementById('lightbox-close').addEventListener('click', () => {
      document.getElementById('modal-lightbox').classList.remove('open');
    });
    document.getElementById('modal-lightbox').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
    });

    // Online/Offline
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    updateSyncBadge();

    // SW message
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data.type === 'SYNC_START') API.syncPending().then(updateSyncBadge);
      });
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Auto-login if token exists
    const user = getUser();
    if (user && API.getToken()) {
      if (user.role === 'admin') {
        document.getElementById('admin-user-label').textContent = user.full_name;
        showPage('admin');
        showAdminView('dashboard');
      } else {
        showPage('driver-home');
      }
    } else {
      showPage('login');
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { showPage, showDriverDetail, updateSyncBadge, openLightbox, login, logout };
})();
