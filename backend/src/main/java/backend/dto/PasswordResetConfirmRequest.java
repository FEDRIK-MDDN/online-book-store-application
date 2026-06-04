package backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PasswordResetConfirmRequest {
    private String token;
    private String newPassword;

    @NotBlank
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
