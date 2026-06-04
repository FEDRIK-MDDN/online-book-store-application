# 🚀 Admin Login Quick Reference

## Testing Commands

```bash
# Test backend health and login
npm run test:backend

# PowerShell comprehensive test (Windows)
npm run test:admin

# Or run directly
node test-admin-backend.js
.\test-admin.ps1
```

## Admin Credentials

| Backend | URL | Email | Password |
|---------|-----|-------|----------|
| **Spring Boot** | http://localhost:8080 | admin@bookstore.com | Admin@123 |
| **Mock API** | http://localhost:5050 | admin@example.com | Admin123 |

## Quick Access URLs

- **Admin Login**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **Regular Login**: http://localhost:3000/login

## Common Issues & Fixes

### ❌ "Cannot reach backend"
```bash
# Check if backend is running
curl http://localhost:8080/actuator/health

# Start Spring Boot backend
mvn spring-boot:run

# Or use mock API fallback
node mock-api/server.js
```

### ❌ "Failed to fetch" / CORS Error
**Add to Spring Boot backend:**

```java
// backend/config/CorsConfig.java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowCredentials(true);
        cfg.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:3010"
        ));
        cfg.setAllowedMethods(Arrays.asList(
            "GET","POST","PUT","DELETE","OPTIONS"
        ));
        cfg.setAllowedHeaders(Arrays.asList(
            "Authorization","Content-Type"
        ));
        cfg.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = 
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return new CorsFilter(source);
    }
}
```

### ❌ "Unauthorized" / Invalid Credentials
1. **Check admin user exists:**
   ```bash
   # In Spring Boot logs, look for:
   # "Created default admin user"
   ```

2. **Verify AdminBootstrap.java is in classpath**
   ```java
   @Component
   public class AdminBootstrap implements ApplicationRunner {
       @Override
       public void run(ApplicationArguments args) {
           // Creates admin user on startup
       }
   }
   ```

3. **Check credentials match:**
   - Email: `admin@bookstore.com`
   - Password: `Admin@123`

### ❌ Dashboard Loads But Shows Errors
**Check browser DevTools → Network tab:**

- **401 Unauthorized**: JWT token issue
  - Token not being sent
  - Token expired
  - Token validation failed

- **404 Not Found**: Endpoint missing
  - Create AdminController endpoints
  - Check route mapping

- **500 Internal Server Error**: Backend error
  - Check Spring Boot logs
  - Verify database connection

## Manual Testing (curl/Postman)

### Test Login
```bash
# PowerShell
curl -X POST http://localhost:8080/admin/login `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "email=admin@bookstore.com&password=Admin@123"

# Expected response:
{
  "jwtToken": "eyJ...",
  "userDto": {
    "name": "Administrator",
    "email": "admin@bookstore.com",
    "role": "ADMIN"
  }
}
```

### Test Dashboard (with token from above)
```bash
# PowerShell
curl -X GET http://localhost:8080/admin/dashboard `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -H "Content-Type: application/json"
```

## Required Backend Components

### 1. AdminBootstrap.java ✓
Creates default admin user on startup.

### 2. AdminController.java
```java
@RestController
@RequestMapping("/admin")
public class AdminController {
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String email, 
                                   @RequestParam String password) {
        // Login logic
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        // Dashboard data
    }
}
```

### 3. CorsConfig.java
Allows frontend to connect from different origin.

### 4. SecurityConfig.java
```java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
          .cors(cors -> {})
          .csrf(csrf -> csrf.disable())
          .authorizeHttpRequests(auth -> auth
              .requestMatchers("/admin/login").permitAll()
              .requestMatchers("/admin/**").hasRole("ADMIN")
              .anyRequest().authenticated()
          );
        return http.build();
    }
}
```

## Troubleshooting Workflow

```
1. Run test: npm run test:backend
   ↓
2. Is backend reachable?
   NO  → Start Spring Boot: mvn spring-boot:run
   YES → Continue
   ↓
3. Does login work?
   NO  → Check if /admin/login endpoint exists
   YES → Continue
   ↓
4. Is JWT token returned?
   NO  → Fix AdminController to return token
   YES → Continue
   ↓
5. Does dashboard work?
   NO  → Check if token is valid & endpoint exists
   YES → Success! ✓
   ↓
6. Still fails in browser?
   → CORS issue - add CorsConfig.java
```

## Development Workflow

### Option 1: Spring Boot Backend (Production-like)
```bash
# Terminal 1: Start Spring Boot
cd backend
mvn spring-boot:run

# Terminal 2: Start React
cd frontend
npm start

# Test
npm run test:backend
```

### Option 2: Mock API (Quick Development)
```bash
# Single command starts both
npm run dev

# Or separately:
# Terminal 1: Mock API
npm run mock-api

# Terminal 2: React
npm start
```

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| React Dev Server | 3000 | http://localhost:3000 |
| React Dev (alt) | 3010 | http://localhost:3010 |
| Spring Boot Backend | 8080 | http://localhost:8080 |
| Mock API | 5050 | http://localhost:5050 |

---

**Need more help?** See [ADMIN_LOGIN_GUIDE.md](ADMIN_LOGIN_GUIDE.md) for detailed troubleshooting.
