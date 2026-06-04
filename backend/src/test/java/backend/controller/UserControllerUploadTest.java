package backend.controller;

import backend.dto.UserDto;
import backend.service.StorageService;
import backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerUploadTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private StorageService storageService;

    @MockBean
    private backend.service.OrderService orderService; // required by controller

    // Security beans (required because SecurityConfig/JwtAuthFilter are in the application context)
    @MockBean
    private backend.security.JwtAuthFilter jwtAuthFilter;

    @MockBean
    private backend.security.JwtUtil jwtUtil;

    @MockBean
    private backend.repository.UserRepository userRepository;

    @MockBean
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @MockBean
    private org.springframework.security.web.AuthenticationEntryPoint authenticationEntryPoint;

    private UserDto stubUserDto(String url) {
        UserDto dto = new UserDto();
        dto.setId(1L);
        dto.setEmail("user@example.com");
        dto.setName("User");
        dto.setRole("USER");
        dto.setVerified(true);
        dto.setProfileImageUrl(url);
        return dto;
    }

    @Test
    void uploadWithFileFieldWorks() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[]{1});
        when(storageService.store(any())).thenReturn("/uploads/x.jpg");
        when(userService.updateProfileImage(anyString())).thenReturn(stubUserDto("/uploads/x.jpg"));

        mockMvc.perform(multipart("/users/me/profile-image/upload")
                        .file(file)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("/uploads/x.jpg"));
    }

    @Test
    void uploadWithImageFieldWorks() throws Exception {
        MockMultipartFile file = new MockMultipartFile("image", "b.png", "image/png", new byte[]{2});
        when(storageService.store(any())).thenReturn("/uploads/y.png");
        when(userService.updateProfileImage(anyString())).thenReturn(stubUserDto("/uploads/y.png"));

        mockMvc.perform(multipart("/users/me/profile-image/upload")
                        .file(file)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("/uploads/y.png"));
    }

    @Test
    void uploadWithAvatarFieldWorks() throws Exception {
        MockMultipartFile file = new MockMultipartFile("avatar", "c.webp", "image/webp", new byte[]{3});
        when(storageService.store(any())).thenReturn("/uploads/z.webp");
        when(userService.updateProfileImage(anyString())).thenReturn(stubUserDto("/uploads/z.webp"));

        mockMvc.perform(multipart("/users/me/profile-image/upload")
                        .file(file)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("/uploads/z.webp"));
    }

    @Test
    void missingFileReturnsBadRequest() throws Exception {
        mockMvc.perform(multipart("/users/me/profile-image/upload")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest());
        Mockito.verify(storageService, Mockito.never()).store(any());
    }
}
