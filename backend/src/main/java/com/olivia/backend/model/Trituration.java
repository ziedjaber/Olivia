package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Trituration {
    private String id;
    private String collecteId;
    private String vergerId;
    private String vergerName;
    private String oliveType;
    
    private Double inputWeightKg;
    private String millId; // Linked to MillingCenter
    private String millName;
    private String status; // PLANNED, PROCESSING, COMPLETED
    private Date plannedDate;
    
    // Results (Nullable during planning)
    private Double oilProducedLiters;
    private Double acidity;
    private String quality; // Extra Virgin, Virgin, Lampante
    private String workerNotes;
}
