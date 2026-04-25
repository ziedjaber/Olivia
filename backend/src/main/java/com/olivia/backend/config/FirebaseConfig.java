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
    public FirebaseApp firebaseApp() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                return FirebaseApp.getInstance();
            }

            InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("firebase-key.json");

            if (serviceAccount == null) {
                log.error("CRITICAL: firebase-key.json not found in resources!");
                throw new RuntimeException("Firebase key not found");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            log.info("Initializing Firebase Application...");
            return FirebaseApp.initializeApp(options);
        } catch (Exception e) {
            log.error("Failed to initialize Firebase App", e);
            throw new RuntimeException(e);
        }
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        log.info("Providing Firestore bean using FirebaseApp: {}", firebaseApp.getName());
        return FirestoreClient.getFirestore(firebaseApp);
    }
}