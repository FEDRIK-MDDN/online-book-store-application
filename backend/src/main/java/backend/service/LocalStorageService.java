package backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private final Path uploadRoot;
    private final String publicBasePath;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            MediaType.IMAGE_GIF_VALUE,
            "image/webp"
    );

    public LocalStorageService(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.public-base:/uploads}") String publicBase
    ) throws IOException {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.publicBasePath = publicBase.endsWith("/") ? publicBase.substring(0, publicBase.length() - 1) : publicBase;
        Files.createDirectories(this.uploadRoot);
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        String contentType = file.getContentType();
        String original = file.getOriginalFilename();
        String ext = "";
        if (StringUtils.hasText(original) && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
            String lower = ext.toLowerCase();
            if (!(lower.equals(".jpg") || lower.equals(".jpeg") || lower.equals(".png") || lower.equals(".gif") || lower.equals(".webp"))) {
                ext = ""; // drop suspicious extensions
            } else {
                ext = lower; // normalize case
            }
        }
        // If content type is allowed but no extension, derive ext from content type
        if (!StringUtils.hasText(ext) && contentType != null) {
            switch (contentType.toLowerCase()) {
                case MediaType.IMAGE_JPEG_VALUE -> ext = ".jpg";
                case MediaType.IMAGE_PNG_VALUE -> ext = ".png";
                case MediaType.IMAGE_GIF_VALUE -> ext = ".gif";
                case "image/webp" -> ext = ".webp";
            }
        }
        // Validate by MIME OR by safe extension to support clients sending octet-stream
        boolean mimeOk = contentType != null && ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase());
        boolean extOk = StringUtils.hasText(ext);
        if (!mimeOk && !extOk) {
            throw new IllegalArgumentException("Unsupported file type");
        }

        String filename = UUID.randomUUID() + (StringUtils.hasText(ext) ? ext : "");
        Path target = uploadRoot.resolve(filename);
        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file", e);
        }
        // Return a public URL path that the app serves via resource handler
        return this.publicBasePath + "/" + filename;
    }
}
