package com.olivia.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.olivia.backend.model.Alerte;
import com.olivia.backend.model.VarieteOlive;
import com.olivia.backend.model.Verger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Service Intelligent de Prédiction de la Maturité des Olives.
 * Basé sur le modèle GDD (Growing Degree Days) : accumulation de chaleur.
 * Seuil de base pour l'olivier : 10°C.
 */
@Slf4j
@Service
public class MaturitePredictionService {

    @Autowired
    private VergerService vergerService;

    @Autowired
    private AlerteService alerteService;

    @Autowired
    private AuditService auditService;

    private final WebClient webClient = WebClient.create("https://api.open-meteo.com/v1/forecast");
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Tâche planifiée : S'exécute chaque nuit à 2h du matin.
     * Met à jour l'état de maturité de tous les vergers en fonction de la météo réelle.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void processAllVergersMaturity() {
        log.info(">>> DÉMARRAGE DU CALCUL DE MATURITÉ (Moteur Intelligent) <<<");
        try {
            List<Verger> vergers = vergerService.getAllVergers();
            for (Verger verger : vergers) {
                processSingleVerger(verger);
            }
            log.info(">>> CALCUL DE MATURITÉ TERMINÉ POUR TOUS LES VERGERS <<<");
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des vergers pour maturité : {}", e.getMessage());
        }
    }

    private void processSingleVerger(Verger verger) {
        // Condition obligatoire : date de référence pour le calcul du cumul
        if (verger.getDateReferenceCalculGDD() == null || verger.getDateReferenceCalculGDD().isEmpty()) {
            log.warn("Verger {} sauté : dateReferenceCalculGDD manquante", verger.getNom());
            return;
        }

        LocalDate refDate = LocalDate.parse(verger.getDateReferenceCalculGDD());

        try {
            // 1. Appel API Open-Meteo pour récupérer Tmin/Tmax d'hier
            String[] coords = verger.getLocalisation().split(",");
            if (coords.length < 2) return;
            
            String lat = coords[0].trim();
            String lon = coords[1].trim();

            Map<String, Object> response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("latitude", lat)
                            .queryParam("longitude", lon)
                            .queryParam("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum")
                            .queryParam("timezone", "auto")
                            .queryParam("past_days", 1)
                            .queryParam("forecast_days", 0)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("daily")) return;

            Map<String, Object> daily = (Map<String, Object>) response.get("daily");
            List<Double> tMaxs = (List<Double>) daily.get("temperature_2m_max");
            List<Double> tMins = (List<Double>) daily.get("temperature_2m_min");
            List<Double> rains = (List<Double>) daily.get("precipitation_sum");

            if (tMaxs == null || tMins == null || tMaxs.isEmpty()) return;

            double tMax = tMaxs.get(0);
            double tMin = tMins.get(0);
            double rain = (rains != null && !rains.isEmpty()) ? rains.get(0) : 0;

            // 2. Calcul du GDD Quotidien (Standard agronomique : base 10°C)
            // Formule : max(0, (Tmax + Tmin)/2 - 10)
            double dailyGdd = Math.max(0, (tMax + tMin) / 2 - 10);

            // 3. Mise à jour du cumul (GDDCumules)
            double currentCumul = (verger.getGddCumules() != null) ? verger.getGddCumules() : 0;
            double newCumul = currentCumul + dailyGdd;
            verger.setGddCumules(newCumul);

            // 4. Calcul du pourcentage de maturité
            VarieteOlive variete = VarieteOlive.fromString(verger.getVarieteOlive());
            int seuil = variete.getGddSeuil();
            verger.setGddSeuilMaturite(seuil);
            
            double progress = (newCumul / seuil) * 100;
            verger.setPourcentageMaturite(Math.min(100.0, progress));
            verger.setNiveauMaturite((int) verger.getPourcentageMaturite().doubleValue());

            // 5. Estimation de la date de maturité prévue
            // Simplification : on estime que le futur aura un GDD moyen de 10/jour
            if (progress < 100) {
                long daysRemaining = (long) ((seuil - newCumul) / 10.0);
                verger.setDateMaturitePrevue(LocalDate.now().plusDays(daysRemaining).toString());
            } else {
                verger.setDateMaturitePrevue(LocalDate.now().toString());
            }

            // 6. Sauvegarde Météo
            ObjectNode meteo = objectMapper.createObjectNode();
            meteo.put("tMax", tMax);
            meteo.put("tMin", tMin);
            meteo.put("rain", rain);
            meteo.put("dailyGdd", dailyGdd);
            verger.setDerniereMeteoJson(meteo.toString());

            // 7. Génération d'alertes intelligentes
            checkAndAlert(verger, tMin, rain);

            // 8. Enregistrement
            vergerService.updateVerger(verger.getId(), verger);
            auditService.log("SYSTEM", "Moteur de Prédiction", "SYSTEM", "PREDICTION_MATURITE", 
                    "Verger", verger.getId(), 
                    String.format("Mise à jour maturité : %.1f%% (+%.2f GDD)", progress, dailyGdd));
            
            log.info("Verger '{}' mis à jour : {}% (GDD: {})", verger.getNom(), verger.getPourcentageMaturite(), verger.getGddCumules());

        } catch (Exception e) {
            log.error("Erreur calcul maturité pour verger {} : {}", verger.getId(), e.getMessage());
        }
    }

    private void checkAndAlert(Verger verger, double tMin, double rain) throws Exception {
        double progress = verger.getPourcentageMaturite();

        // Alerte Maturité
        if (progress >= 95 && progress < 96) { // On alerte une seule fois au passage du seuil (approx)
             createSystemAlert(verger, "MATURITE_IMMINENTE", "Urgent : Le verger a atteint 95% de maturité. Planifiez la récolte.", "URGENT");
        } else if (progress >= 85 && progress < 86) {
             createSystemAlert(verger, "MATURITE_PREVUE", "Information : Le verger est à 85% de maturité.", "MEDIUM");
        }

        // Alerte Risques Météo
        if (tMin < 5) {
             createSystemAlert(verger, "RISQUE_GEL", "Alerte Gel : Température minimale de " + tMin + "°C détectée.", "URGENT");
        }
        if (rain > 20) {
             createSystemAlert(verger, "PLUIE_FORTE", "Alerte Inondation : Précipitations de " + rain + "mm détectées.", "HIGH");
        }
    }

    private void createSystemAlert(Verger verger, String type, String desc, String importance) throws Exception {
        Alerte alerte = new Alerte();
        alerte.setVergerId(verger.getId());
        alerte.setType(type);
        alerte.setDescription(desc);
        alerte.setImportance(importance);
        alerte.setSenderUid("SYSTEM");
        alerte.setSenderName("Moteur Bio-Climatique");
        alerte.setLocalisation(verger.getLocalisation());
        alerteService.create(alerte);
    }
}
