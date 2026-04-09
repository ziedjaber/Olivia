package com.olivia.backend.controller;

import com.olivia.backend.model.Verger;
import com.olivia.backend.service.VergerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vergers")
@CrossOrigin(origins = "*")
public class VergerController {

    @Autowired
    private VergerService vergerService;

    private String getCurrentUserUid() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> getAllVergers() {
        return ResponseEntity.ok(vergerService.getAllVergers());
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('ROLE_OLEICULTEUR')")
    public ResponseEntity<?> getMyVergers() {
        return ResponseEntity.ok(vergerService.getVergersByProprietaire(getCurrentUserUid()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_OLEICULTEUR')")
    public ResponseEntity<?> getVerger(@PathVariable String id) {
        return vergerService.getVergerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR')")
    public ResponseEntity<?> createVerger(@RequestBody Verger verger) {
        try {
            // If grower, force the owner ID to be the current user
            // We can't use simple role check alone if we want to be strict, but for now we
            // follow the requirement.
            return ResponseEntity.ok(vergerService.createVerger(verger));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create Verger: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_OLEICULTEUR')")
    public ResponseEntity<?> updateVerger(@PathVariable String id, @RequestBody Verger verger) {
        try {
            // Security check for Growers: Can only update their own orchards
            var existing = vergerService.getVergerById(id);
            if (existing.isEmpty())
                return ResponseEntity.notFound().build();

            boolean isDirector = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                    .stream().anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTEUR"));

            if (!isDirector && !existing.get().getProprietaireId().equals(getCurrentUserUid())) {
                return ResponseEntity.status(403).body("You can only update your own orchards.");
            }

            return ResponseEntity.ok(vergerService.updateVerger(id, verger));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update Verger: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR')")
    public ResponseEntity<?> deleteVerger(@PathVariable String id) {
        try {
            vergerService.deleteVerger(id);
            return ResponseEntity.ok("Verger deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete Verger: " + e.getMessage());
        }
    }
}
