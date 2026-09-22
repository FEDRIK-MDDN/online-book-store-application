package backend.service;

import backend.dto.UpdateUserRequest;
import backend.model.UserModel;
import backend.repository.CartItemRepository;
import backend.repository.CartRepository;
import backend.repository.OrderRepository;
import backend.repository.UserRepository;
import backend.security.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class UserServiceImplTest {

    private UserRepository repo;
    private PasswordEncoder encoder;
    private JwtUtil jwtUtil;
    private EmailService emailService;
    private CartRepository cartRepository;
    private CartItemRepository cartItemRepository;
    private OrderRepository orderRepository;
    private UserServiceImpl service;

    @BeforeEach
    void setup() {
        repo = Mockito.mock(UserRepository.class);
        encoder = Mockito.mock(PasswordEncoder.class);
        jwtUtil = Mockito.mock(JwtUtil.class);
        emailService = Mockito.mock(EmailService.class);
        cartRepository = Mockito.mock(CartRepository.class);
        cartItemRepository = Mockito.mock(CartItemRepository.class);
        orderRepository = Mockito.mock(OrderRepository.class);
        service = new UserServiceImpl(repo, encoder, jwtUtil, emailService, cartRepository, cartItemRepository, orderRepository);
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void updateCurrentUser_updatesNameAndEmail() {
        // Arrange auth
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("old@example.com", "pw"));
        UserModel existing = new UserModel();
        existing.setId(1L);
        existing.setName("Old Name");
        existing.setEmail("old@example.com");
        when(repo.findByEmail("old@example.com")).thenReturn(Optional.of(existing));
        when(repo.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(repo.save(any(UserModel.class))).thenAnswer(inv -> inv.getArgument(0));
        UpdateUserRequest req = new UpdateUserRequest();
        req.setName("New Name");
        req.setEmail("new@example.com");
        // Act
        var dto = service.updateCurrentUser(req);
        // Assert
        assertEquals("New Name", dto.getName());
        assertEquals("new@example.com", dto.getEmail());
        ArgumentCaptor<UserModel> captor = ArgumentCaptor.forClass(UserModel.class);
        verify(repo).save(captor.capture());
        assertEquals("New Name", captor.getValue().getName());
        assertEquals("new@example.com", captor.getValue().getEmail());
    }

    @Test
    void updateProfileImage_setsUrlOnCurrentUser() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("me@example.com", "pw"));
        UserModel existing = new UserModel();
        existing.setId(2L);
        existing.setName("Me");
        existing.setEmail("me@example.com");
        when(repo.findByEmail("me@example.com")).thenReturn(Optional.of(existing));
        when(repo.save(any(UserModel.class))).thenAnswer(inv -> inv.getArgument(0));
        // Act
        var dto = service.updateProfileImage("/uploads/img.png");
        // Assert
        assertEquals("/uploads/img.png", dto.getProfileImageUrl());
        ArgumentCaptor<UserModel> captor = ArgumentCaptor.forClass(UserModel.class);
        verify(repo).save(captor.capture());
        assertEquals("/uploads/img.png", captor.getValue().getProfileImageUrl());
    }

    @Test
    void deleteCurrentUser_deletesFromRepository() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("bye@example.com", "pw"));
        UserModel existing = new UserModel();
        existing.setId(3L);
        existing.setEmail("bye@example.com");
        // Stub any email -> existing, because other Spring tests in the suite may mutate SecurityContext.
        when(repo.findByEmail(anyString())).thenReturn(Optional.of(existing));
        // Act
        service.deleteCurrentUser();
        // Assert
        verify(repo).delete(existing);
    }
}
