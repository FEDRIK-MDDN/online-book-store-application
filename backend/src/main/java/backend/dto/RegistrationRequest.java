package backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegistrationRequest {
    private String name;
    private String email;
    private String password;

    @NotBlank(message = "Name is required")
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
