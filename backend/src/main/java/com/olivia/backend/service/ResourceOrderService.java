package com.olivia.backend.service;

import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.exceptions.ResourceNotFoundException;
import com.olivia.backend.model.ResourceOrder;
import com.olivia.backend.repository.ResourceOrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class ResourceOrderService {

    @Autowired
    private ResourceOrderRepository resourceOrderRepository;

    public List<ResourceOrder> getOrdersByRequester(String requesterUid) {
        return resourceOrderRepository.findByRequesterUid(requesterUid);
    }

    public List<ResourceOrder> getAllOrders() {
        return resourceOrderRepository.findAll();
    }

    public ResourceOrder createOrder(ResourceOrder order) {
        try {
            if (order.getId() == null || order.getId().isEmpty()) {
                order.setId(UUID.randomUUID().toString());
            }
            order.setStatus("PENDING"); 
            order.setOrderDate(java.time.Instant.now().toString());

            resourceOrderRepository.save(order);
            log.info("Resource Order {} created with status PENDING", order.getId());
            return order;
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to create resource order: " + e.getMessage(), e);
        }
    }

    public ResourceOrder approveOrder(String id) {
        try {
            resourceOrderRepository.updateField(id, "status", "APPROVED");
            return resourceOrderRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("ResourceOrder", "id", id));
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to approve order: " + e.getMessage(), e);
        }
    }

    public String rejectOrder(String id) {
        try {
            resourceOrderRepository.updateField(id, "status", "REJECTED");
            return "Order rejected successfully";
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to reject order: " + e.getMessage(), e);
        }
    }
}

