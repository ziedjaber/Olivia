package com.olivia.backend.controller;

import com.olivia.backend.service.MaturitePredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.Map;

@RestController
@RequestMapping("/api/prediction")
@CrossOrigin(origins = "*")
public class MaturitePredictionController {

    @Autowired
    private MaturitePredictionService predictionService;

    @PostMapping("/sync")
    @PreAuthorize("hasAuthority('ROLE_DIRECTEUR')")
    public ResponseEntity<?> triggerManualPrediction() {
        try {
            predictionService.processAllVergersMaturity();
            return ResponseEntity.ok(Map.of("message", "Calcul de maturité déclenché avec succès. Vérifiez les logs ou l'historique d'audit."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors du déclenchement du calcul : " + e.getMessage());
        }
    }
}
