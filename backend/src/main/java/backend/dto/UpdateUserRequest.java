package backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UpdateUserRequest {
    private String name;
    private String email;

    @NotBlank(message = "Name is required")
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}

