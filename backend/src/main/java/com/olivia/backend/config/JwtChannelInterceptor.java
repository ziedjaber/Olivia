package com.olivia.backend.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        // on intercepte uniquement le CONNECT
        if (!StompCommand.CONNECT.equals(accessor.getCommand())) return message;

        String authHeader = accessor.getFirstNativeHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.err.println("[WS] Pas de token Authorization dans CONNECT");
            return message;
        }

        String token = authHeader.substring(7);

        try {
            // vérification Firebase (même logique que votre JwtFilter HTTP)
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);

            String uid   = decoded.getUid();
            Object role  = decoded.getClaims().getOrDefault("role", "USER");

            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    uid,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role.toString()))
                );

            accessor.setUser(auth);
            System.out.println("[WS] Connecté : " + uid + " / rôle : " + role);

        } catch (Exception e) {
            System.err.println("[WS] Token invalide : " + e.getMessage());
            // on laisse passer sans user — Spring refusera les destinations protégées
        }

        return message;
    }
}