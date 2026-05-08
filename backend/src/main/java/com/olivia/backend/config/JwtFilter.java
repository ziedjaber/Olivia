package com.olivia.backend.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.olivia.backend.model.User;
import com.olivia.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private UserRepository userRepository;

    private static final ConcurrentHashMap<String, String> roleCache = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                if (token == null || token.isEmpty() || token.equals("undefined") || token.equals("null")) {
                    filterChain.doFilter(request, response);
                    return;
                }

                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                String email = decodedToken.getEmail();
                String uid = decodedToken.getUid();

                String role = roleCache.get(uid);

                if (role == null) {
                    synchronized (uid.intern()) {
                        role = roleCache.get(uid);
                        if (role == null) {
                            try {
                                var userOpt = userRepository.findById(uid);
                                if (userOpt.isPresent()) {
                                    role = userOpt.get().getRole().name();
                                } else if (email != null) {
                                    var userByEmail = userRepository.findByEmail(email);
                                    if (userByEmail.isPresent()) {
                                        role = userByEmail.get().getRole().name();
                                    }
                                }
                            } catch (Exception firestoreEx) {
                                log.error("[JwtFilter] Repository identity bridge failed for UID {}: {}", uid, firestoreEx.getMessage());
                            }

                            if (role == null) {
                                log.warn("[JwtFilter] No identity mapping found for {}. Assigning ROLE_USER", uid);
                                role = "USER";
                            }
                            
                            roleCache.put(uid, role);
                        }
                    }
                }

                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        uid, null, Collections.singletonList(authority));
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                log.error("[JwtFilter] AUTHENTICATION CRITICAL FAILURE: {}", e.getMessage());
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