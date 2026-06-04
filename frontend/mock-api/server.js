// Simple mock API server for local development
// Provides /api/register and /api/login endpoints

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
// Use 5050 by default to align with CRA proxy in package.json
const PORT = process.env.PORT || 5050;

app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      // Added dev port variants
      'http://localhost:3010',
      'http://127.0.0.1:3010',
    ],
    credentials: true,
  })
);

// Basic file-backed persistence (still NOT secure; for demo only)
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'users.json');
let nextId = 1;
const users = new Map(); // key: email, value: { id, name, email, password }
const carts = new Map(); // key: email, value: { items: [{ book: {...}, quantity: number }] }

function loadUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return;
    const arr = JSON.parse(raw);
    arr.forEach((u) => {
      users.set(u.email.toLowerCase(), u);
      if (u.id >= nextId) nextId = u.id + 1;
    });
    // eslint-disable-next-line no-console
    console.log(`Loaded ${users.size} users from ${DATA_FILE}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to load users.json:', e.message);
  }
}

function persistUsers() {
  try {
    const arr = Array.from(users.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to persist users.json:', e.message);
  }
}

loadUsers();

function makeToken(email) {
  const rand = Math.random().toString(36).slice(2);
  return `mock-${Buffer.from(`${email}-${Date.now()}-${rand}`).toString('base64url')}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mock-api' });
});

app.post('/api/register', (req, res) => {
  const { name, username, email, password, confirmPassword, passwordConfirmation } = req.body || {};
  const nm = name || username || '';
  const pw = password || '';
  const em = (email || '').toLowerCase().trim();

  if (!nm || !em || !pw) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: {
        name: nm ? [] : ['Name is required'],
        email: em ? [] : ['Email is required'],
        password: pw ? [] : ['Password is required'],
      },
    });
  }
  if ((confirmPassword || passwordConfirmation) && pw !== (confirmPassword || passwordConfirmation)) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (users.has(em)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = { id: nextId++, name: nm, email: em, password: pw };
  users.set(em, user);
  const token = makeToken(em);
  persistUsers();

  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const em = (email || '').toLowerCase().trim();
  const pw = password || '';
  const user = users.get(em);
  if (!user || user.password !== pw) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = makeToken(em);
  // Optionally rotate token; no persistence needed on login
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

app.get('/api/profile', (req, res) => {
  // Demo profile endpoint; in real world would auth by token
  const sample = Array.from(users.values())[0];
  if (!sample) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: { id: sample.id, name: sample.name, email: sample.email } });
});

// Duplicate endpoints under /users/* to match frontend api.js expectations
app.post('/users/register', (req, res) => {
  const { name, username, email, password, confirmPassword, passwordConfirmation } = req.body || {};
  const nm = name || username || '';
  const pw = password || '';
  const em = (email || '').toLowerCase().trim();
  if (!nm || !em || !pw) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: {
        name: nm ? [] : ['Name is required'],
        email: em ? [] : ['Email is required'],
        password: pw ? [] : ['Password is required'],
      },
    });
  }
  if ((confirmPassword || passwordConfirmation) && pw !== (confirmPassword || passwordConfirmation)) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (users.has(em)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const user = { id: nextId++, name: nm, email: em, password: pw };
  users.set(em, user);
  const token = makeToken(em);
  persistUsers();
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

app.post('/users/login', (req, res) => {
  const { email, password } = req.body || {};
  const em = (email || '').toLowerCase().trim();
  const pw = password || '';
  const user = users.get(em);
  if (!user || user.password !== pw) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = makeToken(em);
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

app.get('/users/me', (req, res) => {
  const sample = Array.from(users.values())[0];
  if (!sample) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: { id: sample.id, name: sample.name, email: sample.email } });
});

app.get('/users', (_req, res) => {
  const list = Array.from(users.values()).map(u => ({ id: u.id, name: u.name, email: u.email }));
  res.json({ users: list });
});

// Admin endpoints
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  const em = (email || '').toLowerCase().trim();
  const pw = password || '';
  const user = users.get(em);
  if (!user || user.password !== pw) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  // Check if user is admin (in mock, we'll check if email contains 'admin')
  const isAdmin = em.includes('admin');
  const token = makeToken(em);
  res.json({ 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email,
      role: isAdmin ? 'ADMIN' : 'USER'
    }, 
    token 
  });
});

app.post('/admin/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/admin/dashboard', (_req, res) => {
  res.json({ message: 'Admin dashboard' });
});

app.get('/admin/dashboard/stats', (_req, res) => {
  res.json({
    totalRevenue: 125487.50,
    totalOrders: 1234,
    totalUsers: 567,
    totalBooks: 89,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    usersGrowth: 15.2,
    booksGrowth: 5.1
  });
});

app.get('/admin/books', (_req, res) => {
  const mockBooks = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', price: 12.99, stock: 50, sold: 145 },
    { id: 2, title: '1984', author: 'George Orwell', price: 14.99, stock: 35, sold: 123 },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', price: 13.99, stock: 42, sold: 98 },
    { id: 4, title: 'Pride and Prejudice', author: 'Jane Austen', price: 11.99, stock: 28, sold: 87 },
    { id: 5, title: 'The Catcher in the Rye', author: 'J.D. Salinger', price: 13.49, stock: 31, sold: 76 }
  ];
  res.json(mockBooks);
});

app.get('/admin/orders', (_req, res) => {
  const mockOrders = [
    { id: 1, userId: 1, bookId: 1, quantity: 2, total: 25.98, status: 'COMPLETED', createdAt: '2025-12-20T10:30:00Z' },
    { id: 2, userId: 2, bookId: 2, quantity: 1, total: 14.99, status: 'PENDING', createdAt: '2025-12-21T14:15:00Z' },
    { id: 3, userId: 3, bookId: 3, quantity: 3, total: 41.97, status: 'COMPLETED', createdAt: '2025-12-22T09:45:00Z' },
    { id: 4, userId: 1, bookId: 4, quantity: 1, total: 11.99, status: 'SHIPPED', createdAt: '2025-12-23T16:20:00Z' },
    { id: 5, userId: 4, bookId: 5, quantity: 2, total: 26.98, status: 'COMPLETED', createdAt: '2025-12-24T11:00:00Z' }
  ];
  res.json(mockOrders);
});

app.get('/admin/users', (_req, res) => {
  const list = Array.from(users.values()).map(u => ({ 
    id: u.id, 
    name: u.name, 
    email: u.email,
    role: u.email.includes('admin') ? 'ADMIN' : 'USER',
    active: true,
    createdAt: '2025-01-01T00:00:00Z'
  }));
  res.json(list);
});

app.get('/admin/categories', (_req, res) => {
  const mockCategories = [
    { id: 1, name: 'Fiction', bookCount: 45 },
    { id: 2, name: 'Non-Fiction', bookCount: 23 },
    { id: 3, name: 'Science', bookCount: 12 },
    { id: 4, name: 'History', bookCount: 9 }
  ];
  res.json(mockCategories);
});

// Mock books data for cart
const mockBooks = {
  1: { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', price: 12.99, stock: 50, imageUrl: '/images/great-gatsby.jpg', description: 'A classic American novel', category: 'Fiction' },
  2: { id: 2, title: '1984', author: 'George Orwell', price: 14.99, stock: 35, imageUrl: '/images/1984.jpg', description: 'Dystopian social science fiction', category: 'Sci‑Fi' },
  3: { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', price: 13.99, stock: 42, imageUrl: '/images/mockingbird.jpg', description: 'Coming-of-age story of racism in the Deep South', category: 'Fiction' },
  4: { id: 4, title: 'Pride and Prejudice', author: 'Jane Austen', price: 11.99, stock: 28, imageUrl: '/images/pride.jpg', description: 'Romantic novel of manners', category: 'Romance' },
  5: { id: 5, title: 'The Catcher in the Rye', author: 'J.D. Salinger', price: 13.49, stock: 31, imageUrl: '/images/catcher.jpg', description: 'Classic coming-of-age story', category: 'Fiction' }
};

// Public books endpoint
app.get('/books', (_req, res) => {
  const booksList = Object.values(mockBooks);
  res.json(booksList);
});

// Helper to extract email from mock token
function getUserEmailFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer mock-')) {
    return null;
  }
  try {
    const tokenPart = authHeader.replace('Bearer mock-', '');
    const decoded = Buffer.from(tokenPart, 'base64url').toString();
    const email = decoded.split('-')[0];
    return email;
  } catch {
    return null;
  }
}

// Cart endpoints
app.get('/api/cart', (req, res) => {
  const email = getUserEmailFromToken(req);
  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const cart = carts.get(email) || { items: [] };
  res.json(cart);
});

app.post('/api/cart/add', (req, res) => {
  const email = getUserEmailFromToken(req);
  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const bookId = parseInt(req.query.bookId);
  const quantity = parseInt(req.query.quantity) || 1;
  
  if (!bookId || !mockBooks[bookId]) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  const cart = carts.get(email) || { items: [] };
  const existingItem = cart.items.find(item => item.book.id === bookId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      book: mockBooks[bookId],
      quantity: quantity
    });
  }
  
  carts.set(email, cart);
  res.json({ message: 'Item added to cart', cart });
});

app.post('/api/cart/update', (req, res) => {
  const email = getUserEmailFromToken(req);
  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const bookId = parseInt(req.query.bookId);
  const quantity = parseInt(req.query.quantity);
  
  if (!bookId || quantity < 1) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const cart = carts.get(email) || { items: [] };
  const item = cart.items.find(item => item.book.id === bookId);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  item.quantity = quantity;
  carts.set(email, cart);
  res.json({ message: 'Cart updated', cart });
});

app.delete('/api/cart/remove', (req, res) => {
  const email = getUserEmailFromToken(req);
  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const bookId = parseInt(req.query.bookId);
  
  if (!bookId) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const cart = carts.get(email) || { items: [] };
  cart.items = cart.items.filter(item => item.book.id !== bookId);
  carts.set(email, cart);
  res.json({ message: 'Item removed from cart', cart });
});

app.delete('/api/cart/clear', (req, res) => {
  const email = getUserEmailFromToken(req);
  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  carts.set(email, { items: [] });
  res.json({ message: 'Cart cleared', cart: { items: [] } });
});

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock API listening on http://localhost:${PORT}`);
});
