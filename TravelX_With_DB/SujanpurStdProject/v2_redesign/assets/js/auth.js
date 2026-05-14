// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to show messages
function showMessage(message, type = 'success') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `alert alert-${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    padding: 12px 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
  `;
  
  const form = document.querySelector('form');
  form.insertBefore(messageDiv, form.firstChild);
  
  setTimeout(() => messageDiv.remove(), 5000);
}

// Check if user is logged in
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

// Get user from localStorage
function getStoredUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Set user in localStorage
function setStoredUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Clear user from localStorage
function clearStoredUser() {
  localStorage.removeItem('user');
}

// Logout function
async function logout() {
  // Confirm logout
  if (!confirm('Are you sure you want to logout?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    clearStoredUser();
    localStorage.removeItem('token');
    
    // Show logout message
    const messageDiv = document.createElement('div');
    messageDiv.textContent = '👋 Logged out successfully!';
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
      window.location.href = 'home.html';
    }, 1500);
  } catch (error) {
    console.error('Logout failed:', error);
    // Force logout even if API fails
    clearStoredUser();
    localStorage.removeItem('token');
    window.location.href = 'home.html';
  }
}

// Update navbar with user info
function updateNavbar() {
  const user = getStoredUser();
  const loginLink = document.getElementById('loginLink');
  const userMenu = document.getElementById('userMenu');
  
  if (user) {
    if (loginLink) loginLink.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      const userNameSpan = document.getElementById('userName');
      if (userNameSpan) userNameSpan.textContent = user.name;
    }
  } else {
    if (loginLink) loginLink.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateNavbar);
