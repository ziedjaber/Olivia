package com.olivia.backend.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;  
import com.google.cloud.firestore.DocumentSnapshot;

import com.google.cloud.firestore.QuerySnapshot;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class JwtFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        log.info("[JwtFilter] ENTRY: Processing request to {}. Auth Header: {}", request.getRequestURI(), authHeader != null ? "FOUND" : "MISSING");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            log.info("[JwtFilter] Bearer token detected. Proceeding to verify.");

            try {
                log.info("[JwtFilter] Decoding token for URI: {}", request.getRequestURI());
                
                if (token == null || token.isEmpty() || token.equals("undefined") || token.equals("null")) {
                    log.warn("[JwtFilter] Invalid token string detected: '{}'. Skipping auth.", token);
                    filterChain.doFilter(request, response);
                    return;
                }

                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                String email = decodedToken.getEmail();
                String uid = decodedToken.getUid();
                log.info("[JwtFilter] Token decode successful. UID: {}, Email: {}", uid, email);

                String role = null;
                // TRY UID LOOKUP FROM FIRESTORE (Primary)
                try {
                    DocumentSnapshot doc = FirestoreClient.getFirestore().collection("users").document(uid).get().get(10, TimeUnit.SECONDS);
                    if (doc.exists()) {
                        Object roleObj = doc.get("role");
                        if (roleObj != null) {
                            role = roleObj.toString().trim().toUpperCase().replace(" ", "_");
                            log.info("[JwtFilter] Role found by UID {}: {}", uid, role);
                        }
                    } else if (email != null) {
                        // FALLBACK TO EMAIL QUERY
                        log.info("[JwtFilter] UID document miss. Falling back to email lookup for {}", email);
                        var query = FirestoreClient.getFirestore().collection("users")
                                .whereEqualTo("email", email.toLowerCase())
                                .get().get(10, TimeUnit.SECONDS);
                        if (!query.isEmpty()) {
                            Object roleObj = query.getDocuments().get(0).get("role");
                            if (roleObj != null) {
                                role = roleObj.toString().trim().toUpperCase().replace(" ", "_");
                                log.info("[JwtFilter] Role found by Email {}: {}", email, role);
                            }
                        }
                    }
                } catch (Exception firestoreEx) {
                    log.error("[JwtFilter] Firestore identity bridge failed for UID {}: {}", uid, firestoreEx.getMessage());
                }

                if (role == null) {
                    log.warn("[JwtFilter] No identity mapping found for {}. Assigning ROLE_USER", uid);
                    role = "USER";
                }

                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        uid, null, Collections.singletonList(authority));
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.info("[JwtFilter] Access Granted. Context: {} | Authority: {}", uid, authority.getAuthority());

            } catch (Exception e) {
                log.error("[JwtFilter] AUTHENTICATION CRITICAL FAILURE: {}", e.getMessage(), e);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                String errorMsg = e.getMessage() != null ? e.getMessage() : "Invalid or expired Firebase token";
                response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + errorMsg + "\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}