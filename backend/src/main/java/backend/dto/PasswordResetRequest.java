package backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class PasswordResetRequest {
    private String email;

    @Email
    @NotBlank
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
