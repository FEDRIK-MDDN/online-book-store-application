# Admin Dashboard Login Guide

## 🚀 Quick Start

**One-Command Test:**
```bash
node test-admin-backend.js
```

**Admin Credentials:**
| Backend | Email | Password |
|---------|-------|----------|
| Spring Boot (Port 8080) | admin@bookstore.com | Admin@123 |
| Mock API (Port 5050) | admin@example.com | Admin123 |

**Quick Access:**
- Admin Login: http://localhost:3000/admin/login
- Dashboard: http://localhost:3000/admin/dashboard

---

## The Issue
The admin dashboard was showing "Cannot reach backend" error because:
1. The backend at `localhost:8080` had CORS issues preventing the frontend from connecting
2. The login system wasn't configured to use admin endpoints
3. No admin user existed in the system

## The Solution

### 1. Mock API Server with Admin Endpoints
- Started a mock API server on port 5050 with proper CORS configuration
- Added admin-specific endpoints: `/admin/login`, `/admin/dashboard/stats`, `/admin/books`, `/admin/orders`, `/admin/users`, `/admin/categories`
- The mock server now serves as a fallback when the Spring Boot backend is unavailable

### 2. Admin User Created
**Admin Credentials:**
- Email: `admin@example.com`
- Password: `Admin123`

### 3. Updated Login Flow
- The login page now detects if you're trying to access admin routes
- Uses `adminApi.login()` for admin logins (goes to `/admin/login`)
- Uses `api.login()` for regular user logins (goes to `/users/login`)
- Admin login returns `role: 'ADMIN'` which grants access to admin dashboard

## How to Use

### Option 1: Using Mock API (Recommended for Development)
1. **Start the mock API server:**
   ```bash
   npm run mock-api
   ```
   Or manually:
   ```bash
   node mock-api/server.js
   ```

2. **Start the React app (in another terminal):**
   ```bash
   npm start
   ```

3. **Login as admin:**
   - Go to: http://localhost:3000/admin/login
   - Email: `admin@example.com`
   - Password: `Admin123`
   - You'll be redirected to the admin dashboard

### Option 2: Using Spring Boot Backend
If you want to use the real Spring Boot backend:

1. **Fix CORS in your Spring Boot application:**
   - Follow the instructions in `BACKEND_SETUP.md`
   - Add the `CorsConfig` class
   - Update `SecurityConfig` to allow CORS

2. **Create an admin user in your database:**
   - The user must have `role: 'ADMIN'`
   - Ensure the `/admin/login` endpoint exists in your Spring Boot backend

3. **Start Spring Boot backend on port 8080**

4. **Start React app:**
   ```bash
   npm start
   ```

## API Endpoints Priority

The frontend tries to connect in this order:
1. Relative path (uses React proxy to `localhost:8080`)
2. `http://localhost:8080` (Spring Boot backend)
3. `http://127.0.0.1:8080`
4. `http://localhost:5050` (Mock API - fallback)
5. `http://127.0.0.1:5050`

## Mock API Features

The mock API provides:
- **Dashboard Stats**: Revenue, orders, users, books statistics
- **Books Management**: List of 5 sample books with sales data
- **Orders Management**: List of 5 sample orders
- **Users Management**: All registered users (including the admin)
- **Categories**: 4 sample categories

## Testing

1. **Clear browser storage** (to remove old login data):
   - Open DevTools (F12)
   - Go to Application > Local Storage
   - Delete `auth:user`

2. **Login as admin:**
   - Navigate to `/admin/login`
   - Use credentials: `admin@example.com` / `Admin123`
   - You should see the admin dashboard with charts and statistics

3. **Check if mock API is working:**
   ```bash
   curl http://localhost:5050/admin/dashboard/stats
   ```

## Step-by-Step Troubleshooting Guide

### Quick Health Check
Run the automated test script to diagnose issues:
```bash
node test-admin-backend.js
```

This will check:
1. ✓ Backend connectivity on port 8080
2. ✓ Admin login endpoint exists
3. ✓ JWT token is returned
4. ✓ Dashboard is accessible with token
5. ✓ CORS configuration

### Manual Testing Steps

#### Step 1: Verify Backend is Running
1. **Check if Spring Boot is running on port 8080:**
   ```bash
   # Look for "Started BackendApplication" in logs
   # Should see "Tomcat started on port(s): 8080"
   ```

2. **If using custom port, update frontend:**
   - Check `server.port` in `application.properties`
   - Update proxy in `package.json` to match

#### Step 2: Test Admin Login via Command Line
```bash
# Test with curl (Windows PowerShell)
curl -X POST http://localhost:8080/admin/login `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "email=admin@bookstore.com&password=Admin@123"

# Expected response:
# { "jwtToken": "eyJ...", "userDto": { "role": "ADMIN", ... } }
```

#### Step 3: Test Dashboard with Token
```bash
# Copy the jwtToken from login response, then:
curl -X GET http://localhost:8080/admin/dashboard `
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" `
  -H "Content-Type: application/json"
```

If this works in curl but fails in browser → **CORS issue**

#### Step 4: Fix CORS (if browser shows CORS error)

Add this to your Spring Boot backend:

**CorsConfig.java:**
```java
package backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.Arrays;

@Configuration
public class CorsConfig {
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String origins;

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowCredentials(true);
        cfg.setAllowedOrigins(Arrays.asList(origins.split(",")));
        cfg.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(Arrays.asList("Authorization","Content-Type"));
        cfg.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return new CorsFilter(source);
    }
}
```

**application.yml:**
```yaml
app:
  cors:
    allowed-origins: http://localhost:3000
```

## Troubleshooting Common Issues

### Still seeing "Cannot reach backend"?
1. Run the health check: `node test-admin-backend.js`
2. Check the browser console for specific errors
3. Verify Spring Boot logs for startup errors
4. Try the mock API as fallback: `node mock-api/server.js`

### "Unauthorized" or "Invalid credentials"?
1. **Spring Boot Backend:**
   - Email: `admin@bookstore.com`
   - Password: `Admin@123`
   - Check AdminBootstrap ran on startup

2. **Mock API:**
   - Email: `admin@example.com`
   - Password: `Admin123`

### Admin dashboard shows but data doesn't load?
1. Open browser DevTools > Network tab
2. Check if requests return 401 (token issue) or 500 (server error)
3. Verify JWT token is being sent in Authorization header
4. Check backend logs for errors

## Next Steps

For production:
1. Implement proper admin authentication in Spring Boot backend
2. Add JWT token validation
3. Implement role-based access control (RBAC)
4. Remove or secure the mock API endpoints
5. Add environment variables for backend URL configuration
