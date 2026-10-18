package com.pulsepass.PulsePass.integration;

import com.jayway.jsonpath.JsonPath;
import com.pulsepass.PulsePass.TestcontainersConfiguration;
import com.pulsepass.PulsePass.domain.Role;
import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.domain.UserRole;
import com.pulsepass.PulsePass.repository.UserCredentialRepository;
import com.pulsepass.PulsePass.repository.UserRepository;
import com.pulsepass.PulsePass.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// PRD §17.3: Flyway V4 + hash BCrypt real + login contra usuario real + atomicidad
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@Transactional   // cada test hace rollback: la BD queda limpia
class AuthFlowIntegrationTest {

    private static final String PASSWORD = "UnaFraseSeguraLarga2026!";

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private UserCredentialRepository credentialRepository;
    @Autowired private UserRoleRepository roleRepository;

    private static String registerJson(String username, String password) {
        return """
               {"username":"%s","email":"%s@example.com","firstName":"Andrea","lastName":"Gómez",
                "phone":"3000000000","city":"Santa Marta","birthDate":"1998-05-20","password":"%s"}
               """.formatted(username, username, password);
    }

    private String login(String identifier, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"%s\",\"password\":\"%s\"}".formatted(identifier, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    // UC-SEC-01, 02, 09, 10 — escenario de demostración §23 (pasos 1, 2, 9 y 10)
    @Test
    void registroLoginMeYRevocacionPorEstado() throws Exception {
        // 1. Registro: 201 y sin secretos en la respuesta
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("andrea_it", PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // Persistencia atómica: usuario + hash BCrypt + ROLE_USER
        User andrea = userRepository.findByUsername("andrea_it").orElseThrow();
        String hash = credentialRepository.findById(andrea.getId()).orElseThrow().getPasswordHash();
        assertThat(hash).startsWith("$2").isNotEqualTo(PASSWORD);
        assertThat(roleRepository.findByUserId(andrea.getId()))
                .extracting(UserRole::getRole).containsExactly(Role.USER);

        // 2. Login (por username y por email)
        String token = login("andrea_it", PASSWORD);
        login("andrea_it@example.com", PASSWORD);

        // 3. /me con Bearer
        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(andrea.getId()))
                .andExpect(jsonPath("$.roles[0]").value("USER"));

        // 9. Un carácter alterado => 401
        int i = token.indexOf('.') + 5;
        String tampered = token.substring(0, i) + (token.charAt(i) == 'a' ? 'b' : 'a') + token.substring(i + 1);
        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + tampered))
                .andExpect(status().isUnauthorized());

        // 10. Desactivar con token aún vigente => siguiente request 401
        andrea.setActive(false);
        userRepository.saveAndFlush(andrea);
        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginConPasswordIncorrecta_401Generico() throws Exception {
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("carlos_it", PASSWORD))).andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"carlos_it\",\"password\":\"incorrecta-123456\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));

        // Usuario inexistente => EXACTAMENTE la misma respuesta (no enumeración)
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"no_existe\",\"password\":\"incorrecta-123456\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void passwordCorta_400YNoSeCreaUsuario() throws Exception {
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("corta_it", "corta")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.password").exists());

        assertThat(userRepository.findByUsername("corta_it")).isEmpty();
    }
}