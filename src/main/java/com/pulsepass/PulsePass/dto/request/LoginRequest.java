package com.pulsepass.PulsePass.dto.request;

import jakarta.validation.constraints.NotBlank;

// identifier = username o email (FR-SEC-AUTH-002)
public record LoginRequest(
        @NotBlank(message = "Identifier is required")
        String identifier,

        @NotBlank(message = "Password is required")
        String password
) {
    @Override
    public String toString() {
        return "LoginRequest[identifier=" + identifier + ", password=***]";
    }
}