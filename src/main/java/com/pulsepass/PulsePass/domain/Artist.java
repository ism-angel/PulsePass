package com.pulsepass.PulsePass.domain;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "artists")
public class Artist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stage_name", nullable = false, unique = true, length = 100)
    private String stageName;

    @Column(name = "country", length = 80)
    private String country;

    @Column(name = "genre", length = 80)
    private String genre;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    protected Artist() {
    }

    public Artist(String stageName, String country, String genre) {
        this.stageName = stageName;
        this.country = country;
        this.genre = genre;
    }

    public Long getId() {
        return id;
    }

    public String getStageName() {
        return stageName;
    }

    public void setStageName(String stageName) {
        this.stageName = stageName;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // Igualdad por clave de negocio (stageName es UNIQUE y NOT NULL, FR-ART-002).
    // Es necesaria porque los artistas viven dentro de un Set en Event.
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Artist other)) return false;
        return stageName != null && stageName.equals(other.getStageName());
    }

    @Override
    public int hashCode() {
        return Objects.hash(stageName);
    }
}