package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.Verger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Repository
public class VergerRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "vergers";

    public List<Verger> findAll() {
        try {
            var docs = db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Verger> list = new ArrayList<>();
            for (var d : docs) {
                Verger v = d.toObject(Verger.class);
                if (v != null) {
                    v.setId(d.getId());
                    list.add(v);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch all vergers: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Verger> findByProprietaireId(String uid) {
        try {
            var docs = db.collection(COLLECTION).whereEqualTo("proprietaireId", uid)
                    .get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Verger> list = new ArrayList<>();
            for (var d : docs) {
                Verger v = d.toObject(Verger.class);
                if (v != null) {
                    v.setId(d.getId());
                    list.add(v);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to find vergers by owner {}: {}", uid, e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Verger> findByResponsableUid(String uid) {
        try {
            var docs = db.collection(COLLECTION).whereEqualTo("responsableUid", uid)
                    .get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Verger> list = new ArrayList<>();
            for (var d : docs) {
                Verger v = d.toObject(Verger.class);
                if (v != null) {
                    v.setId(d.getId());
                    list.add(v);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to find vergers by responsable {}: {}", uid, e.getMessage());
            return new ArrayList<>();
        }
    }


    public Optional<Verger> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Verger v = doc.toObject(Verger.class);
                if (v != null) v.setId(doc.getId());
                return Optional.ofNullable(v);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find verger by id {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public void save(Verger verger) {
        try {
            db.collection(COLLECTION).document(verger.getId()).set(verger).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save verger {}: {}", verger.getId(), e.getMessage());
            throw new BusinessLogicException("Failed to save verger", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete verger {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to delete verger", e);
        }
    }

    public void updateField(String id, String field, Object value) {
        try {
            db.collection(COLLECTION).document(id).update(field, value).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to update verger field: {}", e.getMessage());
            throw new BusinessLogicException("Failed to update verger field", e);
        }
    }
}
