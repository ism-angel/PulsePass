package com.pulsepass.PulsePass.security;

import com.pulsepass.PulsePass.domain.Role;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

// Identidades de prueba reutilizables (escenario del PRD §23)
public final class SecurityTestSupport {

    private SecurityTestSupport() {
    }

    public static SecurityPrincipal principal(long id, String username, Role... roles) {
        return new SecurityPrincipal(id, username, username + "@example.com", null, true, Set.of(roles));
    }

    public static RequestPostProcessor asUser() {
        return user(principal(1L, "andrea", Role.USER));
    }

    public static RequestPostProcessor asStaff() {
        return user(principal(2L, "laura", Role.STAFF));
    }

    public static RequestPostProcessor asAdmin() {
        return user(principal(3L, "admin", Role.ADMIN));
    }
}