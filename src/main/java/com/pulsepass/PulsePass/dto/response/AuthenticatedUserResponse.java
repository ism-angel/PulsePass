package com.pulsepass.PulsePass.dto.response;

import java.util.Set;

// GET /api/auth/me — información mínima del principal, sin secretos (FR-SEC-AUTH-010)
public record AuthenticatedUserResponse(
        Long id,
        String username,
        String email,
        Set<String> roles
) {}