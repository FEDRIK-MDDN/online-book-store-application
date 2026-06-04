package backend.service;

import backend.dto.RegistrationRequest;
import backend.dto.UpdateUserRequest;
import backend.dto.UserDto;
import backend.exception.NotFoundException;
import backend.model.UserModel;
import backend.repository.CartItemRepository;
import backend.repository.CartRepository;
import backend.repository.OrderRepository;
import backend.repository.UserRepository;
import backend.security.JwtUtil;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;

    public UserServiceImpl(
            UserRepository repo,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            EmailService emailService,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            OrderRepository orderRepository
    ) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
    }

    private UserDto convert(UserModel model) {
        UserDto dto = new UserDto();
        dto.setId(model.getId());
        dto.setName(model.getName());
        dto.setEmail(model.getEmail());
        dto.setRole(model.getRole());
        dto.setVerified(model.getVerified());
        dto.setProfileImageUrl(model.getProfileImageUrl());
        return dto;
    }

    @Override
    public UserDto register(RegistrationRequest request) {
        repo.findByEmail(request.getEmail()).ifPresent(u -> { throw new IllegalArgumentException("Email already registered"); });
        UserModel user = new UserModel();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setVerified(true);
        user.setTokenVersion(1L);
        UserModel saved = repo.save(user);
        UserDto dto = convert(saved);
        dto.setJwtToken(null);
        return dto;
    }

    @Override
    public UserDto login(String email, String password) {
        UserModel user = repo.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        long nextVersion = (user.getTokenVersion() == null ? 0L : user.getTokenVersion()) + 1L;
        user.setTokenVersion(nextVersion);
        user = repo.save(user);
        UserDto dto = convert(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getTokenVersion());
        dto.setJwtToken(token);
        return dto;
    }

    @Override
    public List<UserDto> getAllUsers() {
        return repo.findAll().stream().map(this::convert).collect(Collectors.toList());
    }

    @Override
    public UserDto getUserById(Long id) {
        return repo.findById(id).map(this::convert).orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Override
    public UserDto updateUser(Long id, UpdateUserRequest user) {
        UserModel existing = repo.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        if (!existing.getEmail().equals(user.getEmail())) {
            repo.findByEmail(user.getEmail()).ifPresent(other -> { throw new IllegalArgumentException("Email already in use"); });
        }
        existing.setName(user.getName());
        existing.setEmail(user.getEmail());
        UserModel saved = repo.save(existing);
        return convert(saved);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String requesterEmail = (auth == null ? null : auth.getName());

        UserModel user = repo.findById(id).orElseThrow(() -> new NotFoundException("User not found"));

        // Prevent an admin from deleting their own account (frontend expects 400)
        if (requesterEmail != null && requesterEmail.equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("Cannot delete your own account");
        }

        // Preserve orders, but detach from user to avoid FK violation
        orderRepository.clearUserReference(id);

        // Delete cart + items (safe to purge)
        cartRepository.findByUser(user).ifPresent(cart -> {
            cartItemRepository.deleteByCartId(cart.getId());
            cartRepository.delete(cart);
        });

        // Finally hard delete user
        repo.delete(user);
    }

    @Override
    public void requestPasswordReset(String email) {
        UserModel user = repo.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        String token = jwtUtil.generatePasswordResetToken(user.getEmail());
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        if (!jwtUtil.validatePasswordResetToken(token)) {
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }
        String email = jwtUtil.extractEmailFromPasswordReset(token);
        UserModel user = repo.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        long nextVersion = (user.getTokenVersion() == null ? 0L : user.getTokenVersion()) + 1L;
        user.setTokenVersion(nextVersion);
        repo.save(user);
    }

    @Override
    public UserDto getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated user");
        }
        String email = auth.getName();
        UserModel user = repo.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        return convert(user);
    }

    @Override
    public UserDto updateCurrentUser(UpdateUserRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new IllegalStateException("No authenticated user");
        String email = auth.getName();
        UserModel existing = repo.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        if (!existing.getEmail().equals(request.getEmail())) {
            repo.findByEmail(request.getEmail()).ifPresent(other -> { throw new IllegalArgumentException("Email already in use"); });
        }
        existing.setName(request.getName());
        existing.setEmail(request.getEmail());
        UserModel saved = repo.save(existing);
        return convert(saved);
    }

    @Override
    public UserDto updateProfileImage(String profileImageUrl) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new IllegalStateException("No authenticated user");
        String email = auth.getName();
        UserModel existing = repo.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        existing.setProfileImageUrl(profileImageUrl);
        UserModel saved = repo.save(existing);
        return convert(saved);
    }

    @Override
    @Transactional
    public void deleteCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new IllegalStateException("No authenticated user");
        String email = auth.getName();

        UserModel existing = repo.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));

        // Detach orders, remove cart, then hard delete
        orderRepository.clearUserReference(existing.getId());
        cartRepository.findByUser(existing).ifPresent(cart -> {
            cartItemRepository.deleteByCartId(cart.getId());
            cartRepository.delete(cart);
        });
        repo.delete(existing);
    }

    @Override
    public void activateUser(Long id) {
        UserModel user = repo.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        user.setVerified(true);
        repo.save(user);
    }

    @Override
    public void deactivateUser(Long id) {
        UserModel user = repo.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        user.setVerified(false);
        // bump tokenVersion to invalidate active sessions
        long nextVersion = (user.getTokenVersion() == null ? 0L : user.getTokenVersion()) + 1L;
        user.setTokenVersion(nextVersion);
        repo.save(user);
    }

    @Override
    public void changeCurrentUserPassword(String currentPassword, String newPassword) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new IllegalStateException("No authenticated user");
        String email = auth.getName();
        UserModel user = repo.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        long nextVersion = (user.getTokenVersion() == null ? 0L : user.getTokenVersion()) + 1L;
        user.setTokenVersion(nextVersion);
        repo.save(user);
    }

    @Override
    public void updateUserRole(Long id, String role) {
        UserModel user = repo.findById(id).orElseThrow(() -> new backend.exception.NotFoundException("User not found"));
        String normalized = role == null ? null : role.toUpperCase();
        if (!"ADMIN".equals(normalized) && !"USER".equals(normalized)) {
            throw new IllegalArgumentException("Invalid role. Allowed: USER, ADMIN");
        }
        user.setRole(normalized);
        long nextVersion = (user.getTokenVersion() == null ? 0L : user.getTokenVersion()) + 1L;
        user.setTokenVersion(nextVersion);
        repo.save(user);
    }
}
