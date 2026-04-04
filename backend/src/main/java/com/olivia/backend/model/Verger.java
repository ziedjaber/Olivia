package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vergers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Verger {
    @Id
    private String id;
    private String nom;
    private String typeOlive;
    private int niveauMaturite;
    private String localisation;
    private String statut; // en_attente, recolte_en_cours
}