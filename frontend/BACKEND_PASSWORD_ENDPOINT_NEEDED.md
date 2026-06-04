# Backend Password Change Endpoint Required

## Issue
The Profile page has password change functionality, but the backend is missing the endpoint.

## Solution
Add this endpoint to your `UserController.java`:

```java
@PutMapping("/me/password")
public String updatePassword(@RequestBody @Valid PasswordChangeRequest request) {
    service.updateCurrentUserPassword(request.getOldPassword(), request.getNewPassword());
    return "Password updated successfully";
}
```

## Create PasswordChangeRequest DTO

Create a new file `backend/dto/PasswordChangeRequest.java`:

```java
package backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PasswordChangeRequest {
    
    @NotBlank(message = "Old password is required")
    private String oldPassword;
    
    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;

    // Getters and Setters
    public String getOldPassword() {
        return oldPassword;
    }

    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
```

## Add Method to UserService

Add this method to your `UserService.java`:

```java
public void updateCurrentUserPassword(String oldPassword, String newPassword) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
        throw new IllegalStateException("No authenticated user");
    }
    
    String email = auth.getName();
    UserModel user = repository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    
    // Verify old password
    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
        throw new IllegalArgumentException("Old password is incorrect");
    }
    
    // Update to new password
    user.setPassword(passwordEncoder.encode(newPassword));
    repository.save(user);
}
```

## After Adding These
1. Restart your backend server
2. In Profile.jsx, uncomment the password change code (currently commented out)
3. Remove the early return statement in `handleSavePassword`
