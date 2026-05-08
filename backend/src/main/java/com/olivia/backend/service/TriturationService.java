package com.olivia.backend.service;

import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.Trituration;
import com.olivia.backend.repository.TriturationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class TriturationService {

    @Autowired
    private TriturationRepository triturationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    public List<Trituration> getAllTriturations() {
        return triturationRepository.findAll();
    }

    public Optional<Trituration> getTriturationById(String id) {
        if (id == null) return Optional.empty();
        return triturationRepository.findById(id);
    }

    public Trituration saveTrituration(Trituration trituration) {
        try {
            log.info("[DEBUG] Persisting trituration: {}", trituration);
            if (trituration.getId() == null || trituration.getId().isEmpty()) {
                trituration.setId(UUID.randomUUID().toString());
            }
            if (trituration.getStatus() == null) {
                trituration.setStatus("PLANNED");
            }

            triturationRepository.save(trituration);
            log.info("[DEBUG] Trituration {} successfully persisted in Firestore", trituration.getId());

            // Send Email if Completed
            if ("COMPLETED".equals(trituration.getStatus())) {
                try {
                    userService.getAllUsers().stream()
                            .filter(u -> "DIRECTEUR".equals(u.getRole().name()))
                            .findFirst()
                            .ifPresent(director -> {
                                Map<String, Object> vars = new java.util.HashMap<>();
                                vars.put("userName", director.getFullName());
                                vars.put("oilVolume", trituration.getOilProducedLiters());
                                vars.put("qualityGrade", trituration.getQuality());
                                vars.put("orchardName", trituration.getMillName()); 
                                emailService.sendHtmlEmail(director.getEmail(), "Oil Production Ready: " + trituration.getId(), "emails/production-ready", vars);
                            });
                } catch (Exception emailEx) {
                    log.warn("Failed to dispatch production email: {}", emailEx.getMessage());
                }
            }

            return trituration;
        } catch (Exception e) {
            log.error("Failed to persist trituration {}: {}", trituration.getId(), e.getMessage());
            throw new BusinessLogicException("Persistence failure: " + e.getMessage(), e);
        }
    }

    public void deleteTrituration(String id) {
        try {
            triturationRepository.deleteById(id);
            log.info("Trituration {} deleted", id);
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to delete trituration: " + e.getMessage(), e);
        }
    }
}

