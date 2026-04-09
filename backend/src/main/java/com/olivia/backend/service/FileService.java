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
