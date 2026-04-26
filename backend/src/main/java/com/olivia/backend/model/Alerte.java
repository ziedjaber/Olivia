package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Alerte {
    private String id;
    private String vergerId;
    private String collecteId;
    private String type; // MACHINE, ACCIDENT, INFRASTRUCTURE, WEATHER, OTHER
    private String description;
    private String importance; // LOW, MEDIUM, URGENT
    private String imageUrl; // Kept for legacy compatibility
    private java.util.List<String> imageUrls;
    private String localisation; // lat,lng
    private String senderUid;
    private String senderName;
    private String date;
    private String statut; // NON_TRAITEE, TRAITEE
}