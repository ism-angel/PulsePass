package com.pulsepass.PulsePass.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// Credencial 1:1 con User (PRD Seguridad §9.1). Unidireccional: User no la conoce,
// así ningún mapper de User puede serializar el hash por accidente.
@Entity
@Table(name = "user_credentials")
public class UserCredential {

    @Id
    @Column(name = "user_id")
    private Long userId;

    // @MapsId: la PK de esta entidad se toma del id del User asociado
    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    protected UserCredential() {
    }

    public UserCredential(User user, String passwordHash) {
        this.user = user;
        this.passwordHash = passwordHash;
        this.passwordChangedAt = LocalDateTime.now();
    }

    public Long getUserId() {
        return userId;
    }

    public User getUser() {
        return user;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public LocalDateTime getPasswordChangedAt() {
        return passwordChangedAt;
    }

    // Sin toString(): evita que el hash termine en logs (SEC-003)
}