package com.pulsepass.PulsePass.dto.response;

// Respuesta del login (PRD §10.1): {"accessToken": "...", "tokenType": "Bearer", "expiresIn": 900}
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {}