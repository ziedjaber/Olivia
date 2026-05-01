package com.olivia.backend.controller;

import com.olivia.backend.model.ResourceOrder;
import com.olivia.backend.model.User;
import com.olivia.backend.service.ResourceOrderService;
import com.olivia.backend.service.CollecteService;
import com.olivia.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resource-orders")
@CrossOrigin(origins = "*")
public class ResourceOrderController {

    @Autowired
    private ResourceOrderService resourceOrderService;

    @Autowired
    private CollecteService collecteService;

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_LOGISTIQUE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> getAllOrders() {
        try {
            return ResponseEntity.ok(resourceOrderService.getAllOrders());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching resource orders: " + e.getMessage());
        }
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<List<ResourceOrder>> getMyOrders() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String uid = (String) auth.getPrincipal();
        return ResponseEntity.ok(resourceOrderService.getOrdersByRequester(uid));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_EQUIPE_RECOLTE', 'ROLE_DIRECTEUR')")
    public ResponseEntity<?> createOrder(@RequestBody ResourceOrder order) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String uid = (String) auth.getPrincipal();
            order.setRequesterUid(uid);

            // Resolve requester name from database
            try {
                com.olivia.backend.model.User user = userService.getUserById(uid);
                order.setRequesterName(user.getFullName());
            } catch (Exception e) {
                // Fallback to "Unknown Requester" if profile fetch fails
                order.setRequesterName("Unknown Requester");
            }

            ResourceOrder created = resourceOrderService.createOrder(order);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Creation failed: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> approveOrder(@PathVariable String id) {
        try {
            ResourceOrder approvedOrder = resourceOrderService.approveOrder(id);
            if (approvedOrder.getCollecteId() != null) {
                collecteService.updateStatus(approvedOrder.getCollecteId(), "RESOURCES_VALIDATED");
            }
            return ResponseEntity.ok(approvedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Approval failed: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_LOGISTIQUE')")
    public ResponseEntity<?> rejectOrder(@PathVariable String id) {
        try {
            resourceOrderService.rejectOrder(id);
            return ResponseEntity.ok("Rejected");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Rejection failed: " + e.getMessage());
        }
    }
}
