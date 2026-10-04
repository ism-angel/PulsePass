package com.pulsepass.PulsePass.service.impl;

import com.pulsepass.PulsePass.domain.Event;
import com.pulsepass.PulsePass.domain.EventStatus;
import com.pulsepass.PulsePass.domain.Ticket;
import com.pulsepass.PulsePass.domain.TicketStatus;
import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.dto.request.PurchaseTicketRequest;
import com.pulsepass.PulsePass.dto.response.TicketResponse;
import com.pulsepass.PulsePass.exception.BusinessRuleException;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.mapper.TicketMapper;
import com.pulsepass.PulsePass.repository.EventRepository;
import com.pulsepass.PulsePass.repository.TicketRepository;
import com.pulsepass.PulsePass.repository.UserRepository;
import com.pulsepass.PulsePass.service.TicketPriceCalculator;
import com.pulsepass.PulsePass.service.TicketService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.UUID;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketMapper ticketMapper;
    private final TicketPriceCalculator priceCalculator;

    public TicketServiceImpl(TicketRepository ticketRepository,
                             UserRepository userRepository,
                             EventRepository eventRepository,
                             TicketMapper ticketMapper,
                             TicketPriceCalculator priceCalculator) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.ticketMapper = ticketMapper;
        this.priceCalculator = priceCalculator;
    }

    @Override
    @Transactional
    public TicketResponse purchase(PurchaseTicketRequest request) {
        // BR-TICKET-001 — Usuario existente
        User user = userRepository
                .findByEmailIgnoreCase(request.userEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.userEmail()));

        // BR-TICKET-002 — Usuario activo
        if (!user.isActive()) {
            throw new BusinessRuleException("User is not active: " + user.getEmail());
        }

        // BR-TICKET-003 — Evento existente
        Event event = eventRepository
                .findByEventCode(request.eventCode())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + request.eventCode()));

        // BR-TICKET-004 — Evento publicado
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BusinessRuleException(
                    "Event is not available for purchase. Current status: " + event.getStatus());
        }

        // BR-TICKET-005 — Fecha futura
        if (!event.getEventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Event has already taken place: " + event.getEventCode());
        }

        // BR-TICKET-006 — Edad mínima, evaluada en la fecha del evento
        if (event.getMinimumAge() > 0) {
            if (user.getProfile() == null || user.getProfile().getBirthDate() == null) {
                throw new BusinessRuleException("User birth date is required to verify minimum age.");
            }
            int age = Period.between(
                    user.getProfile().getBirthDate(),
                    event.getEventDate().toLocalDate()
            ).getYears();
            if (age < event.getMinimumAge()) {
                throw new BusinessRuleException("User does not meet minimum age.");
            }
        }

        // BR-TICKET-007 — Capacidad: paidTickets < venue.capacity
        long paidTickets = ticketRepository
                .countByEventEventCodeAndStatus(event.getEventCode(), TicketStatus.PAID);
        int capacity = event.getVenue().getCapacity();
        if (paidTickets >= capacity) {
            throw new BusinessRuleException("Event has no remaining capacity: " + event.getEventCode());
        }

        // Calcular precio (BR-TICKET-009)
        BigDecimal price = priceCalculator.calculate(request.type());

        // Crear Ticket — compra válida genera PAID
        Ticket ticket = new Ticket(
                "TKT-" + UUID.randomUUID(),
                request.type(),
                price,
                TicketStatus.PAID,
                LocalDateTime.now(),
                user,
                event
        );
        Ticket saved = ticketRepository.save(ticket);

        // BR-TICKET-008 — paidTickets == capacity → SOLD_OUT, en la misma transacción
        if (paidTickets + 1 == capacity) {
            event.setStatus(EventStatus.SOLD_OUT);
            eventRepository.save(event);
        }

        return ticketMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse findByCode(String ticketCode) {
        return ticketRepository
                .findByTicketCode(ticketCode)
                .map(ticketMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketCode));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> findByUserEmail(String email) {
        return ticketRepository
                .findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(email)
                .stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> findPaidTicketsByEvent(String eventCode) {
        return ticketRepository
                .findByEventEventCodeAndStatus(eventCode, TicketStatus.PAID)
                .stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    // PAID → CANCELLED
    @Override
    @Transactional
    public TicketResponse cancel(String ticketCode) {
        Ticket ticket = ticketRepository
                .findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketCode));

        // BR-TICKET-011 — No puede cancelarse USED ni CANCELLED
        if (ticket.getStatus() == TicketStatus.USED || ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BusinessRuleException(
                    "Ticket cannot be cancelled. Current status: " + ticket.getStatus());
        }

        // BR-TICKET-010 — Solo puede cancelarse un ticket PAID
        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException("Only PAID tickets can be cancelled.");
        }

        // BR-TICKET-012 — No puede cancelarse después de la fecha del evento
        if (!ticket.getEvent().getEventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Ticket cannot be cancelled after the event date.");
        }

        ticket.setStatus(TicketStatus.CANCELLED);

        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }

    // PAID → USED
    @Override
    @Transactional
    public TicketResponse markAsUsed(String ticketCode) {
        Ticket ticket = ticketRepository
                .findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketCode));

        // BR-TICKET-014 — Un ticket CANCELLED nunca puede utilizarse
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BusinessRuleException("A CANCELLED ticket cannot be used.");
        }

        // BR-TICKET-013 — Solo puede marcarse como usado un ticket PAID
        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException("Only PAID tickets can be marked as used.");
        }

        ticket.setStatus(TicketStatus.USED);

        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }
}
