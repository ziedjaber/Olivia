package com.olivia.backend.controller;

import com.olivia.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;
    private final com.google.cloud.firestore.Firestore firestore;

    public NotificationController(NotificationService notificationService, com.google.cloud.firestore.Firestore firestore) {
        this.notificationService = notificationService;
        this.firestore = firestore;
    }

    private String currentUid() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyNotifications() {
        try {
            return ResponseEntity.ok(notificationService.getUserNotifications(currentUid()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            notificationService.markAsRead(id, currentUid());
            return ResponseEntity.ok("Marqué comme lu");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAllAsRead() {
        try {
            notificationService.markAllAsRead(currentUid());
            return ResponseEntity.ok("Toutes marquées comme lues");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/bulk-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markBulkAsRead(@RequestBody java.util.List<String> ids) {
        try {
            notificationService.markSelectedAsRead(ids, currentUid());
            return ResponseEntity.ok("Sélection marquée comme lue");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/bulk-delete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteBulk(@RequestBody java.util.List<String> ids) {
        try {
            notificationService.deleteSelected(ids, currentUid());
            return ResponseEntity.ok("Sélection supprimée");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/test")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> sendTestNotification() {
        try {
            java.util.Map<String, Object> notif = new java.util.HashMap<>();
            notif.put("id", java.util.UUID.randomUUID().toString());
            notif.put("recipientUid", currentUid());
            notif.put("title", "Test Notification");
            notif.put("body", "Ceci est une notification de test générée à " + new java.util.Date());
            notif.put("type", "INFO");
            notif.put("read", false);
            notif.put("createdAt", java.time.Instant.now().toString());
            
            firestore.collection("notifications").document(notif.get("id").toString()).set(notif).get();
            return ResponseEntity.ok("Notification de test envoyée à " + currentUid());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur test: " + e.getMessage());
        }
    }
}
