package com.pulsepass.PulsePass.repository;

import com.pulsepass.PulsePass.domain.Event;
import com.pulsepass.PulsePass.domain.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    // ---------- Query Methods (el nombre del método ES la consulta) ----------

    // AC-002: recuperar un evento por su código de negocio
    Optional<Event> findByEventCode(String eventCode);

    // FR-EVT-005: eventos de un estado (se usa con PUBLISHED), por fecha ascendente
    List<Event> findByStatusOrderByEventDateAsc(EventStatus status);

    // FR-VEN-004: navega la relación Event.venue y filtra por venue.code
    List<Event> findByVenueCode(String venueCode);

    // ---------- JPQL (consultas con JOIN) ----------

    // FR-ART-004 / FR-SRC-001: eventos de un artista por stageName, sin duplicados
    @Query("""
            SELECT DISTINCT e
            FROM Event e
            JOIN e.artists a
            WHERE a.stageName = :stageName
            """)
    List<Event> findEventsByArtistStageName(@Param("stageName") String stageName);

    // FR-SRC-002: eventos de una ciudad en los que participa un artista
    @Query("""
            SELECT DISTINCT e
            FROM Event e
            JOIN e.venue v
            JOIN e.artists a
            WHERE v.city = :city
              AND a.stageName = :stageName
            """)
    List<Event> findEventsByCityAndArtist(@Param("city") String city,
                                          @Param("stageName") String stageName);

    // FR-SRC-003: eventos recomendados (publicados, posteriores a una fecha, en una
    // ciudad y con un artista cuyo nombre contenga un texto, sin distinguir mayúsculas)
    @Query("""
            SELECT DISTINCT e
            FROM Event e
            JOIN e.venue v
            JOIN e.artists a
            WHERE e.status = com.pulsepass.PulsePass.domain.EventStatus.PUBLISHED
              AND e.eventDate > :fromDate
              AND v.city = :city
              AND LOWER(a.stageName) LIKE LOWER(CONCAT('%', :artistText, '%'))
            ORDER BY e.eventDate ASC
            """)
    List<Event> findRecommendedEvents(@Param("fromDate") LocalDateTime fromDate,
                                      @Param("city") String city,
                                      @Param("artistText") String artistText);

    // Sección 32: validar unicidad del eventCode
    boolean existsByEventCode(String eventCode);
}