package com.olivia.backend.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;
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

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                String email = decodedToken.getEmail();
                String uid = decodedToken.getUid();

                // Try to get role from custom claims first
                String role = (String) decodedToken.getClaims().get("role");

                // If no role in claims, look it up from Firestore as fallback
                if (role == null || role.isEmpty()) {
                    try {
                        Firestore db = FirestoreClient.getFirestore();
                        QuerySnapshot query = db.collection("users")
                                .whereEqualTo("email", email.toLowerCase())
                                .get()
                                .get(20, TimeUnit.SECONDS);

                        if (!query.isEmpty()) {
                            Object roleObj = query.getDocuments().get(0).get("role");
                            if (roleObj != null) {
                                // NORMALIZE ROLE TO UPPERCASE FOR CASE-INSENSITIVE SECURITY MATCHING
                                role = roleObj.toString().trim().toUpperCase();
                                log.info("[JwtFilter] Role loaded from Firestore for {}: {}", email, role);
                            } else {
                                log.warn("[JwtFilter] Role field is null in Firestore for {}", email);
                            }
                        } else {
                            log.warn("[JwtFilter] No Firestore document found for email: {}", email);
                        }
                    } catch (Exception firestoreEx) {
                        log.error("[JwtFilter] Firestore fetch failed for {}: {}", email, firestoreEx.getMessage());
                    }
                } else {
                    role = role.trim().toUpperCase(); 
                }

                if (uid != null) {
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "USER"));
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            uid, null,
                            Collections.singletonList(authority)
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("[JwtFilter] Security Context established for {} with authority: {}", email, authority.getAuthority());
                }
            } catch (Exception e) {
                log.warn("[JwtFilter] Token verification failed: {}", e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Token verification failed: " + e.getMessage() + "\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}