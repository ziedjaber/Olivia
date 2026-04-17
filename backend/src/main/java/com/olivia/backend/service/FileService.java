package com.olivia.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileService {

    private final String avatarUploadDir = "uploads/avatars/";
    private final String resourceUploadDir = "uploads/resources/";

    public String saveAvatar(MultipartFile file, String userId) throws IOException {
        File dir = new File(avatarUploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String fileName = userId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path path = Paths.get(avatarUploadDir + fileName);
        Files.write(path, file.getBytes());

        return fileName;
    }

    public String saveAvatarFromUrl(String imageUrl, String userId) {
        if (imageUrl == null || imageUrl.isEmpty()) return null;

        try {
            File dir = new File(avatarUploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String extension = ".jpg"; // Default extension
            if (imageUrl.contains(".png")) extension = ".png";
            else if (imageUrl.contains(".webp")) extension = ".webp";
            
            String fileName = userId + "_" + System.currentTimeMillis() + "_google" + extension;
            Path path = Paths.get(avatarUploadDir + fileName);

            try (java.io.InputStream in = new java.net.URL(imageUrl).openStream()) {
                Files.copy(in, path, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            return fileName;
        } catch (Exception e) {
            System.err.println("Failed to download avatar: " + e.getMessage());
            return null;
        }
    }

    public String saveResourceImage(MultipartFile file, String resourceIdStr) throws IOException {
        File dir = new File(resourceUploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String fileName = "res_" + System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
        Path path = Paths.get(resourceUploadDir + fileName);
        Files.write(path, file.getBytes());

        return fileName;
    }
}
