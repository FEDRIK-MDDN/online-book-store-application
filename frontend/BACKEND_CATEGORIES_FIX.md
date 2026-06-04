# Backend Configuration Fix for Categories Endpoint

## Problem
The `/categories` endpoint requires authentication, but it should be publicly accessible for the Visit and Home pages to display category filters.

## Error Message
```
401 Unauthorized: Full authentication is required to access this resource
```

## Solution: Update Spring Security Configuration

Add the `/categories` endpoint to the list of permitted endpoints in your Spring Security configuration.

### Option 1: If you have a SecurityConfig class

Find your `SecurityConfig.java` or similar security configuration file and add `/categories` to the permitAll list:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/categories", "/categories/**").permitAll()  // Add this line
                .requestMatchers("/books", "/books/**").permitAll()
                .requestMatchers("/users/register", "/users/login").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf.disable());
        
        return http.build();
    }
}
```

### Option 2: If using application.properties/yml

If you're using Spring Boot 3.x with property-based security, add:

```properties
spring.security.permit-urls=/categories,/categories/**,/books,/books/**
```

### Option 3: Add annotation to CategoryController

If neither of the above work, add this to your `CategoryController.java`:

```java
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    // ... constructor ...

    @GetMapping
    // No @PreAuthorize needed - public access
    public List<CategoryModel> all() {
        return service.getAll();
    }

    @GetMapping("/paged")
    // No @PreAuthorize needed - public access
    public Page<CategoryModel> allPaged(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size) {
        return service.getAllPaged(page, size);
    }

    @GetMapping("/{id}")
    // No @PreAuthorize needed - public access
    public CategoryModel getOne(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")  // Keep admin protection
    public CategoryModel create(@RequestBody @Valid CategoryModel category) {
        return service.create(category);
    }

    // ... rest of protected methods ...
}
```

## Why This is Needed

- **Public pages** (Visit, Home) need to display category filters for all visitors
- Only **creating, updating, and deleting** categories should require admin authentication
- **Reading/viewing** categories should be public, just like books

## After Making Changes

1. Restart your Spring Boot backend
2. Refresh the frontend pages (Home, Visit)
3. Categories should now appear in the category filter section

## Temporary Frontend Workaround

The frontend has been updated to:
- Try fetching categories without authentication first
- If logged in as a user, use the auth token to fetch categories
- Show "No categories available" if backend blocks access
- Log helpful console messages about the authentication requirement

However, the proper fix is to update the backend configuration as described above.
