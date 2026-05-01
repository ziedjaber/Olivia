package com.olivia.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.InputStream;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws Exception {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("firebase-key.json");
        if (serviceAccount == null) {
            throw new RuntimeException("firebase-key.json introuvable");
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        return FirebaseApp.initializeApp(options);
    }

    @Bean(destroyMethod = "")
    public Firestore firestore(FirebaseApp firebaseApp) {
        log.info("[FIREBASE] Initialisation de Firestore via FirestoreClient (Standard + Protected lifecycle)...");
        return FirestoreClient.getFirestore(firebaseApp);
    }
}