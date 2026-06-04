# Admin Login Flow Diagram

## 📊 System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │◄────────│  Spring Boot    │◄────────│    Database     │
│  (Port 3000)    │  HTTP   │  (Port 8080)    │  JDBC   │   (PostgreSQL/  │
│                 │  +CORS  │                 │         │    MySQL)       │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                            │
        │                            │
        │ Fallback                   │ REST API
        │                            │
        ▼                            ▼
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│   Mock API      │         │  AdminBootstrap │
│  (Port 5050)    │         │  (Auto creates  │
│                 │         │   admin user)   │
└─────────────────┘         └─────────────────┘
```

## 🔄 Login Flow

```
User navigates to /admin/login
        │
        ▼
Frontend shows admin login form
        │
        ▼
User enters credentials
  • Email: admin@bookstore.com
  • Password: Admin@123
        │
        ▼
Frontend calls adminApi.login()
        │
        ▼
POST /admin/login
  Body: email=admin@bookstore.com&password=Admin@123
        │
        ▼
┌───────────────────────────────────┐
│ Spring Boot Backend Processes:   │
│ 1. Find user by email             │
│ 2. Check role === 'ADMIN'         │
│ 3. Verify password (BCrypt)       │
│ 4. Generate JWT token             │
│ 5. Return token + user data       │
└───────────────────────────────────┘
        │
        ▼
Response:
{
  "jwtToken": "eyJhbGc...",
  "userDto": {
    "name": "Administrator",
    "email": "admin@bookstore.com",
    "role": "ADMIN"
  }
}
        │
        ▼
Frontend stores token in localStorage
        │
        ▼
Redirect to /admin/dashboard
```

## 📈 Dashboard Data Flow

```
Admin Dashboard Loads
        │
        ▼
Fetch data from multiple endpoints (parallel):
        │
        ├─► GET /admin/dashboard/stats
        │   Headers: Authorization: Bearer <token>
        │   Returns: { totalRevenue, totalOrders, ... }
        │
        ├─► GET /admin/books
        │   Headers: Authorization: Bearer <token>
        │   Returns: [ { id, title, author, ... }, ... ]
        │
        ├─► GET /admin/orders
        │   Headers: Authorization: Bearer <token>
        │   Returns: [ { id, customer, amount, ... }, ... ]
        │
        ├─► GET /admin/users
        │   Headers: Authorization: Bearer <token>
        │   Returns: [ { id, name, email, ... }, ... ]
        │
        └─► GET /admin/categories
            Headers: Authorization: Bearer <token>
            Returns: [ { id, name, bookCount }, ... ]
        │
        ▼
Backend validates JWT token for each request
        │
        ├─► Token valid? → Return data
        └─► Token invalid? → Return 401 Unauthorized
        │
        ▼
Frontend displays dashboard with charts and stats
```

## 🔒 Authentication Flow

```
┌──────────────────────────────────────────────────────┐
│                    Every Request                      │
└──────────────────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │  Is Authorization header │
        │       present?           │
        └──────────────────────────┘
                │           │
           NO   │           │  YES
                │           │
                ▼           ▼
        ┌─────────┐   ┌──────────────┐
        │ Return  │   │ Extract JWT  │
        │   401   │   │ from Bearer  │
        └─────────┘   └──────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │   Validate Token     │
                │ • Signature valid?   │
                │ • Not expired?       │
                │ • Role = ADMIN?      │
                └──────────────────────┘
                    │           │
              FAIL  │           │  PASS
                    │           │
                    ▼           ▼
            ┌─────────┐   ┌──────────┐
            │ Return  │   │ Process  │
            │   401   │   │ Request  │
            └─────────┘   └──────────┘
```

## 🧪 Testing Flow

```
Run: npm run test:backend
        │
        ▼
┌─────────────────────────────────────┐
│ Test 1: Backend Connectivity        │
│ GET /actuator/health                │
│ ✓ Backend reachable                 │
│ ✗ Connection refused                │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Test 2: Admin Login                 │
│ POST /admin/login                   │
│ ✓ Login successful + JWT received   │
│ ✗ 404 - Endpoint not found          │
│ ✗ 401 - Invalid credentials         │
│ ✗ 403 - Not admin / CORS error      │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Test 3: Dashboard Access            │
│ GET /admin/dashboard                │
│ ✓ Dashboard accessible with token   │
│ ✗ 401 - Token invalid               │
│ ✗ 404 - Endpoint not found          │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Test 4: CORS Configuration          │
│ OPTIONS /admin/login                │
│ ✓ CORS headers present              │
│ ✗ CORS not configured               │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│        Test Results Summary         │
│                                     │
│ All passed? ✓ Backend working!     │
│ Any failed? ✗ Shows fix needed     │
└─────────────────────────────────────┘
```

## 🛠️ Troubleshooting Decision Tree

```
                   Start Here
                       │
                       ▼
        ┌──────────────────────────┐
        │ Run: npm run test:backend│
        └──────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ Is backend reachable?    │
        └──────────────────────────┘
                │           │
           NO   │           │  YES
                │           │
                ▼           ▼
    ┌─────────────────┐   ┌──────────────────┐
    │ Start backend:  │   │ Does login work? │
    │ mvn spring-     │   └──────────────────┘
    │   boot:run      │        │           │
    └─────────────────┘   NO   │           │  YES
                               │           │
                               ▼           ▼
                    ┌──────────────┐  ┌─────────────────┐
                    │ Check error: │  │ Is JWT returned?│
                    │ • 404: Add   │  └─────────────────┘
                    │   controller │      │           │
                    │ • 401: Check │ NO   │           │  YES
                    │   admin user │      │           │
                    │ • 403: Fix   │      ▼           ▼
                    │   CORS       │  ┌────────┐  ┌──────────────┐
                    └──────────────┘  │ Fix    │  │ Does         │
                                      │ Admin  │  │ dashboard    │
                                      │ Ctrl   │  │ work?        │
                                      └────────┘  └──────────────┘
                                                      │        │
                                                 NO   │        │  YES
                                                      │        │
                                                      ▼        ▼
                                              ┌──────────┐  ┌─────┐
                                              │ Check    │  │ ✓   │
                                              │ endpoint │  │ Done│
                                              │ exists   │  └─────┘
                                              └──────────┘
```

## 🔄 CORS Issue Resolution

```
Browser makes request
        │
        ▼
┌──────────────────────────────┐
│ Browser sends OPTIONS        │
│ (CORS preflight)             │
│ Origin: http://localhost:3000│
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Backend CORS Config:         │
│                              │
│ @Bean CorsFilter corsFilter()│
│   allowedOrigins:            │
│     localhost:3000           │
│     localhost:3010           │
│   allowedMethods:            │
│     GET, POST, PUT, DELETE   │
│   allowedHeaders:            │
│     Authorization            │
│     Content-Type             │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Backend responds with:       │
│ Access-Control-Allow-Origin: │
│   http://localhost:3000      │
│ Access-Control-Allow-Methods:│
│   GET, POST, ...             │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Browser allows actual request│
│ POST /admin/login            │
└──────────────────────────────┘
```

## 📁 File Structure

```
frontend/
├── src/
│   ├── api.js ........................... API client with admin endpoints
│   ├── authContext.js ................... Auth state management
│   ├── pages/
│   │   ├── UserManagement/
│   │   │   └── Login.jsx ................ Login page (detects admin)
│   │   └── AdminDashboard/
│   │       ├── AdminDashboard.jsx ....... Main dashboard
│   │       └── components/ .............. Dashboard widgets
│   └── App.js ........................... Routes configuration
│
├── mock-api/
│   ├── server.js ........................ Mock backend server
│   └── users.json ....................... Mock user data
│
├── backend-reference/
│   ├── README.md ........................ Setup instructions
│   └── AdminController.sample.java ...... Sample controller
│
├── test-admin-backend.js ................ Node.js test script
├── test-admin.ps1 ....................... PowerShell test script
│
├── SETUP_COMPLETE.md .................... This guide!
├── QUICK_REFERENCE.md ................... One-page reference
├── ADMIN_LOGIN_GUIDE.md ................. Detailed guide
└── BACKEND_SETUP.md ..................... CORS setup

backend/
└── src/main/java/backend/
    ├── config/
    │   ├── AdminBootstrap.java .......... Creates admin user
    │   ├── CorsConfig.java .............. CORS configuration
    │   └── SecurityConfig.java .......... Spring Security
    ├── controller/
    │   └── AdminController.java ......... Admin endpoints
    ├── model/
    │   └── UserModel.java ............... User entity
    └── repository/
        └── UserRepository.java .......... User data access
```

## 🎯 Key Endpoints

```
Authentication:
POST   /admin/login ................ Login (returns JWT)
POST   /admin/logout ............... Logout (invalidates token)

Dashboard:
GET    /admin/dashboard ............ Dashboard overview
GET    /admin/dashboard/stats ...... Statistics

Management:
GET    /admin/books ................ List all books
POST   /admin/books ................ Create book
PUT    /admin/books/:id ............ Update book
DELETE /admin/books/:id ............ Delete book

GET    /admin/orders ............... List all orders
GET    /admin/orders/:id ........... Get order details

GET    /admin/users ................ List all users
GET    /admin/users/:id ............ Get user details

GET    /admin/categories ........... List all categories
```

## 🔑 Environment Variables

```bash
# Backend (application.yml)
app:
  cors:
    allowed-origins: http://localhost:3000,http://localhost:3010
  jwt:
    secret: your-secret-key-here
    expiration: 86400000  # 24 hours

admin:
  bootstrap:
    email: admin@bookstore.com

# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:8080
```

## ✅ Success Checklist

- [ ] Backend running on port 8080
- [ ] Admin user created (check logs)
- [ ] Login endpoint returns JWT token
- [ ] Dashboard endpoint accessible with token
- [ ] CORS allows frontend origin
- [ ] Frontend can connect to backend
- [ ] Admin login page accessible
- [ ] Dashboard loads with data
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

**Ready to test?** Run: `npm run test:backend`
