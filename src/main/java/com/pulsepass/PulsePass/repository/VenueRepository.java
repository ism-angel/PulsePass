package com.pulsepass.PulsePass.repository;

import com.pulsepass.PulsePass.domain.Venue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface VenueRepository extends JpaRepository<Venue, Long> {

    // FR-VEN-001: recuperar un venue por su código de negocio
    Optional<Venue> findByCode(String code);

    // Sección 32: venues activos ordenados por nombre
    List<Venue> findByActiveTrueOrderByNameAsc();
}