package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    private String id;
    private Date timestamp;
    private String userId;
    private String userName;
    private String actionType; // CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN
    private String module;     // COLLECTE, LOGISTIQUE, USERS, VERGER, PARTICIPATION
    private String description;
    private String entityId;
}
