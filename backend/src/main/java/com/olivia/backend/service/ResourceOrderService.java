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

    private static final String COL = "resource_orders";

    public List<ResourceOrder> getOrdersByRequester(String requesterUid) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            return db.collection(COL)
                    .whereEqualTo("requesterUid", requesterUid)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> d.toObject(ResourceOrder.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching resource orders: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<ResourceOrder> getAllOrders() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            return db.collection(COL).get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> d.toObject(ResourceOrder.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching all resource orders: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public ResourceOrder createOrder(ResourceOrder order) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (order.getId() == null || order.getId().isEmpty()) {
                order.getId();
                order.setId(UUID.randomUUID().toString());
            }
            order.setStatus("PENDING"); 
            order.setOrderDate(new Date());

            Map<String, Object> data = toMap(order);
            db.collection(COL).document(order.getId()).set(data).get(30, TimeUnit.SECONDS);
            log.info("Resource Order {} created with status PENDING", order.getId());
            return order;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create resource order: " + e.getMessage(), e);
        }
    }

    public ResourceOrder approveOrder(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            Map<String, Object> updates = new HashMap<>();
            updates.put("status", "APPROVED");
            db.collection(COL).document(id).update(updates).get(30, TimeUnit.SECONDS);
            
            return db.collection(COL).document(id).get().get(30, TimeUnit.SECONDS).toObject(ResourceOrder.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to approve order: " + e.getMessage(), e);
        }
    }

    public String rejectOrder(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
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
