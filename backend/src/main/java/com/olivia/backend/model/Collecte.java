package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Collecte {
    private String id;
    private String vergerId;
    private String vergerName; // denormalized for display
    private String chefUid; // UID of the Chef d'Équipe who created this
    private String chefName; // denormalized for display
    private String logisticsUid;
    private String logisticsName;
    private String description;

    private Date startDate;
    private Date endDate;

    private String type; // planifiee / urgente
    private String statut; // en_attente, en_cours, termine
    private Boolean logisticsReady;
    private Boolean workersReady;

    // Daily verification and tracking
    private String lastVerificationDate; // YYYY-MM-DD
    private List<DailyProgress> dailyReports;

    private int numberOfWorkers;
    private List<ResourceRequirement> requiredResources;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceRequirement {
        private String resourceId;
        private String resourceName;
        private int quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyProgress {
        private String id;
        private String date; // YYYY-MM-DD
        private int treesHarvested;
        private double weightKg;
        private String notes;
    }
}