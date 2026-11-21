package com.pulsepass.PulsePass.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtService jwtService,
                                                   CustomUserDetailsService userDetailsService,
                                                   RestAuthenticationEntryPoint authEntryPoint,
                                                   RestAccessDeniedHandler accessDeniedHandler) throws Exception {

        JwtAuthenticationFilter jwtFilter =
                new JwtAuthenticationFilter(jwtService, userDetailsService, authEntryPoint);

        http
                // API Bearer sin cookies de autenticación => CSRF no aplica (§14.3 adv. 6)
                .csrf(AbstractHttpConfigurer::disable)
                // Sin JSESSIONID: cada request se autentica por su token (FR-SEC-AUTH-008)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                // 401 y 403 en JSON ErrorResponse (paso 15)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        // ---- Errores internos de Spring: no ocultar 404/400 tras un 401 ----
                        .requestMatchers("/error").permitAll()

                        // ---- Autenticación ----
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users").permitAll()          // USR-01

                        // ---- Venues y artistas: públicos ----
                        .requestMatchers(HttpMethod.GET, "/api/venues/**").permitAll()        // VEN-01/02
                        .requestMatchers(HttpMethod.GET, "/api/artists/**").permitAll()       // ART-01/02/03

                        // ---- Eventos: lo ESPECÍFICO antes que lo general (§14.3 adv. 4) ----
                        .requestMatchers(HttpMethod.GET, "/api/events/*/tickets/paid")
                        .hasAnyRole("STAFF", "ADMIN")                                     // TKT-04
                        .requestMatchers(HttpMethod.POST, "/api/events").hasRole("ADMIN")     // EVT-01
                        .requestMatchers(HttpMethod.PATCH, "/api/events/*/publish").hasRole("ADMIN")      // EVT-04
                        .requestMatchers(HttpMethod.POST, "/api/events/*/artists/*").hasRole("ADMIN")     // EVT-05
                        .requestMatchers(HttpMethod.GET, "/api/events/published").permitAll() // EVT-03
                        .requestMatchers(HttpMethod.GET, "/api/events/by-artist").permitAll() // EVT-06 (filtrado en Service, paso 20)
                        .requestMatchers(HttpMethod.GET, "/api/events/*").permitAll()         // EVT-02 (filtrado en Service, paso 20)

                        // ---- Tickets ----
                        .requestMatchers(HttpMethod.POST, "/api/tickets").hasRole("USER")     // TKT-01 (+ propiedad, paso 19)
                        .requestMatchers(HttpMethod.PATCH, "/api/tickets/*/use")
                        .hasAnyRole("STAFF", "ADMIN")                                     // TKT-06
                        // TKT-02/03/05 y USR-02/03: autenticado + propiedad en Service (paso 19)

                        // ---- Denegar por defecto (SEC-001) ----
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // SEC-003: contraseñas con BCrypt
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(CustomUserDetailsService userDetailsService,
                                                       PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }
}