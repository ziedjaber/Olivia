package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private int nombreArbres;
    private String statut; // EN_ATTENTE, RECOLTE_EN_COURS, RECOLTE_TERMINEE
}