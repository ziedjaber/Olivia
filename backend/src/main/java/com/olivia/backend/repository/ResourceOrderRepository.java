package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.ResourceOrder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Repository
public class ResourceOrderRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "resource_orders";

    public List<ResourceOrder> findAll() {
        try {
            var docs = db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments();
            List<ResourceOrder> list = new ArrayList<>();
            for (var d : docs) {
                ResourceOrder o = d.toObject(ResourceOrder.class);
                if (o != null) {
                    o.setId(d.getId());
                    list.add(o);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch all resource orders: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<ResourceOrder> findByRequesterUid(String uid) {
        try {
            var docs = db.collection(COLLECTION).whereEqualTo("requesterUid", uid)
                    .get().get(30, TimeUnit.SECONDS).getDocuments();
            List<ResourceOrder> list = new ArrayList<>();
            for (var d : docs) {
                ResourceOrder o = d.toObject(ResourceOrder.class);
                if (o != null) {
                    o.setId(d.getId());
                    list.add(o);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to find resource orders by requester {}: {}", uid, e.getMessage());
            return new ArrayList<>();
        }
    }


    public Optional<ResourceOrder> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                ResourceOrder o = doc.toObject(ResourceOrder.class);
                if (o != null) o.setId(doc.getId());
                return Optional.ofNullable(o);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find resource order by id {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public void save(ResourceOrder order) {
        try {
            db.collection(COLLECTION).document(order.getId()).set(order).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save resource order {}: {}", order.getId(), e.getMessage());
            throw new BusinessLogicException("Failed to save resource order", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete resource order {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to delete resource order", e);
        }
    }

    public void updateField(String id, String field, Object value) {
        try {
            db.collection(COLLECTION).document(id).update(field, value).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to update resource order field: {}", e.getMessage());
            throw new BusinessLogicException("Failed to update resource order field", e);
        }
    }
}
