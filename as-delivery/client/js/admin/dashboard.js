// Admin Dashboard
window.AdminDashboard = (() => {
  let allDeliveries = [];
  let driverList = []; // cache สำหรับ reassign dropdown

  function badge(s) {
    if (s === 'delivered') return '<span class="badge badge-delivered">ส่งแล้ว</span>';
    if (s === 'failed') return '<span class="badge badge-failed">ส่งไม่ได้</span>';
    return '<span class="badge badge-pending">รอส่ง</span>';
  }

  function fmt(str) {
    if (!str) return '-';
    return str.replace('T', ' ').slice(0, 16);
  }

  function renderTable(rows) {
    const tbody = document.getElementById('admin-deliveries-tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="empty-icon">📋</div><div class="empty-text">ไม่พบข้อมูล</div></div></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(d => `
      <tr data-id="${d.id}">
        <td><strong style="cursor:pointer;color:var(--primary);" class="open-modal">${d.invoice_no}</strong></td>
        <td>${d.customer_name}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span class="driver-cell-name" style="font-weight:${d.driver_name ? '600' : '400'};color:${d.driver_name ? 'inherit' : 'var(--text-muted)'};">
              ${d.driver_name || 'ยังไม่ได้มอบหมาย'}
            </span>
            <button class="btn btn-sm btn-outline btn-reassign-inline"
              data-id="${d.id}" data-driver="${d.driver_id || ''}"
              style="font-size:12px;padding:4px 8px;line-height:1;">
              เปลี่ยน
            </button>
          </div>
          <div class="inline-reassign-wrap" id="inline-reassign-${d.id}" style="display:none;margin-top:6px;"></div>
        </td>
        <td>${d.delivery_date}</td>
        <td>${fmt(d.delivered_at)}</td>
        <td>${badge(d.status)}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.note || '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary open-modal" style="white-space:nowrap;">ดูรายละเอียด</button>
        </td>
      </tr>
    `).join('');

    // คลิก invoice หรือปุ่ม ดูรายละเอียด → เปิด modal
    tbody.querySelectorAll('.open-modal').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeliveryModal(parseInt(el.closest('tr').dataset.id));
      });
    });

    // ปุ่ม "เปลี่ยน" inline ในตาราง
    tbody.querySelectorAll('.btn-reassign-inline').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleInlineReassign(parseInt(btn.dataset.id), parseInt(btn.dataset.driver) || null, btn);
      });
    });
  }

  function toggleInlineReassign(deliveryId, currentDriverId, triggerBtn) {
    const wrap = document.getElementById(`inline-reassign-${deliveryId}`);
    if (wrap.style.display !== 'none') { wrap.style.display = 'none'; return; }

    const opts = driverList.map(d =>
      `<option value="${d.id}" ${d.id === currentDriverId ? 'selected' : ''}>${d.full_name}</option>`
    ).join('');

    wrap.innerHTML = `
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
        <select class="inline-driver-select" style="margin:0;flex:1;min-width:130px;font-size:13px;padding:6px 10px;">
          <option value="">-- ยังไม่ได้มอบหมาย --</option>
          ${opts}
        </select>
        <button class="btn btn-primary btn-sm inline-confirm-btn" style="white-space:nowrap;">✓ ยืนยัน</button>
        <button class="btn btn-secondary btn-sm inline-cancel-btn">ยกเลิก</button>
      </div>
      <div class="inline-feedback" style="font-size:12px;margin-top:4px;display:none;"></div>
    `;
    wrap.style.display = 'block';

    const sel = wrap.querySelector('.inline-driver-select');
    const confirmBtn = wrap.querySelector('.inline-confirm-btn');
    const cancelBtn = wrap.querySelector('.inline-cancel-btn');
    const fb = wrap.querySelector('.inline-feedback');

    cancelBtn.addEventListener('click', () => { wrap.style.display = 'none'; });

    confirmBtn.addEventListener('click', async () => {
      const newDriverId = sel.value ? parseInt(sel.value) : null;
      if (String(newDriverId || '') === String(currentDriverId || '')) {
        fb.style.cssText = 'display:block;color:var(--text-muted);';
        fb.textContent = 'ไม่มีการเปลี่ยนแปลง';
        return;
      }
      confirmBtn.disabled = true; confirmBtn.textContent = 'กำลังบันทึก...';
      try {
        const updated = await API.apiFetch(`/api/deliveries/${deliveryId}`, {
          method: 'PATCH',
          body: JSON.stringify({ driver_id: newDriverId })
        });

        // อัปเดตชื่อในแถวทันทีโดยไม่ต้อง reload ทั้งตาราง
        const row = document.querySelector(`tr[data-id="${deliveryId}"]`);
        if (row) {
          const nameSpan = row.querySelector('.driver-cell-name');
          const newName = newDriverId
            ? (driverList.find(d => d.id === newDriverId) || {}).full_name || '-'
            : 'ยังไม่ได้มอบหมาย';
          if (nameSpan) nameSpan.textContent = newName;
          // อัปเดต data attribute ของปุ่มเปลี่ยน
          const inlineBtn = row.querySelector('.btn-reassign-inline');
          if (inlineBtn) inlineBtn.dataset.driver = newDriverId || '';
        }
        // อัปเดต allDeliveries
        const idx = allDeliveries.findIndex(d => d.id === deliveryId);
        if (idx >= 0) {
          allDeliveries[idx].driver_id = newDriverId;
          allDeliveries[idx].driver_name = updated.driver_name || null;
        }

        fb.style.cssText = 'display:block;color:var(--success);font-weight:600;';
        fb.textContent = '✓ บันทึกแล้ว';
        setTimeout(() => { wrap.style.display = 'none'; }, 1500);
      } catch (err) {
        fb.style.cssText = 'display:block;color:var(--danger);';
        fb.textContent = err.message;
        confirmBtn.disabled = false; confirmBtn.textContent = '✓ ยืนยัน';
      }
    });
  }

  function updateSummary(rows) {
    document.getElementById('sum-total').textContent = rows.length;
    document.getElementById('sum-delivered').textContent = rows.filter(d => d.status === 'delivered').length;
    document.getElementById('sum-pending').textContent = rows.filter(d => d.status === 'pending').length;
    document.getElementById('sum-failed').textContent = rows.filter(d => d.status === 'failed').length;
  }

  async function load(params = {}) {
    const qs = new URLSearchParams(params).toString();
    try {
      const rows = await API.apiFetch('/api/deliveries' + (qs ? '?' + qs : ''));
      allDeliveries = rows;
      renderTable(rows);
      updateSummary(rows);
    } catch (err) {
      document.getElementById('admin-deliveries-tbody').innerHTML =
        `<tr><td colspan="7" class="alert alert-error">${err.message}</td></tr>`;
    }
  }

  async function openDeliveryModal(id) {
    const delivery = await API.apiFetch(`/api/deliveries/${id}`);
    const photos = delivery.photos || [];
    const goodsPhotos = photos.filter(p => p.photo_type === 'goods');
    const sigPhotos = photos.filter(p => p.photo_type === 'signature_doc');

    function photoHtml(list) {
      if (!list.length) return '<div style="color:var(--text-muted);font-size:14px;">ไม่มีรูป</div>';
      return list.map(p => {
        const src = `/api/photos${p.file_path.replace('/uploads', '')}`;
        return `<img src="${src}" style="width:100%;border-radius:8px;cursor:zoom-in;" onclick="window.App.openLightbox('${src}')" />`;
      }).join('');
    }

    // Build driver options สำหรับ reassign
    const driverOptions = driverList.map(d =>
      `<option value="${d.id}" ${d.id === delivery.driver_id ? 'selected' : ''}>${d.full_name}</option>`
    ).join('');

    document.getElementById('modal-delivery-title').textContent = `Invoice: ${delivery.invoice_no}`;
    document.getElementById('modal-delivery-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div>
          <div style="font-size:12px;color:var(--text-muted);">ลูกค้า</div>
          <div style="font-weight:600;">${delivery.customer_name}</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text-muted);">ที่อยู่</div>
          <div>${delivery.customer_address || '-'}</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text-muted);">วันที่นัดส่ง</div>
          <div style="font-weight:600;">${delivery.delivery_date}</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text-muted);">วันเวลาส่งจริง</div>
          <div>${fmt(delivery.delivered_at)}</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text-muted);">สถานะ</div>
          <div>${badge(delivery.status)}</div>
        </div>
        ${delivery.note ? `<div>
          <div style="font-size:12px;color:var(--text-muted);">หมายเหตุ</div>
          <div style="font-size:14px;">${delivery.note}</div>
        </div>` : '<div></div>'}
      </div>

      <!-- ── แก้ไขคนส่ง ── -->
      <div style="background:#F8FAFC;border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:var(--text-muted);margin-bottom:10px;letter-spacing:0.03em;">🚚 คนส่ง (เปลี่ยนได้)</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="reassign-driver-select" style="flex:1;min-width:160px;margin:0;border-color:var(--border);">
            <option value="">-- ยังไม่ได้มอบหมาย --</option>
            ${driverOptions}
          </select>
          <button id="btn-reassign-confirm" class="btn btn-primary"
            style="white-space:nowrap;padding:10px 18px;"
            data-delivery-id="${delivery.id}"
            data-original-driver="${delivery.driver_id || ''}">
            ✓ ยืนยันการเปลี่ยน
          </button>
        </div>
        <div id="reassign-feedback" style="font-size:13px;margin-top:8px;display:none;"></div>
      </div>

      <!-- ── รูปภาพ ── -->
      <div style="margin-bottom:12px;">
        <div class="photo-section-title">📦 รูปสินค้า</div>
        <div class="photo-grid">${photoHtml(goodsPhotos)}</div>
      </div>
      <div>
        <div class="photo-section-title">✍️ รูปเอกสาร / ลายเซ็น</div>
        <div class="photo-grid">${photoHtml(sigPhotos)}</div>
      </div>
    `;

    // ── Wire up ปุ่มยืนยัน ──
    const confirmBtn = document.getElementById('btn-reassign-confirm');
    const select = document.getElementById('reassign-driver-select');
    const feedback = document.getElementById('reassign-feedback');

    // ไฮไลท์ select เมื่อเปลี่ยนค่า
    select.addEventListener('change', () => {
      const changed = select.value !== String(delivery.driver_id || '');
      confirmBtn.style.background = changed ? 'var(--warning)' : '';
      feedback.style.display = 'none';
    });

    confirmBtn.addEventListener('click', async () => {
      const newDriverId = select.value ? parseInt(select.value) : null;
      const newDriverName = select.value
        ? (driverList.find(d => d.id === parseInt(select.value)) || {}).full_name || '-'
        : 'ยังไม่ได้มอบหมาย';

      // ถ้าไม่ได้เปลี่ยนจริง
      if (String(newDriverId || '') === String(delivery.driver_id || '')) {
        feedback.style.cssText = 'display:block;color:var(--text-muted);';
        feedback.textContent = 'ไม่มีการเปลี่ยนแปลง';
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'กำลังบันทึก...';

      try {
        await API.apiFetch(`/api/deliveries/${delivery.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ driver_id: newDriverId })
        });

        // อัปเดต driver_id ในหน่วยความจำเพื่อป้องกัน double-click
        delivery.driver_id = newDriverId;

        confirmBtn.style.background = 'var(--success)';
        confirmBtn.textContent = '✓ บันทึกแล้ว';
        feedback.style.cssText = 'display:block;color:var(--success);font-weight:600;';
        feedback.textContent = `✓ เปลี่ยนคนส่งเป็น "${newDriverName}" เรียบร้อยแล้ว`;

        // รีโหลดตาราง dashboard ใน background
        load();

        // รีเซ็ตปุ่มหลัง 2 วิ
        setTimeout(() => {
          confirmBtn.disabled = false;
          confirmBtn.textContent = '✓ ยืนยันการเปลี่ยน';
          confirmBtn.style.background = '';
        }, 2000);
      } catch (err) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '✓ ยืนยันการเปลี่ยน';
        feedback.style.cssText = 'display:block;color:var(--danger);';
        feedback.textContent = `เกิดข้อผิดพลาด: ${err.message}`;
      }
    });

    document.getElementById('modal-delivery').classList.add('open');
  }

  async function loadDriverFilter() {
    try {
      const users = await API.apiFetch('/api/users');
      driverList = users.filter(u => u.role === 'driver' && u.is_active);
      const sel = document.getElementById('filter-driver');
      const exportSel = document.getElementById('export-driver');
      const madminSel = document.getElementById('madmin-driver');
      driverList.forEach(d => {
        [sel, exportSel, madminSel].forEach(s => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = d.full_name;
          s.appendChild(opt.cloneNode(true));
        });
      });
    } catch {}
  }

  function applyFilter() {
    const date = document.getElementById('filter-date').value;
    const driver = document.getElementById('filter-driver').value;
    const status = document.getElementById('filter-status').value;
    const params = {};
    if (date) params.date = date;
    if (driver) params.driver_id = driver;
    if (status) params.status = status;
    load(params);
  }

  function exportCSV() {
    const from = document.getElementById('export-from').value;
    const to = document.getElementById('export-to').value;
    const driverId = document.getElementById('export-driver').value;

    if (!from || !to) { alert('กรุณาเลือกช่วงวันที่'); return; }

    const filtered = allDeliveries.filter(d => {
      const inRange = d.delivery_date >= from && d.delivery_date <= to;
      const matchDriver = !driverId || String(d.driver_id) === driverId;
      return inRange && matchDriver;
    });

    const header = ['Invoice No.', 'ลูกค้า', 'ที่อยู่', 'Driver', 'วันนัดส่ง', 'วันส่งจริง', 'สถานะ', 'หมายเหตุ'];
    const rows = filtered.map(d => [
      d.invoice_no, d.customer_name, d.customer_address || '', d.driver_name || '',
      d.delivery_date, d.delivered_at || '', d.status, d.note || ''
    ]);

    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `delivery_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Admin modal customer dropdown ──
  let madminCustomers = [];
  let madminSelected = null;

  function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function madminBuildDropdown(list) {
    const dd = document.getElementById('madmin-customer-dropdown');
    const itemsHtml = list.map((c, i) => `
      <div class="autocomplete-item" data-idx="${i}">
        <div class="autocomplete-item-name">
          ${escHtml(c.customer_name)}
          ${c.branch ? `<span style="font-weight:400;color:var(--text-muted);"> (${escHtml(c.branch)})</span>` : ''}
          ${c.customer_code ? `<span style="font-size:11px;color:var(--text-muted);"> [${escHtml(c.customer_code)}]</span>` : ''}
        </div>
        ${c.address ? `<div class="autocomplete-item-sub">📍 ${escHtml(c.address)}</div>` : ''}
        ${c.delivery_note ? `<div class="autocomplete-item-note">⚠️ ${escHtml(c.delivery_note)}</div>` : ''}
      </div>
    `).join('');
    const emptyHtml = list.length === 0
      ? `<div style="padding:12px 14px;color:var(--text-muted);font-size:14px;">ไม่พบลูกค้า — กรอกชื่อได้เลย</div>` : '';
    dd.innerHTML = itemsHtml + emptyHtml;
    dd.querySelectorAll('.autocomplete-item').forEach((el, idx) => {
      el.addEventListener('mousedown', (e) => { e.preventDefault(); madminApplyCustomer(list[idx]); });
    });
    dd.classList.add('open');
  }

  function madminOpenDropdown() {
    const q = document.getElementById('madmin-customer').value.trim().toLowerCase();
    const filtered = q
      ? madminCustomers.filter(c =>
          (c.customer_name||'').toLowerCase().includes(q) ||
          (c.customer_code||'').toLowerCase().includes(q) ||
          (c.branch||'').toLowerCase().includes(q))
      : madminCustomers;
    madminBuildDropdown(filtered);
  }

  function madminCloseDropdown() {
    document.getElementById('madmin-customer-dropdown').classList.remove('open');
  }

  function madminApplyCustomer(c) {
    madminSelected = c;
    document.getElementById('madmin-customer').value = c.branch ? `${c.customer_name} (${c.branch})` : c.customer_name;
    document.getElementById('madmin-customer-id').value = c.id;
    document.getElementById('madmin-customer-matched').textContent = '✓ พบในฐานข้อมูล';
    if (c.address) document.getElementById('madmin-address').value = c.address;
    if (c.delivery_note) {
      document.getElementById('madmin-delivery-note-text').textContent = c.delivery_note;
      document.getElementById('madmin-delivery-note-banner').style.display = 'flex';
    } else {
      document.getElementById('madmin-delivery-note-banner').style.display = 'none';
    }
    if (c.contact_name || c.contact_phone) {
      document.getElementById('madmin-contact-info').textContent = [c.contact_name, c.contact_phone].filter(Boolean).join(' — ');
      document.getElementById('madmin-contact-row').style.display = 'block';
    } else {
      document.getElementById('madmin-contact-row').style.display = 'none';
    }
    madminCloseDropdown();
  }

  function madminClearSelection() {
    madminSelected = null;
    document.getElementById('madmin-customer-id').value = '';
    document.getElementById('madmin-customer-matched').textContent = '';
    document.getElementById('madmin-delivery-note-banner').style.display = 'none';
    document.getElementById('madmin-contact-row').style.display = 'none';
  }

  async function openAddModal() {
    document.getElementById('madmin-invoice').value = '';
    document.getElementById('madmin-customer').value = '';
    document.getElementById('madmin-address').value = '';
    document.getElementById('madmin-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('modal-add-alert').style.display = 'none';
    madminClearSelection();
    madminCloseDropdown();

    // โหลดรายชื่อลูกค้า
    try { madminCustomers = await API.apiFetch('/api/customers'); } catch { madminCustomers = []; }

    document.getElementById('modal-add-delivery').classList.add('open');
    setTimeout(() => document.getElementById('madmin-invoice').focus(), 100);
  }

  async function saveAdminDelivery() {
    const invoice   = document.getElementById('madmin-invoice').value.trim();
    const custText  = document.getElementById('madmin-customer').value.trim();
    const customer_name = madminSelected ? madminSelected.customer_name : custText;
    const customer_id   = madminSelected ? madminSelected.id : null;
    const address   = document.getElementById('madmin-address').value.trim();
    const date      = document.getElementById('madmin-date').value;
    const driverId  = document.getElementById('madmin-driver').value;

    const alertEl = document.getElementById('modal-add-alert');
    if (!invoice || !customer_name || !date || !driverId) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = 'กรุณากรอกข้อมูลให้ครบ (Invoice, ลูกค้า, วันที่, Driver)';
      alertEl.style.display = 'block';
      return;
    }

    try {
      await API.apiFetch('/api/deliveries', {
        method: 'POST',
        body: JSON.stringify({
          invoice_no: invoice,
          customer_name,
          customer_id,
          customer_address: address || null,
          delivery_date: date,
          driver_id: parseInt(driverId)
        })
      });
      document.getElementById('modal-add-delivery').classList.remove('open');
      load();
    } catch (err) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = err.message;
      alertEl.style.display = 'block';
    }
  }

  function init() {
    document.getElementById('btn-filter-apply').addEventListener('click', applyFilter);
    document.getElementById('filter-date').addEventListener('change', applyFilter);
    document.getElementById('modal-delivery-close').addEventListener('click', () => {
      document.getElementById('modal-delivery').classList.remove('open');
    });
    document.getElementById('modal-delivery').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
    });
    document.getElementById('btn-admin-add').addEventListener('click', openAddModal);
    document.getElementById('modal-add-delivery-close').addEventListener('click', () => {
      document.getElementById('modal-add-delivery').classList.remove('open');
    });
    document.getElementById('btn-madmin-cancel').addEventListener('click', () => {
      document.getElementById('modal-add-delivery').classList.remove('open');
    });
    document.getElementById('btn-madmin-save').addEventListener('click', saveAdminDelivery);

    // Customer dropdown ใน admin modal
    const madminInput = document.getElementById('madmin-customer');
    madminInput.addEventListener('focus', madminOpenDropdown);
    madminInput.addEventListener('click', () => {
      if (!document.getElementById('madmin-customer-dropdown').classList.contains('open')) madminOpenDropdown();
    });
    madminInput.addEventListener('input', () => { madminClearSelection(); madminOpenDropdown(); });
    madminInput.addEventListener('blur', () => setTimeout(madminCloseDropdown, 200));
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

    // Set default export dates
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 8) + '01';
    document.getElementById('export-from').value = monthStart;
    document.getElementById('export-to').value = today;

    loadDriverFilter();
    load({ date: today });
    document.getElementById('filter-date').value = today;
  }

  return { init, load };
})();
