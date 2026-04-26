package com.olivia.backend.controller;

import com.olivia.backend.model.AuditLog;
import com.olivia.backend.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
public class AuditController {

    @Autowired
    private AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_DIRECTEUR')")
    public List<AuditLog> getAll() {
        return auditService.getAll();
    }

    @GetMapping("/filter")
    @PreAuthorize("hasAuthority('ROLE_DIRECTEUR')")
    public List<AuditLog> getFiltered(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType) {
        return auditService.getAll().stream()
                .filter(logEntry -> action == null || (logEntry.getAction() != null && logEntry.getAction().equalsIgnoreCase(action)))
                .filter(logEntry -> entityType == null || (logEntry.getEntityType() != null && logEntry.getEntityType().equalsIgnoreCase(entityType)))
                .collect(Collectors.toList());
    }
}
