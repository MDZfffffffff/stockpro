// API wrapper with offline queue support
const API_BASE = '';

function getToken() { return localStorage.getItem('as_token'); }
function setToken(t) { localStorage.setItem('as_token', t); }
function clearToken() { localStorage.removeItem('as_token'); localStorage.removeItem('as_user'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.App && window.App.showPage('login');
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function uploadPhoto(deliveryId, file, photoType, takenAt) {
  const token = getToken();
  const form = new FormData();

  // Compress image before upload
  const compressed = await compressImage(file, 1200, 0.8);
  form.append('photo', compressed, file.name);
  form.append('photo_type', photoType);
  if (takenAt) form.append('taken_at', takenAt);

  const res = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/photos`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function compressImage(file, maxDim, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function syncPending() {
  const pending = await OfflineDB.getAllPending();
  if (pending.length === 0) return;

  try {
    const records = pending.map(({ localId: _l, _ts: _t, ...rest }) => rest);
    await apiFetch('/api/sync', { method: 'POST', body: JSON.stringify({ records }) });
    await OfflineDB.clearPending(pending.map(p => p.localId));
    window.App && window.App.updateSyncBadge();
  } catch (e) {
    console.warn('Sync failed:', e.message);
  }
}

window.API = { apiFetch, uploadPhoto, getToken, setToken, clearToken, syncPending };
