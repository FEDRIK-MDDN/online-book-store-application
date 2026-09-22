package backend.service;

import backend.dto.UserDto;
import backend.model.UserModel;
import backend.repository.CartItemRepository;
import backend.repository.CartRepository;
import backend.repository.OrderRepository;
import backend.repository.UserRepository;
import backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserServiceImplProfileImageTest {

    private UserRepository repo;
    private PasswordEncoder encoder;
    private JwtUtil jwtUtil;
    private EmailService emailService;
    private CartRepository cartRepository;
    private CartItemRepository cartItemRepository;
    private OrderRepository orderRepository;
    private UserServiceImpl service;

    private Authentication auth;
    private SecurityContext securityContext;

    @BeforeEach
    void setup() {
        repo = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        jwtUtil = mock(JwtUtil.class);
        emailService = mock(EmailService.class);
        cartRepository = mock(CartRepository.class);
        cartItemRepository = mock(CartItemRepository.class);
        orderRepository = mock(OrderRepository.class);
        service = new UserServiceImpl(repo, encoder, jwtUtil, emailService, cartRepository, cartItemRepository, orderRepository);

        auth = mock(Authentication.class);
        securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void updateProfileImage_isPersisted_andReturnedOnLogin() {
        String email = "test@example.com";
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn(email);

        UserModel user = new UserModel();
        user.setId(1L);
        user.setEmail(email);
        user.setName("Tester");
        user.setPassword("secret");
        user.setRole("USER");
        user.setVerified(true);
        user.setTokenVersion(1L);

        when(repo.findByEmail(email)).thenReturn(java.util.Optional.of(user));
        when(repo.save(any(UserModel.class))).thenAnswer(inv -> inv.getArgument(0));

        // Update profile image
        String pic = "/uploads/pic123.png";
        UserDto updated = service.updateProfileImage(pic);
        assertEquals(pic, updated.getProfileImageUrl());

        // Simulate later login returning the same value
        when(jwtUtil.generateToken(anyString(), anyString(), anyLong())).thenReturn("token");
        when(encoder.matches(anyString(), anyString())).thenReturn(true);
        when(repo.findByEmail(email)).thenReturn(java.util.Optional.of(user));

        UserDto afterLogin = service.login(email, "secret");
        assertEquals(pic, afterLogin.getProfileImageUrl());

        // ensure persisted
        ArgumentCaptor<UserModel> captor = ArgumentCaptor.forClass(UserModel.class);
        verify(repo, atLeastOnce()).save(captor.capture());
        assertEquals(pic, captor.getValue().getProfileImageUrl());
    }
}

