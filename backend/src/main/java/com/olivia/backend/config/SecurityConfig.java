// package com.olivia.backend.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.core.userdetails.UserDetailsService;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.security.provisioning.InMemoryUserDetailsManager;
// import org.springframework.security.web.SecurityFilterChain;
// import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// import jakarta.servlet.http.HttpServletResponse;

// import org.springframework.web.cors.CorsConfiguration;
// import org.springframework.web.cors.CorsConfigurationSource;
// import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// import java.util.Arrays;
// import java.util.List;

// @Configuration
// @EnableWebSecurity
// @EnableMethodSecurity // Permits @PreAuthorize
// public class SecurityConfig {

//     private final JwtFilter firebaseFilter;

//     public SecurityConfig(JwtFilter firebaseFilter) {
//         this.firebaseFilter = firebaseFilter;
//     }

//     @Bean
//     public PasswordEncoder passwordEncoder() {
//         return new BCryptPasswordEncoder();
//     }

//     @Bean
//     public UserDetailsService userDetailsService() {
//         return new InMemoryUserDetailsManager();
//     }

//     @Bean
//     public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//         http
//                 .csrf(csrf -> csrf.disable())
//                 .cors(cors -> cors.configurationSource(corsConfigurationSource()))
//                 .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//                 // EXPLICITLY DISABLE DEFAULT AUTH MECHANISMS TO PREVENT CONFLICTS
//                 .formLogin(f -> f.disable())
//                 .httpBasic(b -> b.disable())
//                 .exceptionHandling(ex -> ex
//                         .authenticationEntryPoint((request, response, authException) -> {
//                             response.setContentType("application/json");
//                             response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//                             response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
//                         })
//                         .accessDeniedHandler((request, response, accessDeniedException) -> {
//                             response.setContentType("application/json");
//                             response.setStatus(HttpServletResponse.SC_FORBIDDEN);
//                             response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access Denied: You do not have the required authorities.\"}");
//                         })
//                 )
//                 .authorizeHttpRequests(auth -> auth
//                         .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
//                         .requestMatchers("/api/auth/**","/ws/**","/ws/info/**" ).permitAll()//modifié pour permettre la connexion WebSocket
//                         .requestMatchers("/uploads/**").permitAll()
//                         .anyRequest().authenticated()
//                 )
//                 .addFilterBefore(firebaseFilter, UsernamePasswordAuthenticationFilter.class);

//         return http.build();
//     }

//     @Bean
//     public CorsConfigurationSource corsConfigurationSource() {
//         CorsConfiguration configuration = new CorsConfiguration();
//         configuration.setAllowedOrigins(List.of("http://localhost:4200"));
//         configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
//         configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
//         configuration.setAllowCredentials(true);
//         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//         source.registerCorsConfiguration("/**", configuration);
//         return source;
// }
// }

package com.olivia.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter firebaseFilter;

    public SecurityConfig(JwtFilter firebaseFilter) {
        this.firebaseFilter = firebaseFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/ws/**", "/ws/info/**")
                .disable()
            )
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session
                // IMPORTANT — WebSocket SockJS a besoin de sessions
                // on garde STATELESS pour HTTP mais on autorise la création
                // de session pour le handshake WebSocket uniquement
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .formLogin(f -> f.disable())
            .httpBasic(b -> b.disable())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write(
                        "{\"error\": \"Unauthorized\", \"message\": \""
                        + authException.getMessage() + "\"}"
                    );
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                        "{\"error\": \"Forbidden\", \"message\": " +
                        "\"Access Denied: You do not have the required authorities.\"}"
                    );
                })
            )
            .authorizeHttpRequests(auth -> auth
                // OPTIONS preflight toujours autorisé
                .requestMatchers(
                    org.springframework.http.HttpMethod.OPTIONS, "/**"
                ).permitAll()

                // Auth publique
                .requestMatchers("/api/auth/**").permitAll()

                // WebSocket — tous les endpoints SockJS
                .requestMatchers(
                    "/ws/**",
                    "/ws/info/**",
                    "/ws/iframe.html",
                    "/ws/jsonp/**"
                ).permitAll()

                // Fichiers uploadés
                .requestMatchers("/uploads/**").permitAll()

                // Tout le reste nécessite authentification
                .anyRequest().authenticated()
            )
            .addFilterBefore(firebaseFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // origines autorisées
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:4200",
            "http://localhost:4201"
        ));

        // méthodes autorisées
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        // headers autorisés — important pour WebSocket
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            // headers SockJS
            "Sec-WebSocket-Key",
            "Sec-WebSocket-Version",
            "Sec-WebSocket-Extensions",
            "Upgrade",
            "Connection"
        ));

        // headers exposés au client
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ));

        configuration.setAllowCredentials(true);

        // durée cache preflight OPTIONS (1 heure)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}