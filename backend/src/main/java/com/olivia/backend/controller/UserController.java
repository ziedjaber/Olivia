package com.olivia.backend.controller;

import com.olivia.backend.model.User;
import com.olivia.backend.model.Role;
import com.olivia.backend.service.FileService;
import com.olivia.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private FileService fileService;

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(userService.getProfile(email));
        } catch (Exception e) {
            return ResponseEntity.status(404).body("Profile not found");
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody User user) {
        try {
            userService.updateProfile(user);
            return ResponseEntity.ok("Profile updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating profile: " + e.getMessage());
        }
    }

    // --- Administrative Endpoints ---

    @GetMapping
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching users");
        }
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<?> updateRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            Role role = Role.valueOf(body.get("role"));
            userService.updateRole(id, role);
            return ResponseEntity.ok("Role updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating role");
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<?> toggleStatus(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        try {
            userService.toggleStatus(id, body.get("active"));
            return ResponseEntity.ok("User status updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating status");
        }
    }

    @Autowired
    private com.olivia.backend.service.AuthService authService;

    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<?> adminCreateUser(@RequestBody com.olivia.backend.dto.AuthDTOs.RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok("User created successfully by admin");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating user: " + e.getMessage());
        }
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userService.getProfile(email);
            String fileName = fileService.saveAvatar(file, user.getId());
            String avatarUrl = "/uploads/avatars/" + fileName;
            user.setAvatarUrl(avatarUrl);
            userService.updateProfile(user);
            return ResponseEntity.ok(avatarUrl);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }
}