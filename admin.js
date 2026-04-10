// API Base URL - Update this to match your backend
const API_URL = 'http://localhost:5000'; // Change to your deployed backend URL

// Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Stats Elements
const totalOrdersEl = document.getElementById('total-orders');
const totalProductsEl = document.getElementById('total-products');
const totalRidersEl = document.getElementById('total-riders');
const pendingRidersEl = document.getElementById('pending-riders');
const totalRevenueEl = document.getElementById('total-revenue');

// Action Buttons
const manageProductsBtn = document.getElementById('manage-products-btn');
const manageRidersBtn = document.getElementById('manage-riders-btn');
const manageOrdersBtn = document.getElementById('manage-orders-btn');

// Check if user is already logged in
function checkAuth() {
  const token = localStorage.getItem('adminToken');
  if (token) {
    showDashboard();
    fetchStats();
  } else {
    showLogin();
  }
}

// Show Login Section
function showLogin() {
  loginSection.style.display = 'flex';
  dashboardSection.style.display = 'none';
}

// Show Dashboard Section
function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    loginError.textContent = 'Please fill all fields';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      loginError.textContent = data.message || 'Login failed';
      return;
    }

    // Store token
    localStorage.setItem('adminToken', data.token);
    loginError.textContent = '';
    
    // Clear form
    loginForm.reset();
    
    // Show dashboard
    showDashboard();
    fetchStats();
  } catch (err) {
    loginError.textContent = 'Error connecting to backend';
    console.error(err);
  }
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  showLogin();
  loginForm.reset();
  loginError.textContent = '';
});

// Fetch Dashboard Stats
async function fetchStats() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    showLogin();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Token expired
      localStorage.removeItem('adminToken');
      showLogin();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('Error fetching stats:', data.message);
      return;
    }

    // Update UI
    totalOrdersEl.textContent = data.totalOrders || 0;
    totalProductsEl.textContent = data.totalProducts || 0;
    totalRidersEl.textContent = data.totalRiders || 0;
    pendingRidersEl.textContent = data.pendingRiders || 0;
    totalRevenueEl.textContent = `GHS ${(data.totalRevenue || 0).toFixed(2)}`;
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
  }
}

// Action Button Handlers
manageProductsBtn.addEventListener('click', () => {
  alert('Manage Products feature coming soon!');
  // TODO: Implement product management UI
});

manageRidersBtn.addEventListener('click', () => {
  alert('Manage Riders feature coming soon!');
  // TODO: Implement rider management UI
});

manageOrdersBtn.addEventListener('click', () => {
  alert('View Orders feature coming soon!');
  // TODO: Implement orders view UI
});

// Refresh stats every 30 seconds
setInterval(() => {
  if (localStorage.getItem('adminToken')) {
    fetchStats();
  }
}, 30000);

// Initialize
window.addEventListener('DOMContentLoaded', checkAuth);
