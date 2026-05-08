package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.SetOptions;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.Alerte;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Repository
public class AlerteRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "alertes";

    public List<Alerte> findAll() {
        try {
            var docs = db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Alerte> list = new ArrayList<>();
            for (var d : docs) {
                Alerte a = d.toObject(Alerte.class);
                if (a != null) {
                    a.setId(d.getId());
                    list.add(a);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch all alertes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Alerte> findBySenderUid(String uid) {
        try {
            var docs = db.collection(COLLECTION).whereEqualTo("senderUid", uid)
                    .get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Alerte> list = new ArrayList<>();
            for (var d : docs) {
                Alerte a = d.toObject(Alerte.class);
                if (a != null) {
                    a.setId(d.getId());
                    list.add(a);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to find alertes by sender {}: {}", uid, e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Alerte> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Alerte a = doc.toObject(Alerte.class);
                if (a != null) a.setId(doc.getId());
                return Optional.ofNullable(a);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find alerte by id {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public void save(Alerte alerte) {
        try {
            db.collection(COLLECTION).document(alerte.getId()).set(alerte).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save alerte {}: {}", alerte.getId(), e.getMessage());
            throw new BusinessLogicException("Failed to save alerte", e);
        }
    }

    public void update(Alerte alerte) {
        try {
            db.collection(COLLECTION).document(alerte.getId()).set(alerte, SetOptions.merge()).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to update alerte {}: {}", alerte.getId(), e.getMessage());
            throw new BusinessLogicException("Failed to update alerte", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete alerte {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to delete alerte", e);
        }
    }

    public void updateField(String id, String field, Object value) {
        try {
            db.collection(COLLECTION).document(id).update(field, value).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to update alerte field: {}", e.getMessage());
            throw new BusinessLogicException("Failed to update alerte field", e);
        }
    }

    public void deleteAll() {
        try {
            var docs = db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments();
            for (var d : docs) {
                db.collection(COLLECTION).document(d.getId()).delete();
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete all alerts: {}", e.getMessage());
        }
    }
}

