package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceOrder {
    private String id;
    private String collecteId;
    private String requesterUid;
    private String requesterName;

    private Date startDate;
    private Date endDate;

    private List<OrderedResource> resources;

    private String status; // "PENDING", "APPROVED", "DELIVERED", "RETURNED"
    private Date orderDate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderedResource {
        private String resourceId;
        private String resourceName;
        private int quantity;
    }
}
