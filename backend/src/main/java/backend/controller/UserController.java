package backend.controller;

import backend.dto.PasswordChangeRequest;
import backend.dto.PasswordResetConfirmRequest;
import backend.dto.PasswordResetRequest;
import backend.dto.RegistrationRequest;
import backend.dto.UpdateUserRequest;
import backend.dto.UserDto;
import backend.model.OrderModel;
import backend.service.OrderService;
import backend.service.UserService;
import backend.service.StorageService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/users")
@Validated
public class UserController {

    private final UserService service;
    private final OrderService orderService;
    private final StorageService storageService;

    public UserController(UserService service, OrderService orderService, StorageService storageService) {
        this.service = service;
        this.orderService = orderService;
        this.storageService = storageService;
    }

    @PostMapping("/register")
    public UserDto register(@RequestBody @Valid RegistrationRequest request) {
        return service.register(request);
    }

    @PostMapping("/login")
    public UserDto login(@RequestParam String email,
                         @RequestParam String password) {
        return service.login(email, password);
    }

    @PostMapping("/password-reset/request")
    public String requestReset(@RequestBody @Valid PasswordResetRequest request) {
        service.requestPasswordReset(request.getEmail());
        return "Password reset email sent";
    }

    @PostMapping("/password-reset/confirm")
    public String confirmReset(@RequestBody @Valid PasswordResetConfirmRequest request) {
        service.resetPassword(request.getToken(), request.getNewPassword());
        return "Password reset successful";
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> allUsers() {
        return service.getAllUsers();
    }

    @GetMapping("/me")
    public UserDto me() {
        return service.getCurrentUser();
    }

    @GetMapping("/{id}")
    public UserDto getOne(@PathVariable Long id) {
        return service.getUserById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto update(@PathVariable Long id,
                          @RequestBody @Valid UpdateUserRequest user) {
        return service.updateUser(id, user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String delete(@PathVariable Long id) {
        service.deleteUser(id);
        return "User deleted successfully!";
    }

    // --- Profile endpoints for the authenticated user ---

    @PutMapping("/me")
    public UserDto updateMe(@RequestBody @Valid UpdateUserRequest request) {
        return service.updateCurrentUser(request);
    }

    @PutMapping("/me/profile-image")
    public UserDto updateProfileImage(@RequestParam("url") String url) {
        return service.updateProfileImage(url);
    }

    @PostMapping(value = "/me/profile-image/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserDto uploadProfileImage(
            @RequestParam(value = "file", required = false) MultipartFile fileParam,
            @RequestParam(value = "image", required = false) MultipartFile imageParam,
            @RequestParam(value = "avatar", required = false) MultipartFile avatarParam,
            @RequestPart(value = "file", required = false) MultipartFile filePart
    ) {
        // accept common field names: file, image, avatar
        MultipartFile file = fileParam != null ? fileParam : (imageParam != null ? imageParam : (avatarParam != null ? avatarParam : filePart));
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No image file provided. Use multipart field 'file', 'image', or 'avatar'.");
        }
        String url = storageService.store(file);
        return service.updateProfileImage(url);
    }

    @GetMapping("/me/orders")
    public List<OrderModel> myOrders() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user");
        }
        String email = auth.getName();
        return orderService.getOrderHistory(email);
    }

    @DeleteMapping("/me")
    public String deleteMe() {
        service.deleteCurrentUser();
        return "Account deleted successfully";
    }

    @PutMapping("/me/password")
    public String changeMyPassword(@RequestBody @Valid PasswordChangeRequest request) {
        service.changeCurrentUserPassword(request.getCurrentPassword(), request.getNewPassword());
        return "Password changed successfully";
    }
}
