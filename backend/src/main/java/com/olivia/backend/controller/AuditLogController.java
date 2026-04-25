package com.olivia.backend.controller;

import com.olivia.backend.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_DIRECTEUR')")
    public ResponseEntity<?> getAllLogs(@RequestParam(required = false) String module) {
        try {
            if (module != null && !module.isBlank()) {
                return ResponseEntity.ok(auditLogService.getLogsByModule(module));
            }
            return ResponseEntity.ok(auditLogService.getAllLogs());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching audit logs: " + e.getMessage());
        }
    }
}
