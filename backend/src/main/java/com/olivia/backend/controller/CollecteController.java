package com.olivia.backend.controller;

import com.olivia.backend.model.Collecte;
import com.olivia.backend.model.Participation;
import com.olivia.backend.model.User;
import com.olivia.backend.service.CollecteService;
import com.olivia.backend.service.ParticipationService;
import com.olivia.backend.service.UserService;
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

    private String currentUid() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // ─── GET ALL (Director sees all, Chef sees own) ────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> getCollectes() {
        try {
            // Both Director and Chef see all collectes.
            // The frontend filters by chefUid for the Chef's view.
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
            
            // If the frontend provided a chefUid (Director selecting a chef), keep it.
            // If not (Chef creating their own mission), use the current user's UID.
            if (collecte.getChefUid() == null || collecte.getChefUid().isEmpty()) {
                String uid = currentUid();
                collecte.setChefUid(uid);
                User chef = userService.getUserById(uid);
                collecte.setChefName(chef.getFullName());
            } else {
                // Director specified a chef — resolve the chef's name from their UID
                User chef = userService.getUserById(collecte.getChefUid());
                collecte.setChefName(chef.getFullName());
            }
            
            log.info("[CollecteController] Finalizing mission with Chef: {} ({})", 
                    collecte.getChefName(), collecte.getChefUid());
            
            return ResponseEntity.ok(collecteService.createCollecte(collecte));
        } catch (Exception e) {
            log.error("[CollecteController] Failed to create mission: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to create collecte: " + e.getMessage());
        }
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> updateCollecte(@PathVariable String id, @RequestBody Collecte collecte) {
        try {
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
            return ResponseEntity.ok("Collecte ended. All assigned workers are now COMPLETED.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to end collecte: " + e.getMessage());
        }
    }

    // ─── INVITE WORKER ───────────────────────────────────────────────────────

    @PostMapping("/{id}/invite-ouvrier")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> inviteOuvrier(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            String ouvrierUid = (String) body.get("ouvrierUid");
            if (ouvrierUid == null || ouvrierUid.isBlank()) {
                return ResponseEntity.badRequest().body("ouvrierUid is required.");
            }

            Double dailySalary = 0.0;
            if (body.containsKey("dailySalary") && body.get("dailySalary") != null) {
                dailySalary = Double.valueOf(body.get("dailySalary").toString());
            }

            // Fetch collecte details
            Optional<Collecte> collecteOpt = collecteService.getCollecteById(id);
            if (collecteOpt.isEmpty())
                return ResponseEntity.notFound().build();
            Collecte collecte = collecteOpt.get();

            // Fetch worker details
            User ouvrier = userService.getUserById(ouvrierUid);

            // Fetch inviter details
            User inviter = userService.getUserById(currentUid());

            Participation participation = participationService.invite(
                    id,
                    ouvrierUid,
                    ouvrier.getFullName(),
                    ouvrier.getEmail(),
                    collecte.getDescription(),
                    collecte.getType(),
                    collecte.getStartDate(),
                    collecte.getEndDate(),
                    collecte.getVergerName(),
                    currentUid(),
                    inviter.getFullName(),
                    dailySalary);
            return ResponseEntity.ok(participation);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(409).body(ise.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to invite worker: " + e.getMessage());
        }
    }

    // ─── GET WORKERS FOR A COLLECTE ──────────────────────────────────────────

    @GetMapping("/{id}/participations")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_CHEF_EQUIPE_RECOLTE')")
    public ResponseEntity<?> getParticipations(@PathVariable String id) {
        return ResponseEntity.ok(participationService.getByCollecte(id));
    }
}
