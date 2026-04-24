package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

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
    private Date   collecteDate;
    private Date   collecteEndDate;
    private String collecteLocation;

    // Status lifecycle
    private String status;         // mirrors ParticipationStatus enum name

    // Timestamps
    private Date dateInvitation;
    private Date dateReponse;

    // Who sent the invite
    private String invitedByUid;
    private String invitedByName;

    // Added for new worker UI requirements
    private boolean salaryPaid;
    private Date dateRemoved;
    private Double dailySalary;
}
