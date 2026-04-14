function normalizeApiBaseUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

function getQueryApiOverride() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('api') || '';
  } catch (err) {
    return '';
  }
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function getDefaultApiBaseUrl() {
  const host = String(window.location.hostname || '').toLowerCase();
  if (isLocalHost(host)) {
    return 'http://localhost:5001';
  }

  return 'https://global-sports-backend.onrender.com';
}

function getApiCandidates() {
  const queryOverride = normalizeApiBaseUrl(getQueryApiOverride());
  const storedBaseUrl = normalizeApiBaseUrl(localStorage.getItem('adminApiUrl') || '');
  const sameOriginBase = /^https?:/i.test(String(window.location.origin || ''))
    ? normalizeApiBaseUrl(window.location.origin)
    : '';
  const defaultBaseUrl = normalizeApiBaseUrl(getDefaultApiBaseUrl());
  const localHostBases = isLocalHost(String(window.location.hostname || '').toLowerCase())
    ? ['http://localhost:5001', 'http://localhost:5000']
    : [];

  return [
    queryOverride,
    storedBaseUrl,
    sameOriginBase,
    ...localHostBases,
    defaultBaseUrl,
    'https://global-sports-backend.onrender.com'
  ].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);
}

let activeApiBaseUrl = normalizeApiBaseUrl(
  getQueryApiOverride() ||
  localStorage.getItem('adminApiUrl') ||
  getDefaultApiBaseUrl()
);
let apiDiscoveryComplete = false;

function resolveApiBaseUrl() {
  const queryOverride = normalizeApiBaseUrl(getQueryApiOverride());

  if (queryOverride) {
    localStorage.setItem('adminApiUrl', queryOverride);
    activeApiBaseUrl = queryOverride;
    return activeApiBaseUrl;
  }

  const defaultBaseUrl = normalizeApiBaseUrl(getDefaultApiBaseUrl());
  const storedBaseUrl = normalizeApiBaseUrl(localStorage.getItem('adminApiUrl') || '');

  if (isLocalHost(String(window.location.hostname || '').toLowerCase())) {
    if (storedBaseUrl && storedBaseUrl !== defaultBaseUrl) {
      localStorage.setItem('adminApiUrl', defaultBaseUrl);
    }
    activeApiBaseUrl = defaultBaseUrl;
    return activeApiBaseUrl;
  }

  activeApiBaseUrl = normalizeApiBaseUrl(
    window.ADMIN_API_URL ||
    storedBaseUrl ||
    defaultBaseUrl
  );
  return activeApiBaseUrl;
}

const API_URL = resolveApiBaseUrl();

async function probeApiBaseUrl(baseUrl) {
  const normalized = normalizeApiBaseUrl(baseUrl);
  if (!normalized) return null;

  const candidates = [`${normalized}/health`, `${normalized}/api/health`, `${normalized}/ping`];
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { method: 'GET' });
      if (response.ok) {
        return normalized;
      }
    } catch {
      // Try next probe URL.
    }
  }

  return null;
}

async function ensureApiResolved(force = false) {
  if (apiDiscoveryComplete && !force && activeApiBaseUrl) {
    return activeApiBaseUrl;
  }

  const candidates = getApiCandidates();
  for (const candidate of candidates) {
    const discovered = await probeApiBaseUrl(candidate);
    if (discovered) {
      activeApiBaseUrl = discovered;
      apiDiscoveryComplete = true;
      localStorage.setItem('adminApiUrl', discovered);
      apiEndpointEl.textContent = discovered;
      return discovered;
    }
  }

  apiDiscoveryComplete = true;
  activeApiBaseUrl = normalizeApiBaseUrl(API_URL);
  apiEndpointEl.textContent = activeApiBaseUrl || API_URL;
  return activeApiBaseUrl;
}

// Debug logging
console.log('🔧 Admin Dashboard Initialized');
console.log('📡 API URL:', API_URL);
console.log('🌐 Backend Base:', activeApiBaseUrl || API_URL);

function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = activeApiBaseUrl || API_URL;
  return `${base}${normalizedPath}`;
}

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const totalOrdersEl = document.getElementById('total-orders');
const totalProductsEl = document.getElementById('total-products');
const totalRidersEl = document.getElementById('total-riders');
const pendingRidersEl = document.getElementById('pending-riders');
const totalRevenueEl = document.getElementById('total-revenue');
const apiEndpointEl = document.getElementById('api-endpoint');
const apiHealthEl = document.getElementById('api-health');
const lastSyncEl = document.getElementById('last-sync');

const manageProductsBtn = document.getElementById('manage-products-btn');
const manageRidersBtn = document.getElementById('manage-riders-btn');
const manageOrdersBtn = document.getElementById('manage-orders-btn');
const managementPanel = document.getElementById('management-panel');
const managementTitle = document.getElementById('management-title');
const managementMessage = document.getElementById('management-message');
const managementTableHead = document.getElementById('management-table-head');
const managementTableBody = document.getElementById('management-table-body');
const closePanelBtn = document.getElementById('close-panel-btn');
const refreshPanelBtn = document.getElementById('refresh-panel-btn');
const managementSearch = document.getElementById('management-search');
const addItemBtn = document.getElementById('add-item-btn');
const columnsBtn = document.getElementById('columns-btn');
const columnMenu = document.getElementById('column-menu');
const orderFilterBar = document.getElementById('order-filter-bar');
const bulkActions = document.getElementById('bulk-actions');
const selectedCount = document.getElementById('selected-count');
const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
const bulkStatusSelect = document.getElementById('bulk-status-select');
const bulkStatusBtn = document.getElementById('bulk-status-btn');
const pagination = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const paginationInfo = document.getElementById('pagination-info');
const auditLogList = document.getElementById('audit-log-list');
const globalNotice = document.getElementById('global-notice');
const globalNoticeText = document.getElementById('global-notice-text');
const globalNoticeClose = document.getElementById('global-notice-close');

const editorModal = document.getElementById('editor-modal');
const editorTitle = document.getElementById('editor-title');
const editorForm = document.getElementById('editor-form');
const editorError = document.getElementById('editor-error');
const closeEditorBtn = document.getElementById('close-editor-btn');
const cancelEditorBtn = document.getElementById('cancel-editor-btn');
const saveEditorBtn = document.getElementById('save-editor-btn');
const imagePreviewWrap = document.getElementById('image-preview-wrap');
const imagePreview = document.getElementById('image-preview');

const state = {
  entity: null,
  records: [],
  filteredRecords: [],
  selectedIds: new Set(),
  expandedIds: new Set(),
  page: 1,
  pageSize: 10,
  totalPages: 1,
  editMode: null,
  editTarget: null,
  isPanelBusy: false,
  isEditorBusy: false,
  isLoginBusy: false,
  resizeTimer: null,
  lastFocusedElement: null,
  orderFilter: 'all',
  auditLogs: []
};

const entityConfigs = {
  products: {
    title: 'Products',
    searchKeys: ['name', 'category', 'description'],
    listPaths: ['/api/admin/products', '/api/products'],
    createPaths: ['/api/admin/products', '/api/products'],
    updatePaths: (id) => [`/api/admin/products/${id}`, `/api/products/${id}`],
    deletePaths: (id) => [`/api/admin/products/${id}`, `/api/products/${id}`],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      {
        key: 'image',
        label: 'Image',
        render: (p) => productImageCell(p.image, p.name)
      },
      {
        key: 'name',
        label: 'Name',
        render: (p) => escapeHtml(p.name || '-')
      },
      {
        key: 'category',
        label: 'Category',
        render: (p) => escapeHtml(p.category || '-')
      },
      {
        key: 'price',
        label: 'Price (GHS)',
        render: (p) => escapeHtml(Number(p.price || 0).toFixed(2))
      },
      {
        key: 'stock',
        label: 'Stock',
        render: (p) => escapeHtml(p.stock ?? '-')
      }
    ],
    fields: [
      { key: 'name', label: 'Product Name', type: 'text', required: true },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: ['Football', 'Running', 'Gym', 'Boxing', 'Yoga', 'Accessories'],
        required: true
      },
      { key: 'price', label: 'Price (GHS)', type: 'number', required: true },
      { key: 'stock', label: 'Stock', type: 'number', required: true },
      {
        key: 'sizeType',
        label: 'Size Type',
        type: 'select',
        options: ['none', 'clothing', 'footwear', 'custom'],
        required: true
      },
      {
        key: 'customSizes',
        label: 'Custom Sizes (comma separated)',
        type: 'text',
        full: true
      },
      { key: 'image', label: 'Image URL', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', full: true }
    ]
  },
  riders: {
    title: 'Riders',
    searchKeys: ['fullName', 'name', 'phone', 'status', 'vehicleType', 'user.fullName', 'user.phone'],
    listPaths: [
      '/api/admin/riders',
      '/api/riders',
      '/api/rider-applications',
      '/api/admin/rider-applications',
      '/api/admin/riders/all'
    ],
    createPaths: ['/api/admin/riders', '/api/riders'],
    updatePaths: (id) => [
      `/api/admin/riders/${id}/status`,
      `/api/admin/riders/${id}`,
      `/api/riders/${id}/status`,
      `/api/riders/${id}`
    ],
    deletePaths: (id) => [`/api/admin/riders/${id}`, `/api/riders/${id}`],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      {
        key: 'fullName',
        label: 'Full Name',
        render: (r) => escapeHtml(r.fullName || r.name || r.user?.fullName || '-')
      },
      {
        key: 'phone',
        label: 'Phone',
        render: (r) => escapeHtml(r.phone || r.user?.phone || '-')
      },
      {
        key: 'vehicleType',
        label: 'Vehicle',
        render: (r) => escapeHtml(r.vehicleType || r.bikeType || r.vehicle || '-')
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => statusBadge(r.status)
      },
      {
        key: 'available',
        label: 'Available',
        render: (r) => escapeHtml(r.isAvailable ? 'Yes' : 'No')
      }
    ],
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text', required: true },
      { key: 'vehicleType', label: 'Vehicle Type', type: 'text' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: ['pending', 'approved', 'rejected'],
        required: true
      },
      { key: 'isAvailable', label: 'Available for deliveries', type: 'checkbox' }
    ]
  },
  orders: {
    title: 'Orders',
    searchKeys: ['reference', 'status', 'customer.name', 'customer.phone'],
    listPaths: ['/api/orders'],
    updatePaths: (id) => [`/api/admin/orders/${id}`, `/api/orders/${id}`],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    columns: [
      {
        key: 'reference',
        label: 'Reference',
        render: (o) => escapeHtml(o.reference || '-')
      },
      {
        key: 'customer',
        label: 'Customer',
        render: (o) => escapeHtml(o.customer?.name || '-')
      },
      {
        key: 'details',
        label: 'Details',
        render: (o) => orderDetailsCell(o)
      },
      {
        key: 'amount',
        label: 'Amount (GHS)',
        render: (o) => escapeHtml(Number(o.amount || 0).toFixed(2))
      },
      {
        key: 'status',
        label: 'Status',
        render: (o) => statusBadge(o.status)
      },
      {
        key: 'date',
        label: 'Date',
        render: (o) => escapeHtml(formatDateSafe(o.date))
      }
    ],
    fields: [
      {
        key: 'status',
        label: 'Order Status',
        type: 'select',
        options: ['pending', 'assigned', 'paid', 'delivered', 'cancelled'],
        required: true
      }
    ]
  }
};

function loadAuditLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem('adminAuditLogs') || '[]');
    state.auditLogs = Array.isArray(logs) ? logs : [];
  } catch (err) {
    state.auditLogs = [];
  }

  renderAuditLogs();
}

function addAuditLog(action, entityKey, details) {
  const entityLabel = entityConfigs[entityKey]?.title || entityKey;
  const entry = {
    message: `${new Date().toLocaleString()} | ${action} | ${entityLabel} | ${details}`
  };

  state.auditLogs.unshift(entry);
  state.auditLogs = state.auditLogs.slice(0, 30);
  localStorage.setItem('adminAuditLogs', JSON.stringify(state.auditLogs));
  renderAuditLogs();
}

function renderAuditLogs() {
  if (!auditLogList) return;

  if (!state.auditLogs.length) {
    auditLogList.innerHTML = '<li>No activity yet.</li>';
    return;
  }

  auditLogList.innerHTML = state.auditLogs
    .map((entry) => `<li>${escapeHtml(entry.message)}</li>`)
    .join('');
}

function showLogin() {
  loginSection.style.display = 'flex';
  dashboardSection.style.display = 'none';
  closeColumnMenu();
}

function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
}

function getAuthToken() {
  return sessionStorage.getItem('adminToken') || '';
}

function setAuthToken(token) {
  if (!token) return;
  sessionStorage.setItem('adminToken', String(token));
  // Prevent silent re-login from stale persistent tokens.
  localStorage.removeItem('adminToken');
}

function clearAuthToken() {
  sessionStorage.removeItem('adminToken');
  localStorage.removeItem('adminToken');
}

async function validateAdminSession(token) {
  if (!token) return false;

  try {
    await ensureApiResolved();
    const response = await fetch(apiUrl('/api/admin/dashboard/stats'), {
      method: 'GET',
      headers: authHeaders(token)
    });
    return response.ok;
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function authHeaders(token, contentType = true) {
  const headers = {
    Authorization: `Bearer ${token}`
  };

  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function getItemId(item) {
  return (
    item?._id ||
    item?.id ||
    item?.riderId ||
    item?.orderId ||
    item?.applicationId ||
    item?.userId ||
    item?.user?._id ||
    item?.reference ||
    null
  );
}

function normalizeIdValue(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
  }
  return '';
}

function getRiderActionId(rider) {
  const preferred =
    normalizeIdValue(rider?.riderId) ||
    normalizeIdValue(rider?.rider?._id) ||
    normalizeIdValue(rider?._id) ||
    normalizeIdValue(rider?.id) ||
    normalizeIdValue(rider?.user?._id);
  return preferred || '';
}

function normalizeRecords(entityKey, rawRecords) {
  if (!Array.isArray(rawRecords)) return [];

  if (entityKey !== 'riders') {
    return rawRecords;
  }

  return rawRecords.map((rider) => ({
    ...rider,
    _id: getRiderActionId(rider) || getItemId(rider),
    fullName: rider.fullName || rider.name || rider.user?.fullName || '',
    phone: rider.phone || rider.user?.phone || '',
    vehicleType: rider.vehicleType || rider.bikeType || rider.vehicle || '',
    status: rider.status || rider.approvalStatus || 'pending',
    isAvailable: typeof rider.isAvailable === 'boolean' ? rider.isAvailable : Boolean(rider.available)
  }));
}

function storageKeyForVisibleColumns(entityKey) {
  return `adminVisibleColumns:${entityKey}`;
}

function storageKeyForOrderFilter() {
  return 'adminOrderFilter';
}

function getDefaultVisibleColumns(entityKey) {
  const config = entityConfigs[entityKey];
  if (!config) return [];
  return config.columns.map((column) => column.key).filter(Boolean);
}

function getVisibleColumns(entityKey) {
  const config = entityConfigs[entityKey];
  if (!config) return [];

  try {
    const saved = JSON.parse(localStorage.getItem(storageKeyForVisibleColumns(entityKey)) || 'null');
    if (Array.isArray(saved) && saved.length) {
      const allowed = new Set(config.columns.map((column) => column.key));
      return saved.filter((key) => allowed.has(key));
    }
  } catch (err) {
    // ignore malformed preferences
  }

  return getDefaultVisibleColumns(entityKey);
}

function saveVisibleColumns(entityKey, keys) {
  localStorage.setItem(storageKeyForVisibleColumns(entityKey), JSON.stringify(keys));
}

function getEnabledColumns(entityKey) {
  const config = entityConfigs[entityKey];
  if (!config) return [];

  const visibleKeys = new Set(getVisibleColumns(entityKey));
  return config.columns.filter((column) => column.key && visibleKeys.has(column.key));
}

function getResponsiveColumns(entityKey) {
  const enabled = getEnabledColumns(entityKey);
  if (entityKey !== 'orders') return enabled;

  // On phones, prioritize core order context + details for readability.
  if (window.innerWidth > 760) return enabled;

  const config = entityConfigs[entityKey];
  const byKey = new Map(config.columns.map((column) => [column.key, column]));
  const mobilePriority = ['reference', 'customer', 'status', 'details'];
  return mobilePriority
    .map((key) => byKey.get(key))
    .filter(Boolean);
}

function setVisibleColumns(entityKey, keys) {
  const uniqueKeys = [...new Set(keys)];
  saveVisibleColumns(entityKey, uniqueKeys);
  renderColumnMenu();
  if (state.entity === entityKey) {
    renderRows(getVisibleRows());
  }
}

function getOrderFilterOptions() {
  return ['all', 'pending', 'paid', 'assigned', 'delivered', 'cancelled'];
}

function setOrderFilter(value) {
  state.orderFilter = getOrderFilterOptions().includes(value) ? value : 'all';
  localStorage.setItem(storageKeyForOrderFilter(), state.orderFilter);
  renderOrderFilterBar();
  applySearchFilter();
}

function getSavedOrderFilter() {
  const saved = localStorage.getItem(storageKeyForOrderFilter());
  return getOrderFilterOptions().includes(saved) ? saved : 'all';
}

function renderOrderFilterBar() {
  if (!orderFilterBar) return;

  if (state.entity !== 'orders') {
    orderFilterBar.style.display = 'none';
    orderFilterBar.innerHTML = '';
    return;
  }

  const options = getOrderFilterOptions();
  orderFilterBar.style.display = 'flex';
  orderFilterBar.innerHTML = options
    .map((option) => {
      const active = state.orderFilter === option ? 'active' : '';
      const label = option === 'all' ? 'All Orders' : option.charAt(0).toUpperCase() + option.slice(1);
      return `<button type="button" class="filter-chip ${active}" data-filter="${escapeHtml(option)}">${escapeHtml(label)}</button>`;
    })
    .join('');
}

function renderColumnMenu() {
  if (!columnMenu || !columnsBtn) return;

  if (!state.entity) {
    columnMenu.style.display = 'none';
    columnMenu.innerHTML = '';
    columnsBtn.disabled = true;
    return;
  }

  columnsBtn.disabled = false;
  const config = entityConfigs[state.entity];
  const visibleColumns = new Set(getVisibleColumns(state.entity));
  columnMenu.innerHTML = config.columns
    .map((column) => {
      const checked = visibleColumns.has(column.key) ? 'checked' : '';
      return `
        <label class="column-menu-item">
          <input type="checkbox" data-column-key="${escapeHtml(column.key)}" ${checked}>
          <span>${escapeHtml(column.label)}</span>
        </label>
      `;
    })
    .join('');
}

function closeColumnMenu() {
  if (!columnMenu) return;
  columnMenu.style.display = 'none';
}

function toggleColumnMenu() {
  if (!columnMenu) return;
  const isOpen = columnMenu.style.display === 'block';
  columnMenu.style.display = isOpen ? 'none' : 'block';
}

function applySavedPreferences() {
  state.orderFilter = getSavedOrderFilter();
}

function toggleRowExpansion(id) {
  const key = String(id);
  if (state.expandedIds.has(key)) {
    state.expandedIds.delete(key);
  } else {
    state.expandedIds.add(key);
  }
  renderRows(getVisibleRows());
}

function buildOrderDetailRow(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemsMarkup = items.length
    ? items.map((item) => {
        const name = item?.name || 'Item';
        const size = item?.selectedSize || item?.size || item?.variant || '-';
        const qty = Number(item?.qty || item?.quantity || 1);
        const price = Number(item?.price || 0).toFixed(2);
        return `
          <div class="expanded-item-row">
            <div>
              <strong>${escapeHtml(name)}</strong>
              <span>${escapeHtml(size)}</span>
            </div>
            <div>x${escapeHtml(qty)} · GHS ${escapeHtml(price)}</div>
          </div>
        `;
      }).join('')
    : '<div class="expanded-empty">No items found.</div>';

  const customer = order?.customer || {};
  return `
    <div class="expanded-order-panel">
      <div class="expanded-order-grid">
        <div><span>Customer</span><strong>${escapeHtml(customer.name || '-')}</strong></div>
        <div><span>Phone</span><strong>${escapeHtml(customer.phone || '-')}</strong></div>
        <div><span>Email</span><strong>${escapeHtml(customer.email || '-')}</strong></div>
        <div><span>Status</span><strong>${escapeHtml(order.status || '-')}</strong></div>
        <div class="expanded-wide"><span>Address</span><strong>${escapeHtml(customer.address || customer.location?.address || '-')}</strong></div>
      </div>
      <div class="expanded-items-block">
        <h4>Items</h4>
        ${itemsMarkup}
      </div>
    </div>
  `;
}

function getFilteredRecords() {
  const config = entityConfigs[state.entity];
  if (!config) return [];

  let records = [...state.records];

  if (state.entity === 'orders' && state.orderFilter !== 'all') {
    records = records.filter((record) => String(record.status || '').toLowerCase() === state.orderFilter);
  }

  const query = managementSearch.value.trim().toLowerCase();
  if (!query) return records;

  return records.filter((item) =>
    config.searchKeys.some((key) => String(getValueByPath(item, key)).toLowerCase().includes(query))
  );
}

function normalizePayload(entityKey, payload) {
  if (entityKey === 'products') {
    const normalized = { ...payload };
    const sizeType = String(normalized.sizeType || 'none').toLowerCase();

    let sizes = [];
    if (sizeType === 'clothing') {
      sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    } else if (sizeType === 'footwear') {
      // Boots, runners, slippers and similar products
      sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
    } else if (sizeType === 'custom') {
      sizes = String(normalized.customSizes || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    normalized.sizeType = sizeType;
    normalized.sizes = sizes;
    delete normalized.customSizes;
    return normalized;
  }

  if (entityKey !== 'riders') {
    return payload;
  }

  return {
    ...payload,
    name: payload.fullName,
    available: payload.isAvailable
  };
}

function getValueByPath(obj, path) {
  if (!obj || !path) return '';
  const segments = path.split('.');
  let current = obj;

  for (const segment of segments) {
    current = current?.[segment];
    if (current === undefined || current === null) return '';
  }

  return current;
}

function setManagementMessage(message) {
  managementMessage.classList.remove('error', 'success');
  managementMessage.textContent = message;
  managementMessage.style.display = 'block';
}

function setManagementError(message) {
  managementMessage.classList.remove('success');
  managementMessage.classList.add('error');
  managementMessage.textContent = message;
  managementMessage.style.display = 'block';
}

function setManagementSuccess(message) {
  managementMessage.classList.remove('error');
  managementMessage.classList.add('success');
  managementMessage.textContent = message;
  managementMessage.style.display = 'block';
}

function clearManagementMessage() {
  managementMessage.classList.remove('error', 'success');
  managementMessage.textContent = '';
  managementMessage.style.display = 'none';
}

function setPanelBusy(isBusy, message = 'Loading...') {
  state.isPanelBusy = isBusy;
  managementPanel.setAttribute('aria-busy', String(isBusy));

  const controls = [
    managementSearch,
    addItemBtn,
    columnsBtn,
    bulkDeleteBtn,
    bulkStatusSelect,
    bulkStatusBtn,
    refreshPanelBtn,
    prevPageBtn,
    nextPageBtn
  ];

  controls.forEach((control) => {
    if (!control) return;
    control.disabled = isBusy;
  });

  managementTableBody.style.opacity = isBusy ? '0.6' : '1';

  if (isBusy) {
    managementMessage.classList.remove('error', 'success');
    managementMessage.textContent = message;
    managementMessage.style.display = 'block';
  }
}

function setEditorBusy(isBusy) {
  state.isEditorBusy = isBusy;
  editorForm.querySelectorAll('input, select, textarea, button').forEach((control) => {
    control.disabled = isBusy;
  });
  saveEditorBtn.disabled = isBusy;
  cancelEditorBtn.disabled = isBusy;
  closeEditorBtn.disabled = isBusy;
  saveEditorBtn.textContent = isBusy ? 'Saving...' : 'Save Changes';
}

function setLoginBusy(isBusy) {
  state.isLoginBusy = isBusy;
  loginForm.querySelectorAll('input, button').forEach((control) => {
    control.disabled = isBusy;
  });
  loginForm.querySelector('button[type="submit"]').textContent = isBusy ? 'Signing In...' : 'Login';
}

function getEditorFocusableElements() {
  if (!editorModal || editorModal.style.display === 'none') return [];
  return Array.from(editorModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter((el) => !el.hasAttribute('disabled'));
}

function formatDateSafe(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function setApiStatus(online) {
  if (!apiHealthEl) return;
  apiHealthEl.textContent = online ? 'Online' : 'Offline';
  apiHealthEl.classList.toggle('online', online);
  apiHealthEl.classList.toggle('offline', !online);
}

function setLastSyncNow() {
  if (!lastSyncEl) return;
  lastSyncEl.textContent = new Date().toLocaleTimeString();
}

function showGlobalNotice(message, type = 'success') {
  if (!globalNotice || !globalNoticeText) return;
  globalNotice.classList.remove('success', 'error');
  globalNotice.classList.add(type === 'error' ? 'error' : 'success');
  globalNoticeText.textContent = message;
  globalNotice.style.display = 'flex';
}

function hideGlobalNotice() {
  if (!globalNotice || !globalNoticeText) return;
  globalNotice.style.display = 'none';
  globalNoticeText.textContent = '';
}

function showManagementPanel(entityKey) {
  const config = entityConfigs[entityKey];
  if (!config) return;

  closeColumnMenu();
  state.entity = entityKey;
  managementTitle.textContent = config.title;
  managementSearch.value = '';
  if (entityKey === 'orders') {
    state.orderFilter = getSavedOrderFilter();
  }
  state.expandedIds = new Set();
  state.page = 1;
  state.selectedIds = new Set();
  addItemBtn.style.display = config.canCreate ? 'inline-block' : 'none';
  renderBulkActions();
  renderColumnMenu();
  renderOrderFilterBar();

  clearManagementMessage();
  setPanelBusy(true, `Loading ${config.title.toLowerCase()}...`);
  managementTableHead.innerHTML = '';
  managementTableBody.innerHTML = '<tr><td>Loading...</td></tr>';
  setManagementView('table');
}

function statusBadge(status) {
  const value = String(status || 'unknown').toLowerCase();
  return `<span class="status-badge ${escapeHtml(value)}">${escapeHtml(value)}</span>`;
}

function orderDetailsCell(order) {
  const customerPhone = order?.customer?.phone
    ? `<div class="od-meta-line"><span class="od-label">Phone</span><span class="od-value">${escapeHtml(order.customer.phone)}</span></div>`
    : '';
  const customerEmail = order?.customer?.email
    ? `<div class="od-meta-line"><span class="od-label">Email</span><span class="od-value">${escapeHtml(order.customer.email)}</span></div>`
    : '';
  const customerAddress = order?.customer?.address || order?.customer?.location?.address;
  const addressLine = customerAddress
    ? `<div class="od-meta-line"><span class="od-label">Address</span><span class="od-value">${escapeHtml(customerAddress)}</span></div>`
    : '';

  const items = Array.isArray(order?.items) ? order.items : [];
  const firstItems = items.slice(0, 3).map((item) => {
    const name = item?.name || 'Item';
    const qty = Number(item?.qty || item?.quantity || 1);
    const size = item?.selectedSize || item?.size || item?.variant || '';
    const sizeLabel = size ? `<span class="od-size">${escapeHtml(size)}</span>` : '';
    return `<div class="od-item-chip"><span class="od-item-name">${escapeHtml(name)}</span>${sizeLabel}<span class="od-item-qty">x${escapeHtml(qty)}</span></div>`;
  });

  const moreCount = items.length > 3 ? `<div class="od-more">+${items.length - 3} more item(s)</div>` : '';
  const itemsLine = firstItems.length
    ? `<div class="od-items-wrap">${firstItems.join('')}</div>${moreCount}`
    : '<div class="od-empty">Items: -</div>';

  return `<div class="order-details-cell">${customerPhone}${customerEmail}${addressLine}${itemsLine}</div>`;
}

function productImageCell(imageUrl, name) {
  if (!imageUrl) return '<span>-</span>';

  const safeUrl = escapeHtml(imageUrl);
  const safeName = escapeHtml(name || 'Product image');
  return `<img class="table-product-image" src="${safeUrl}" alt="${safeName}" onerror="this.replaceWith(document.createTextNode('-'))">`;
}

function rowActionsCell(item) {
  const id = getItemId(item);
  if (!id) return '<span>-</span>';

  const config = entityConfigs[state.entity];
  if (!config) return '<span>-</span>';

  const actions = [];

  if (config.canEdit) {
    actions.push(`<button class="row-btn edit" data-action="edit" data-id="${escapeHtml(id)}">Edit</button>`);
  }

  if (config.canDelete) {
    actions.push(`<button class="row-btn delete" data-action="delete" data-id="${escapeHtml(id)}">Delete</button>`);
  }

  return `<div class="row-actions">${actions.join('')}</div>`;
}

function getVisibleRows() {
  if (state.entity === 'products') {
    return state.filteredRecords;
  }

  const start = (state.page - 1) * state.pageSize;
  return state.filteredRecords.slice(start, start + state.pageSize);
}

function updatePaginationState() {
  if (state.entity === 'products') {
    state.totalPages = 1;
    state.page = 1;
    pagination.style.display = 'none';
    paginationInfo.textContent = 'All products shown';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }

  state.totalPages = Math.max(1, Math.ceil(state.filteredRecords.length / state.pageSize));
  if (state.page > state.totalPages) {
    state.page = state.totalPages;
  }

  pagination.style.display = state.filteredRecords.length > state.pageSize ? 'flex' : 'none';
  paginationInfo.textContent = `Page ${state.page} of ${state.totalPages}`;
  prevPageBtn.disabled = state.page <= 1;
  nextPageBtn.disabled = state.page >= state.totalPages;
}

function renderBulkActions() {
  const config = entityConfigs[state.entity];
  if (!config) {
    bulkActions.style.display = 'none';
    return;
  }

  const canBulkDelete = config.canDelete;
  const statusField = config.fields.find((field) => field.key === 'status');
  const canBulkStatus = Boolean(statusField);

  bulkActions.style.display = canBulkDelete || canBulkStatus ? 'flex' : 'none';
  bulkDeleteBtn.style.display = canBulkDelete ? 'inline-block' : 'none';
  bulkStatusSelect.style.display = canBulkStatus ? 'inline-block' : 'none';
  bulkStatusBtn.style.display = canBulkStatus ? 'inline-block' : 'none';

  selectedCount.textContent = `${state.selectedIds.size} selected`;

  if (canBulkStatus) {
    const options = ['<option value="">Change status...</option>']
      .concat(statusField.options.map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`));
    bulkStatusSelect.innerHTML = options.join('');
  }
}

function toggleSelection(id, checked) {
  if (checked) {
    state.selectedIds.add(String(id));
  } else {
    state.selectedIds.delete(String(id));
  }
  selectedCount.textContent = `${state.selectedIds.size} selected`;
}

function renderRows(rows) {
  const config = entityConfigs[state.entity];
  if (!config) return;

  const visibleColumns = getResponsiveColumns(state.entity);
  const hasBulkOps = config.canDelete || config.fields.some((field) => field.key === 'status');
  const headers = visibleColumns.map((col) => ({ label: col.label, isHtml: false }));
  const isOrders = state.entity === 'orders';

  if (isOrders) {
    headers.unshift({ label: '', isHtml: true });
  }
  if (hasBulkOps) {
    headers.unshift({
      label: '<input id="select-all-rows" type="checkbox" class="row-checkbox" aria-label="Select all">',
      isHtml: true
    });
  }
  if (config.canEdit || config.canDelete) {
    headers.push({ label: 'Actions', isHtml: false });
  }

  managementTableHead.innerHTML = `<tr>${headers.map((header) => `<th>${header.isHtml ? header.label : escapeHtml(header.label)}</th>`).join('')}</tr>`;

  if (!rows.length) {
    managementTableBody.innerHTML = `<tr><td colspan="${headers.length}">No records found.</td></tr>`;
    return;
  }

  managementTableBody.innerHTML = rows
    .map((item) => {
      const id = getItemId(item);
      const cells = visibleColumns.map((col) => `<td>${col.render(item)}</td>`);
      if (isOrders) {
        const expanded = state.expandedIds.has(String(id));
        const label = expanded ? 'Collapse details' : 'Expand details';
        cells.unshift(`
          <td>
            <button type="button" class="row-expand-btn" data-action="toggle-expand" data-id="${escapeHtml(id || '')}" aria-expanded="${expanded ? 'true' : 'false'}" aria-label="${label}">${expanded ? '−' : '+'}</button>
          </td>
        `);
      }
      if (hasBulkOps) {
        const checked = state.selectedIds.has(String(id)) ? 'checked' : '';
        const ariaLabel = `Select row ${escapeHtml(id || '')}`;
        cells.unshift(`<td><input type="checkbox" class="row-checkbox row-select" data-id="${escapeHtml(id || '')}" aria-label="${ariaLabel}" ${checked}></td>`);
      }
      if (config.canEdit || config.canDelete) {
        cells.push(`<td>${rowActionsCell(item)}</td>`);
      }
      const detailRow = isOrders && state.expandedIds.has(String(id))
        ? `<tr class="expanded-order-row"><td colspan="${cells.length}">${buildOrderDetailRow(item)}</td></tr>`
        : '';
      return `<tr class="management-main-row">${cells.join('')}</tr>${detailRow}`;
    })
    .join('');
}

function applySearchFilter() {
  const config = entityConfigs[state.entity];
  if (!config) return;

  state.filteredRecords = getFilteredRecords();
  state.page = 1;
  updatePaginationState();
  renderRows(getVisibleRows());
}

function showEditor(title) {
  editorTitle.textContent = title;
  editorError.textContent = '';
  editorError.style.display = 'none';
  state.lastFocusedElement = document.activeElement;
  editorModal.style.display = 'flex';

  setTimeout(() => {
    const focusables = getEditorFocusableElements();
    if (focusables.length) focusables[0].focus();
  }, 0);
}

function hideEditor() {
  if (state.isEditorBusy) return;
  editorModal.style.display = 'none';
  editorForm.innerHTML = '';
  state.editMode = null;
  state.editTarget = null;
  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
    state.lastFocusedElement.focus();
  }
  state.lastFocusedElement = null;
}

function renderEditorForm(entityKey, mode, item = null) {
  const config = entityConfigs[entityKey];
  if (!config) return;

  state.editMode = mode;
  state.editTarget = item;

  const titleMap = {
    create: `Add ${config.title.slice(0, -1)}`,
    edit: `Edit ${config.title.slice(0, -1)}`
  };

  showEditor(titleMap[mode] || 'Edit Item');

  editorForm.innerHTML = config.fields
    .map((field) => {
      let value = item?.[field.key];
      if (entityKey === 'products') {
        if (field.key === 'sizeType') {
          value = item?.sizeType || 'none';
        }
        if (field.key === 'customSizes') {
          value = Array.isArray(item?.sizes) ? item.sizes.join(', ') : '';
        }
      }
      const fullClass = field.full ? 'field-group full' : 'field-group';

      if (field.type === 'textarea') {
        return `
          <div class="${fullClass}">
            <label for="field-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>
            <textarea id="field-${escapeHtml(field.key)}" name="${escapeHtml(field.key)}" ${field.required ? 'required' : ''}>${escapeHtml(value || '')}</textarea>
          </div>
        `;
      }

      if (field.type === 'select') {
        const options = (field.options || [])
          .map((option) => {
            const selected = String(value || '').toLowerCase() === String(option).toLowerCase() ? 'selected' : '';
            return `<option value="${escapeHtml(option)}" ${selected}>${escapeHtml(option)}</option>`;
          })
          .join('');

        return `
          <div class="${fullClass}">
            <label for="field-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>
            <select id="field-${escapeHtml(field.key)}" name="${escapeHtml(field.key)}" ${field.required ? 'required' : ''}>${options}</select>
          </div>
        `;
      }

      if (field.type === 'checkbox') {
        return `
          <div class="${fullClass}">
            <label>${escapeHtml(field.label)}</label>
            <label class="field-checkbox" for="field-${escapeHtml(field.key)}">
              <input id="field-${escapeHtml(field.key)}" type="checkbox" name="${escapeHtml(field.key)}" ${value ? 'checked' : ''}>
              <span>Enabled</span>
            </label>
          </div>
        `;
      }

      return `
        <div class="${fullClass}">
          <label for="field-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>
          <input id="field-${escapeHtml(field.key)}" type="${escapeHtml(field.type || 'text')}" name="${escapeHtml(field.key)}" value="${escapeHtml(value ?? '')}" ${field.required ? 'required' : ''}>
        </div>
      `;
    })
    .join('');

  const imageField = editorForm.querySelector('[name="image"]');
  if (imageField) {
    imagePreviewWrap.style.display = 'block';
    imagePreview.src = imageField.value || '';

    imageField.addEventListener('input', () => {
      imagePreview.src = imageField.value || '';
    });

    imagePreview.onerror = () => {
      imagePreview.removeAttribute('src');
    };
  } else {
    imagePreviewWrap.style.display = 'none';
    imagePreview.removeAttribute('src');
  }

  if (entityKey === 'products') {
    const sizeTypeField = editorForm.querySelector('[name="sizeType"]');
    const customSizesGroup = editorForm.querySelector('[name="customSizes"]')?.closest('.field-group');
    const toggleCustomSizes = () => {
      if (!customSizesGroup || !sizeTypeField) return;
      const shouldShow = sizeTypeField.value === 'custom';
      customSizesGroup.style.display = shouldShow ? '' : 'none';
    };

    if (sizeTypeField) {
      sizeTypeField.addEventListener('change', toggleCustomSizes);
      toggleCustomSizes();
    }
  }
}

function collectFormData(entityKey) {
  const config = entityConfigs[entityKey];
  if (!config) return {};

  const payload = {};

  for (const field of config.fields) {
    const element = editorForm.querySelector(`[name="${field.key}"]`);
    if (!element) continue;

    if (field.type === 'checkbox') {
      payload[field.key] = Boolean(element.checked);
      continue;
    }

    if (field.type === 'number') {
      payload[field.key] = Number(element.value || 0);
      continue;
    }

    payload[field.key] = String(element.value || '').trim();
  }

  return payload;
}

function findRecordById(id) {
  return state.records.find((item) => String(getItemId(item)) === String(id)) || null;
}

async function requestWithFallback({ paths, method = 'GET', payload, requiresAuth = true, includeAuthIfAvailable = false }) {
  await ensureApiResolved();
  const token = getAuthToken();

  if (requiresAuth && !token) {
    throw new Error('Please log in again.');
  }

  let lastError = null;
  let lastStatus = 0;
  let hadUnauthorized = false;

  for (const path of paths) {
    try {
      const useAuth = requiresAuth || (includeAuthIfAvailable && Boolean(token));
      const response = await fetch(apiUrl(path), {
        method,
        headers: useAuth
          ? authHeaders(token, payload !== undefined)
          : (payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
        body: payload !== undefined ? JSON.stringify(payload) : undefined
      });

      lastStatus = response.status;

      if (response.status === 401) {
        hadUnauthorized = true;
        lastError = 'Unauthorized on one endpoint, trying fallback endpoints...';
        continue;
      }

      const body = await response.text();
      const parsedBody = body ? (() => {
        try {
          return JSON.parse(body);
        } catch (err) {
          return body;
        }
      })() : null;

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          data: parsedBody,
          path
        };
      }

      const messageText = String(parsedBody?.message || parsedBody || '').toLowerCase();
      const isEndpointStyleError =
        [404, 405, 501].includes(response.status) ||
        /endpoint not available|cannot\s+(put|post|get|delete|patch)|method not allowed|route not found|not implemented/.test(messageText);
      const isResourceMissing = /rider not found|order not found|product not found|not found/.test(messageText);

      if (isEndpointStyleError && !isResourceMissing) {
        lastError = parsedBody?.message || `Endpoint not available: ${path}`;
        continue;
      }

      return {
        ok: false,
        status: response.status,
        data: parsedBody,
        path
      };
    } catch (err) {
      lastError = err.message || 'Network error';
    }
  }

  if (hadUnauthorized && requiresAuth) {
    clearAuthToken();
    showLogin();
    return {
      ok: false,
      status: 401,
      data: { message: 'Session expired or unauthorized for all rider endpoints. Please log in again.' }
    };
  }

  return {
    ok: false,
    status: lastStatus,
    data: { message: lastError || 'Request failed on all fallback endpoints.' }
  };
}

function extractCollection(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  const candidateKeys = ['data', 'items', 'rows', 'results', 'orders', 'riders', 'docs', 'applications', 'messages', 'chatMessages'];

  for (const key of candidateKeys) {
    if (Array.isArray(raw[key])) {
      return raw[key];
    }
  }

  for (const key of candidateKeys) {
    if (raw[key] && typeof raw[key] === 'object') {
      const nested = extractCollection(raw[key]);
      if (nested.length) return nested;
    }
  }

  return [];
}

function getRiderId(rider) {
  return getRiderActionId(rider);
}

function getRiderChatId(rider) {
  return (
    normalizeIdValue(rider?._id) ||
    normalizeIdValue(rider?.id) ||
    normalizeIdValue(rider?.riderId) ||
    normalizeIdValue(rider?.rider?._id) ||
    normalizeIdValue(rider?.user?._id) ||
    ''
  );
}

function extractRiderCollection(raw) {
  const collection = extractCollection(raw);
  return normalizeRecords('riders', collection).filter((rider) => getRiderId(rider));
}

function setManagementView(mode) {
  const header = managementPanel.querySelector('.management-header');
  const toolbar = managementPanel.querySelector('.management-toolbar');
  const tableWrap = managementPanel.querySelector('.table-wrapper');
  const auditPanel = managementPanel.querySelector('.audit-panel');
  const chatPanel = document.getElementById('chat-panel');
  const registrationsPanel = document.getElementById('registrations-panel');

  const showTable = mode === 'table';
  const showChat = mode === 'chat';
  const showRegistrations = mode === 'registrations';

  managementPanel.style.display = 'block';
  if (header) header.style.display = showTable ? 'flex' : 'none';
  if (toolbar) toolbar.style.display = showTable ? 'flex' : 'none';
  if (tableWrap) tableWrap.style.display = showTable ? 'block' : 'none';
  if (auditPanel) auditPanel.style.display = showTable ? 'block' : 'none';
  if (pagination) pagination.style.display = showTable && state.filteredRecords.length > state.pageSize ? 'flex' : 'none';
  if (managementMessage) {
    managementMessage.style.display = showTable && managementMessage.textContent ? 'block' : 'none';
  }

  if (showTable) {
    renderBulkActions();
    renderOrderFilterBar();
  } else {
    if (bulkActions) bulkActions.style.display = 'none';
    if (orderFilterBar) orderFilterBar.style.display = 'none';
  }

  if (chatPanel) chatPanel.style.display = showChat ? 'block' : 'none';
  if (registrationsPanel) registrationsPanel.style.display = showRegistrations ? 'flex' : 'none';
}

async function loadEntity(entityKey) {
  const config = entityConfigs[entityKey];
  if (!config) return;

  showManagementPanel(entityKey);

  const result = await requestWithFallback({
    paths: config.listPaths,
    method: 'GET',
    requiresAuth: entityKey !== 'products',
    includeAuthIfAvailable: true
  });

  if (!result.ok) {
    const message = result.data?.message || `${config.title} could not be loaded.`;
    setManagementError(message);
    setApiStatus(false);
    setPanelBusy(false);
    managementTableHead.innerHTML = '';
    managementTableBody.innerHTML = '';
    return;
  }

  const raw = result.data;
  const collection = extractCollection(raw);
  const records = normalizeRecords(entityKey, collection);

  state.records = records;
  state.filteredRecords = getFilteredRecords();
  state.page = 1;
  state.selectedIds = new Set();

  clearManagementMessage();
  setPanelBusy(false);
  setApiStatus(true);
  setLastSyncNow();
  renderBulkActions();
  renderColumnMenu();
  renderOrderFilterBar();
  updatePaginationState();
  renderRows(getVisibleRows());

  if (records.length === 0) {
    setManagementMessage(`No ${config.title.toLowerCase()} found yet.`);
  }
}

async function handleSaveEditor() {
  const config = entityConfigs[state.entity];
  if (!config || !state.editMode) return;

  if (state.isEditorBusy || state.isPanelBusy) return;

  editorError.textContent = '';
  editorError.style.display = 'none';

  const payload = normalizePayload(state.entity, collectFormData(state.entity));
  const isCreate = state.editMode === 'create';
  const id = getItemId(state.editTarget);

  let paths = [];
  let method = 'POST';

  if (isCreate) {
    paths = config.createPaths || [];
    method = 'POST';
  } else {
    if (!id) {
      editorError.textContent = 'Cannot update this item because it has no id.';
      editorError.style.display = 'block';
      return;
    }

    paths = config.updatePaths ? config.updatePaths(id) : [];
    method = 'PUT';
  }

  if (!paths.length) {
    editorError.textContent = 'This action is not available for this section.';
    editorError.style.display = 'block';
    return;
  }

  setEditorBusy(true);

  const result = await requestWithFallback({
    paths,
    method,
    payload,
    requiresAuth: true
  });

  if (!result.ok) {
    editorError.textContent = result.data?.message || 'Save failed. Check backend endpoint support.';
    editorError.style.display = 'block';
    setApiStatus(false);
    setEditorBusy(false);
    showGlobalNotice(editorError.textContent, 'error');
    return;
  }

  hideEditor();
  setEditorBusy(false);
  await loadEntity(state.entity);
  setManagementSuccess(`${config.title.slice(0, -1)} ${isCreate ? 'created' : 'updated'} successfully.`);
  showGlobalNotice(`${config.title.slice(0, -1)} ${isCreate ? 'added' : 'updated'} successfully.`, 'success');
  addAuditLog(isCreate ? 'CREATE' : 'UPDATE', state.entity, payload.name || payload.fullName || payload.status || 'record updated');
  await fetchStats();
}

async function handleDelete(id) {
  const config = entityConfigs[state.entity];
  if (!config || !config.deletePaths) return;

  if (!id) {
    setManagementError('Cannot delete item: missing id.');
    showGlobalNotice('Delete failed: missing item id.', 'error');
    return;
  }

  const item = findRecordById(id);
  const label = item?.name || item?.fullName || item?.reference || id;

  const confirmed = window.confirm(`Delete ${label}? This action cannot be undone.`);
  if (!confirmed) return;

  if (state.isPanelBusy || state.isEditorBusy) return;
  setPanelBusy(true, `Deleting ${config.title.toLowerCase().slice(0, -1)}...`);

  try {
    const result = await requestWithFallback({
      paths: config.deletePaths(id),
      method: 'DELETE',
      requiresAuth: true
    });

    if (!result.ok) {
      const msg = result.data?.message || 'Delete failed. Endpoint may be unavailable.';
      setManagementError(msg);
      setApiStatus(false);
      showGlobalNotice(msg, 'error');
      return;
    }

    await loadEntity(state.entity);
    setManagementSuccess(`${config.title.slice(0, -1)} deleted successfully.`);
    showGlobalNotice(`${config.title.slice(0, -1)} deleted successfully.`, 'success');
    addAuditLog('DELETE', state.entity, String(label));
    await fetchStats();
  } catch (err) {
    const msg = err?.message || 'Delete failed due to an unexpected error.';
    setManagementError(msg);
    showGlobalNotice(msg, 'error');
  } finally {
    setPanelBusy(false);
  }
}

async function handleBulkDelete() {
  const ids = Array.from(state.selectedIds);
  if (!ids.length) {
    setManagementMessage('Select at least one row first.');
    return;
  }

  const confirmed = window.confirm(`Delete ${ids.length} selected record(s)?`);
  if (!confirmed) return;

  if (state.isPanelBusy || state.isEditorBusy) return;
  setPanelBusy(true, `Deleting ${ids.length} selected item(s)...`);

  const config = entityConfigs[state.entity];
  if (!config || !config.deletePaths) {
    setManagementError('Delete is not available for this section.');
    setPanelBusy(false);
    return;
  }

  let removedCount = 0;

  for (const id of ids) {
    const result = await requestWithFallback({
      paths: config.deletePaths(id),
      method: 'DELETE',
      requiresAuth: true
    });

    if (!result.ok) {
      setManagementError(result.data?.message || 'Bulk delete failed for one or more rows.');
      setApiStatus(false);
      setPanelBusy(false);
      return;
    }

    removedCount += 1;
    addAuditLog('DELETE', state.entity, String(id));
  }

  state.selectedIds = new Set();
  renderBulkActions();
  await loadEntity(state.entity);
  setManagementSuccess(`Deleted ${removedCount} selected record(s).`);
  setPanelBusy(false);
}

async function handleBulkStatusUpdate() {
  const ids = Array.from(state.selectedIds);
  const status = bulkStatusSelect.value;

  if (!ids.length) {
    setManagementMessage('Select at least one row first.');
    return;
  }

  if (!status) {
    setManagementMessage('Choose a status before applying.');
    return;
  }

  if (state.isPanelBusy || state.isEditorBusy) return;
  setPanelBusy(true, `Updating ${ids.length} selected row(s)...`);

  const config = entityConfigs[state.entity];
  for (const id of ids) {
    const result = await requestWithFallback({
      paths: config.updatePaths(id),
      method: 'PUT',
      payload: { status },
      requiresAuth: true
    });

    if (!result.ok) {
      setManagementMessage(`Status update failed for one or more rows: ${result.data?.message || 'error'}`);
      setPanelBusy(false);
      return;
    }
  }

  addAuditLog('BULK UPDATE', state.entity, `Status set to ${status} for ${ids.length} row(s)`);
  await loadEntity(state.entity);
  setManagementSuccess(`Updated status for ${ids.length} row(s).`);
}

async function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    showLogin();
    return;
  }

  const valid = await validateAdminSession(token);
  if (!valid) {
    clearAuthToken();
    showLogin();
    loginError.textContent = 'Session verification failed. Please log in again.';
    return;
  }

  showDashboard();
  await fetchStats();
}

async function verifyBackendConnection() {
  try {
    await ensureApiResolved(true);
    // Prefer richer health endpoint, fallback to legacy ping endpoint.
    let response = await fetch(apiUrl('/api/health'), { method: 'GET' });
    if (!response.ok) {
      response = await fetch(apiUrl('/ping'), { method: 'GET' });
    }
    if (!response.ok) throw new Error('Backend responded with non-OK status');
    setApiStatus(true);
    setLastSyncNow();
    return true;
  } catch (err) {
    loginError.textContent = `Cannot reach backend (${activeApiBaseUrl || API_URL}). Check deployed backend URL/CORS or pass ?api=https://your-backend-domain.`;
    console.error('Backend connection error:', err);
    setApiStatus(false);
    return false;
  }
}

async function attemptAdminLoginAcrossCandidates(username, password) {
  const candidates = getApiCandidates();
  let lastMessage = 'Error connecting to backend';

  for (const baseCandidate of candidates) {
    const base = normalizeApiBaseUrl(baseCandidate);
    if (!base) continue;

    try {
      const response = await fetch(`${base}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const bodyText = await response.text();
      let parsed;
      try {
        parsed = bodyText ? JSON.parse(bodyText) : {};
      } catch {
        parsed = { message: String(bodyText || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() };
      }

      if (response.ok && parsed?.token) {
        activeApiBaseUrl = base;
        apiDiscoveryComplete = true;
        localStorage.setItem('adminApiUrl', base);
        if (apiEndpointEl) apiEndpointEl.textContent = base;
        return { ok: true, token: parsed.token };
      }

      const message = parsed?.message || `Login failed (${response.status})`;
      lastMessage = message;

      // Invalid credentials should stop fallback attempts.
      if ([400, 401, 403].includes(response.status)) {
        return { ok: false, message };
      }
    } catch {
      // Try next candidate base URL.
    }
  }

  return { ok: false, message: lastMessage };
}

async function fetchStats() {
  const token = getAuthToken();
  if (!token) {
    showLogin();
    return;
  }

  try {
    await ensureApiResolved();
    const response = await fetch(apiUrl('/api/admin/dashboard/stats'), {
      method: 'GET',
      headers: authHeaders(token)
    });

    if (response.status === 401) {
      clearAuthToken();
      showLogin();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      await fetchStatsFallback(token);
      return;
    }

    updateStatsUi(data);
    setApiStatus(true);
    setLastSyncNow();
  } catch (err) {
    console.error('Error fetching dashboard stats, trying fallback:', err);
    setApiStatus(false);
    await fetchStatsFallback(token);
  }
}

function updateStatsUi(data) {
  totalOrdersEl.textContent = data.totalOrders || 0;
  totalProductsEl.textContent = data.totalProducts || 0;
  totalRidersEl.textContent = data.totalRiders || 0;
  pendingRidersEl.textContent = data.pendingRiders || 0;
  totalRevenueEl.textContent = `GHS ${(data.totalRevenue || 0).toFixed(2)}`;
}

async function fetchStatsFallback(token) {
  try {
    await ensureApiResolved();
    const headers = authHeaders(token);

    const [ordersRes, productsRes, ridersRes] = await Promise.all([
      fetch(apiUrl('/api/orders'), { method: 'GET', headers }),
      fetch(apiUrl('/api/products'), { method: 'GET', headers }),
      fetch(apiUrl('/api/admin/riders'), { method: 'GET', headers })
    ]);

    if ([ordersRes, productsRes, ridersRes].some((res) => res.status === 401)) {
      clearAuthToken();
      showLogin();
      return;
    }

    const [ordersRaw, productsRaw, ridersRaw] = await Promise.all([
      ordersRes.ok ? ordersRes.json() : Promise.resolve([]),
      productsRes.ok ? productsRes.json() : Promise.resolve([]),
      ridersRes.ok ? ridersRes.json() : Promise.resolve([])
    ]);

    const orders = extractCollection(ordersRaw);
    const products = extractCollection(productsRaw);
    const riders = extractRiderCollection(ridersRaw);

    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);

    updateStatsUi({
      totalOrders: orders.length,
      totalProducts: products.length,
      totalRiders: riders.length,
      pendingRiders: riders.filter((r) => String(r.status || '').toLowerCase() === 'pending').length,
      totalRevenue
    });
    setApiStatus(true);
    setLastSyncNow();
  } catch (err) {
    console.error('Error fetching fallback dashboard stats:', err);
    setApiStatus(false);
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (state.isLoginBusy || state.isPanelBusy || state.isEditorBusy) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    loginError.textContent = 'Please fill all fields';
    return;
  }

  try {
    setLoginBusy(true);
    await ensureApiResolved(true);
    const result = await attemptAdminLoginAcrossCandidates(username, password);

    if (!result.ok || !result.token) {
      loginError.textContent = result.message || 'Login failed';
      return;
    }

    setAuthToken(result.token);
    loginError.textContent = '';
    loginForm.reset();

    showDashboard();
    fetchStats();
  } catch (err) {
    loginError.textContent = 'Error connecting to backend';
    console.error(err);
  } finally {
    setLoginBusy(false);
  }
});

logoutBtn.addEventListener('click', () => {
  clearAuthToken();
  showLogin();
  loginForm.reset();
  loginError.textContent = '';
  managementPanel.style.display = 'none';
  setPanelBusy(false);
});

const retryConnectionBtn = document.getElementById('retry-connection-btn');
if (retryConnectionBtn) {
  retryConnectionBtn.addEventListener('click', async () => {
    retryConnectionBtn.disabled = true;
    loginError.textContent = '';

    try {
      const connected = await verifyBackendConnection();
      if (!connected) return;

      if (getAuthToken()) {
        await fetchStats();
        if (state.entity) {
          await loadEntity(state.entity);
        }
      }

      if (chatState.selectedRiderId) {
        await loadChatMessages(chatState.selectedRiderId);
      }

      if (registrationState.pendingRiders) {
        await loadPendingRegistrations();
      }

      if (!chatState.socket || !chatState.connected) {
        initializeSocket();
      }
    } catch (err) {
      console.error('Retry connection failed:', err);
    } finally {
      retryConnectionBtn.disabled = false;
    }
  });
}

manageProductsBtn.addEventListener('click', () => loadEntity('products'));
manageRidersBtn.addEventListener('click', () => loadEntity('riders'));
manageOrdersBtn.addEventListener('click', () => loadEntity('orders'));

const manageChatBtn = document.getElementById('manage-chat-btn');
if (manageChatBtn) {
  manageChatBtn.addEventListener('click', async () => {
    const regPanel = document.getElementById('registrations-panel');
    if (regPanel) regPanel.style.display = 'none';
    
    await showChatPanel();
    
    // Stop registration polling when switching to chat
    if (registrationState.pollTimer) {
      clearInterval(registrationState.pollTimer);
      registrationState.pollTimer = null;
    }
  });
}

closePanelBtn.addEventListener('click', () => {
  managementPanel.style.display = 'none';
  closeColumnMenu();
});

refreshPanelBtn.addEventListener('click', async () => {
  if (!state.entity) return;
  await loadEntity(state.entity);
});

columnsBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleColumnMenu();
});

columnMenu.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-column-key]');
  if (!checkbox || !state.entity) return;

  const current = getVisibleColumns(state.entity);
  const key = checkbox.dataset.columnKey;
  const next = checkbox.checked
    ? [...new Set([...current, key])]
    : current.filter((columnKey) => columnKey !== key);

  if (!next.length) {
    checkbox.checked = true;
    return;
  }

  setVisibleColumns(state.entity, next);
});

orderFilterBar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  setOrderFilter(button.dataset.filter);
});

managementSearch.addEventListener('input', applySearchFilter);

prevPageBtn.addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    updatePaginationState();
    renderRows(getVisibleRows());
  }
});

nextPageBtn.addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    updatePaginationState();
    renderRows(getVisibleRows());
  }
});

bulkDeleteBtn.addEventListener('click', handleBulkDelete);
bulkStatusBtn.addEventListener('click', handleBulkStatusUpdate);

addItemBtn.addEventListener('click', () => {
  if (!state.entity) return;
  renderEditorForm(state.entity, 'create');
});

managementTableBody.addEventListener('click', async (event) => {
  if (state.isPanelBusy) return;

  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!id || !state.entity) return;

  if (action === 'toggle-expand') {
    toggleRowExpansion(id);
    return;
  }

  if (action === 'edit') {
    const item = findRecordById(id);
    if (!item) {
      setManagementMessage('Unable to find selected record. Please refresh and try again.');
      return;
    }

    renderEditorForm(state.entity, 'edit', item);
    return;
  }

  if (action === 'delete') {
    await handleDelete(id);
  }
});

managementTableBody.addEventListener('change', (event) => {
  const checkbox = event.target.closest('.row-select');
  if (!checkbox) return;
  toggleSelection(checkbox.dataset.id, checkbox.checked);
});

managementTableHead.addEventListener('change', (event) => {
  const checkbox = event.target.closest('#select-all-rows');
  if (!checkbox) return;

  const visible = getVisibleRows();
  for (const item of visible) {
    const id = getItemId(item);
    if (!id) continue;
    toggleSelection(id, checkbox.checked);
  }

  const rowBoxes = managementTableBody.querySelectorAll('.row-select');
  rowBoxes.forEach((box) => {
    box.checked = checkbox.checked;
  });
});

closeEditorBtn.addEventListener('click', hideEditor);
cancelEditorBtn.addEventListener('click', hideEditor);
saveEditorBtn.addEventListener('click', handleSaveEditor);

editorModal.addEventListener('click', (event) => {
  if (event.target === editorModal) {
    hideEditor();
  }
});

document.addEventListener('click', (event) => {
  if (!columnMenu.contains(event.target) && !columnsBtn.contains(event.target)) {
    closeColumnMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (editorModal.style.display !== 'none' && event.key === 'Tab') {
    const focusables = getEditorFocusableElements();
    if (focusables.length) {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  const target = event.target;
  const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

  if (event.key === 'Escape') {
    closeColumnMenu();
    if (editorModal.style.display !== 'none') {
      hideEditor();
      return;
    }
    return;
  }

  if (event.key === '/' && !isTyping && dashboardSection.style.display !== 'none') {
    event.preventDefault();
    managementSearch.focus();
    return;
  }

  if (event.ctrlKey && event.key === 'Enter' && editorModal.style.display !== 'none') {
    event.preventDefault();
    handleSaveEditor();
    return;
  }

  if (isTyping || editorModal.style.display !== 'none') return;

  const key = event.key.toLowerCase();
  if (event.altKey && key === 'p') {
    loadEntity('products');
    return;
  }
  if (event.altKey && key === 'r') {
    loadEntity('riders');
    return;
  }
  if (event.altKey && key === 'o') {
    loadEntity('orders');
    return;
  }
  if (event.altKey && key === 'n' && state.entity && addItemBtn.style.display !== 'none') {
    addItemBtn.click();
  }
});

window.addEventListener('resize', () => {
  if (!state.entity) return;

  if (state.resizeTimer) clearTimeout(state.resizeTimer);
  state.resizeTimer = setTimeout(() => {
    renderRows(getVisibleRows());
  }, 140);
});

window.addEventListener('orientationchange', () => {
  if (!state.entity) return;

  if (state.resizeTimer) clearTimeout(state.resizeTimer);
  state.resizeTimer = setTimeout(() => {
    renderRows(getVisibleRows());
  }, 140);
});

setInterval(() => {
  if (getAuthToken()) {
    fetchStats();
  }
}, 30000);

window.addEventListener('DOMContentLoaded', async () => {
  // Zero-trust: never trust a persistent token from previous browser sessions.
  localStorage.removeItem('adminToken');
  if (apiEndpointEl) apiEndpointEl.textContent = API_URL;
  applySavedPreferences();
  hideGlobalNotice();
  loadAuditLogs();
  const connected = await verifyBackendConnection();
  if (!connected) {
    showLogin();
    return;
  }

  await checkAuth();
});

if (globalNoticeClose) {
  globalNoticeClose.addEventListener('click', hideGlobalNotice);
}

// ========== CHAT SYSTEM ==========

// Chat state management
const chatState = {
  riders: [],
  selectedRiderId: null,
  selectedReferenceCandidates: [],
  activeReference: '',
  messages: [],
  socket: null,
  connected: false,
  chatPollTimer: null,
  joinedReference: '',
  joinedReferences: new Set(),
  boundReference: ''
};

function isSafariBrowser() {
  const ua = String(navigator.userAgent || '');
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Android/i.test(ua);
}

function stopChatPolling() {
  if (chatState.chatPollTimer) {
    clearInterval(chatState.chatPollTimer);
    chatState.chatPollTimer = null;
  }
}

function startChatPolling() {
  stopChatPolling();

  // Realtime socket is preferred when available.
  if (chatState.connected) return;

  chatState.chatPollTimer = setInterval(async () => {
    if (!chatState.selectedRiderId) return;
    try {
      await loadChatMessages(chatState.selectedRiderId, chatState.activeReference);
    } catch {
      // Keep polling silently when intermittent network failures occur.
    }
  }, 4500);
}

function parseRiderIdFromReference(reference) {
  const raw = String(reference || '').trim();
  if (!raw.toLowerCase().startsWith('rider:')) return '';
  return normalizeIdValue(raw.slice('rider:'.length));
}

function updateManageChatBadge() {
  const badge = document.getElementById('manage-chat-badge');
  if (!badge) return;
  const totalUnread = chatState.riders.reduce((sum, rider) => sum + (Number(rider.unreadCount) || 0), 0);
  if (totalUnread > 0) {
    badge.textContent = totalUnread > 99 ? '99+' : String(totalUnread);
    badge.style.display = 'inline-flex';
  } else {
    badge.textContent = '0';
    badge.style.display = 'none';
  }
}

function playAdminChatNotificationTone() {
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {
    // Ignore audio restrictions/failures.
  }
}

function ensureRiderForReference(reference) {
  const riderId = parseRiderIdFromReference(reference);
  if (!riderId) return null;

  let rider = chatState.riders.find((item) => (item.__chatId || getRiderChatId(item)) === riderId);
  if (!rider) {
    rider = {
      _id: riderId,
      __chatId: riderId,
      fullName: `Rider ${riderId.slice(-6)}`,
      phone: 'Unknown',
      unreadCount: 0
    };
    chatState.riders.unshift(rider);
  }
  return rider;
}

function getRiderReferenceCandidates(rider, preferredId = '') {
  const raw = [
    preferredId,
    rider?.__chatId,
    rider?._id,
    rider?.id,
    rider?.riderId,
    rider?.rider?._id,
    rider?.user?._id
  ];

  const ids = [];
  const seen = new Set();
  for (const value of raw) {
    const normalized = normalizeIdValue(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ids.push(normalized);
  }

  return ids.map((id) => `rider:${id}`);
}

// Initialize Socket.io connection
function initializeSocket() {
  // Don't reinitialize if already connected
  if (chatState.socket && chatState.socket.connected) {
    console.log('✓ Socket already connected');
    return;
  }

  if (typeof io === 'undefined') {
    console.warn('Socket.io library not loaded');
    return;
  }

  const apiBase = (activeApiBaseUrl || API_URL).replace(/\/api\/?$/, '');
  console.log('Connecting to Socket.io at:', apiBase);

  const preferredTransports = isSafariBrowser()
    ? ['polling', 'websocket']
    : ['websocket', 'polling'];

  chatState.socket = io(apiBase, {
    transports: preferredTransports,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    path: '/socket.io/'
  });

  chatState.socket.on('connect', () => {
    chatState.connected = true;
    stopChatPolling();
    chatState.joinedReference = '';
    chatState.boundReference = '';
    chatState.joinedReferences.clear();
    console.log('✓ Socket.io connected');
    updateChatConnectionStatus();
    updateRegistrationConnectionStatus();

    subscribeToKnownRiderRooms().catch((err) => {
      console.warn('Failed to subscribe to rider rooms:', err?.message || err);
    });
  });

  chatState.socket.on('disconnect', () => {
    chatState.connected = false;
    console.warn('✗ Socket.io disconnected');
    updateChatConnectionStatus();
    updateRegistrationConnectionStatus();
    startChatPolling();
  });

  chatState.socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error);
    startChatPolling();
  });

  chatState.socket.on('chat:message', (data) => {
    if (!data || !data.reference) return;
    const reference = String(data.reference || '');
    const senderRole = String(data.senderRole || '').toLowerCase();
    if (!reference.toLowerCase().startsWith('rider:')) return;

    const rider = ensureRiderForReference(reference);
    if (!rider) return;

    const riderId = rider.__chatId || getRiderChatId(rider);
    const incomingRiderId = parseRiderIdFromReference(reference);
    const isCurrentThread =
      chatState.selectedRiderId === riderId ||
      chatState.selectedRiderId === incomingRiderId ||
      chatState.selectedReferenceCandidates.includes(reference);

    if (isCurrentThread) {
      console.log('Received chat message for active rider thread');
      loadChatMessages(chatState.selectedRiderId, reference);
      return;
    }

    if (senderRole === 'rider') {
      rider.unreadCount = (Number(rider.unreadCount) || 0) + 1;
      renderChatRidersList();
      updateManageChatBadge();
      playAdminChatNotificationTone();
      showGlobalNotice(`New rider message from ${rider.fullName || 'Rider'}`, 'success');
    }
  });

  // Setup registration socket listeners
  initializeRegistrationSocket();
}

function updateChatConnectionStatus() {
  const statusDot = document.getElementById('chat-status-dot');
  const statusText = document.getElementById('chat-status-text');

  if (statusDot) {
    statusDot.classList.toggle('connected', chatState.connected);
  }
  if (statusText) {
    statusText.textContent = chatState.connected ? 'Online' : 'Offline';
  }
}

function updateRegistrationConnectionStatus() {
  const statusDot = document.getElementById('reg-status-dot');
  const statusText = document.getElementById('reg-status-text');

  if (statusDot) {
    statusDot.classList.toggle('connected', chatState.connected);
  }
  if (statusText) {
    statusText.textContent = chatState.connected ? 'Connected (Real-time)' : 'Disconnected (Polling)';
  }
}

async function ensureChatRoomJoined(reference) {
  const token = getAuthToken();
  if (!reference || !token) return false;
  if (!chatState.socket || !chatState.connected) return false;
  if (chatState.joinedReferences.has(reference) && chatState.boundReference === reference) return true;
  const adminName = 'Admin';

  await new Promise((resolve, reject) => {
    chatState.socket.emit('chat:join', {
      reference,
      role: 'admin',
      token,
      name: adminName
    }, (ack) => {
      if (ack?.ok) {
        chatState.joinedReference = reference;
        chatState.boundReference = reference;
        chatState.joinedReferences.add(reference);
        resolve(true);
      } else {
        reject(new Error(ack?.message || 'Unable to join chat room'));
      }
    });
  });

  return true;
}

async function subscribeToKnownRiderRooms() {
  if (!chatState.connected) return;
  const references = new Set();

  for (const rider of chatState.riders) {
    const candidates = getRiderReferenceCandidates(rider, rider.__chatId || getRiderChatId(rider));
    for (const ref of candidates) {
      if (ref) references.add(ref);
    }
  }

  for (const reference of references) {
    if (chatState.joinedReferences.has(reference)) continue;
    try {
      await ensureChatRoomJoined(reference);
    } catch {
      // Ignore individual room join failures and continue.
    }
  }

  if (chatState.activeReference) {
    try {
      await ensureChatRoomJoined(chatState.activeReference);
    } catch {
      // Keep fallback API behavior if active room join fails.
    }
  }
}

async function showChatPanel() {
  const chatPanel = document.getElementById('chat-panel');
  if (!chatPanel) return;

  // Keep the parent panel visible and only switch content.
  setManagementView('chat');
  globalNotice.style.display = 'none';

  // Stop registration polling when switching to chat
  if (registrationState.pollTimer) {
    clearInterval(registrationState.pollTimer);
    registrationState.pollTimer = null;
  }

  // Load riders
  console.log('Loading chat riders...');
  await loadChatRiders();
}

async function loadChatRiders() {
  try {
    const unreadById = new Map(
      chatState.riders.map((rider) => [rider.__chatId || getRiderChatId(rider), Number(rider.unreadCount) || 0])
    );

    const result = await requestWithFallback({
      paths: [
        '/api/admin/riders',
        '/api/admin/riders/all',
        '/api/riders'
      ],
      method: 'GET',
      requiresAuth: true
    });

    if (!result.ok) {
      throw new Error(result.data?.message || 'Failed to fetch riders');
    }

    chatState.riders = extractRiderCollection(result.data)
      .map((rider) => {
        const chatId = getRiderChatId(rider);
        return {
          ...rider,
          __chatId: chatId,
          unreadCount: unreadById.get(chatId) || 0
        };
      })
      .filter((rider) => rider.__chatId);
    renderChatRidersList();
    updateManageChatBadge();
    if (chatState.connected) {
      subscribeToKnownRiderRooms().catch(() => {});
    }
    console.log('✓ Loaded chat riders from:', result.path);
  } catch (err) {
    console.error('Error loading chat riders:', err);
    const ridersList = document.getElementById('chat-riders-list');
    if (ridersList) {
      ridersList.innerHTML = `<p class="empty-state">Error: ${err.message}</p>`;
    }
  }
}

function renderChatRidersList() {
  const ridersList = document.getElementById('chat-riders-list');
  if (!ridersList) return;

  if (!chatState.riders.length) {
    ridersList.innerHTML = '<p class="empty-state">No riders available.</p>';
    return;
  }

  const searchTerm = document.getElementById('chat-rider-search')?.value.toLowerCase() || '';
  const filtered = chatState.riders.filter((rider) => {
    const text = `${rider.fullName || ''} ${rider.phone || ''}`.toLowerCase();
    return !searchTerm || text.includes(searchTerm);
  });

  ridersList.innerHTML = filtered
    .map((rider) => {
      const riderId = rider.__chatId || getRiderChatId(rider);
      return `
      <div class="rider-item ${chatState.selectedRiderId === riderId ? 'active' : ''}" data-rider-id="${escapeHtml(riderId)}">
        <div class="rider-info">
          <div>${escapeHtml(rider.fullName || 'Unknown')}</div>
          <div class="rider-info-sub">${escapeHtml(rider.phone || 'No phone')}</div>
        </div>
        ${rider.unreadCount ? `<span class="rider-unread">${rider.unreadCount}</span>` : ''}
      </div>
    `;
    })
    .join('');

  // Add event listeners to rider items
  ridersList.querySelectorAll('.rider-item').forEach((item) => {
    item.addEventListener('click', () => {
      const riderId = item.dataset.riderId;
      if (!riderId) return;
      selectChatRider(riderId);
    });
  });
}

function selectChatRider(riderId) {
  const selectedRider = chatState.riders.find((r) => (r.__chatId || getRiderChatId(r)) === String(riderId));
  if (!selectedRider) return;

  chatState.selectedRiderId = selectedRider.__chatId || getRiderChatId(selectedRider);
  selectedRider.unreadCount = 0;
  chatState.selectedReferenceCandidates = getRiderReferenceCandidates(selectedRider, chatState.selectedRiderId);
  chatState.activeReference = chatState.selectedReferenceCandidates[0] || '';

  const noSelected = document.getElementById('no-rider-selected');
  const chatContent = document.getElementById('chat-content');

  if (noSelected) noSelected.style.display = 'none';
  if (chatContent) chatContent.style.display = 'flex';

  const chatWithName = document.getElementById('chat-with-name');
  if (chatWithName) chatWithName.textContent = `Chat with ${selectedRider.fullName}`;

  const reference = chatState.activeReference;
  if (chatState.connected) {
    ensureChatRoomJoined(reference).catch((err) => {
      console.warn('Realtime join failed, fallback API send will be used:', err?.message || err);
    });
  }

  loadChatMessages(chatState.selectedRiderId, reference);
  if (!chatState.connected) {
    startChatPolling();
  }
  renderChatRidersList();
  updateManageChatBadge();
}

async function loadChatMessages(riderId, preferredReference = '') {
  const token = getAuthToken();
  if (!token) return;

  try {
    await ensureApiResolved();
    const rider = chatState.riders.find((item) => (item.__chatId || getRiderChatId(item)) === String(riderId));
    const candidates = [
      preferredReference,
      chatState.activeReference,
      ...(chatState.selectedReferenceCandidates || []),
      ...getRiderReferenceCandidates(rider, riderId)
    ].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);

    let chosenReference = '';
    let chosenMessages = [];

    for (const reference of candidates) {
      const response = await fetch(apiUrl(`/api/chat/${encodeURIComponent(reference)}/messages?role=admin`), {
        method: 'GET',
        headers: authHeaders(token, false)
      });
      if (!response.ok) continue;

      const data = await response.json();
      const rawMessages = Array.isArray(data?.messages) ? data.messages : extractCollection(data);
      const normalized = rawMessages
        .filter((msg) => msg && (msg.text || msg.message))
        .map((msg) => ({
          text: String(msg.text || msg.message || ''),
          senderRole: String(msg.senderRole || msg.role || '').toLowerCase(),
          createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
        }));

      if (!chosenReference || normalized.length > 0) {
        chosenReference = reference;
        chosenMessages = normalized;
      }
      if (normalized.length > 0) break;
    }

    if (!chosenReference && candidates.length) {
      chosenReference = candidates[0];
    }

    if (chosenReference) {
      chatState.activeReference = chosenReference;
      if (chatState.connected) {
        ensureChatRoomJoined(chosenReference).catch(() => {});
      }
    }

    chatState.messages = chosenMessages;
    renderChatMessages();
  } catch (err) {
    console.error('Error loading chat messages:', err);
  }
}

async function postChatMessageViaApi(reference, text, token) {
  const response = await fetch(apiUrl(`/api/chat/${encodeURIComponent(reference)}/messages`), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      senderRole: 'admin',
      senderName: 'Admin',
      text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    let message = body;
    try {
      const parsed = JSON.parse(body);
      message = parsed?.message || body;
    } catch {
      message = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    throw new Error(message || 'Failed to send message');
  }

  return response;
}

function renderChatMessages() {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  if (!chatState.messages.length) {
    messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Start the conversation!</div>';
    return;
  }

  messagesContainer.innerHTML = chatState.messages
    .map((msg) => {
      const isAdmin = msg.senderRole === 'admin';
      const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="chat-message ${isAdmin ? 'admin' : 'rider'}">
          <div>${escapeHtml(msg.text || '')}</div>
          <div class="chat-message-time">${escapeHtml(time)}</div>
        </div>
      `;
    })
    .join('');

  // Auto-scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendChatMessage() {
  if (!chatState.selectedRiderId) return;

  const chatInput = document.getElementById('chat-message-input');
  if (!chatInput) return;

  const text = chatInput.value?.trim();
  if (!text) return;

  const token = getAuthToken();
  if (!token) return;

  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  try {
    await ensureApiResolved();
    const reference = chatState.activeReference || `rider:${chatState.selectedRiderId}`;

    // Try real-time if socket connected
    if (chatState.connected && chatState.socket) {
      let joined = false;
      try {
        joined = await ensureChatRoomJoined(reference);
      } catch (err) {
        console.warn('Realtime join failed before send:', err?.message || err);
      }

      if (joined) {
        try {
          await new Promise((resolve, reject) => {
            chatState.socket.emit('chat:message', {
              reference,
              senderRole: 'admin',
              token,
              senderName: 'Admin',
              text
            }, (ack) => {
              if (ack?.ok) resolve();
              else reject(new Error(ack?.message || 'Send failed'));
            });
          });
        } catch (socketSendErr) {
          console.warn('Realtime send failed, falling back to API:', socketSendErr?.message || socketSendErr);
          await postChatMessageViaApi(reference, text, token);
        }
      } else {
        // Fallback to API when socket room join is unavailable.
        await postChatMessageViaApi(reference, text, token);
      }
    } else {
      // Fallback to API
      await postChatMessageViaApi(reference, text, token);
    }

    chatInput.value = '';
    await loadChatMessages(chatState.selectedRiderId, reference);
  } catch (err) {
    console.error('Error sending message:', err);
    alert(`Failed to send message: ${err.message}`);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

// Chat event listeners
const chatRiderSearch = document.getElementById('chat-rider-search');
if (chatRiderSearch) {
  chatRiderSearch.addEventListener('input', () => {
    renderChatRidersList();
  });
}

const chatSendBtn = document.getElementById('chat-send-btn');
if (chatSendBtn) {
  chatSendBtn.addEventListener('click', sendChatMessage);
}

const chatMessageInput = document.getElementById('chat-message-input');
if (chatMessageInput) {
  chatMessageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
}

// Load registrations and initialize socket when showing dashboard
const originalShowDashboardFinal = showDashboard;
showDashboard = function() {
  originalShowDashboardFinal.call(this);
  // Initialize Socket.io and listeners
  setTimeout(async () => {
    await ensureApiResolved();
    initializeSocket();
    loadPendingRegistrations();
  }, 100);
};

// Clean up on logout
const originalShowLogin = showLogin;
showLogin = function() {
  if (chatState.chatPollTimer) clearInterval(chatState.chatPollTimer);
  stopChatPolling();
  if (chatState.socket) {
    chatState.socket.off('rider:registered');
    chatState.socket.off('rider:updated');
    chatState.socket.off('rider:application');
    chatState.socket.off('chat:message');
    chatState.socket.disconnect();
  }
  chatState.selectedRiderId = null;
  chatState.selectedReferenceCandidates = [];
  chatState.activeReference = '';
  chatState.riders = [];
  chatState.messages = [];
  chatState.connected = false;
  chatState.joinedReference = '';
  chatState.boundReference = '';
  chatState.joinedReferences.clear();
  updateManageChatBadge();
  registrationState.pendingRiders = [];
  registrationState.unreadCount = 0;
  originalShowLogin.call(this);
};

// ========== PENDING REGISTRATIONS SYSTEM ==========

// Registration state management
const registrationState = {
  pendingRiders: [],
  socket: null,
  connected: false,
  pollTimer: null,
  unreadCount: 0
};

// Initialize registration socket events
function initializeRegistrationSocket() {
  if (!chatState.socket) {
    console.log('Socket not ready yet, registration listeners will be set up after connection');
    return;
  }

  console.log('Setting up registration socket listeners');

  // Remove existing listeners to avoid duplicates
  chatState.socket.off('rider:registered');
  chatState.socket.off('rider:updated');
  chatState.socket.off('rider:application');

  // Listen for new rider registrations
  chatState.socket.on('rider:registered', (data) => {
    console.log('Event: rider:registered', data);
    if (data && data.rider) {
      const incomingId = getRiderId(data.rider);
      const exists = registrationState.pendingRiders.find((r) => getRiderId(r) === incomingId);
      if (!exists) {
        registrationState.pendingRiders.unshift(data.rider);
        registrationState.unreadCount++;
        updatePendingBadge();
        renderRegistrations();
        showRegistrationNotification(`New registration from ${data.rider.fullName || 'New Rider'}`);
      }
    }
  });

  // Listen for new rider applications
  chatState.socket.on('rider:application', (data) => {
    console.log('Event: rider:application', data);
    if (data && (data.rider || data)) {
      const rider = data.rider || data;
      if (rider.status === 'pending') {
        const incomingId = getRiderId(rider);
        const exists = registrationState.pendingRiders.find((r) => getRiderId(r) === incomingId);
        if (!exists) {
          registrationState.pendingRiders.unshift(rider);
          registrationState.unreadCount++;
          updatePendingBadge();
          renderRegistrations();
          showRegistrationNotification(`New registration from ${rider.fullName || 'New Rider'}`);
        }
      }
    }
  });

  // Listen for registration status updates
  chatState.socket.on('rider:updated', (data) => {
    console.log('Event: rider:updated', data);
    if (data && data.rider) {
      const incomingId = getRiderId(data.rider);
      const index = registrationState.pendingRiders.findIndex((r) => getRiderId(r) === incomingId);
      if (index !== -1) {
        if (data.rider.status !== 'pending') {
          registrationState.pendingRiders.splice(index, 1);
        } else {
          registrationState.pendingRiders[index] = data.rider;
        }
        updatePendingBadge();
        renderRegistrations();
      }
    }
  });

  console.log('✓ Registration socket listeners configured');
}

async function loadPendingRegistrations() {
  try {
    const result = await requestWithFallback({
      paths: [
        '/api/admin/riders',
        '/api/riders',
        '/api/rider-applications',
        '/api/admin/rider-applications'
      ],
      method: 'GET',
      requiresAuth: true
    });

    if (!result.ok) {
      throw new Error(result.data?.message || 'Failed to fetch riders');
    }

    const riders = extractRiderCollection(result.data);
    registrationState.pendingRiders = Array.isArray(riders)
      ? riders.filter((r) => String(r.status || '').toLowerCase() === 'pending').sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )
      : [];

    registrationState.unreadCount = 0;
    updatePendingBadge();
    renderRegistrations();
    console.log('✓ Loaded pending registrations from:', result.path, registrationState.pendingRiders.length, 'pending');
  } catch (err) {
    console.error('Error loading pending registrations:', err);
    const regList = document.getElementById('registrations-list');
    if (regList) {
      regList.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
    }
  }
}

function updatePendingBadge() {
  const badge = document.getElementById('pending-badge');
  if (!badge) return;

  if (registrationState.pendingRiders.length > 0) {
    badge.textContent = registrationState.pendingRiders.length;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

function renderRegistrations() {
  const regList = document.getElementById('registrations-list');
  if (!regList) return;

  if (!registrationState.pendingRiders.length) {
    regList.innerHTML = '<div class="empty-state">No pending rider registrations at the moment.</div>';
    return;
  }

  regList.innerHTML = registrationState.pendingRiders
    .map((rider, index) => {
      const riderId = getRiderId(rider);
      const createdAt = new Date(rider.createdAt);
      const timeAgo = getTimeAgo(createdAt);
      const isNew = index === 0 && registrationState.unreadCount > 0;

      return `
        <div class="registration-card ${isNew ? 'new-alert' : ''}" data-rider-id="${escapeHtml(riderId)}">
          <div class="registration-head">
            <div>
              <div class="registration-name">${escapeHtml(rider.fullName || 'Unknown')}</div>
              ${isNew ? '<span class="registration-new-badge">NEW</span>' : ''}
            </div>
            <span class="registration-time">${escapeHtml(timeAgo)}</span>
          </div>

          <div class="registration-details">
            <div class="registration-detail-item">
              <span class="registration-detail-label">Phone</span>
              <span class="registration-detail-value">${escapeHtml(rider.phone || 'N/A')}</span>
            </div>
            <div class="registration-detail-item">
              <span class="registration-detail-label">Vehicle</span>
              <span class="registration-detail-value">${escapeHtml(rider.vehicleType || 'Not specified')}</span>
            </div>
            <div class="registration-detail-item">
              <span class="registration-detail-label">License ID</span>
              <span class="registration-detail-value">${escapeHtml(rider.vehicleLicenseId || 'N/A')}</span>
            </div>
            <div class="registration-detail-item">
              <span class="registration-detail-label">Registered</span>
              <span class="registration-detail-value">${escapeHtml(formatDate(rider.createdAt))}</span>
            </div>
          </div>

          <div class="registration-documents">
            <div class="document-item ${rider.ghanaCardId ? 'present' : 'missing'}">Ghana Card ID</div>
            <div class="document-item ${rider.vehicleLicenseId ? 'present' : 'missing'}">Vehicle License</div>
            <div class="document-item ${rider.isAvailable !== undefined ? 'present' : 'missing'}">Availability</div>
            <div class="document-item ${rider.phone ? 'present' : 'missing'}">Contact</div>
          </div>

          <div class="registration-actions">
            <button class="approval-btn approve" onclick="approveRider('${escapeHtml(riderId)}', this)">
              ✓ Approve
            </button>
            <button class="approval-btn reject" onclick="rejectRider('${escapeHtml(riderId)}', this)">
              ✕ Reject
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';

  return Math.floor(seconds) + 's ago';
}

async function approveRider(riderId, buttonEl) {
  if (!riderId) return;
  await updateRiderRegistration(riderId, 'approved', buttonEl);
}

async function rejectRider(riderId, buttonEl) {
  if (!riderId) return;
  const confirm = window.confirm('Are you sure you want to reject this registration?');
  if (!confirm) return;
  await updateRiderRegistration(riderId, 'rejected', buttonEl);
}

async function updateRiderRegistration(riderId, status, buttonEl) {
  if (buttonEl) {
    buttonEl.classList.add('loading');
    buttonEl.disabled = true;
  }

  try {
    console.log(`Updating rider ${riderId} to status: ${status}`);
    const result = await requestWithFallback({
      paths: [
        `/api/admin/riders/${riderId}/status`,
        `/api/admin/riders/${riderId}`,
        `/api/riders/${riderId}/status`,
        `/api/riders/${riderId}`
      ],
      method: 'PUT',
      payload: { status },
      requiresAuth: true
    });

    if (!result.ok) {
      throw new Error(result.data?.message || `Failed to update rider (${result.status})`);
    }

    const updatedRider = result.data?.rider || result.data || {};

    // Remove from pending list
    const index = registrationState.pendingRiders.findIndex((r) => getRiderId(r) === String(riderId));
    if (index !== -1) {
      registrationState.pendingRiders.splice(index, 1);
      updatePendingBadge();
      renderRegistrations();
    }

    // Show success message
    const action = status === 'approved' ? 'Approved' : 'Rejected';
    const riderName = updatedRider.fullName || updatedRider.name || 'Rider';
    showGlobalNotice(`${riderName} ${action.toLowerCase()} successfully!`, status === 'approved' ? 'success' : 'error');

    // Add to audit log
    addAuditLog(status === 'approved' ? 'APPROVE' : 'REJECT', 'riders', `${riderName} - ${status}`);
    console.log(`✓ Rider updated successfully via ${result.path}`);
  } catch (err) {
    console.error('Error updating rider status:', err);
    showGlobalNotice(`Error: ${err.message}`, 'error');
  } finally {
    if (buttonEl) {
      buttonEl.classList.remove('loading');
      buttonEl.disabled = false;
    }
  }
}

function showRegistrationNotification(message) {
  const notif = document.getElementById('registrations-notification');
  const notifMsg = document.getElementById('notification-message');

  if (notif && notifMsg) {
    notifMsg.textContent = message;
    notif.style.display = 'block';

    setTimeout(() => {
      notif.style.display = 'none';
    }, 5000);
  }
}

// Registrations panel button
const pendingsBtn = document.getElementById('pending-registrations-btn');
if (pendingsBtn) {
  pendingsBtn.addEventListener('click', async () => {
    const chatPanel = document.getElementById('chat-panel');
    if (chatPanel) chatPanel.style.display = 'none';

    const regPanel = document.getElementById('registrations-panel');
    if (regPanel) {
      setManagementView('registrations');
      await loadPendingRegistrations();
      registrationState.unreadCount = 0;
      updatePendingBadge();
      
      // Set up polling if not real-time
      if (!chatState.connected && !registrationState.pollTimer) {
        console.log('Real-time not available, starting polling for pending registrations');
        registrationState.pollTimer = setInterval(() => {
          loadPendingRegistrations().catch(err => console.error('Poll error:', err));
        }, 5000);
      }
    }
  });
}

// Close notification
const notifClose = document.getElementById('notification-close');
if (notifClose) {
  notifClose.addEventListener('click', () => {
    const notif = document.getElementById('registrations-notification');
    if (notif) notif.style.display = 'none';
  });
}
