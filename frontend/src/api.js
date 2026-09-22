// Lightweight API client — targets Spring Boot backend at :8080.
// Override with REACT_APP_API_URL env var if backend runs elsewhere.
const explicit = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : '';
// Direct backend URLs — no relative proxy needed since CRA proxy is not configured
const BASE_CANDIDATES = explicit
  ? [explicit]
  : [
      'http://localhost:8080',  // Spring Boot backend (primary)
      'http://127.0.0.1:8080', // fallback alias
    ];

async function request(path, { method = 'GET', body, headers, useFormData = false } = {}) {
  let lastError;
  for (const base of BASE_CANDIDATES) {
    const url = `${base}${path}`;
    try {
      // Handle different body types
      let requestBody;
      let requestHeaders = { ...(headers || {}) };
      
      if (body instanceof FormData) {
        // For FormData, don't set Content-Type (browser will set it with boundary)
        requestBody = body;
      } else if (body) {
        requestBody = useFormData ? new URLSearchParams(body).toString() : JSON.stringify(body);
        requestHeaders['Content-Type'] = useFormData ? 'application/x-www-form-urlencoded' : 'application/json';
      }
      
      const res = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials: 'omit',
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (!res.ok) {
        const message = data?.message || data?.error || `Request to ${path} failed (${res.status})`;
        if (process.env.NODE_ENV === 'development') {
          console.debug('[api] non-OK response', { triedBase: base || '<relative>', url, status: res.status, data });
        }
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err; // do not fallback on logical error responses
      }
      if (process.env.NODE_ENV === 'development' && base && base !== explicit) {
        console.debug('[api] succeeded using fallback base', base);
      }
      return data;
    } catch (err) {
      // Proceed to next candidate only on network errors — not on logical errors (4xx/5xx from backend)
      const isNetwork = err.isNetworkError || err.status == null;
      if (isNetwork) {
        lastError = err;
        if (process.env.NODE_ENV === 'development') {
          console.debug('[api] network failure, trying next base', { failedBase: base, status: err.status, error: err.message });
        }
        continue;
      }
      throw err; // logical/server error (401, 403, 404, 500…), stop early
    }
  }
  const basesTried = BASE_CANDIDATES.map(b => b || '<relative>').join(', ');
  const msg = `Cannot reach backend. Tried bases: ${basesTried}. Last error: ${lastError?.message}`;
  const finalErr = new Error(msg);
  finalErr.isNetworkError = true;
  throw finalErr;
}

function extractAuth(data) {
  // Spring Boot backend returns a flat UserDto with jwtToken field.
  // The user object IS the data itself (id, name, email, role, jwtToken, profileImageUrl).
  const token = data.jwtToken || data.token || data.accessToken || data.jwt || data.data?.token || null;
  // If backend returns a flat user object (has id + email), use it directly
  const user = data.user || data.data?.user || data.profile || data.userDto ||
    (data.id != null && data.email ? { id: data.id, name: data.name, email: data.email, role: data.role, profileImageUrl: data.profileImageUrl, verified: data.verified } : null);
  return { user, token, raw: data };
}

export const api = {
  register: async ({ name, email, password, confirmPassword }) => {
    const data = await request('/users/register', {
      method: 'POST',
      body: { name, email, password, confirmPassword },
    });
    return extractAuth(data);
  },
  login: async ({ email, password }) => {
    const data = await request('/users/login/body', {
      method: 'POST',
      body: { email, password },
    });
    return extractAuth(data);
  },
  me: async (token) => {
    return request('/users/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateMe: async (token, data) => {
    return request('/users/me', {
      method: 'PUT',
      body: data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateProfileImage: async (token, url) => {
    return request(`/users/me/profile-image?url=${encodeURIComponent(url)}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  myOrders: async (token) => {
    return request('/users/me/orders', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  deleteMe: async (token) => {
    return request('/users/me', {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  listUsers: async (token) => {
    return request('/users', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  requestPasswordReset: async (email) => {
    return request('/users/password-reset/request', {
      method: 'POST',
      body: { email },
    });
  },
  confirmPasswordReset: async ({ token, newPassword }) => {
    return request('/users/password-reset/confirm', {
      method: 'POST',
      body: { token, newPassword },
    });
  },
  changePassword: async ({ email, oldPassword, newPassword }) => {
    return request('/users/change-password', {
      method: 'POST',
      body: { email, oldPassword, newPassword },
    });
  },
  
  // Cart operations - backend extracts user email from JWT Authentication
  getCart: async (token) => {
    return request('/api/cart', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  addToCart: async (token, bookId, quantity = 1) => {
    return request(`/api/cart/add?bookId=${bookId}&quantity=${quantity}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateCartItem: async (token, bookId, quantity) => {
    return request(`/api/cart/update?bookId=${bookId}&quantity=${quantity}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  removeFromCart: async (token, bookId) => {
    return request(`/api/cart/remove?bookId=${bookId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  clearCart: async (token) => {
    return request('/api/cart/clear', {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Order operations
  placeOrder: async (token, orderData) => {
    return request('/api/orders/place', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: orderData,
    });
  },
  getUserOrders: async (token) => {
    return request('/api/orders/history', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  getOrderById: async (token, orderId) => {
    return request(`/api/orders/${orderId}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  cancelOrder: async (token, orderId) => {
    return request(`/api/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  deleteOrder: async (token, orderId) => {
    return request(`/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

// Admin API endpoints
// Public API endpoints (no authentication required)
export const publicApi = {
  // Books - public access
  getBooks: async () => {
    return request('/books');
  },
  getBook: async (id) => {
    return request(`/books/${id}`);
  },
  // Categories - public access
  getCategories: async () => {
    return request('/categories');
  },
};

export const adminApi = {
  // Auth
  login: async ({ email, password }) => {
    const data = await request('/admin/login', {
      method: 'POST',
      body: { email, password },
    });
    return extractAuth(data);
  },
  logout: async (token) => {
    return request('/admin/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Dashboard
  getDashboard: async (token) => {
    return request('/admin/dashboard', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  getDashboardStats: async (token) => {
    return request('/admin/dashboard/stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Books
  getBooks: async (token) => {
    return request('/books', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  getBook: async (token, id) => {
    return request(`/books/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  createBook: async (token, bookData) => {
    return request('/books', {
      method: 'POST',
      body: bookData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateBook: async (token, id, bookData) => {
    return request(`/books/${id}`, {
      method: 'PUT',
      body: bookData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  deleteBook: async (token, id) => {
    return request(`/books/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateBookStock: async (token, id, stock) => {
    return request(`/books/${id}/stock?stock=${stock}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateBookPrice: async (token, id, price) => {
    return request(`/books/${id}/price?price=${price}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  uploadBookImage: async (token, id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/admin/books/${id}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Categories
  getCategories: async (token) => {
    return request('/categories', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  createCategory: async (token, categoryData) => {
    return request('/categories', {
      method: 'POST',
      body: categoryData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateCategory: async (token, id, categoryData) => {
    return request(`/categories/${id}`, {
      method: 'PUT',
      body: categoryData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  deleteCategory: async (token, id) => {
    return request(`/categories/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Users
  getUsers: async (token) => {
    return request('/admin/users', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  getUserById: async (id, token) => {
    return request(`/admin/users/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  createUser: async (userData, token) => {
    return request('/admin/users', {
      method: 'POST',
      body: userData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateUser: async (id, userData, token) => {
    return request(`/admin/users/${id}`, {
      method: 'PUT',
      body: userData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateUserRole: async (id, role, token) => {
    return request(`/admin/users/${id}/role?role=${role}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  deleteUser: async (id, token) => {
    return request(`/admin/users/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  activateUser: async (id, token) => {
    return request(`/admin/users/${id}/activate`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  deactivateUser: async (id, token) => {
    return request(`/admin/users/${id}/deactivate`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Orders
  getOrders: async (token) => {
    return request('/admin/orders', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateOrderStatus: async (token, orderId, orderStatus) => {
    return request(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: { orderStatus },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Password
  changePassword: async (token, currentPassword, newPassword) => {
    return request(`/admin/password?currentPassword=${currentPassword}&newPassword=${newPassword}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

export default api;
