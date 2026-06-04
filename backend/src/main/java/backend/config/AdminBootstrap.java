package backend.config;

import backend.model.UserModel;
import backend.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.bootstrap.email:admin@bookstore.com}")
    private String defaultEmail;

    @Value("${admin.bootstrap.password:Admin@12345678}")
    private String defaultPassword;

    @Value("${admin.bootstrap.resetIfExists:false}")
    private boolean resetIfExists;

    public AdminBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean adminExists = userRepository.existsByRole("ADMIN");
        if (!adminExists) {
            UserModel admin = new UserModel();
            admin.setName("Administrator");
            admin.setEmail(defaultEmail);
            admin.setPassword(passwordEncoder.encode(defaultPassword));
            admin.setRole("ADMIN");
            admin.setVerified(true);
            admin.setTokenVersion(0L);
            userRepository.save(admin);
        } else if (resetIfExists) {
            userRepository.findByEmail(defaultEmail).ifPresent(u -> {
                if ("ADMIN".equalsIgnoreCase(u.getRole())) {
                    u.setPassword(passwordEncoder.encode(defaultPassword));
                    // bump tokenVersion to invalidate old tokens
                    long nextVersion = (u.getTokenVersion() == null ? 0L : u.getTokenVersion()) + 1L;
                    u.setTokenVersion(nextVersion);
                    userRepository.save(u);
                }
            });
        }
    }
}
