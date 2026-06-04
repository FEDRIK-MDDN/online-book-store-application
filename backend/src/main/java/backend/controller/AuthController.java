package backend.controller;

import backend.dto.UserDto;
import backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    @PostMapping("/login/body") // changed to avoid conflict with existing /users/login
    public ResponseEntity<UserDto> login(@RequestBody LoginRequest body) {
        UserDto dto = userService.login(body.email, body.password);
        return ResponseEntity.ok(dto);
    }
}
