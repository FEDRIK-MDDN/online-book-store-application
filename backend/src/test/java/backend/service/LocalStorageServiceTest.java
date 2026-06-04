package backend.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.FileSystemUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalStorageServiceTest {

    private Path tempDir;
    private LocalStorageService storageService;

    @BeforeEach
    void setUp() throws IOException {
        tempDir = Files.createTempDirectory("uploads-test-");
        storageService = new LocalStorageService(tempDir.toString(), "/uploads");
    }

    @AfterEach
    void tearDown() throws IOException {
        FileSystemUtils.deleteRecursively(tempDir);
    }

    @Test
    void storesJpegWithNormalizedExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "Avatar.JPG", "image/jpeg", new byte[]{1, 2, 3}
        );
        String url = storageService.store(file);
        assertNotNull(url);
        assertTrue(url.startsWith("/uploads/"));
        assertTrue(url.toLowerCase().endsWith(".jpg"));
        // verify file exists on disk
        String filename = url.substring(url.lastIndexOf('/') + 1);
        assertTrue(Files.exists(tempDir.resolve(filename)));
    }

    @Test
    void acceptsMissingMimeWhenExtensionSafe() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "pic.png", null, new byte[]{4, 5, 6}
        );
        String url = storageService.store(file);
        assertNotNull(url);
        assertTrue(url.endsWith(".png"));
    }

    @Test
    void rejectsUnsupportedType() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.txt", "text/plain", new byte[]{7, 8}
        );
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> storageService.store(file));
        assertTrue(ex.getMessage().toLowerCase().contains("unsupported"));
    }

    @Test
    void rejectsEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "empty.jpg", "image/jpeg", new byte[]{}
        );
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> storageService.store(file));
        assertTrue(ex.getMessage().toLowerCase().contains("empty"));
    }
}

