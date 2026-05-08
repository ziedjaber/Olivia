package com.olivia.backend.controller;

import com.olivia.backend.model.Alerte;
import com.olivia.backend.model.Verger;
import com.olivia.backend.service.AlerteService;
import com.olivia.backend.service.VergerService;
import com.olivia.backend.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur de Simulation d'Alertes.
 * Permet de forcer l'apparition d'alertes de différents types pour tester 
 * le comportement du tableau de bord et des notifications.
 */
@RestController
@RequestMapping("/api/test/alerts")
@CrossOrigin(origins = "*")
public class AlertSimulationController {

    @Autowired
    private AlerteService alerteService;

    @Autowired
    private VergerService vergerService;

    @Autowired
    private AuditService auditService;

    /**
     * Simule trois scénarios critiques sur les vergers existants.
     * 1. Alerte Gel (Température < 5°C)
     * 2. Alerte Inondation (Pluie > 20mm)
     * 3. Alerte Maturité (Maturité > 95%)
     */
    @RequestMapping(value = "/simulate-all", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> simulateScenarios() {
        try {
            // 1. NETTOYAGE RADICAL (Alertes)
            alerteService.deleteAll();

            // 2. RÉCUPÉRATION OU CRÉATION DES VERGERS
            List<Verger> vergers = vergerService.getAllVergers();
            if (vergers.size() < 3) {
                return ResponseEntity.ok(Map.of(
                    "status", "error",
                    "message", "Action requise : Lancez d'abord http://localhost:8080/api/test/initialize pour créer les vergers."
                ));
            }

            Verger v1 = vergers.get(0);
            Verger v2 = vergers.size() > 1 ? vergers.get(1) : v1;
            Verger v3 = vergers.size() > 2 ? vergers.get(2) : v1;

            // 3. CRÉATION DES 3 ALERTES AVEC COORDONNÉES FORCÉES (Sfax, Zaghouan, Kairouan)
            createAlertWithCoords(v1, "WEATHER", "GEL - SECTEUR SFAX", "URGENT", "34.7333, 10.7600");
            createAlertWithCoords(v2, "MACHINE", "PANNE - SECTEUR ZAGHOUAN", "MEDIUM", "36.4000, 10.1400");
            createAlertWithCoords(v3, "OTHER", "INFOS - SECTEUR KAIROUAN", "LOW", "35.6700, 10.1000");

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "OUI ! Les 3 points sont maintenant forcés à des positions distinctes (Sfax, Zaghouan, Kairouan)."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

    private void createAlertWithCoords(Verger v, String type, String desc, String importance, String coords) throws Exception {
        Alerte alerte = new Alerte();
        alerte.setVergerId(v.getId());
        alerte.setType(type);
        alerte.setDescription(desc);
        alerte.setImportance(importance);
        alerte.setSenderUid("SYSTEM");
        alerte.setSenderName("Moteur Bio-Climatique");
        alerte.setLocalisation(coords);
        alerte.setDate(java.time.Instant.now().toString());
        alerte.setStatut("NON_TRAITEE");
        String resId = alerteService.create(alerte);
        auditService.log("SYSTEM", "Moteur Olivia", "SYSTEM", "ALERTE_SIMULEE", "Alerte", resId, desc);
    }
}

