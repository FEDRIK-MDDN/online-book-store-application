# Backend Integration (Spring Boot) – Recommended Setup

This guide shows a robust way to make the Spring Boot backend on `:8080` work seamlessly with the React frontend (ports `3000` or `3010`) while avoiding the "Failed to fetch" CORS preflight errors.

---
## 1. Core Principles
- **Explicit CORS configuration**: Relying on defaults often breaks JSON POST requests from a different origin.
- **Environment-driven origins**: Keep dev origins configurable via properties instead of hard-coding.
- **Allow preflight**: OPTIONS requests must be permitted for custom headers / JSON POST.
- **Security integration**: Configure CORS *before* Spring Security blocks requests.

---
## 2. Application Properties (Recommended)
`application.yml` (or `application.properties`):
```yaml
app:
  cors:
    allowed-origins: http://localhost:3000,http://localhost:3010
```

Then create a config class that reads this value.

---
## 3. CORS Configuration Class
```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:3010}")
    private String origins;

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowCredentials(true); // if you need cookies / auth headers
        cfg.setAllowedOrigins(Arrays.asList(origins.split(",")));
        cfg.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        cfg.setAllowedHeaders(Arrays.asList("Authorization","Content-Type","Accept","Origin","X-Requested-With"));
        cfg.setExposedHeaders(Arrays.asList("Authorization")); // if you return tokens
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return new CorsFilter(source);
    }
}
```

---
## 4. Spring Security Configuration (Simplified)
Make sure CORS is enabled and public endpoints are permitted. Adjust roles/matchers as needed.
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
          .cors(cors -> {})           // integrate CORS config
          .csrf(csrf -> csrf.disable()) // disable for pure API (consider token-based protection instead)
          .authorizeHttpRequests(auth -> auth
              .requestMatchers("/users/register", "/users/login", "/users/login/body", "/users/password-reset/**").permitAll()
              .anyRequest().authenticated()
          );
        // Add JWT filter here if/when implemented
        return http.build();
    }
}
```

---
## 5. Controller Consistency
You currently expose:
- `/users/register` – JSON body
- `/users/login` – query params (`email`, `password`)
- `/users/login/body` – JSON body alternative
The frontend now attempts `/users/login/body` first, then falls back to query param variant.

If you prefer **only JSON body**, remove the query-param method and keep `/users/login/body` mapped to `/users/login`:
```java
@PostMapping("/login")
public UserDto loginJson(@RequestBody @Valid LoginRequest request) {
    return service.login(request.getEmail(), request.getPassword());
}
```
Update frontend to remove fallback if you standardize.

---
## 6. Returning Tokens (Optional JWT)
To issue a token during registration/login:
1. Generate JWT after successful auth.
2. Return payload shape:
```json
{ "user": { "id": 1, "email": "user@example.com" }, "token": "<jwt>" }
```
The existing `extractAuth` already supports this.

---
## 7. Common Failure Points & Fix Checklist
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Failed to fetch` | Missing CORS preflight allowance | Add `CorsFilter` + allow OPTIONS |
| 403 on OPTIONS | Security intercepting preflight | Ensure `http.cors()` then disable CSRF or configure properly |
| Frontend hitting wrong origin | `REACT_APP_API_URL` mis-set | Remove or correct env var so fallbacks attempt correct port |
| 404 on `/users/login/body` | Endpoint not present | Either add method or rely on query-param variant |
| Missing token client-side | Backend not returning token field | Implement JWT and add `token` to response |

---
## 8. Quick Validation Script (PowerShell)
```powershell
# Check health (if you add one) or any public endpoint
Invoke-WebRequest http://localhost:8080/users/login -Method OPTIONS -Headers @{"Access-Control-Request-Method"="POST";"Origin"="http://localhost:3000"}
```
Expect 200/204 with CORS headers (`Access-Control-Allow-Origin`, etc.).

---
## 9. Production Notes
- Restrict `allowedOrigins` to your deployed frontend domains only.
- Prefer JWT (stateless) over session for SPA.
- Consider rate limiting & proper validation for password reset endpoints.

---
## 10. Frontend Alignment
No further changes required in `src/api.js` for CORS once backend is properly configured. You may set:
```powershell
$env:REACT_APP_API_URL = "http://localhost:8080"; npm start
```
To skip fallback probing.

---
## 11. Next Steps
1. Add `CorsConfig` & `SecurityConfig` to backend.
2. Restart backend; watch for log lines confirming startup.
3. Retry registration/login from the React app.
4. Implement JWT issuance if auth persistence needed.

Feel free to request a JWT implementation example or a health endpoint sample.
