package com.olivia.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Autowired
    private ResourceLoader resourceLoader;

    @PostConstruct
    public void init() {
        System.out.println("[FIREBASE] Initializing Firebase Admin SDK...");
        try {
            Resource resource = resourceLoader.getResource("classpath:firebase-key.json");
            
            if (!resource.exists()) {
                System.err.println("[FIREBASE] ERROR: firebase-key.json not found in classpath!");
                throw new RuntimeException("Firebase key not found");
            }

            try (InputStream serviceAccount = resource.getInputStream()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    System.out.println("[FIREBASE] Firebase Admin SDK initialized successfully.");
                } else {
                    System.out.println("[FIREBASE] Firebase Admin SDK already initialized.");
                }
            }

        } catch (Exception e) {
            System.err.println("[FIREBASE] CRITICAL ERROR during initialization: " + e.getMessage());
            e.printStackTrace();
        }
    }
}