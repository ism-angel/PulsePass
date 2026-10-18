package com.pulsepass.PulsePass.security;

import com.pulsepass.PulsePass.domain.Role;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;

// Principal: identidad comprobada de quien hace la solicitud (PRD §6).
// Expone el ID persistente, que es lo que usaremos para verificar propiedad (anti-IDOR).
public class SecurityPrincipal implements UserDetails, CredentialsContainer {

    private final Long id;
    private final String username;
    private final String email;
    private String passwordHash;          // no final: se borra tras autenticar
    private final boolean active;
    private final Set<Role> roles;
    private final List<GrantedAuthority> authorities;

    public SecurityPrincipal(Long id, String username, String email,
                             String passwordHash, boolean active, Set<Role> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.active = active;
        this.roles = Set.copyOf(roles);
        // Role.ADMIN -> "ROLE_ADMIN": convención que usa hasRole("ADMIN")
        this.authorities = roles.stream()
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.name()))
                .toList();
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public boolean hasRole(Role role) {
        return roles.contains(role);
    }

    // ---- Contrato UserDetails ----

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    // Usuario inactivo => Spring Security lo trata como cuenta deshabilitada (FR-SEC-AUTH-004)
    @Override
    public boolean isEnabled() {
        return active;
    }

    // ---- CredentialsContainer ----

    // Spring lo llama después de un login exitoso: el hash no queda vivo en memoria
    @Override
    public void eraseCredentials() {
        this.passwordHash = null;
    }

    @Override
    public String toString() {
        return "SecurityPrincipal[id=" + id + ", username=" + username + ", roles=" + roles + "]";
    }
}