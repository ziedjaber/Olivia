package com.olivia.backend.controller;

import com.olivia.backend.model.LogisticResource;
import com.olivia.backend.service.FileService;
import com.olivia.backend.service.LogisticResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/logistics")
@CrossOrigin(origins = "*")
public class LogisticResourceController {

    @Autowired
    private LogisticResourceService resourceService;

    @Autowired
    private FileService fileService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> createResource(@RequestBody LogisticResource resource) {
        try {
            return ResponseEntity.ok(resourceService.createResource(resource));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create resource: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> updateResource(@PathVariable String id, @RequestBody LogisticResource resource) {
        try {
            return ResponseEntity.ok(resourceService.updateResource(id, resource));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update resource: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> deleteResource(@PathVariable String id) {
        try {
            resourceService.deleteResource(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete resource: " + e.getMessage());
        }
    }

    @PostMapping("/image")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> uploadResourceImages(@RequestParam("files") MultipartFile[] files) {
        try {
            if (files.length > 4) {
                return ResponseEntity.badRequest().body("Maximum of 4 images allowed per resource.");
            }
            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile file : files) {
                String fileName = fileService.saveResourceImage(file, "upload");
                imageUrls.add("/uploads/resources/" + fileName);
            }
            return ResponseEntity.ok(imageUrls);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to upload images: " + e.getMessage());
        }
    }
}
