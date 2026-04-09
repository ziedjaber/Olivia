package com.olivia.backend.controller;

import com.olivia.backend.model.Participation;
import com.olivia.backend.service.ParticipationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/participations")
@CrossOrigin(origins = "*")
public class ParticipationController {

    @Autowired
    private ParticipationService participationService;

    private String currentUid() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // ─── GET WORKER INVITATIONS ────────────────────────────────────────────────

    @GetMapping("/mine")
    @PreAuthorize("hasAnyAuthority('ROLE_OUVRIER_RECOLTE')")
    public ResponseEntity<?> getMyParticipations() {
        try {
            return ResponseEntity.ok(participationService.getByOuvrier(currentUid()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching participations: " + e.getMessage());
        }
    }

    // ─── WORKER ACTIONS ────────────────────────────────────────────────────────

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasAnyAuthority('ROLE_OUVRIER_RECOLTE')")
    public ResponseEntity<?> acceptInvitation(@PathVariable String id) {
        try {
            Participation p = participationService.accept(id, currentUid());
            return ResponseEntity.ok(p);
        } catch (IllegalStateException | SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to accept invitation: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_OUVRIER_RECOLTE')")
    public ResponseEntity<?> rejectInvitation(@PathVariable String id) {
        try {
            Participation p = participationService.reject(id, currentUid());
            return ResponseEntity.ok(p);
        } catch (IllegalStateException | SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to reject invitation: " + e.getMessage());
        }
    }

    // ─── TEAM LEAD ACTIONS ──────────────────────────────────────────────────────

    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> getAllActiveParticipations() {
        return ResponseEntity.ok(participationService.getAllActiveParticipations());
    }

    @DeleteMapping("/{id}/remove")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> removeParticipation(@PathVariable String id) {
        try {
            participationService.remove(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to remove worker: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/pay")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> payWorker(@PathVariable String id) {
        try {
            Participation p = participationService.pay(id);
            return ResponseEntity.ok(p);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to pay worker: " + e.getMessage());
        }
    }
}
