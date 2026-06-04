package backend.controller;

import backend.dto.LoginRequest;
import backend.model.BookModel;
import backend.model.OrderModel;
import backend.model.CategoryModel;
import backend.dto.UserDto;
import backend.dto.RegistrationRequest;
import backend.dto.UpdateUserRequest;
import backend.dto.UpdateOrderStatusRequest;
import backend.service.BookService;
import backend.service.CategoryService;
import backend.service.OrderService;
import backend.service.UserService;
import backend.service.StorageService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@Validated
public class AdminController {

    private final UserService userService;
    private final BookService bookService;
    private final CategoryService categoryService;
    private final OrderService orderService;
    private final StorageService storageService;

    public AdminController(UserService userService,
                           BookService bookService,
                           CategoryService categoryService,
                           OrderService orderService,
                           StorageService storageService) {
        this.userService = userService;
        this.bookService = bookService;
        this.categoryService = categoryService;
        this.orderService = orderService;
        this.storageService = storageService;
    }

    // --- AUTH ---
    @PostMapping("/login")
    public UserDto adminLogin(@RequestBody @Valid LoginRequest request) {
        UserDto dto = userService.login(request.getEmail(), request.getPassword());
        if (dto == null || dto.getRole() == null || !"ADMIN".equalsIgnoreCase(dto.getRole())) {
            throw new IllegalArgumentException("Admin credentials required");
        }
        return dto;
    }

    @PostMapping("/logout")
    public String adminLogout() {
        // JWT-based stateless logout: handled client-side by discarding token
        return "Logged out";
    }

    // --- DASHBOARD ---
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> dashboard() {
        Map<String, Object> res = new HashMap<>();
        res.put("users", userService.getAllUsers().size());
        res.put("books", bookService.getAll().size());
        res.put("categories", categoryService.getAll().size());
        // orders count requires repository; using service getAll()
        res.put("orders", orderService.getAll().size());
        return res;
    }

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> dashboardStats() {
        // Basic stats as a starting point; can be expanded later
        return dashboard();
    }

    // --- MINIMUM REQUIRED: books, categories, users, orders lists ---

    // Books
    @GetMapping("/books")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BookModel> adminBooks() {
        return bookService.getAll();
    }

    @PostMapping("/books")
    @PreAuthorize("hasRole('ADMIN')")
    public BookModel createBook(@RequestBody @Valid BookModel book) {
        return bookService.create(book);
    }

    // Categories
    @GetMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CategoryModel> adminCategories() {
        return categoryService.getAll();
    }

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryModel createCategory(@RequestBody @Valid CategoryModel category) {
        return categoryService.create(category);
    }

    // Users
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> adminUsers() {
        return userService.getAllUsers();
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto adminCreateUser(@RequestBody @Valid RegistrationRequest request,
                                   @RequestParam(value = "role", required = false) String role) {
        UserDto created = userService.register(request);
        if (role != null && !role.isBlank()) {
            userService.updateUserRole(created.getId(), role);
            // return updated user
            return userService.getUserById(created.getId());
        }
        return created;
    }

    // --- USER MANAGEMENT: get one, role update, delete ---
    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto adminGetUser(@PathVariable("id") Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto adminUpdateUser(@PathVariable("id") Long id,
                                   @RequestBody @Valid UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminUpdateUserRole(@PathVariable("id") Long id,
                                      @RequestParam("role") String role) {
        userService.updateUserRole(id, role);
        return "User role updated";
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminDeleteUser(@PathVariable("id") Long id) {
        userService.deleteUser(id);
        return "User deleted";
    }

    // Orders
    @GetMapping("/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderModel> adminOrders() {
        return orderService.getAll();
    }

    @PutMapping("/orders/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderModel updateOrderStatus(@PathVariable("id") Long id,
                                        @RequestBody @Valid UpdateOrderStatusRequest request) {
        return orderService.updateOrderStatus(id, request.getOrderStatus());
    }

    // --- ADMIN PASSWORD CHANGE ---
    @PutMapping(value = "/password")
    @PreAuthorize("hasRole('ADMIN')")
    public String changePassword(@RequestParam String currentPassword,
                                 @RequestParam String newPassword) {
        userService.changeCurrentUserPassword(currentPassword, newPassword);
        return "Password changed";
    }

    // --- USER ENABLE/DISABLE ---
    @PutMapping("/users/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public String activateUser(@PathVariable("id") Long id) {
        userService.activateUser(id);
        return "User activated";
    }

    @PutMapping("/users/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public String deactivateUser(@PathVariable("id") Long id) {
        userService.deactivateUser(id);
        return "User deactivated";
    }

    // --- BOOK CRUD ---
    @GetMapping("/books/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BookModel getBook(@PathVariable Long id) {
        return bookService.getById(id);
    }

    @PutMapping("/books/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BookModel updateBook(@PathVariable Long id, @RequestBody @Valid BookModel book) {
        return bookService.update(id, book);
    }

    @DeleteMapping("/books/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteBook(@PathVariable Long id) {
        bookService.delete(id);
        return "Book deleted";
    }

    @PutMapping("/books/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public BookModel updateBookStock(@PathVariable Long id, @RequestParam int stock) {
        BookModel existing = bookService.getById(id);
        existing.setStock(stock);
        return bookService.update(id, existing);
    }

    @PutMapping("/books/{id}/price")
    @PreAuthorize("hasRole('ADMIN')")
    public BookModel updateBookPrice(@PathVariable Long id, @RequestParam BigDecimal price) {
        BookModel existing = bookService.getById(id);
        existing.setPrice(price);
        return bookService.update(id, existing);
    }

    @PostMapping(value = "/books/{id}/image/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public BookModel uploadBookImage(@PathVariable Long id,
                                     @RequestParam(value = "file", required = false) MultipartFile fileParam,
                                     @RequestParam(value = "image", required = false) MultipartFile imageParam,
                                     @RequestParam(value = "cover", required = false) MultipartFile coverParam,
                                     @RequestPart(value = "file", required = false) MultipartFile filePart) {
        MultipartFile file = fileParam != null ? fileParam : (imageParam != null ? imageParam : (coverParam != null ? coverParam : filePart));
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No image file provided. Use multipart field 'file', 'image', or 'cover'.");
        }
        String url = storageService.store(file);
        BookModel existing = bookService.getById(id);
        existing.setImageUrl(url);
        return bookService.update(id, existing);
    }
}
