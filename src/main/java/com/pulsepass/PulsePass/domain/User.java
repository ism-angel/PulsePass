package com.pulsepass.PulsePass.domain;

import jakarta.persistence.*;

// "user" es palabra reservada en PostgreSQL; por eso la tabla se llama "users"
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    // User 1:1 UserProfile. Lado inverso (mappedBy): la FK vive en user_profiles.
    // cascade = ALL: al guardar el User se guarda también su perfil (el PRD no
    // define un UserProfileRepository, sección 22).
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private UserProfile profile;

    protected User() {
    }

    public User(String username, String email) {
        this.username = username;
        this.email = email;
    }

    // Mantiene sincronizados los dos lados de la relación
    public void setProfile(UserProfile profile) {
        this.profile = profile;
        if (profile != null) {
            profile.setUser(this);
        }
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public UserProfile getProfile() {
        return profile;
    }
}