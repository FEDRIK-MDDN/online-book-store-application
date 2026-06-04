package backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    private String email;
    private String password;

    @Email
    @NotBlank
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @NotBlank
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
