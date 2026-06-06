// Admin Users Management
window.AdminUsers = (() => {
  let editingUserId = null;

  function badge(isActive) {
    return isActive
      ? '<span class="badge badge-active">ใช้งาน</span>'
      : '<span class="badge badge-inactive">ปิดใช้งาน</span>';
  }

  function roleLabel(r) {
    return r === 'admin' ? '🔑 Admin' : '🚚 Driver';
  }

  async function load() {
    try {
      const users = await API.apiFetch('/api/users');
      const tbody = document.getElementById('admin-users-tbody');
      if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty">ไม่มีข้อมูล</div></td></tr>';
        return;
      }
      tbody.innerHTML = users.map(u => `
        <tr>
          <td><strong>${u.username}</strong></td>
          <td>${u.full_name}</td>
          <td>${roleLabel(u.role)}</td>
          <td>${badge(u.is_active)}</td>
          <td style="font-size:13px;color:var(--text-muted);">${u.created_at}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="AdminUsers.openEdit(${u.id})">แก้ไข</button>
            ${u.is_active
              ? `<button class="btn btn-sm btn-danger" style="margin-left:6px;" onclick="AdminUsers.deactivate(${u.id})">ปิดใช้งาน</button>`
              : `<button class="btn btn-sm btn-success" style="margin-left:6px;" onclick="AdminUsers.activate(${u.id})">เปิดใช้งาน</button>`
            }
          </td>
        </tr>
      `).join('');
    } catch (err) {
      document.getElementById('admin-users-tbody').innerHTML =
        `<tr><td colspan="6" class="alert alert-error">${err.message}</td></tr>`;
    }
  }

  function openAdd() {
    editingUserId = null;
    document.getElementById('modal-user-title').textContent = 'เพิ่มผู้ใช้';
    document.getElementById('uform-username').value = '';
    document.getElementById('uform-password').value = '';
    document.getElementById('uform-fullname').value = '';
    document.getElementById('uform-role').value = 'driver';
    document.getElementById('uform-active').value = '1';
    document.getElementById('uform-active-wrap').style.display = 'none';
    document.getElementById('uform-pw-hint').textContent = '';
    document.getElementById('modal-user-alert').style.display = 'none';
    document.getElementById('modal-user').classList.add('open');
  }

  async function openEdit(id) {
    editingUserId = id;
    try {
      const users = await API.apiFetch('/api/users');
      const u = users.find(x => x.id === id);
      if (!u) return;
      document.getElementById('modal-user-title').textContent = 'แก้ไขผู้ใช้';
      document.getElementById('uform-username').value = u.username;
      document.getElementById('uform-password').value = '';
      document.getElementById('uform-fullname').value = u.full_name;
      document.getElementById('uform-role').value = u.role;
      document.getElementById('uform-active').value = u.is_active ? '1' : '0';
      document.getElementById('uform-active-wrap').style.display = 'block';
      document.getElementById('uform-pw-hint').textContent = '(เว้นว่างไว้ถ้าไม่เปลี่ยน)';
      document.getElementById('modal-user-alert').style.display = 'none';
      document.getElementById('modal-user').classList.add('open');
    } catch {}
  }

  async function save() {
    const alertEl = document.getElementById('modal-user-alert');
    alertEl.style.display = 'none';

    const username = document.getElementById('uform-username').value.trim();
    const password = document.getElementById('uform-password').value;
    const full_name = document.getElementById('uform-fullname').value.trim();
    const role = document.getElementById('uform-role').value;
    const is_active = document.getElementById('uform-active').value === '1';

    if (!username || !full_name || (!editingUserId && !password)) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = 'กรุณากรอกข้อมูลให้ครบ';
      alertEl.style.display = 'block';
      return;
    }

    try {
      if (editingUserId) {
        const body = { full_name, role, is_active };
        if (password) body.password = password;
        await API.apiFetch(`/api/users/${editingUserId}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await API.apiFetch('/api/users', { method: 'POST', body: JSON.stringify({ username, password, full_name, role }) });
      }
      document.getElementById('modal-user').classList.remove('open');
      load();
    } catch (err) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = err.message;
      alertEl.style.display = 'block';
    }
  }

  async function deactivate(id) {
    if (!confirm('ต้องการปิดใช้งานผู้ใช้นี้?')) return;
    await API.apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: false }) });
    load();
  }

  async function activate(id) {
    await API.apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: true }) });
    load();
  }

  function init() {
    document.getElementById('btn-add-user').addEventListener('click', openAdd);
    document.getElementById('modal-user-close').addEventListener('click', () => {
      document.getElementById('modal-user').classList.remove('open');
    });
    document.getElementById('btn-uform-cancel').addEventListener('click', () => {
      document.getElementById('modal-user').classList.remove('open');
    });
    document.getElementById('btn-uform-save').addEventListener('click', save);
  }

  return { init, load, openEdit, deactivate, activate };
})();
