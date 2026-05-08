package com.olivia.backend.service;

import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.LogisticResource;
import com.olivia.backend.repository.LogisticResourceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class LogisticResourceService {

    @Autowired
    private LogisticResourceRepository logisticResourceRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    public List<LogisticResource> getAllResources() {
        return logisticResourceRepository.findAll();
    }

    public Optional<LogisticResource> getResourceById(String id) {
        if (id == null) return Optional.empty();
        return logisticResourceRepository.findById(id);
    }

    public LogisticResource createResource(LogisticResource resource) {
        try {
            if (resource.getId() == null || resource.getId().isEmpty()) {
                resource.setId(UUID.randomUUID().toString());
            }
            if (resource.getSku() == null || resource.getSku().isEmpty()) {
                resource.setSku("#RES-" + (100 + new Random().nextInt(900)));
            }

            logisticResourceRepository.save(resource);
            log.info("Successfully saved logistic resource {} to Firestore", resource.getId());
            return resource;
        } catch (Exception e) {
            log.error("Error creating logistic resource: {}", e.getMessage());
            throw new BusinessLogicException("Failed to save LogisticResource to Firestore", e);
        }
    }

    public LogisticResource updateResource(String id, LogisticResource resource) {
        if (id == null) throw new IllegalArgumentException("ID cannot be null");
        try {
            resource.setId(id);
            logisticResourceRepository.save(resource);

            // Low Stock Alert
            if (resource.getStockLevel() < 10) {
                try {
                    userService.getAllUsers().stream()
                            .filter(u -> "RESPONSABLE_LOGISTIQUE".equals(u.getRole().name()))
                            .findFirst()
                            .ifPresent(manager -> {
                                Map<String, Object> vars = new HashMap<>();
                                vars.put("resourceName", resource.getName());
                                vars.put("currentStock", resource.getStockLevel());
                                vars.put("minThreshold", 10);
                                emailService.sendHtmlEmail(manager.getEmail(), "CRITICAL STOCK ALERT: " + resource.getName(), "emails/low-stock", vars);
                            });
                } catch (Exception emailEx) {
                    log.warn("Failed to dispatch low stock email: {}", emailEx.getMessage());
                }
            }

            return resource;
        } catch (Exception e) {
            log.error("Error updating logistic resource {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to update LogisticResource in Firestore", e);
        }
    }

    public void deleteResource(String id) {
        if (id == null) return;
        try {
            logisticResourceRepository.deleteById(id);
        } catch (Exception e) {
            log.error("Error deleting logistic resource {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to delete LogisticResource from Firestore", e);
        }
    }
}

