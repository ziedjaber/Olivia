package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.ResourceOrder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ResourceOrderService {

    @org.springframework.beans.factory.annotation.Autowired
    private com.google.cloud.firestore.Firestore db;

    private static final String COL = "resource_orders";

    public List<ResourceOrder> getOrdersByRequester(String requesterUid) {
        try {
            return db.collection(COL)
                    .whereEqualTo("requesterUid", requesterUid)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> {
                        ResourceOrder o = d.toObject(ResourceOrder.class);
                        if (o.getId() == null) o.setId(d.getId());
                        return o;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching resource orders: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<ResourceOrder> getAllOrders() {
        try {
            return db.collection(COL).get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> {
                        ResourceOrder o = d.toObject(ResourceOrder.class);
                        if (o.getId() == null) o.setId(d.getId());
                        return o;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching all resource orders: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public ResourceOrder createOrder(ResourceOrder order) {
        try {
            if (order.getId() == null || order.getId().isEmpty()) {
                order.setId(UUID.randomUUID().toString());
            }
            order.setStatus("PENDING"); 
            order.setOrderDate(java.time.Instant.now().toString());

            db.collection(COL).document(order.getId()).set(order).get(30, TimeUnit.SECONDS);
            log.info("Resource Order {} created with status PENDING", order.getId());
            return order;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create resource order: " + e.getMessage(), e);
        }
    }

    public ResourceOrder approveOrder(String id) {
        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("status", "APPROVED");
            db.collection(COL).document(id).update(updates).get(30, TimeUnit.SECONDS);
            
            ResourceOrder o = db.collection(COL).document(id).get().get(30, TimeUnit.SECONDS).toObject(ResourceOrder.class);
            if (o != null && o.getId() == null) o.setId(id);
            return o;
        } catch (Exception e) {
            throw new RuntimeException("Failed to approve order: " + e.getMessage(), e);
        }
    }

    public String rejectOrder(String id) {
        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("status", "REJECTED");
            db.collection(COL).document(id).update(updates).get(30, TimeUnit.SECONDS);
            return "Order rejected successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to reject order: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> toMap(ResourceOrder o) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", o.getId());
        m.put("collecteId", o.getCollecteId());
        m.put("requesterUid", o.getRequesterUid());
        m.put("requesterName", o.getRequesterName());
        m.put("startDate", o.getStartDate());
        m.put("endDate", o.getEndDate());
        m.put("status", o.getStatus());
        m.put("orderDate", o.getOrderDate());
        m.put("resources", o.getResources());
        return m;
    }
}
