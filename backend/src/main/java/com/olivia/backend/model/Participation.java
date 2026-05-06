package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * Represents a worker's participation record in a Collecte.
 * Stored in Firestore collection: "participations"
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Participation {
    private String id;

    // References (stored as IDs for Firestore flat model)
    private String collecteId;
    private String ouvrierUid;

    // Denormalized for efficient display (no extra Firestore lookups on read)
    private String ouvrierName;
    private String ouvrierEmail;
    private String collecteDescription;
    private String collecteType;   // planifiee / urgente
    private String   collecteDate;
    private String   collecteEndDate;
    private String collecteLocation;

    // Status lifecycle
    private String status;         // mirrors ParticipationStatus enum name

    // Timestamps
    private String dateInvitation;
    private String dateReponse;

    // Who sent the invite
    private String invitedByUid;
    private String invitedByName;

    // Added for new worker UI requirements
    private Boolean salaryPaid;
    private String dateRemoved;
    private Double dailySalary;
}
