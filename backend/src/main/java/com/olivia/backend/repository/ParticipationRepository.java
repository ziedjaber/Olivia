package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.Participation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class ParticipationRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "participations";

    public List<Participation> findAll() {
        try {
            return db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        Participation p = d.toObject(Participation.class);
                        p.setId(d.getId());
                        return p;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch all participations: {}", e.getMessage());
            return List.of();
        }
    }

    public List<Participation> findByOuvrierUid(String uid) {
        try {
            return db.collection(COLLECTION).whereEqualTo("ouvrierUid", uid)
                    .get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        Participation p = d.toObject(Participation.class);
                        p.setId(d.getId());
                        return p;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to find participations for worker: {}", e.getMessage());
            return List.of();
        }
    }

    public List<Participation> findByCollecteId(String collecteId) {
        try {
            return db.collection(COLLECTION).whereEqualTo("collecteId", collecteId)
                    .get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        Participation p = d.toObject(Participation.class);
                        p.setId(d.getId());
                        return p;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to find participations for collecte: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<Participation> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Participation p = doc.toObject(Participation.class);
                p.setId(doc.getId());
                return Optional.ofNullable(p);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find participation by id: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void save(Participation p) {
        try {
            db.collection(COLLECTION).document(p.getId()).set(p).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save participation: {}", e.getMessage());
            throw new BusinessLogicException("Failed to save participation", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete participation: {}", e.getMessage());
        }
    }

    public void updateField(String id, String field, Object value) {
        try {
            db.collection(COLLECTION).document(id).update(field, value).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to update participation field: {}", e.getMessage());
            throw new BusinessLogicException("Failed to update participation field", e);
        }
    }
}

