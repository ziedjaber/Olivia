package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MillingCenter {
    private String id;
    private String name;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private String contactNumber;
    private Integer dailyCapacityKg;
    private String status; // ACTIVE, INACTIVE, MAINTENANCE
}
