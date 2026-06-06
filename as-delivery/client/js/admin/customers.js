// Admin Customers Management
window.AdminCustomers = (() => {
  let editingId = null;
  let allCustomers = [];

  // ── Render table ──
  function render(list) {
    const tbody = document.getElementById('admin-customers-tbody');
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty"><div class="empty-icon">🏢</div><div class="empty-text">ไม่มีข้อมูลลูกค้า</div></div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(c => `
      <tr>
        <td style="font-size:13px;color:var(--text-muted);">${c.customer_code || '-'}</td>
        <td>
          <div style="font-weight:600;">${c.customer_name}</div>
          ${c.branch ? `<div style="font-size:13px;color:var(--text-muted);">${c.branch}</div>` : ''}
        </td>
        <td>${c.contact_name || '-'}</td>
        <td>${c.contact_phone ? `<a href="tel:${c.contact_phone}" style="color:var(--primary);">${c.contact_phone}</a>` : '-'}</td>
        <td style="max-width:200px;">
          ${c.delivery_note
            ? `<span style="font-size:13px;color:#92400E;">⚠️ ${c.delivery_note}</span>`
            : '<span style="color:var(--text-muted);font-size:13px;">-</span>'}
        </td>
        <td>${c.is_active
          ? '<span class="badge badge-active">ใช้งาน</span>'
          : '<span class="badge badge-inactive">ปิด</span>'}
        </td>
        <td style="white-space:nowrap;">
          <button class="btn btn-sm btn-secondary" onclick="AdminCustomers.openHistory(${c.id})">ประวัติ</button>
          <button class="btn btn-sm btn-secondary" style="margin-left:6px;" onclick="AdminCustomers.openEdit(${c.id})">แก้ไข</button>
          ${c.is_active
            ? `<button class="btn btn-sm btn-danger" style="margin-left:6px;" onclick="AdminCustomers.deactivate(${c.id})">ปิด</button>`
            : `<button class="btn btn-sm btn-success" style="margin-left:6px;" onclick="AdminCustomers.activate(${c.id})">เปิด</button>`
          }
        </td>
      </tr>
    `).join('');
  }

  async function load() {
    try {
      const rows = await API.apiFetch('/api/customers');
      allCustomers = rows;
      render(rows);
    } catch (err) {
      document.getElementById('admin-customers-tbody').innerHTML =
        `<tr><td colspan="7" class="alert alert-error">${err.message}</td></tr>`;
    }
  }

  // ── Search (client-side filter) ──
  function doSearch() {
    const q = document.getElementById('cust-search-input').value.trim().toLowerCase();
    if (!q) { render(allCustomers); return; }
    const filtered = allCustomers.filter(c =>
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.customer_code || '').toLowerCase().includes(q) ||
      (c.branch || '').toLowerCase().includes(q) ||
      (c.contact_name || '').toLowerCase().includes(q)
    );
    render(filtered);
  }

  // ── Modal helpers ──
  function getFormValues() {
    return {
      customer_code: document.getElementById('cform-code').value.trim() || null,
      customer_name: document.getElementById('cform-name').value.trim(),
      branch: document.getElementById('cform-branch').value.trim() || null,
      address: document.getElementById('cform-address').value.trim() || null,
      contact_name: document.getElementById('cform-contact-name').value.trim() || null,
      contact_phone: document.getElementById('cform-contact-phone').value.trim() || null,
      delivery_note: document.getElementById('cform-delivery-note').value.trim() || null,
    };
  }

  function setFormValues(c) {
    document.getElementById('cform-code').value = c.customer_code || '';
    document.getElementById('cform-name').value = c.customer_name || '';
    document.getElementById('cform-branch').value = c.branch || '';
    document.getElementById('cform-address').value = c.address || '';
    document.getElementById('cform-contact-name').value = c.contact_name || '';
    document.getElementById('cform-contact-phone').value = c.contact_phone || '';
    document.getElementById('cform-delivery-note').value = c.delivery_note || '';
  }

  function showModal() { document.getElementById('modal-customer').classList.add('open'); }
  function hideModal() { document.getElementById('modal-customer').classList.remove('open'); }

  function setAlert(msg, type = 'error') {
    const el = document.getElementById('modal-customer-alert');
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  function openAdd() {
    editingId = null;
    document.getElementById('modal-customer-title').textContent = '+ เพิ่มลูกค้า';
    setFormValues({ customer_code: '', customer_name: '', branch: '', address: '', contact_name: '', contact_phone: '', delivery_note: '' });
    setAlert('');
    showModal();
  }

  function openEdit(id) {
    editingId = id;
    const c = allCustomers.find(x => x.id === id);
    if (!c) return;
    document.getElementById('modal-customer-title').textContent = `✏️ แก้ไข: ${c.customer_name}`;
    setFormValues(c);
    setAlert('');
    showModal();
  }

  async function save() {
    const vals = getFormValues();
    if (!vals.customer_name) { setAlert('กรุณากรอกชื่อลูกค้า'); return; }

    try {
      if (editingId) {
        await API.apiFetch(`/api/customers/${editingId}`, { method: 'PATCH', body: JSON.stringify(vals) });
      } else {
        await API.apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(vals) });
      }
      hideModal();
      load();
    } catch (err) {
      setAlert(err.message);
    }
  }

  async function deactivate(id) {
    if (!confirm('ต้องการปิดใช้งานลูกค้านี้?')) return;
    await API.apiFetch(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: false }) });
    load();
  }

  async function activate(id) {
    await API.apiFetch(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: true }) });
    load();
  }

  // ── History Modal ──
  async function openHistory(id) {
    const c = allCustomers.find(x => x.id === id);
    document.getElementById('modal-ch-title').textContent = `📦 ประวัติการส่ง — ${c ? c.customer_name : ''}`;
    document.getElementById('modal-ch-body').innerHTML = '<div class="spinner">กำลังโหลด...</div>';
    document.getElementById('modal-customer-history').classList.add('open');

    try {
      const data = await API.apiFetch(`/api/customers/${id}`);
      const history = data.history || [];
      if (!history.length) {
        document.getElementById('modal-ch-body').innerHTML = '<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">ยังไม่มีประวัติการส่ง</div></div>';
        return;
      }

      function badge(s) {
        if (s === 'delivered') return '<span class="badge badge-delivered">ส่งแล้ว</span>';
        if (s === 'failed') return '<span class="badge badge-failed">ส่งไม่ได้</span>';
        return '<span class="badge badge-pending">รอส่ง</span>';
      }

      document.getElementById('modal-ch-body').innerHTML = `
        <div style="margin-bottom:12px;font-size:13px;color:var(--text-muted);">
          ส่งทั้งหมด <strong>${history.length}</strong> ครั้ง |
          สำเร็จ <strong style="color:var(--success);">${history.filter(h=>h.status==='delivered').length}</strong> ครั้ง
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Invoice No.</th><th>วันนัดส่ง</th><th>Driver</th><th>สถานะ</th><th>หมายเหตุ</th></tr>
            </thead>
            <tbody>
              ${history.map(h => `
                <tr>
                  <td><strong>${h.invoice_no}</strong></td>
                  <td>${h.delivery_date}</td>
                  <td>${h.driver_name || '-'}</td>
                  <td>${badge(h.status)}</td>
                  <td style="max-width:180px;font-size:13px;">${h.note || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('modal-ch-body').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  // ── Init ──
  function init() {
    document.getElementById('btn-add-customer').addEventListener('click', openAdd);
    document.getElementById('btn-cust-search').addEventListener('click', doSearch);
    document.getElementById('cust-search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
    document.getElementById('cust-search-input').addEventListener('input', doSearch);

    document.getElementById('modal-customer-close').addEventListener('click', hideModal);
    document.getElementById('modal-customer').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) hideModal();
    });
    document.getElementById('btn-cform-cancel').addEventListener('click', hideModal);
    document.getElementById('btn-cform-save').addEventListener('click', save);

    document.getElementById('modal-ch-close').addEventListener('click', () => {
      document.getElementById('modal-customer-history').classList.remove('open');
    });
    document.getElementById('modal-customer-history').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
    });
  }

  return { init, load, openEdit, openHistory, deactivate, activate };
})();
