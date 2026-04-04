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
    private String type;
    private String description;
    private String statut;
}