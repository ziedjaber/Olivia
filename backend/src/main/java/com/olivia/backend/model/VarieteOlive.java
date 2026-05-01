package com.olivia.backend.model;

import lombok.Getter;

/**
 * Enumération des variétés d'olives tunisiennes avec leurs seuils de GDD (Growing Degree Days).
 * Le seuil GDD représente l'accumulation de chaleur nécessaire pour atteindre la maturité.
 * Base de calcul : 10°C (température de base pour l'olivier).
 */
@Getter
public enum VarieteOlive {
    CHEMLALI(1500, "Variété dominante à Sfax, très résistante à la sécheresse"),
    CHETOUI(1700, "Variété du Nord, réputée pour son huile fruitée, nécessite plus de chaleur"),
    OUESLATI(1600, "Variété du Centre (Kairouan), maturité intermédiaire"),
    ZALMATI(1550, "Variété du Sud (Zarzis), proche de la Chemlali"),
    MESKI(1400, "Olive de table, cycle plus court");

    private final int gddSeuil;
    private final String description;

    VarieteOlive(int gddSeuil, String description) {
        this.gddSeuil = gddSeuil;
        this.description = description;
    }

    public static VarieteOlive fromString(String text) {
        for (VarieteOlive v : VarieteOlive.values()) {
            if (v.name().equalsIgnoreCase(text)) {
                return v;
            }
        }
        return CHEMLALI; // Par défaut
    }
}
