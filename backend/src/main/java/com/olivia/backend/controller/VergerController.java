package com.olivia.backend.controller;

import com.olivia.backend.model.Verger;
import com.olivia.backend.model.User;
import com.olivia.backend.service.VergerService;
import com.olivia.backend.service.AuditService;
import com.olivia.backend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/vergers")
@CrossOrigin(origins = "*")
public class VergerController {

    @Autowired
    private VergerService vergerService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private UserService userService;

    private String getCurrentUserUid() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> getAllVergers() {
        return ResponseEntity.ok(vergerService.getAllVergers());
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('ROLE_OLEICULTEUR')")
    public ResponseEntity<?> getMyVergers() {
        return ResponseEntity.ok(vergerService.getVergersByProprietaire(getCurrentUserUid()));
    }

    @GetMapping("/responsable")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> getAssignedVergers() {
        return ResponseEntity.ok(vergerService.getVergersByResponsable(getCurrentUserUid()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_OLEICULTEUR', 'ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> getVerger(@PathVariable String id) {
        return vergerService.getVergerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR')")
    public ResponseEntity<?> createVerger(@RequestBody Verger verger) {
        try {
            Verger res = vergerService.createVerger(verger);
            logAudit("VERGER_CRÉÉ", "Verger", res.getId(), "Verger '" + verger.getNom() + "' créé");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create Verger: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_OLEICULTEUR')")
    public ResponseEntity<?> updateVerger(@PathVariable String id, @RequestBody Verger verger) {
        try {
            var existing = vergerService.getVergerById(id);
            if (existing.isEmpty()) return ResponseEntity.notFound().build();

            boolean isDirector = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                    .stream().anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTEUR"));

            if (!isDirector && !existing.get().getProprietaireId().equals(getCurrentUserUid())) {
                return ResponseEntity.status(403).body("You can only update your own orchards.");
            }

            Verger res = vergerService.updateVerger(id, verger);
            logAudit("VERGER_MODIFIÉ", "Verger", id, "Verger modifié");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update Verger: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/maturite")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> updateMaturite(@PathVariable String id, @RequestBody Map<String, Object> update) {
        try {
            var existingOpt = vergerService.getVergerById(id);
            if (existingOpt.isEmpty()) return ResponseEntity.notFound().build();

            Verger verger = existingOpt.get();
            if (update.containsKey("descriptionMaturite")) verger.setDescriptionMaturite((String) update.get("descriptionMaturite"));
            if (update.containsKey("imageMaturiteUrl")) verger.setImageMaturiteUrl((String) update.get("imageMaturiteUrl"));
            
            if (update.containsKey("niveauMaturite")) {
                Object val = update.get("niveauMaturite");
                if (val instanceof Number) verger.setNiveauMaturite(((Number) val).intValue());
            }

            verger.setDateDerniereMaturite(new java.util.Date().toString());

            Verger res = vergerService.updateVerger(id, verger);
            logAudit("MATURITÉ_MISE_À_JOUR", "Verger", id, "Maturité mise à jour");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update maturity: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/init-trees")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> initTrees(@PathVariable String id, @RequestParam(required = false, defaultValue = "false") boolean force) {
        try {
            return ResponseEntity.ok(vergerService.generateTrees(id, force));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to initialize trees: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/trees/{treeId}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> updateTreeStatus(@PathVariable String id, @PathVariable String treeId, @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null || status.isEmpty()) return ResponseEntity.badRequest().body("Status is required");
            return ResponseEntity.ok(vergerService.updateTreeStatus(id, treeId, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update tree status: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR')")
    public ResponseEntity<?> deleteVerger(@PathVariable String id) {
        try {
            vergerService.deleteVerger(id);
            logAudit("VERGER_SUPPRIMÉ", "Verger", id, "Verger supprimé");
            return ResponseEntity.ok("Verger deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete Verger: " + e.getMessage());
        }
    }

    private void logAudit(String action, String targetType, String targetId, String details) {
        try {
            String uid = getCurrentUserUid();
            User user = userService.getUserById(uid);
            String role = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .findFirst()
                    .orElse("ROLE_UNKNOWN");

            auditService.log(uid, user.getFullName(), role, action, targetType, targetId, details);
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement de l'audit pour l'action {}: {}", action, e.getMessage());
        }
    }
}