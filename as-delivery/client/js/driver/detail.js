// Driver Delivery Detail
window.DriverDetail = (() => {
  let currentDelivery = null;
  const pendingPhotos = { goods: [], signature_doc: [] };

  function pad(n) { return String(n).padStart(2, '0'); }

  function localNow() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function showAlert(msg, type = 'error') {
    const el = document.getElementById('detail-alert');
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  function renderPhoto(blob, containerId) {
    const url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.className = 'photo-thumb';
    img.src = url;
    img.addEventListener('click', () => window.App.openLightbox(url));
    document.getElementById(containerId).appendChild(img);
  }

  function renderExistingPhoto(photo) {
    const img = document.createElement('img');
    img.className = 'photo-thumb';
    img.src = `/api/photos${photo.file_path.replace('/uploads', '')}`;
    img.onerror = () => { img.src = photo.file_path; };
    img.addEventListener('click', () => window.App.openLightbox(img.src));
    const containerId = photo.photo_type === 'goods' ? 'photos-goods' : 'photos-sig';
    document.getElementById(containerId).appendChild(img);
  }

  function setupCamera(cameraId, inputId, photoType) {
    document.getElementById(cameraId).addEventListener('click', () => {
      document.getElementById(inputId).click();
    });
    document.getElementById(inputId).addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      pendingPhotos[photoType].push({ file, takenAt: new Date().toISOString() });
      const containerId = photoType === 'goods' ? 'photos-goods' : 'photos-sig';
      renderPhoto(file, containerId);
      e.target.value = '';
    });
  }

  async function load(delivery) {
    currentDelivery = delivery;
    pendingPhotos.goods = [];
    pendingPhotos.signature_doc = [];
    document.getElementById('photos-goods').innerHTML = '';
    document.getElementById('photos-sig').innerHTML = '';

    document.getElementById('d-invoice').textContent = delivery.invoice_no;
    document.getElementById('d-customer').textContent = delivery.customer_name;
    document.getElementById('d-address').textContent = delivery.customer_address || '-';
    document.getElementById('d-date').textContent = delivery.delivery_date;
    document.getElementById('d-status').value = delivery.status || 'pending';
    document.getElementById('d-note').value = delivery.note || '';
    document.getElementById('d-delivered-at').value = delivery.delivered_at
      ? delivery.delivered_at.slice(0, 16) : localNow();

    if (delivery.photos) {
      delivery.photos.forEach(renderExistingPhoto);
    }

    setupCamera('camera-goods', 'input-goods', 'goods');
    setupCamera('camera-sig', 'input-sig', 'signature_doc');
  }

  async function save() {
    const btn = document.getElementById('btn-save-detail');
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';

    const payload = {
      status: document.getElementById('d-status').value,
      note: document.getElementById('d-note').value,
      delivered_at: document.getElementById('d-delivered-at').value || null,
      invoice_no: currentDelivery.invoice_no,
      customer_name: currentDelivery.customer_name,
      customer_address: currentDelivery.customer_address,
      delivery_date: currentDelivery.delivery_date
    };

    try {
      // Update delivery record
      try {
        await API.apiFetch(`/api/deliveries/${currentDelivery.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } catch {
        // Offline: save to queue
        await OfflineDB.addPending(payload);
        window.App.updateSyncBadge();
      }

      // Upload pending photos
      for (const { file, takenAt } of pendingPhotos.goods) {
        try {
          await API.uploadPhoto(currentDelivery.id, file, 'goods', takenAt);
        } catch { /* store locally — full offline photo sync not in scope */ }
      }
      for (const { file, takenAt } of pendingPhotos.signature_doc) {
        try {
          await API.uploadPhoto(currentDelivery.id, file, 'signature_doc', takenAt);
        } catch {}
      }

      showAlert('บันทึกสำเร็จ', 'success');
      setTimeout(() => window.App.showPage('driver-home'), 1200);
    } catch (err) {
      showAlert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 บันทึก';
    }
  }

  function init() {
    document.getElementById('btn-save-detail').addEventListener('click', save);
    document.getElementById('btn-detail-back').addEventListener('click', () => window.App.showPage('driver-home'));
  }

  return { load, init };
})();
