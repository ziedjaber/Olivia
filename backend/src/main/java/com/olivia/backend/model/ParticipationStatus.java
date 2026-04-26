package com.olivia.backend.model;

/**
 * Status lifecycle for a worker's participation in a Collecte:
<<<<<<< HEAD
 * INVITED → (worker accepts) → ACCEPTED → (collecte starts) → ASSIGNED →
 * (collecte ends) → COMPLETED
 * INVITED → (worker rejects) → REJECTED
 */
public enum ParticipationStatus {
    INVITED,
    ACCEPTED,
    REJECTED,
    ASSIGNED,
    COMPLETED
}
