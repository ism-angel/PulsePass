package com.pulsepass.PulsePass.domain;

import jakarta.persistence.*;

import java.io.Serializable;

// Rol asignado a un usuario. PK compuesta (user_id, role) — PRD Seguridad §9.1
@Entity
@Table(name = "user_roles")
@IdClass(UserRole.UserRoleId.class)
public class UserRole {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    protected UserRole() {
    }

    public UserRole(Long userId, Role role) {
        this.userId = userId;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public Role getRole() {
        return role;
    }

    // Clase de la PK compuesta: los nombres y tipos deben coincidir con los @Id de arriba.
    // El record ya trae equals/hashCode, que JPA necesita para comparar llaves.
    public record UserRoleId(Long userId, Role role) implements Serializable {
    }
}