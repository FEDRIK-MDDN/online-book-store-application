package backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    /**
     * Store a file and return a public URL (or path) that can be used by clients.
     */
    String store(MultipartFile file);
}

