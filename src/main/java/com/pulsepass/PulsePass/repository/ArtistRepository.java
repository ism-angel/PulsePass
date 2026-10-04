package com.pulsepass.PulsePass.repository;

import com.pulsepass.PulsePass.domain.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    // FR-ART-001: recuperar un artista por su nombre artístico (único)
    Optional<Artist> findByStageName(String stageName);

    // Sección 32: búsqueda por nombre artístico ignorando mayúsculas
    Optional<Artist> findByStageNameIgnoreCase(String stageName);

    // Sección 32: artistas activos ordenados por nombre artístico
    List<Artist> findByActiveTrueOrderByStageNameAsc();
}