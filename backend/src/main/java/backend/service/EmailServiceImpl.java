package backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:no-reply@example.com}")
    private String fromAddress;

    @Value("${app.verification-base-url:http://localhost:3000/verify}")
    private String verificationBaseUrl;

    @Value("${app.password-reset-base-url:http://localhost:3000/reset-password}")
    private String passwordResetBaseUrl;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private String buildLink(String baseUrl, String tokenParamName, String token) {
        String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
        if (baseUrl.contains("?")) {
            return baseUrl + "&" + tokenParamName + "=" + encoded;
        }
        return baseUrl + "?" + tokenParamName + "=" + encoded;
    }

    @Override
    public void sendVerificationEmail(String to, String token) {
        String link = buildLink(verificationBaseUrl, "token", token);
        String subject = "Verify your account";
        String body = "Welcome! Please verify your account by clicking the link: " + link + "\nIf you did not sign up, ignore this email.";
        sendSimpleMessage(to, subject, body);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String link = buildLink(passwordResetBaseUrl, "token", token);
        String subject = "Reset your password";
        String body = "You requested a password reset. Use the following link: " + link + "\nIf you did not request this, you can ignore this email.";
        sendSimpleMessage(to, subject, body);
    }

    private void sendSimpleMessage(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            logger.info("Email sent to {} with subject '{}'", to, subject);
        } catch (Exception ex) {
            // Log and swallow to avoid failing the main flow; could be enhanced to retry or persist.
            logger.error("Failed to send email to {}: {}", to, ex.getMessage(), ex);
        }
    }
}
