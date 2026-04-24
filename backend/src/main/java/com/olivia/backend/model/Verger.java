package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

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
    
    @com.google.cloud.firestore.annotation.PropertyName("trees")
    public int getTrees() { return nombreArbres; }
    
    @com.google.cloud.firestore.annotation.PropertyName("trees")
    public void setTrees(int trees) { this.nombreArbres = trees; }

    private String statut; // EN_ATTENTE, RECOLTE_EN_COURS, RECOLTE_TERMINEE

    // Nouveaux champs pour le moteur de prédiction
    private String varieteOlive;                // ex: "CHEMLALI", "CHETOUI"
    private String datePlantation;           // optionnel
    private String dateReferenceCalculGDD;   // obligatoire pour le calcul
    private Double gddCumules;                  // mis à jour chaque nuit
    private Integer gddSeuilMaturite;           // selon variété (ex: 1500)
    private Double pourcentageMaturite;         // 0-100
    private String dateMaturitePrevue;
    private String derniereMeteoJson;           // sauvegarde du dernier état météo
}