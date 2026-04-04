package com.olivia.backend.service;
import com.google.firebase.messaging.*;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    public String sendNotification(String title, String body) throws Exception {

        Message message = Message.builder()
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .setTopic("alerts")
                .build();

        FirebaseMessaging.getInstance().send(message);

        return "Notification envoyée";
    }
}