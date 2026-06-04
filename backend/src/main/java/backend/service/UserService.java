package backend.service;

import backend.dto.RegistrationRequest;
import backend.dto.UpdateUserRequest;
import backend.dto.UserDto;

import java.util.List;

public interface UserService {

    UserDto register(RegistrationRequest request);

    UserDto login(String email, String password);

    List<UserDto> getAllUsers();

    UserDto getUserById(Long id);

    UserDto updateUser(Long id, UpdateUserRequest user);

    void deleteUser(Long id);

    void requestPasswordReset(String email);

    void resetPassword(String token, String newPassword);

    UserDto getCurrentUser();

    UserDto updateCurrentUser(UpdateUserRequest request);

    UserDto updateProfileImage(String profileImageUrl);

    void deleteCurrentUser();

    // admin operations
    void activateUser(Long id);

    void deactivateUser(Long id);

    void changeCurrentUserPassword(String currentPassword, String newPassword);

    void updateUserRole(Long id, String role);
}
