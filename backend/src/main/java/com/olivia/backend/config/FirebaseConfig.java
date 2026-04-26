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

            // Utilisation du ClassLoader pour charger la clé
            InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("firebase-key.json");

            if (serviceAccount == null) {
                log.error("[FIREBASE] ERREUR CRITIQUE: firebase-key.json introuvable dans src/main/resources/");
                throw new RuntimeException("Firebase key not found");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            log.info("[FIREBASE] Initialisation du SDK Admin...");
            return FirebaseApp.initializeApp(options);
        } catch (Exception e) {
            log.error("[FIREBASE] Échec de l'initialisation", e);
            throw new RuntimeException(e);
        }
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        log.info("[FIREBASE] Firestore est prêt à être utilisé par le service de Chat.");
        return FirestoreClient.getFirestore(firebaseApp);
    }
}