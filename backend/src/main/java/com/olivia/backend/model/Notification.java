package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    private String id;
    private String recipientUid;
    private String title;
    private String body;
    private String type; // INFO, SUCCESS, WARNING, ERROR, INVITATION, MISSION, LOGISTICS, URGENT
    private boolean read;
    private String createdAt;
}
