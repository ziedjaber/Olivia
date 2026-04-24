package com.olivia.backend.model;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @DocumentId
    private String id;
    private String timestamp;
    private String acteurUid;
    private String acteurNom;
    private String acteurRole;
    private String action;
    private String entite;
    private String entiteId;
    private String details;
}
