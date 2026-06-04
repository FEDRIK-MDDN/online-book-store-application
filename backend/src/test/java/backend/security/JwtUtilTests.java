package backend.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

public class JwtUtilTests {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setup() {
        jwtUtil = new JwtUtil();
        // 32+ char secret
        ReflectionTestUtils.setField(jwtUtil, "secret", "0123456789abcdef0123456789abcdef");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 60_000L); // 1 minute
        ReflectionTestUtils.setField(jwtUtil, "issuer", "test-issuer");
        ReflectionTestUtils.setField(jwtUtil, "audience", "test-audience");
        jwtUtil.validateSecret();
    }

    @Test
    void generateAndValidateToken_success() {
        String token = jwtUtil.generateToken("user@example.com", "USER");
        assertTrue(jwtUtil.validate(token));
        assertEquals("user@example.com", jwtUtil.extractEmail(token));
        assertEquals("USER", jwtUtil.extractRole(token));
    }

    @Test
    void validateToken_expired_returnsFalse() throws Exception {
        // Create an expired token by temporarily setting expirationMs negative
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", -1000L);
        String token = jwtUtil.generateToken("user@example.com", "USER");
        // restore
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 60_000L);
        assertFalse(jwtUtil.validate(token));
    }

    @Test
    void validateToken_wrongIssuer_returnsFalse() {
        String token = jwtUtil.generateToken("user@example.com", "USER");
        // Change expected issuer so requirement fails on parse
        ReflectionTestUtils.setField(jwtUtil, "issuer", "another-issuer");
        assertFalse(jwtUtil.validate(token));
    }

    @Test
    void validateToken_wrongAudience_returnsFalse() {
        String token = jwtUtil.generateToken("user@example.com", "USER");
        // Change expected audience so requirement fails on parse
        ReflectionTestUtils.setField(jwtUtil, "audience", "another-audience");
        assertFalse(jwtUtil.validate(token));
    }

    @Test
    void validateToken_missingRole_returnsFalse() {
        // Build a token without role by using JwtUtil internal key and JJWT directly
        String token = io.jsonwebtoken.Jwts.builder()
                .setSubject("user@example.com")
                .setIssuer((String) ReflectionTestUtils.getField(jwtUtil, "issuer"))
                .setAudience((String) ReflectionTestUtils.getField(jwtUtil, "audience"))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith((java.security.Key) ReflectionTestUtils.invokeMethod(jwtUtil, "getKey"), io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();
        assertFalse(jwtUtil.validate(token));
    }
}

