const state = {
  apiUrl: resolveApiUrl(),
  apiResolved: false,
  token: sessionStorage.getItem('gs_admin_token') || '',
  riders: [],
  selectedRiderId: null,
  selectedRiderDetails: null,
  activeReference: '',
  chatPollTimer: null,
  dashboardPollTimer: null,
  socket: null,
  joinedReference: '',
  unreadByRider: new Map()
};

const el = {
  loginCard: document.getElementById('loginCard'),
  dashboard: document.getElementById('dashboardLayout'),
  statsRow: document.getElementById('statsRow'),
  loginBtn: document.getElementById('loginBtn'),
  loginError: document.getElementById('loginError'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  refreshBtn: document.getElementById('refreshBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  riderSearch: document.getElementById('riderSearch'),
  riderList: document.getElementById('riderList'),
  riderDetails: document.getElementById('riderDetails'),
  selectedStatus: document.getElementById('selectedStatus'),
  chatTitle: document.getElementById('chatTitle'),
  chatHint: document.getElementById('chatHint'),
  chatMessages: document.getElementById('chatMessages'),
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),
  socketDot: document.getElementById('socketDot'),
  socketLabel: document.getElementById('socketLabel'),
  statOrders: document.getElementById('statOrders'),
  statRevenue: document.getElementById('statRevenue'),
  statRiders: document.getElementById('statRiders'),
  statPending: document.getElementById('statPending'),
  statProducts: document.getElementById('statProducts')
};

function resolveApiUrl() {
  const candidates = getApiCandidates();
  return candidates[0] || 'http://localhost:5001/api';
}

function normalizeApiBase(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  const clean = raw.replace(/\/+$/, '');
  return /\/api$/i.test(clean) ? clean : `${clean}/api`;
}

function getApiCandidates() {
  const stored = normalizeApiBase(localStorage.getItem('gs_api_url'));
  const originApi = window.location.origin && /^https?:/i.test(window.location.origin)
    ? normalizeApiBase(window.location.origin)
    : null;

  const list = [
    stored,
    originApi,
    'http://localhost:5500/api',
    'http://localhost:5001/api',
    'http://localhost:5000/api',
    'https://global-sports-backend.onrender.com/api'
  ].filter(Boolean);

  return [...new Set(list)];
}

async function ensureApiResolved() {
  if (state.apiResolved) return;

  const candidates = getApiCandidates();
  for (const candidate of candidates) {
    const apiBase = normalizeApiBase(candidate);
    const originBase = apiBase.replace(/\/api$/i, '');
    try {
      let response = await fetch(`${apiBase}/health`, { method: 'GET' });
      if (!response.ok) {
        response = await fetch(`${originBase}/health`, { method: 'GET' });
      }

      if (response.ok) {
        state.apiUrl = apiBase;
        state.apiResolved = true;
        localStorage.setItem('gs_api_url', apiBase);
        return;
      }
    } catch {
      // Try next candidate.
    }
  }

  // Fall back to first candidate if health checks are unavailable.
  state.apiUrl = normalizeApiBase(candidates[0]) || state.apiUrl;
  localStorage.setItem('gs_api_url', state.apiUrl);
  state.apiResolved = true;
}

function getSocketBase() {
  return state.apiUrl.replace(/\/api\/?$/i, '');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeArrayPayload(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  if (payload.data && Array.isArray(payload.data)) return payload.data;
  if (payload.result && Array.isArray(payload.result)) return payload.result;
  return [];
}

function normalizeObjectPayload(payload, keys = []) {
  if (!payload || typeof payload !== 'object') return null;
  for (const key of keys) {
    if (payload[key] && typeof payload[key] === 'object') return payload[key];
  }
  if (payload.data && typeof payload.data === 'object') return payload.data;
  if (payload.result && typeof payload.result === 'object') return payload.result;
  return payload;
}

function normalizeRidersResponse(payload) {
  const list = normalizeArrayPayload(payload, ['riders', 'items', 'records']);
  return list.filter((item) => item && (item._id || item.id));
}

function normalizeRiderDetailsResponse(payload) {
  const details = normalizeObjectPayload(payload, ['rider', 'details']);
  if (!details) return null;
  return details.rider && typeof details.rider === 'object' ? details.rider : details;
}

function normalizeStatsResponse(payload) {
  const stats = normalizeObjectPayload(payload, ['stats']) || {};
  return {
    totalOrders: Number(stats.totalOrders || stats.orders || 0),
    totalRevenue: Number(stats.totalRevenue || stats.revenue || 0),
    totalRiders: Number(stats.totalRiders || stats.riders || 0),
    pendingRiders: Number(stats.pendingRiders || stats.pending || 0),
    totalProducts: Number(stats.totalProducts || stats.products || 0)
  };
}

function normalizeMessagesResponse(payload) {
  const list = normalizeArrayPayload(payload, ['messages', 'items']);
  const normalized = list
    .map((message) => ({
      id: message.id || message._id || `${message.createdAt || ''}-${message.senderRole || ''}-${message.text || ''}`,
      senderRole: String(message.senderRole || message.role || '').toLowerCase(),
      senderName: message.senderName || message.name || 'Unknown',
      text: String(message.text || message.message || ''),
      createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
      reference: message.reference || ''
    }))
    .filter((message) => message.text.trim().length > 0);

  normalized.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const unique = [];
  const seen = new Set();
  for (const message of normalized) {
    const key = `${message.id}|${message.senderRole}|${message.text}|${message.createdAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(message);
  }
  return unique;
}

function normalizeSendMessageResponse(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const message = payload.chatMessage || payload.message || payload.data || payload.result;
  if (!message || typeof message !== 'object') return null;
  return {
    id: message.id || message._id || `${Date.now()}-${Math.random()}`,
    senderRole: String(message.senderRole || message.role || 'admin').toLowerCase(),
    senderName: message.senderName || message.name || 'Admin',
    text: String(message.text || message.message || ''),
    createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
    reference: message.reference || state.activeReference
  };
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-GH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function statusClass(status) {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

async function apiFetch(path, options = {}, useAuth = true) {
  await ensureApiResolved();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (useAuth && state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${state.apiUrl}${path}`, { ...options, headers });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const plain = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    data = { message: plain || 'Invalid response' };
  }
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function setConnected(connected) {
  el.socketDot.classList.toggle('connected', !!connected);
  el.socketLabel.textContent = connected ? 'Realtime online' : 'Realtime offline';
  if (!connected && state.activeReference) {
    el.chatHint.textContent = 'Realtime offline - using auto-refresh fallback';
  }
}

function stopChatPolling() {
  if (state.chatPollTimer) {
    clearInterval(state.chatPollTimer);
    state.chatPollTimer = null;
  }
}

function startChatPolling(reference) {
  stopChatPolling();
  if (!reference) return;
  state.chatPollTimer = setInterval(() => {
    if (state.activeReference !== reference) return;
    loadChatHistory(reference).catch(() => {});
  }, 4000);
}

function showLogin(show) {
  el.loginCard.classList.toggle('visible', !!show);
  el.dashboard.classList.toggle('visible', !show);
  el.statsRow.style.display = show ? 'none' : 'grid';
}

function parseRiderIdFromReference(reference) {
  const match = String(reference || '').match(/^rider:(.+)$/i);
  return match ? match[1] : '';
}

function riderKey(rider) {
  if (!rider || typeof rider !== 'object') return '';
  return String(rider._id || rider.id || '');
}

function renderRiderList() {
  const search = String(el.riderSearch.value || '').trim().toLowerCase();
  const riders = state.riders.filter((rider) => {
    if (!search) return true;
    const hay = `${rider.fullName || ''} ${rider.phone || ''} ${rider.ghanaCardId || ''} ${rider.vehicleLicenseId || ''}`.toLowerCase();
    return hay.includes(search);
  });

  if (!riders.length) {
    el.riderList.innerHTML = '<div class="empty">No riders match this search.</div>';
    return;
  }

  el.riderList.innerHTML = riders.map((rider) => {
    const id = riderKey(rider);
    const unread = Number(state.unreadByRider.get(id) || 0);
    const active = state.selectedRiderId === id ? 'active' : '';
    return `
      <article class="rider-card ${active}">
        <div class="rider-head">
          <div>
            <div class="rider-name">${escapeHtml(rider.fullName)}</div>
            <div class="rider-phone">${escapeHtml(rider.phone || 'No phone')}</div>
          </div>
          <span class="pill ${statusClass(rider.status)}">${escapeHtml(rider.status || 'pending')}</span>
        </div>
        <div class="rider-meta">
          <span>Card: ${escapeHtml(rider.ghanaCardId || 'N/A')}</span>
          <span>License: ${escapeHtml(rider.vehicleLicenseId || 'N/A')}</span>
          <span>Available: ${rider.isAvailable ? 'Yes' : 'No'}</span>
        </div>
        <div class="rider-actions">
          <button class="btn tiny" data-action="view" data-id="${escapeHtml(id)}">View</button>
          <button class="btn tiny" data-action="approve" data-id="${escapeHtml(id)}">Approve</button>
          <button class="btn tiny danger" data-action="reject" data-id="${escapeHtml(id)}">Reject</button>
          <button class="btn tiny primary" data-action="chat" data-id="${escapeHtml(id)}">💬 Chat${unread ? ` <span class="counter">${unread}</span>` : ''}</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderRiderDetails(details) {
  if (!details) {
    el.selectedStatus.textContent = 'No rider selected';
    el.riderDetails.innerHTML = '<div class="empty">Select a rider and click View to load complete registration details.</div>';
    return;
  }

  const status = details.status || 'pending';
  el.selectedStatus.textContent = `Status: ${status}`;
  el.riderDetails.innerHTML = `
    <div class="kv"><span>Rider ID</span><strong>${escapeHtml(details._id || details.id || 'N/A')}</strong></div>
    <div class="kv"><span>Full Name</span><strong>${escapeHtml(details.fullName || 'N/A')}</strong></div>
    <div class="kv"><span>Phone</span><strong>${escapeHtml(details.phone || 'N/A')}</strong></div>
    <div class="kv"><span>Ghana Card ID</span><strong>${escapeHtml(details.ghanaCardId || 'N/A')}</strong></div>
    <div class="kv"><span>Vehicle License</span><strong>${escapeHtml(details.vehicleLicenseId || 'N/A')}</strong></div>
    <div class="kv"><span>Approval Status</span><strong>${escapeHtml(status)}</strong></div>
    <div class="kv"><span>Availability</span><strong>${details.isAvailable ? 'Available' : 'Offline'}</strong></div>
    <div class="kv"><span>Registered At</span><strong>${escapeHtml(formatDate(details.createdAt))}</strong></div>
    <div class="kv"><span>Updated At</span><strong>${escapeHtml(formatDate(details.updatedAt))}</strong></div>
  `;
}

function renderChatMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) {
    el.chatMessages.innerHTML = '<div class="empty">No chat yet with this rider. Send a message to start.</div>';
    return;
  }

  el.chatMessages.innerHTML = messages.map((message) => {
    const role = message.senderRole === 'admin' ? 'admin' : 'rider';
    return `
      <article class="msg ${role}">
        <div class="msg-meta">${escapeHtml(message.senderName || role)} • ${escapeHtml(formatDate(message.createdAt))}</div>
        <div>${escapeHtml(message.text || '')}</div>
      </article>
    `;
  }).join('');
  el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
}

async function loadDashboardStats() {
  const payload = await apiFetch('/admin/dashboard/stats');
  const stats = normalizeStatsResponse(payload);
  el.statOrders.textContent = stats.totalOrders.toLocaleString('en-GH');
  el.statRevenue.textContent = `GHS ${stats.totalRevenue.toFixed(2)}`;
  el.statRiders.textContent = stats.totalRiders.toLocaleString('en-GH');
  el.statPending.textContent = stats.pendingRiders.toLocaleString('en-GH');
  el.statProducts.textContent = stats.totalProducts.toLocaleString('en-GH');
}

async function loadRiders() {
  const payload = await apiFetch('/admin/riders');
  state.riders = normalizeRidersResponse(payload);
  if (state.selectedRiderId && !state.riders.some((item) => riderKey(item) === String(state.selectedRiderId))) {
    state.selectedRiderId = null;
    state.selectedRiderDetails = null;
  }
  renderRiderList();
}

async function selectRider(riderId) {
  if (!riderId) return;
  state.selectedRiderId = riderId;
  state.unreadByRider.set(riderId, 0);
  renderRiderList();

  const encodedId = encodeURIComponent(riderId);
  let details = state.riders.find((item) => riderKey(item) === String(riderId)) || null;
  try {
    const freshPayload = await apiFetch(`/admin/riders/${encodedId}`);
    const freshDetails = normalizeRiderDetailsResponse(freshPayload);
    details = freshDetails || details;
  } catch (err) {
    // Keep using the rider object from list if details endpoint is unavailable.
  }
  state.selectedRiderDetails = normalizeRiderDetailsResponse(details) || details || null;
  renderRiderDetails(state.selectedRiderDetails);
}

async function updateRiderStatus(riderId, status) {
  const encodedId = encodeURIComponent(riderId);
  let updated = false;
  try {
    await apiFetch(`/admin/riders/${encodedId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    updated = true;
  } catch {
    try {
      await apiFetch(`/riders/${encodedId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      updated = true;
    } catch {
      await apiFetch(`/admin/riders/${encodedId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      updated = true;
    }
  }
  if (!updated) throw new Error('Unable to update rider status on this backend');

  await Promise.all([loadRiders(), loadDashboardStats()]);
  if (state.selectedRiderId === riderId) {
    await selectRider(riderId);
  }
}

async function openRiderChat(riderId) {
  if (!riderId) return;
  const rider = state.riders.find((item) => riderKey(item) === String(riderId));
  state.activeReference = `rider:${riderId}`;
  state.joinedReference = '';
  state.unreadByRider.set(riderId, 0);
  renderRiderList();

  el.chatTitle.textContent = rider ? `Chat with ${rider.fullName}` : 'Direct Rider Chat';
  el.chatHint.textContent = 'Messages sync in real time when rider is online';
  el.sendBtn.disabled = false;

  await selectRider(riderId);
  await loadChatHistory(state.activeReference);
  joinChatRoom(state.activeReference);
  startChatPolling(state.activeReference);
}

async function loadChatHistory(reference) {
  const params = new URLSearchParams({ role: 'admin', token: state.token });
  const data = await apiFetch(`/chat/${encodeURIComponent(reference)}/messages?${params.toString()}`, {}, false);
  renderChatMessages(normalizeMessagesResponse(data));
}

function joinChatRoom(reference) {
  if (!state.socket || !state.socket.connected || !reference) return;

  state.socket.emit('chat:join', {
    reference,
    role: 'admin',
    token: state.token,
    name: 'Admin'
  }, (ack) => {
    if (ack && ack.ok) {
      state.joinedReference = reference;
    }
  });
}

async function sendChatMessage() {
  const text = String(el.chatInput.value || '').trim();
  if (!text || !state.activeReference) return;

  el.sendBtn.disabled = true;
  const payload = {
    reference: state.activeReference,
    senderRole: 'admin',
    token: state.token,
    text,
    senderName: 'Admin'
  };

  try {
    if (state.socket && state.socket.connected && state.joinedReference === state.activeReference) {
      await new Promise((resolve, reject) => {
        state.socket.emit('chat:message', payload, (ack) => {
          if (ack && ack.ok) resolve(ack.message);
          else reject(new Error(ack?.message || 'Realtime send failed'));
        });
      });
    } else {
      const response = await apiFetch(`/chat/${encodeURIComponent(state.activeReference)}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false);
      normalizeSendMessageResponse(response);
    }

    el.chatInput.value = '';
    await loadChatHistory(state.activeReference);
  } catch (err) {
    alert(err.message || 'Failed to send message');
  } finally {
    el.sendBtn.disabled = false;
  }
}

function handleIncomingMessage(message) {
  if (!message || !message.reference) return;
  const riderId = parseRiderIdFromReference(message.reference);
  if (!riderId) return;

  if (state.activeReference === message.reference) {
    loadChatHistory(message.reference).catch(() => {});
    return;
  }

  const currentCount = Number(state.unreadByRider.get(riderId) || 0);
  state.unreadByRider.set(riderId, currentCount + 1);
  renderRiderList();
}

function startDashboardPolling() {
  if (state.dashboardPollTimer) return;
  state.dashboardPollTimer = setInterval(async () => {
    if (!state.token) return;
    try {
      await Promise.all([loadDashboardStats(), loadRiders()]);
      if (state.selectedRiderId) {
        const stillExists = state.riders.some((item) => riderKey(item) === String(state.selectedRiderId));
        if (stillExists) {
          const details = state.riders.find((item) => riderKey(item) === String(state.selectedRiderId)) || state.selectedRiderDetails;
          if (details) {
            state.selectedRiderDetails = details;
            renderRiderDetails(details);
          }
        }
      }
    } catch {
      // Keep UI state and retry on next interval.
    }
  }, 8000);
}

function stopDashboardPolling() {
  if (state.dashboardPollTimer) {
    clearInterval(state.dashboardPollTimer);
    state.dashboardPollTimer = null;
  }
}

function connectSocket() {
  if (typeof io === 'undefined') {
    setConnected(false);
    return;
  }

  state.socket = io(getSocketBase(), {
    transports: ['websocket', 'polling'],
    reconnection: true,
    timeout: 8000
  });

  state.socket.on('connect', () => {
    setConnected(true);
    el.chatHint.textContent = state.activeReference
      ? 'Messages sync in real time when rider is online'
      : 'Select a rider to open live chat';
    if (state.activeReference) joinChatRoom(state.activeReference);
  });

  state.socket.on('disconnect', () => setConnected(false));
  state.socket.on('chat:message', handleIncomingMessage);
  state.socket.on('chat:history', (payload) => {
    if (!payload || payload.reference !== state.activeReference) return;
    renderChatMessages(normalizeMessagesResponse(payload));
  });
}

async function doLogin() {
  el.loginError.textContent = '';
  const username = String(el.username.value || '').trim();
  const password = String(el.password.value || '').trim();

  if (!username || !password) {
    el.loginError.textContent = 'Enter username and password.';
    return;
  }

  el.loginBtn.disabled = true;
  try {
    await ensureApiResolved();
    const data = await apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }, false);

    state.token = data.token;
    sessionStorage.setItem('gs_admin_token', state.token);
    localStorage.removeItem('gs_admin_token');
    showLogin(false);
    connectSocket();
    await Promise.all([loadDashboardStats(), loadRiders()]);
    startDashboardPolling();
  } catch (err) {
    el.loginError.textContent = err.message || 'Login failed';
  } finally {
    el.loginBtn.disabled = false;
  }
}

async function bootstrapAfterToken() {
  if (!state.token) {
    showLogin(true);
    return;
  }

  showLogin(false);
  await ensureApiResolved();
  connectSocket();

  try {
    await Promise.all([loadDashboardStats(), loadRiders()]);
    startDashboardPolling();
  } catch (err) {
    sessionStorage.removeItem('gs_admin_token');
    localStorage.removeItem('gs_admin_token');
    state.token = '';
    setConnected(false);
    showLogin(true);
    el.loginError.textContent = 'Session expired. Please login again.';
  }
}

function bindEvents() {
  el.loginBtn.addEventListener('click', doLogin);
  el.password.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') doLogin();
  });

  el.refreshBtn.addEventListener('click', async () => {
    if (!state.token) return;
    await Promise.all([loadDashboardStats(), loadRiders()]);
    if (state.selectedRiderId) await selectRider(state.selectedRiderId);
    if (state.activeReference) await loadChatHistory(state.activeReference);
  });

  el.logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('gs_admin_token');
    localStorage.removeItem('gs_admin_token');
    state.token = '';
    state.riders = [];
    state.selectedRiderId = null;
    state.selectedRiderDetails = null;
    state.activeReference = '';
    stopChatPolling();
    stopDashboardPolling();
    state.joinedReference = '';
    state.unreadByRider.clear();
    if (state.socket) {
      state.socket.disconnect();
      state.socket = null;
    }
    setConnected(false);
    renderRiderList();
    renderRiderDetails(null);
    renderChatMessages([]);
    el.sendBtn.disabled = true;
    showLogin(true);
  });

  el.riderSearch.addEventListener('input', renderRiderList);

  el.riderList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const riderId = button.getAttribute('data-id');
    if (!action || !riderId) return;

    button.disabled = true;
    try {
      if (action === 'view') await selectRider(riderId);
      if (action === 'approve') await updateRiderStatus(riderId, 'approved');
      if (action === 'reject') await updateRiderStatus(riderId, 'rejected');
      if (action === 'chat') await openRiderChat(riderId);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      button.disabled = false;
    }
  });

  el.sendBtn.addEventListener('click', sendChatMessage);
  el.chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  });
}

bindEvents();
// Zero-trust: never trust persisted admin tokens across browser restarts.
localStorage.removeItem('gs_admin_token');
bootstrapAfterToken();
