package com.pulsepass.PulsePass.repository;

import com.pulsepass.PulsePass.domain.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    // FR-ART-001: recuperar un artista por su nombre artístico (único)
    Optional<Artist> findByStageName(String stageName);
}