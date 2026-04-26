package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class AuditLog {
    private String id;
    private String timestamp;
    
    // Acteur
    private String userId;
    private String userName;
    private String userRole;
    
    // Action
    private String action;      // ex: VERGER_CREE, COLLECTE_TERMINEE
    private String entityType;  // ex: Verger, Collecte, User
    private String entityId;
    
    // Details
    private String details;
}
