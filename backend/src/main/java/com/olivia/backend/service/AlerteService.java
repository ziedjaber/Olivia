package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.Alerte;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AlerteService {

    public String create(Alerte alerte) throws Exception {
        Firestore db = FirestoreClient.getFirestore();

        alerte.setId(UUID.randomUUID().toString());
        alerte.setStatut("NON_TRAITEE");

        db.collection("alertes").document(alerte.getId()).set(alerte);

        return "Alerte créée";
    }

    public List<Alerte> getAll() throws Exception {
        Firestore db = FirestoreClient.getFirestore();

        List<Alerte> list = new ArrayList<>();

        db.collection("alertes").get().get().forEach(doc -> {
            list.add(doc.toObject(Alerte.class));
        });

        return list;
    }
}