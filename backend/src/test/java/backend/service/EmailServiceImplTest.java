package backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.lang.reflect.Field;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

class EmailServiceImplTest {

    private JavaMailSender mailSender;
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() throws Exception {
        mailSender = Mockito.mock(JavaMailSender.class);
        emailService = new EmailServiceImpl(mailSender);
        setField("fromAddress", "test@example.com");
        setField("verificationBaseUrl", "http://test.local/verify");
        setField("passwordResetBaseUrl", "http://test.local/reset-password");
    }

    private void setField(String fieldName, String value) throws Exception {
        Field f = EmailServiceImpl.class.getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(emailService, value);
    }

    @Test
    void sendVerificationEmail_sendsExpectedMessage() {
        String token = "tok en+value"; // includes characters needing encoding
        String expectedEncoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
        emailService.sendVerificationEmail("user@example.com", token);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage msg = captor.getValue();
        assertNotNull(msg.getText());
        assertEquals("test@example.com", msg.getFrom());
        assertArrayEquals(new String[]{"user@example.com"}, msg.getTo());
        assertEquals("Verify your account", msg.getSubject());
        assertTrue(msg.getText().contains("http://test.local/verify?token=" + expectedEncoded), "Verification link should contain encoded token");
    }

    @Test
    void sendPasswordResetEmail_sendsExpectedMessage() {
        String token = "resetToken123";
        String expectedEncoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
        emailService.sendPasswordResetEmail("user2@example.com", token);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage msg = captor.getValue();
        assertNotNull(msg.getText());
        assertEquals("Reset your password", msg.getSubject());
        assertTrue(msg.getText().contains("http://test.local/reset-password?token=" + expectedEncoded));
    }

    @Test
    void sendPasswordResetEmail_appendsTokenWithAmpersandIfQueryPresent() throws Exception {
        setField("passwordResetBaseUrl", "http://test.local/reset-password?existing=1");
        String token = "abc";
        String expectedEncoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
        emailService.sendPasswordResetEmail("user3@example.com", token);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage msg = captor.getValue();
        assertNotNull(msg.getText());
        assertTrue(msg.getText().contains("http://test.local/reset-password?existing=1&token=" + expectedEncoded));
    }
}
