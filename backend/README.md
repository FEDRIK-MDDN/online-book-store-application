# Online Book Store Backend

Spring Boot backend providing user registration, authentication (JWT), verification email workflow, and password reset functionality.

## Tech Stack
- Java 21
- Spring Boot 3.3
- Spring Data JPA (MySQL / H2 for tests)
- Spring Security + JWT (jjwt 0.11.5)
- Spring Mail (JavaMailSender)
- Lombok (optional convenience; ensure annotation processing enabled in IDE)
- JUnit 5 + Mockito

## Features
- User registration with email uniqueness and verification token
- Email verification link generation
- JWT-based stateless authentication (HS256)
- Password reset token flow with expiry (15 minutes)
- Basic CRUD for users (secured endpoints)

## Configuration
All configuration resides in `src/main/resources/application.properties` and can be overridden via environment variables.

### Database (MySQL)
```
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/bookstore_db
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=****
```
For development you can keep defaults. For tests an in-memory H2 database is used (`application-test.properties`).

### JWT
Provide a strong secret (>=32 characters):
```
JWT_SECRET=ChangeThisToAStrongRandomSecretValueAtLeast32Chars
JWT_EXPIRATION_MS=86400000
```
`jwt.secret` in properties falls back to a long default but you should always set `JWT_SECRET` in production.

### Mail
Set real SMTP credentials (examples for common providers):
```
SPRING_MAIL_HOST=smtp.yourprovider.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_smtp_user
SPRING_MAIL_PASSWORD=your_smtp_password
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
SPRING_MAIL_FROM=no-reply@yourdomain.com
```
Links embedded in emails:
```
APP_VERIFICATION_BASE_URL=https://frontend.yourdomain.com/verify
APP_PASSWORD_RESET_BASE_URL=https://frontend.yourdomain.com/reset-password
```
These map to `app.verification-base-url` and `app.password-reset-base-url`.

### Profiles
Use test profile when running tests:
```
mvn -Dspring.profiles.active=test test
```
(Default tests already load `application-test.properties` via SpringBootTest.)

## Running Locally
```
./mvnw spring-boot:run
```
Or build the JAR:
```
./mvnw clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## Endpoints (examples)
- POST /users/register
- POST /users/login
- GET /users/verify?token=... (verification flow)
- POST /users/password-reset/request (body: email)
- POST /users/password-reset/confirm (body: token + new password)

Secure endpoints require `Authorization: Bearer <jwt>` header after login.

## Testing
Unit tests include email service link construction checks.
Run all tests:
```
./mvnw test
```

## Security Notes
- Ensure HTTPS termination in production.
- Rotate JWT secret periodically.
- Consider adding account lockout / rate limiting for login/password reset.
- Current email sending swallows exceptions after logging; consider persisting failed messages for retry.

## Next Improvements
- Add integration tests for registration + verification flow using Testcontainers (MySQL)
- Add refresh token support
- Add audit timestamps (created/updated) on entities
- Add email templates (Thymeleaf or FreeMarker)

## License
Internal project (add license if needed).

