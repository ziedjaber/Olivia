package com.olivia.backend.controller;

import com.olivia.backend.model.Collecte;
import com.olivia.backend.model.Participation;
import com.olivia.backend.model.User;
import com.olivia.backend.service.CollecteService;
import com.olivia.backend.service.ParticipationService;
import com.olivia.backend.service.UserService;
import com.olivia.backend.service.AuditService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/collectes")
@CrossOrigin(origins = "*")
public class CollecteController {

    @Autowired
    private CollecteService collecteService;
    @Autowired
    private ParticipationService participationService;
    @Autowired
    private UserService userService;
    @Autowired
    private AuditService auditService;  

    private String currentUid() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // Aide pour l'audit : centralise la récupération des infos de l'utilisateur courant
    private void logAudit(String action, String targetType, String targetId, String details) {
        try {
            String uid = currentUid();
            User user = userService.getUserById(uid);
            String role = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                    .map(a -> a.getAuthority()).findFirst().orElse("ROLE_UNKNOWN");
            auditService.log(uid, user.getFullName(), role, action, targetType, targetId, details);
        } catch (Exception e) {
            log.error("Failed to log audit for action {}: {}", action, e.getMessage());
        }
    }

    // ─── GET ALL (Director sees all, Chef sees own) ────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> getCollectes() {
        try {
            return ResponseEntity.ok(collecteService.getAllCollectes());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching collectes: " + e.getMessage());
        }
    }

    // ─── CREATE ────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> createCollecte(@RequestBody Collecte collecte) {
        try {
            log.info("[CollecteController] Creating mission: {}. Provided Chef UID: {}",
                    collecte.getDescription(), collecte.getChefUid());

            // 1. Gestion du Chef (Fusion HEAD + Chaima)
            if (collecte.getChefUid() == null || collecte.getChefUid().isEmpty()) {
                String uid = currentUid();
                collecte.setChefUid(uid);
                User chef = userService.getUserById(uid);
                collecte.setChefName(chef.getFullName());
            } else {
                User chef = userService.getUserById(collecte.getChefUid());
                if (chef != null) collecte.setChefName(chef.getFullName());
            }

            // 2. Resolve Responsable Logistique (Ta spécificité HEAD)
            if (collecte.getLogisticsUid() != null && !collecte.getLogisticsUid().isEmpty()) {
                User rm = userService.getUserById(collecte.getLogisticsUid());
                if (rm != null) collecte.setLogisticsName(rm.getFullName());
                log.info("[CollecteController] Resolved RM Name: {}", collecte.getLogisticsName());
            }

            Collecte result = collecteService.createCollecte(collecte);

            // 3. Audit (Spécificité Chaima)
            logAudit("COLLECTE_CRÉÉE", "Collecte", result.getId(), "Collecte '" + collecte.getDescription() + "' créée");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("[CollecteController] Failed to create mission: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to create collecte: " + e.getMessage());
        }
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> updateCollecte(@PathVariable String id, @RequestBody Collecte collecte) {
        try {
            log.info("[CollecteController] Updating mission: {}. RM_UID in payload: {}", id, collecte.getLogisticsUid());
            
            // Résolution des noms pour assurer la cohérence (Ta partie HEAD)
            if (collecte.getChefUid() != null && !collecte.getChefUid().isEmpty()) {
                User chef = userService.getUserById(collecte.getChefUid());
                if (chef != null) collecte.setChefName(chef.getFullName());
            }
            if (collecte.getLogisticsUid() != null && !collecte.getLogisticsUid().isEmpty()) {
                User rm = userService.getUserById(collecte.getLogisticsUid());
                if (rm != null) collecte.setLogisticsName(rm.getFullName());
            }

            return ResponseEntity.ok(collecteService.updateCollecte(id, collecte));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update collecte: " + e.getMessage());
        }
    }

    // ─── LIFECYCLE ───────────────────────────────────────────────────────────

    @PutMapping("/{id}/start")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> startCollecte(@PathVariable String id) {
        try {
            collecteService.startCollecte(id);
            logAudit("COLLECTE_DÉMARRÉE", "Collecte", id, "Collecte démarrée");
            return ResponseEntity.ok("Collecte started. All accepted workers are now ASSIGNED.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to start collecte: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/end")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> endCollecte(@PathVariable String id) {
        try {
            collecteService.endCollecte(id);
            logAudit("COLLECTE_TERMINÉE", "Collecte", id, "Collecte terminée");
            return ResponseEntity.ok("Collecte ended. All assigned workers are now COMPLETED.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to end collecte: " + e.getMessage());
        }
    }

    // ─── PROGRESSION JOURNALIÈRE (Tes ajouts HEAD) ──────────────────────────

    @PutMapping("/{id}/verify-day")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> verifyDay(@PathVariable String id) {
        try {
            return ResponseEntity.ok(collecteService.verifyDay(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to verify day: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/progress")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> addDailyProgress(@PathVariable String id, @RequestBody Collecte.DailyProgress progress) {
        try {
            return ResponseEntity.ok(collecteService.addDailyProgress(id, progress));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add daily progress: " + e.getMessage());
        }
    }

    // ─── INVITE WORKER ───────────────────────────────────────────────────────

    @PostMapping("/{id}/invite-ouvrier")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> inviteOuvrier(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            String ouvrierUid = (String) body.get("ouvrierUid");
            if (ouvrierUid == null || ouvrierUid.isBlank()) {
                return ResponseEntity.badRequest().body("ouvrierUid is required.");
            }

            Double dailySalary = 0.0;
            if (body.containsKey("dailySalary") && body.get("dailySalary") != null) {
                dailySalary = Double.valueOf(body.get("dailySalary").toString());
            }

            Optional<Collecte> collecteOpt = collecteService.getCollecteById(id);
            if (collecteOpt.isEmpty()) return ResponseEntity.notFound().build();
            Collecte collecte = collecteOpt.get();

            User ouvrier = userService.getUserById(ouvrierUid);
            User inviter = userService.getUserById(currentUid());

            Participation participation = participationService.invite(
                    id, ouvrierUid, ouvrier.getFullName(), ouvrier.getEmail(),
                    collecte.getDescription(), collecte.getType(),
                    collecte.getStartDate(), collecte.getEndDate(),
                    collecte.getVergerName(), currentUid(), inviter.getFullName(), dailySalary);

            logAudit("OUVRIER_INVITÉ", "Participation", ouvrierUid, "Ouvrier invité à la collecte " + id);

            return ResponseEntity.ok(participation);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(409).body(ise.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to invite worker: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/participations")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> getParticipations(@PathVariable String id) {
        return ResponseEntity.ok(participationService.getByCollecte(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR')")
    public ResponseEntity<?> deleteCollecte(@PathVariable String id) {
        try {
            collecteService.deleteCollecte(id);
            return ResponseEntity.ok("Mission deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting mission: " + e.getMessage());
        }
    }
}