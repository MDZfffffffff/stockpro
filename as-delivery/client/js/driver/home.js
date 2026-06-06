// Driver Home — list of today's deliveries
window.DriverHome = (() => {
  const TODAY = new Date().toISOString().slice(0, 10);

  function formatDate(str) {
    if (!str) return '-';
    return new Date(str).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function statusLabel(s) {
    if (s === 'delivered') return '<span class="badge badge-delivered">✓ ส่งแล้ว</span>';
    if (s === 'failed') return '<span class="badge badge-failed">✗ ส่งไม่ได้</span>';
    return '<span class="badge badge-pending">⏳ รอส่ง</span>';
  }

  function render(deliveries) {
    const list = document.getElementById('driver-delivery-list');
    if (!deliveries.length) {
      list.innerHTML = `
        <div class="empty">
          <div class="empty-icon">📋</div>
          <div class="empty-text">ไม่มีรายการส่งวันนี้</div>
        </div>`;
      return;
    }
    list.innerHTML = deliveries.map(d => `
      <div class="delivery-card ${d.status}" data-id="${d.id}">
        <div class="delivery-card-header">
          <span class="invoice-no">${d.invoice_no}</span>
          ${statusLabel(d.status)}
        </div>
        <div class="customer-name">${d.customer_name}</div>
        <div class="customer-addr">${d.customer_address || ''}</div>
      </div>
    `).join('');

    list.querySelectorAll('.delivery-card').forEach(card => {
      card.addEventListener('click', () => {
        window.App.showDriverDetail(parseInt(card.dataset.id));
      });
    });
  }

  async function load() {
    const user = JSON.parse(localStorage.getItem('as_user') || '{}');
    document.getElementById('driver-greeting').textContent = `สวัสดี, ${user.full_name || 'คนขับ'}`;
    document.getElementById('driver-today').textContent = `วันที่: ${formatDate(TODAY)}`;

    try {
      const rows = await API.apiFetch(`/api/deliveries?date=${TODAY}`);
      await OfflineDB.cacheDeliveries(rows);
      render(rows);
    } catch {
      // offline fallback
      const cached = await OfflineDB.getCachedDeliveries();
      const today = cached.filter(d => d.delivery_date === TODAY);
      render(today);
    }
  }

  return { load };
})();
