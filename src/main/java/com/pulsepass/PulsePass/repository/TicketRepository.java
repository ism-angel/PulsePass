package com.pulsepass.PulsePass.repository;

import com.pulsepass.PulsePass.domain.Ticket;
import com.pulsepass.PulsePass.domain.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // ---------- Query Methods ----------

    // FR-TKT-006: tickets de un usuario por email (navega Ticket -> User -> email)
    List<Ticket> findByUserEmail(String email);

    // FR-TKT-006: lo mismo, filtrando además por estado
    List<Ticket> findByUserEmailAndStatus(String email, TicketStatus status);

    // FR-TKT-007: tickets de un evento (por eventCode) en un estado; se usa con PAID
    List<Ticket> findByEventEventCodeAndStatus(String eventCode, TicketStatus status);

    // ---------- JPQL ----------

    // FR-TKT-008: conteo de tickets PAID de un evento
    @Query("""
            SELECT COUNT(t)
            FROM Ticket t
            WHERE t.event.eventCode = :eventCode
              AND t.status = com.pulsepass.PulsePass.domain.TicketStatus.PAID
            """)
    long countPaidTicketsByEventCode(@Param("eventCode") String eventCode);

    // FR-SRC-004: tickets cuyo evento es posterior a una fecha, en orden cronológico
    @Query("""
            SELECT t
            FROM Ticket t
            JOIN t.event e
            WHERE e.eventDate > :fromDate
            ORDER BY e.eventDate ASC
            """)
    List<Ticket> findTicketsForEventsAfter(@Param("fromDate") LocalDateTime fromDate);
}