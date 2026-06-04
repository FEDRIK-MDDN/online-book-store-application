package backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    @Value("${jwt.reset-expiration-ms:900000}") // 15 minutes by default
    private long resetExpirationMs;

    @Value("${jwt.issuer:onlineBookStore}")
    private String issuer;

    @Value("${jwt.audience:onlineBookStore-users}")
    private String audience;

    @PostConstruct
    void validateSecret() {
        // HS256 requires at least 256 bits (32 bytes) of key material for security.
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret too short. Provide at least 32 ASCII characters via environment variable JWT_SECRET or application properties.");
        }
    }

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String subjectEmail, String role, long tokenVersion) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(subjectEmail)
                .setIssuer(issuer)
                .setAudience(audience)
                .claim("role", role)
                .claim("purpose", "access")
                .claim("tokenVersion", tokenVersion)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Backward-compat overload; default tokenVersion to 0
    public String generateToken(String subjectEmail, String role) {
        return generateToken(subjectEmail, role, 0);
    }

    public String generatePasswordResetToken(String subjectEmail) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(subjectEmail)
                .setIssuer(issuer)
                .setAudience(audience)
                .claim("purpose", "reset")
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + resetExpirationMs))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .setAllowedClockSkewSeconds(30) // small tolerance for clock drift
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isExpired(Claims claims) {
        return claims == null || claims.getExpiration() == null || claims.getExpiration().before(new Date());
    }

    public String extractEmail(String token) {
        Claims claims = parse(token);
        return claims.getSubject();
    }

    public String extractRole(String token) {
        Claims claims = parse(token);
        return claims.get("role", String.class);
    }

    public Long extractTokenVersion(String token) {
        Claims claims = parse(token);
        Long ver = claims.get("tokenVersion", Long.class);
        return ver == null ? 0L : ver;
    }

    public boolean validate(String token) {
        try {
            if (!StringUtils.hasText(token)) return false;

            Claims claims = parse(token);
            if (isExpired(claims)) return false;
            String subject = claims.getSubject();
            String role = claims.get("role", String.class);
            String purpose = claims.get("purpose", String.class);
            return StringUtils.hasText(subject) && StringUtils.hasText(role) && "access".equals(purpose);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean validatePasswordResetToken(String token) {
        try {
            if (!StringUtils.hasText(token)) return false;
            Claims claims = parse(token);
            if (isExpired(claims)) return false;
            String subject = claims.getSubject();
            String purpose = claims.get("purpose", String.class);
            return StringUtils.hasText(subject) && "reset".equals(purpose);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractEmailFromPasswordReset(String token) {
        Claims claims = parse(token);
        String purpose = claims.get("purpose", String.class);
        if (!"reset".equals(purpose)) {
            throw new IllegalArgumentException("Invalid token purpose");
        }
        return claims.getSubject();
    }
}
