package com.olivia.backend.service;

import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.exceptions.ResourceNotFoundException;
import com.olivia.backend.model.Verger;
import com.olivia.backend.repository.VergerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class VergerService {

    @Autowired
    private VergerRepository vergerRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuthService authService;

    public List<Verger> getAllVergers() {
        return vergerRepository.findAll();
    }

    public List<Verger> getVergersByProprietaire(String ownerId) {
        if (ownerId == null) return new ArrayList<>();
        return vergerRepository.findByProprietaireId(ownerId);
    }

    public List<Verger> getVergersByResponsable(String chefUid) {
        if (chefUid == null) return new ArrayList<>();
        return vergerRepository.findByResponsableUid(chefUid);
    }

    public Optional<Verger> getVergerById(String id) {
        if (id == null) return Optional.empty();
        return vergerRepository.findById(id);
    }

    public Verger createVerger(Verger verger) {
        try {
            if (verger.getId() == null || verger.getId().isEmpty()) {
                verger.setId(UUID.randomUUID().toString());
            }
            if (verger.getStatut() == null || verger.getStatut().isEmpty()) {
                verger.setStatut("EN_ATTENTE");
            }

            vergerRepository.save(verger);
            
            // Notifications
            notificationService.notifyRole(com.olivia.backend.model.Role.DIRECTEUR, "Nouveau Verger", "Un nouveau verger '" + verger.getNom() + "' a été ajouté au système.", "INFO");
            if (verger.getResponsableUid() != null) {
                notificationService.sendToUser(verger.getResponsableUid(), "Assignation de Verger", "Vous avez été assigné comme responsable du verger: " + verger.getNom(), "INFO");
            }

            String currentUid = authService.extractUserIdFromToken();
            auditService.log(currentUid, "CREATE", "VERGERS", "Created verger: " + verger.getNom(), verger.getId());

            log.info("Successfully saved verger {} to Firestore", verger.getId());
            return verger;
        } catch (Exception e) {
            log.error("Error creating verger: {}", e.getMessage());
            throw new BusinessLogicException("Failed to save Verger to Firestore", e);
        }
    }

    public Verger updateVerger(String id, Verger vergerDetails) {
        if (id == null) throw new IllegalArgumentException("ID cannot be null");
        try {
            vergerDetails.setId(id);
            vergerRepository.save(vergerDetails);

            notificationService.notifyRole(com.olivia.backend.model.Role.DIRECTEUR, "Verger Mis à Jour", "Le verger '" + vergerDetails.getNom() + "' a été modifié.", "INFO");

            String currentUid = authService.extractUserIdFromToken();
            auditService.log(currentUid, "UPDATE", "VERGERS", "Updated verger: " + vergerDetails.getNom(), id);

            return vergerDetails;
        } catch (Exception e) {
            log.error("Error updating verger {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to update Verger in Firestore", e);
        }
    }

    public void deleteVerger(String id) {
        if (id == null) return;
        try {
            vergerRepository.deleteById(id);
            
            String currentUid = authService.extractUserIdFromToken();
            auditService.log(currentUid, "DELETE", "VERGERS", "Deleted verger", id);
        } catch (Exception e) {
            log.error("Error deleting verger {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to delete Verger from Firestore", e);
        }
    }

    public Verger generateTrees(String id, boolean force) {
        Verger verger = getVergerById(id).orElseThrow(() -> new ResourceNotFoundException("Verger", "id", id));
        if (!force && verger.getTrees() != null && !verger.getTrees().isEmpty()) {
            return verger; // already populated and not forced
        }
        
        if (verger.getLocalisation() == null || !verger.getLocalisation().contains(",")) return verger;
        try {
            String[] parts = verger.getLocalisation().split(",");
            double lat = Double.parseDouble(parts[0].trim());
            double lng = Double.parseDouble(parts[1].trim());

            int count = verger.getNombreArbres();
            if (count <= 0) return verger;
            if (count > 200) count = 200;

            List<Verger.OliveTree> trees = new ArrayList<>();
            int cols = (int) Math.ceil(Math.sqrt(count * 1.5));
            int rows = (int) Math.ceil((double) count / cols);
            double spacingInDegrees = 0.00012; 

            int treeCount = 0;
            for (int r = 0; r < rows && treeCount < count; r++) {
                for (int c = 0; c < cols && treeCount < count; c++) {
                    double offLat = (r - (rows - 1) / 2.0) * spacingInDegrees;
                    double offLng = (c - (cols - 1) / 2.0) * spacingInDegrees / Math.cos(Math.toRadians(lat));

                    String tId = UUID.randomUUID().toString().substring(0, 8);
                    trees.add(new Verger.OliveTree(tId, lat + offLat, lng + offLng, "A_FAIRE"));
                    treeCount++;
                }
            }

            verger.setTrees(trees);
            updateVerger(verger.getId(), verger);
            return verger;
        } catch (Exception e) {
            log.error("Failed to generate trees for verger {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Error generating trees", e);
        }
    }

    public Verger generateTrees(String id) {
        return generateTrees(id, false);
    }

    public Verger updateTreeStatus(String vergerId, String treeId, String status) {
        Verger verger = getVergerById(vergerId).orElseThrow(() -> new ResourceNotFoundException("Verger", "id", vergerId));
        if (verger.getTrees() == null) return verger;

        boolean updated = false;
        for (Verger.OliveTree tree : verger.getTrees()) {
            if (tree.getId() != null && tree.getId().equals(treeId)) {
                tree.setStatus(status);
                updated = true;
                break;
            }
        }

        if (updated) {
            updateVerger(vergerId, verger);
        }
        return verger;
    }
    public void updateMaturite(String id, int level, String aiJustification) throws Exception {
        vergerRepository.updateField(id, "pourcentageMaturite", level);
        vergerRepository.updateField(id, "aiJustification", aiJustification);
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "UPDATE", "VERGERS", "Updated maturity to " + level + "% (AI)", id);
    }
}

