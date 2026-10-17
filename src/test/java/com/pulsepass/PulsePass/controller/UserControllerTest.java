package com.pulsepass.PulsePass.controller;

import com.pulsepass.PulsePass.dto.request.RegisterUserRequest;
import com.pulsepass.PulsePass.dto.response.UserResponse;
import com.pulsepass.PulsePass.exception.DuplicateResourceException;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    private static final String VALID_REQUEST = """
            {
              "username": "andrea",
              "email": "andrea@example.com",
              "firstName": "Andrea",
              "lastName": "Gómez",
              "phone": "3000000000",
              "city": "Santa Marta",
              "birthDate": "1998-05-20"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    private UserResponse andrea() {
        return new UserResponse(
                1L, "andrea", "andrea@example.com", true,
                "Andrea", "Gómez", "3000000000", "Santa Marta", LocalDate.of(1998, 5, 20));
    }

    // TEST-CTRL-USR-001 — AC-CTRL007
    @Test
    void register_withValidRequest_returns201() throws Exception {
        when(userService.register(any(RegisterUserRequest.class))).thenReturn(andrea());

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("andrea"))
                .andExpect(jsonPath("$.email").value("andrea@example.com"))
                .andExpect(jsonPath("$.active").value(true));

        verify(userService).register(any(RegisterUserRequest.class));
    }

    // TEST-CTRL-USR-002
    @Test
    void register_withInvalidEmail_returns400AndDoesNotCallService() throws Exception {
        String invalidEmailRequest = """
                {
                  "username": "andrea",
                  "email": "not-an-email",
                  "firstName": "Andrea",
                  "lastName": "Gómez",
                  "birthDate": "1998-05-20"
                }
                """;

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidEmailRequest))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email must be a valid address"));

        verify(userService, never()).register(any(RegisterUserRequest.class));
    }

    // QT-CTRL-007 / QT-CTRL-010 — campos obligatorios ausentes
    @Test
    void register_withMissingRequiredFields_returns400ListingEveryInvalidField() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.username").value("Username is required"))
                .andExpect(jsonPath("$.details.email").value("Email is required"))
                .andExpect(jsonPath("$.details.firstName").value("First name is required"))
                .andExpect(jsonPath("$.details.lastName").value("Last name is required"))
                .andExpect(jsonPath("$.details.birthDate").value("Birth date is required"));

        verify(userService, never()).register(any(RegisterUserRequest.class));
    }

    // TEST-CTRL-USR-003 — AC-CTRL008
    @Test
    void register_withDuplicateUsername_returns409() throws Exception {
        when(userService.register(any(RegisterUserRequest.class)))
                .thenThrow(new DuplicateResourceException("Username already exists."));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Username already exists."));

        verify(userService).register(any(RegisterUserRequest.class));
    }

    // TEST-CTRL-USR-004
    @Test
    void findByEmail_whenUserExists_returns200() throws Exception {
        when(userService.findByEmail("andrea@example.com")).thenReturn(andrea());

        mockMvc.perform(get("/api/users/by-email").param("email", "andrea@example.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email").value("andrea@example.com"));

        verify(userService).findByEmail("andrea@example.com");
    }

    // FR-CTRLUSR-002 — rama 404
    @Test
    void findByEmail_whenUserDoesNotExist_returns404() throws Exception {
        when(userService.findByEmail("ghost@example.com"))
                .thenThrow(new ResourceNotFoundException("User not found: ghost@example.com"));

        mockMvc.perform(get("/api/users/by-email").param("email", "ghost@example.com"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found: ghost@example.com"));

        verify(userService).findByEmail("ghost@example.com");
    }

    // TEST-CTRL-USR-005
    @Test
    void findByUsername_whenUserExists_returns200() throws Exception {
        when(userService.findByUsername("andrea")).thenReturn(andrea());

        mockMvc.perform(get("/api/users/by-username").param("username", "andrea"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value("andrea"));

        verify(userService).findByUsername("andrea");
    }

    // FR-CTRLUSR-003 — rama 404
    @Test
    void findByUsername_whenUserDoesNotExist_returns404() throws Exception {
        when(userService.findByUsername("ghost"))
                .thenThrow(new ResourceNotFoundException("User not found: ghost"));

        mockMvc.perform(get("/api/users/by-username").param("username", "ghost"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        verify(userService).findByUsername("ghost");
    }
}
