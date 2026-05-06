package com.olivia.backend.controller;

import com.olivia.backend.model.Alerte;
import com.olivia.backend.service.AlerteService;
import com.olivia.backend.service.AuditService;
import com.olivia.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertes")
@CrossOrigin(origins = "*")
public class AlerteController {

    @Autowired
    private AlerteService service;

    @Autowired
    private AuditService auditService;

    @Autowired
    private UserService userService;

    private String currentUid() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_RESPONSABLE_LOGISTIQUE', 'ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_USER')")
    public String create(@RequestBody Alerte a) throws Exception {
        System.out.println("[DIAGNOSTIC] AlerteController.create CALLED. Type: " + a.getType());
        try {
            String result = service.create(a);
            try {
                String uid = currentUid();
                String nom = userService.getUserById(uid).getFullName();
                String role = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                        .map(auth -> auth.getAuthority()).findFirst().orElse("ROLE_UNKNOWN");
                auditService.log(uid, nom, role, "ALERTE_CRÉÉE", "Alerte", result,
                        "Alerte '" + a.getType() + "' créée");
            } catch (Exception auditEx) {
            }

            System.out.println("[DIAGNOSTIC] Alerte successfully created. ID: " + result);
            return result;
        } catch (Exception e) {
            System.err.println("[DIAGNOSTIC] Alerte creation FAILED: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_RESPONSABLE_LOGISTIQUE', 'ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_USER')")
    public List<Alerte> getAll() throws Exception {
        return service.getAll();
    }

    @GetMapping("/mine/{uid}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_RESPONSABLE_LOGISTIQUE')")
    public List<Alerte> getMyAlertes(@PathVariable String uid) throws Exception {
        return service.getBySender(uid);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_RESPONSABLE_LOGISTIQUE')")
    public String update(@PathVariable String id, @RequestBody Alerte a) throws Exception {
        return service.update(id, a);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_RESPONSABLE_LOGISTIQUE')")
    public String delete(@PathVariable String id) throws Exception {
        return service.delete(id);
    }

    @PutMapping("/{id}/solve")
    @PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_USER')")
    public String solve(@PathVariable String id) throws Exception {
        String result = service.solve(id);
        try {
            String uid = currentUid();
            String nom = userService.getUserById(uid).getFullName();
            String role = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                    .map(auth -> auth.getAuthority()).findFirst().orElse("ROLE_UNKNOWN");
            auditService.log(uid, nom, role, "ALERTE_RÉSOLUE", "Alerte", id, "Alerte résolue");
        } catch (Exception auditEx) {
        }
        return result;
    }
}