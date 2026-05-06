

package com.olivia.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class Conversation {

    @Id
    private String id;

    private List<String> participantIds;

    @JsonProperty("participantNames")
    private Map<String, String> participantNames = new HashMap<>();

    @JsonProperty("participantRoles")
    private Map<String, String> participantRoles = new HashMap<>();

    @JsonProperty("unreadCount")
    private Map<String, Integer> unreadCount = new HashMap<>();

    private String lastMessage;
    private String lastTimestamp;

    // Getters sécurisés (très important pour éviter null)
    public Map<String, String> getParticipantNames() {
        return participantNames != null ? participantNames : new HashMap<>();
    }

    public Map<String, String> getParticipantRoles() {
        return participantRoles != null ? participantRoles : new HashMap<>();
    }

    public Map<String, Integer> getUnreadCount() {
        return unreadCount != null ? unreadCount : new HashMap<>();
    }

    // Setters sécurisés
    public void setParticipantNames(Map<String, String> participantNames) {
        this.participantNames = participantNames != null ? participantNames : new HashMap<>();
    }

    public void setParticipantRoles(Map<String, String> participantRoles) {
        this.participantRoles = participantRoles != null ? participantRoles : new HashMap<>();
    }

    public void setUnreadCount(Map<String, Integer> unreadCount) {
        this.unreadCount = unreadCount != null ? unreadCount : new HashMap<>();
    }
}