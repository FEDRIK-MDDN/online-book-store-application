package backend.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setup() {
        jwtUtil = new JwtUtil();
        // Long enough secret for HS256
        ReflectionTestUtils.setField(jwtUtil, "secret", "TestSecretKeyChangeLongEnoughForHS256_123456");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 60000L);
        ReflectionTestUtils.setField(jwtUtil, "resetExpirationMs", 60000L);
        ReflectionTestUtils.setField(jwtUtil, "issuer", "test-issuer");
        ReflectionTestUtils.setField(jwtUtil, "audience", "test-audience");
        jwtUtil.validateSecret();
    }

    @Test
    void accessToken_roundtrip() {
        String token = jwtUtil.generateToken("user@example.com", "USER");
        assertTrue(jwtUtil.validate(token));
        assertEquals("user@example.com", jwtUtil.extractEmail(token));
        assertEquals("USER", jwtUtil.extractRole(token));
    }

    @Test
    void resetToken_roundtrip() {
        String token = jwtUtil.generatePasswordResetToken("user@example.com");
        assertTrue(jwtUtil.validatePasswordResetToken(token));
        assertEquals("user@example.com", jwtUtil.extractEmailFromPasswordReset(token));
        // Access validator should reject reset token
        assertFalse(jwtUtil.validate(token));
    }

    @Test
    void invalidToken_rejected() {
        assertFalse(jwtUtil.validate("not-a-jwt"));
        assertFalse(jwtUtil.validatePasswordResetToken("not-a-jwt"));
    }
}

