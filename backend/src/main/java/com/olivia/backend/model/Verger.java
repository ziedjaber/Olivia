package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Verger {
    private String id;
    private String nom;
    private String typeOlive;
    private int niveauMaturite;
    private String localisation;
    private String proprietaireId;
    private String responsableUid;
    private String responsableName;
    private String descriptionMaturite;
    private String imageMaturiteUrl;
    private String dateDerniereMaturite;
    private int nombreArbres;
    private String statut; // EN_ATTENTE, RECOLTE_EN_COURS, RECOLTE_TERMINEE
    
    private List<BoundaryPoint> boundary;
    private List<OliveTree> trees;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoundaryPoint {
        private double lat;
        private double lng;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OliveTree {
        private String id;
        private double lat;
        private double lng;
        private String status; // A_FAIRE, EN_COURS, TERMINE
    }
}