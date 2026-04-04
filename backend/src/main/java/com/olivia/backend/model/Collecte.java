package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "collectes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Collecte {
    @Id
    private String id;
    private String vergerId;
    private Date date;
    private String type; // planifiee / urgente
    private String statut; // en_attente, en_cours, termine
}