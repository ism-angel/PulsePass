package com.pulsepass.PulsePass.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

public record RegisterUserRequest(
        @NotBlank(message = "Username is required")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid address")
        String email,

        @NotBlank(message = "First name is required")
        String firstName,

        @NotBlank(message = "Last name is required")
        String lastName,

        String phone,

        String city,

        @NotNull(message = "Birth date is required")
        LocalDate birthDate,

        // Fase 4 — PRD Seguridad §9.3: mínimo 12 caracteres
        @NotBlank(message = "Password is required")
        @Size(min = 12, max = 72, message = "Password must be between 12 and 72 characters")
        String password
) {

        // BCrypt solo admite 72 BYTES; una tilde o emoji ocupa más de 1 byte en UTF-8
        @AssertTrue(message = "Password must not exceed 72 bytes")
        public boolean isPasswordWithinBcryptLimit() {
                return password == null || password.getBytes(StandardCharsets.UTF_8).length <= 72;
        }

        // Un record imprime TODOS sus campos en toString(): se oculta la contraseña (SEC-003)
        @Override
        public String toString() {
                return "RegisterUserRequest[username=" + username + ", email=" + email + ", password=***]";
        }
}