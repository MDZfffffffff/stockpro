// Driver Add Delivery — Customer Dropdown + Quick-Add
window.DriverAdd = (() => {
  let selectedCustomer = null;
  let allCustomers = [];       // cache รายชื่อทั้งหมดจาก server
  let focusedIndex = -1;
  let visibleItems = [];       // รายการที่กำลังแสดงใน dropdown

  // ══════════════════════════════
  //  Alert
  // ══════════════════════════════
  function showAlert(msg, type = 'error') {
    const el = document.getElementById('add-alert');
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  // ══════════════════════════════
  //  โหลดลูกค้าทั้งหมดจาก server
  // ══════════════════════════════
  async function loadCustomers() {
    try {
      allCustomers = await API.apiFetch('/api/customers');
    } catch {
      allCustomers = [];
    }
  }

  // ══════════════════════════════
  //  เลือกลูกค้า
  // ══════════════════════════════
  function clearSelection() {
    selectedCustomer = null;
    document.getElementById('add-customer-id').value = '';
    document.getElementById('add-customer-matched').textContent = '';
    document.getElementById('add-delivery-note-banner').style.display = 'none';
    document.getElementById('add-contact-row').style.display = 'none';
  }

  function applyCustomer(c) {
    selectedCustomer = c;
    document.getElementById('add-customer').value =
      c.branch ? `${c.customer_name} (${c.branch})` : c.customer_name;
    document.getElementById('add-customer-id').value = c.id;
    document.getElementById('add-customer-matched').textContent = '✓ พบในฐานข้อมูล';

    if (c.address) document.getElementById('add-address').value = c.address;

    if (c.delivery_note) {
      document.getElementById('add-delivery-note-text').textContent = c.delivery_note;
      document.getElementById('add-delivery-note-banner').style.display = 'flex';
    } else {
      document.getElementById('add-delivery-note-banner').style.display = 'none';
    }

    if (c.contact_name || c.contact_phone) {
      document.getElementById('add-contact-info').textContent =
        [c.contact_name, c.contact_phone].filter(Boolean).join(' — ');
      document.getElementById('add-contact-row').style.display = 'block';
    } else {
      document.getElementById('add-contact-row').style.display = 'none';
    }

    closeDropdown();
  }

  // ══════════════════════════════
  //  Dropdown
  // ══════════════════════════════
  function buildDropdown(list) {
    const dd = document.getElementById('add-customer-dropdown');
    focusedIndex = -1;
    visibleItems = list;

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
      ? `<div style="padding:12px 14px;color:var(--text-muted);font-size:14px;">ไม่พบลูกค้าที่ตรงกัน</div>`
      : '';

    // ปุ่มเพิ่มลูกค้าใหม่ — แสดงเสมอที่ด้านล่าง
    const addBtnHtml = `
      <div id="dd-add-new-btn" style="
        padding:12px 14px;
        border-top:1.5px dashed var(--border);
        display:flex;align-items:center;gap:8px;
        cursor:pointer;color:var(--primary);font-weight:600;font-size:14px;
        background:#FFF5F5;
      ">
        <span style="font-size:18px;line-height:1;">➕</span>
        <span>เพิ่มลูกค้าใหม่ในฐานข้อมูล</span>
      </div>
    `;

    dd.innerHTML = itemsHtml + emptyHtml + addBtnHtml;

    // bind click รายชื่อ
    dd.querySelectorAll('.autocomplete-item').forEach((el, idx) => {
      el.addEventListener('mousedown', (e) => { e.preventDefault(); applyCustomer(list[idx]); });
    });

    // bind click ปุ่มเพิ่มใหม่
    document.getElementById('dd-add-new-btn').addEventListener('mousedown', (e) => {
      e.preventDefault();
      closeDropdown();
      openQuickAdd();
    });

    dd.classList.add('open');
  }

  function openDropdown() {
    const q = document.getElementById('add-customer').value.trim().toLowerCase();
    const filtered = q
      ? allCustomers.filter(c =>
          (c.customer_name || '').toLowerCase().includes(q) ||
          (c.customer_code || '').toLowerCase().includes(q) ||
          (c.branch || '').toLowerCase().includes(q) ||
          (c.contact_name || '').toLowerCase().includes(q)
        )
      : allCustomers;
    buildDropdown(filtered);
  }

  function closeDropdown() {
    document.getElementById('add-customer-dropdown').classList.remove('open');
    focusedIndex = -1;
  }

  function setFocused(idx) {
    const items = document.getElementById('add-customer-dropdown')
      .querySelectorAll('.autocomplete-item');
    items.forEach(el => el.classList.remove('focused'));
    if (idx >= 0 && idx < items.length) {
      items[idx].classList.add('focused');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
    focusedIndex = idx;
  }

  function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ══════════════════════════════
  //  Quick-Add ลูกค้าใหม่ (inline panel)
  // ══════════════════════════════
  function openQuickAdd() {
    // ดึงชื่อที่ driver พิมพ์ค้างไว้ใส่ในฟอร์ม
    const typedName = document.getElementById('add-customer').value.trim();
    const panel = document.getElementById('quick-add-customer-panel');
    document.getElementById('qa-name').value = typedName;
    document.getElementById('qa-branch').value = '';
    document.getElementById('qa-address').value = document.getElementById('add-address').value.trim();
    document.getElementById('qa-contact-name').value = '';
    document.getElementById('qa-contact-phone').value = '';
    document.getElementById('qa-delivery-note').value = '';
    document.getElementById('qa-alert').style.display = 'none';
    panel.style.display = 'block';
    document.getElementById('qa-name').focus();
    // เลื่อน scroll ลงไปหาฟอร์ม
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeQuickAdd() {
    document.getElementById('quick-add-customer-panel').style.display = 'none';
  }

  async function saveQuickAdd() {
    const name = document.getElementById('qa-name').value.trim();
    if (!name) {
      const el = document.getElementById('qa-alert');
      el.className = 'alert alert-error';
      el.textContent = 'กรุณากรอกชื่อลูกค้า';
      el.style.display = 'block';
      return;
    }

    const btn = document.getElementById('qa-save-btn');
    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';

    try {
      const payload = {
        customer_name:  name,
        branch:         document.getElementById('qa-branch').value.trim() || null,
        address:        document.getElementById('qa-address').value.trim() || null,
        contact_name:   document.getElementById('qa-contact-name').value.trim() || null,
        contact_phone:  document.getElementById('qa-contact-phone').value.trim() || null,
        delivery_note:  document.getElementById('qa-delivery-note').value.trim() || null,
      };
      const newCustomer = await API.apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // เพิ่มลงใน cache แล้ว auto-select ทันที
      allCustomers.unshift(newCustomer);
      applyCustomer(newCustomer);
      closeQuickAdd();
      showAlert(`เพิ่มลูกค้า "${newCustomer.customer_name}" แล้ว`, 'success');
    } catch (err) {
      const el = document.getElementById('qa-alert');
      el.className = 'alert alert-error';
      el.textContent = err.message;
      el.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = '💾 บันทึกลูกค้าใหม่';
    }
  }

  // ══════════════════════════════
  //  บันทึก Delivery
  // ══════════════════════════════
  async function save() {
    const invoice      = document.getElementById('add-invoice').value.trim();
    const date         = document.getElementById('add-date').value;
    const customerText = document.getElementById('add-customer').value.trim();
    const customer_name = selectedCustomer ? selectedCustomer.customer_name : customerText;
    const customer_id   = selectedCustomer ? selectedCustomer.id : null;
    const address       = document.getElementById('add-address').value.trim();

    if (!invoice || !customer_name || !date) {
      return showAlert('กรุณากรอก Invoice No., ชื่อลูกค้า และวันที่');
    }

    const payload = {
      invoice_no: invoice,
      customer_name,
      customer_address: address || null,
      delivery_date: date,
      customer_id
    };

    const btn = document.getElementById('btn-save-add');
    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';

    try {
      try {
        await API.apiFetch('/api/deliveries', { method: 'POST', body: JSON.stringify(payload) });
      } catch {
        await OfflineDB.addPending(payload);
        window.App.updateSyncBadge();
      }
      showAlert('เพิ่มรายการสำเร็จ', 'success');
      resetForm();
      setTimeout(() => window.App.showPage('driver-home'), 1200);
    } catch (err) {
      showAlert(err.message);
    } finally {
      btn.disabled = false; btn.textContent = '+ เพิ่มรายการ';
    }
  }

  function resetForm() {
    document.getElementById('add-invoice').value = '';
    document.getElementById('add-customer').value = '';
    document.getElementById('add-address').value = '';
    document.getElementById('add-date').value = new Date().toISOString().slice(0, 10);
    clearSelection();
    closeQuickAdd();
  }

  // ══════════════════════════════
  //  Init
  // ══════════════════════════════
  function init() {
    document.getElementById('btn-save-add').addEventListener('click', save);
    document.getElementById('btn-add-back').addEventListener('click', () => {
      closeDropdown(); closeQuickAdd();
      window.App.showPage('driver-home');
    });
    document.getElementById('add-date').value = new Date().toISOString().slice(0, 10);

    // Quick-add panel buttons
    document.getElementById('qa-save-btn').addEventListener('click', saveQuickAdd);
    document.getElementById('qa-cancel-btn').addEventListener('click', closeQuickAdd);

    const input = document.getElementById('add-customer');

    // คลิก/focus → แสดง dropdown ทันที
    input.addEventListener('focus', () => {
      loadCustomers().then(openDropdown);
    });
    input.addEventListener('click', () => {
      if (!document.getElementById('add-customer-dropdown').classList.contains('open')) {
        loadCustomers().then(openDropdown);
      }
    });

    // พิมพ์ → กรองรายการ
    input.addEventListener('input', () => {
      clearSelection();
      openDropdown();
    });

    // Keyboard nav
    input.addEventListener('keydown', (e) => {
      const dd = document.getElementById('add-customer-dropdown');
      if (!dd.classList.contains('open')) { if (e.key === 'ArrowDown') openDropdown(); return; }
      const len = visibleItems.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault(); setFocused(Math.min(focusedIndex + 1, len - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); setFocused(Math.max(focusedIndex - 1, 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault(); applyCustomer(visibleItems[focusedIndex]);
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    input.addEventListener('blur', () => setTimeout(closeDropdown, 200));

    // โหลดครั้งแรกในพื้นหลัง
    loadCustomers();
  }

  return { init, resetForm };
})();
