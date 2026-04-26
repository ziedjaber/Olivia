package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogisticResource {
    private String id;
    private String sku;
    private String name;
    private String type; // e.g., MECHANICS, TOOLS, TRACTORS, BENNES, FERTILIZER
    private String description;
    private double pricePerHour;
    private List<String> images; // up to 4 URLs
    private int stockLevel;
    private String location; // e.g., Warehouse A
    private String status; // active, low_stock
}
