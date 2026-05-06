package com.olivia.backend.controller;

import com.olivia.backend.model.Verger;
import com.olivia.backend.model.LogisticResource;
import com.olivia.backend.service.VergerService;
import com.olivia.backend.service.LogisticResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur utilitaire pour initialiser une base de données de test.
 * Ce contrôleur permet de peupler l'application avec des données réalistes 
 * (Vergers et Ressources Logistiques) pour tester les fonctionnalités.
 */
@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class DataInitializerController {

    @Autowired
    private VergerService vergerService;

    @Autowired
    private LogisticResourceService resourceService;

    /**
     * Point d'entrée pour initialiser les données de test.
     * URL: http://localhost:8080/api/test/initialize
     * @return Un message confirmant la création des données.
     */
    @GetMapping("/initialize")
    public ResponseEntity<?> initializeData() {
        try {
            // 1. Initialisation des Vergers de test
            createTestVergers();
            
            // 2. Initialisation des Ressources Logistiques
            createTestResources();

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Données de test initialisées avec succès (3 vergers et 5 ressources logistiques)."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de l'initialisation : " + e.getMessage());
        }
    }

    /**
     * Crée trois vergers situés dans différentes régions de Tunisie avec des états de maturité variés.
     */
    private void createTestVergers() {
        // Verger 1 : Sfax (Maturité avancée)
        Verger v1 = new Verger();
        v1.setNom("Domaine El-Anwar (Sfax)");
        v1.setVarieteOlive("CHEMLALI");
        v1.setLocalisation("34.7333, 10.7600"); // Coordonnées Sfax
        v1.setNombreArbres(1200);
        v1.setStatut("EN_ATTENTE");
        v1.setDateReferenceCalculGDD(LocalDate.now().minusMonths(6).toString());
        v1.setGddCumules(1420.0); // Proche du seuil 1500
        v1.setPourcentageMaturite(94.6);
        v1.setNiveauMaturite(94);
        v1.setProprietaireId("TEST_OWNER_1");
        v1.setResponsableUid("SYSTEM");
        vergerService.createVerger(v1);

        // Verger 2 : Zaghouan (Maturité intermédiaire)
        Verger v2 = new Verger();
        v2.setNom("Olivier Nord (Zaghouan)");
        v2.setVarieteOlive("CHETOUI");
        v2.setLocalisation("36.4000, 10.1400"); // Coordonnées Zaghouan
        v2.setNombreArbres(850);
        v2.setStatut("EN_ATTENTE");
        v2.setDateReferenceCalculGDD(LocalDate.now().minusMonths(5).toString());
        v2.setGddCumules(850.0); // Seuil 1700
        v2.setPourcentageMaturite(50.0);
        v2.setNiveauMaturite(50);
        v2.setProprietaireId("TEST_OWNER_1");
        v2.setResponsableUid("SYSTEM");
        vergerService.createVerger(v2);

        // Verger 3 : Kairouan (Début de cycle)
        Verger v3 = new Verger();
        v3.setNom("Plaine du Centre (Kairouan)");
        v3.setVarieteOlive("OUESLATI");
        v3.setLocalisation("35.6700, 10.1000"); // Coordonnées Kairouan
        v3.setNombreArbres(2500);
        v3.setStatut("EN_ATTENTE");
        v3.setDateReferenceCalculGDD(LocalDate.now().minusMonths(2).toString());
        v3.setGddCumules(200.0); // Seuil 1600
        v3.setPourcentageMaturite(12.5);
        v3.setNiveauMaturite(12);
        v3.setProprietaireId("TEST_OWNER_1");
        v3.setResponsableUid("SYSTEM");
        vergerService.createVerger(v3);
    }

    /**
     * Crée un inventaire de base pour la logistique (Tracteurs, outils, etc.).
     */
    private void createTestResources() {
        List<LogisticResource> list = new ArrayList<>();
        
        list.add(new LogisticResource(null, "TRAC-001", "Tracteur Massey Ferguson 440", "TRACTORS", "Tracteur robuste pour le transport des caisses", 45.0, new ArrayList<>(), 2, "Dépôt A", "active"));
        list.add(new LogisticResource(null, "TRAC-002", "Tracteur John Deere 5075", "TRACTORS", "Tracteur compact idéal pour les rangées serrées", 55.0, new ArrayList<>(), 1, "Dépôt B", "active"));
        list.add(new LogisticResource(null, "VIB-01", "Vibreur de tronc Pellenc", "MECHANICS", "Vibreur hydraulique haute performance", 30.0, new ArrayList<>(), 3, "Dépôt A", "active"));
        list.add(new LogisticResource(null, "CAIS-X100", "Lot de 100 Caisses Récolte", "TOOLS", "Caisses aérées pour conservation de l'olive", 0.0, new ArrayList<>(), 10, "Dépôt A", "active"));
        list.add(new LogisticResource(null, "FERT-NPK", "Engrais NPK 15-15-15", "FERTILIZER", "Engrais minéral pour phase de croissance", 12.0, new ArrayList<>(), 50, "Entrepôt Central", "low_stock"));

        for (LogisticResource res : list) {
            resourceService.createResource(res);
        }
    }
}
