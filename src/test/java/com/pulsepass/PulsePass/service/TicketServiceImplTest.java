package com.pulsepass.PulsePass.service.impl;

import com.pulsepass.PulsePass.domain.Event;
import com.pulsepass.PulsePass.domain.EventCategory;
import com.pulsepass.PulsePass.domain.EventStatus;
import com.pulsepass.PulsePass.domain.Ticket;
import com.pulsepass.PulsePass.domain.TicketStatus;
import com.pulsepass.PulsePass.domain.TicketType;
import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.domain.UserProfile;
import com.pulsepass.PulsePass.domain.Venue;
import com.pulsepass.PulsePass.dto.request.PurchaseTicketRequest;
import com.pulsepass.PulsePass.dto.response.TicketResponse;
import com.pulsepass.PulsePass.exception.BusinessRuleException;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.mapper.TicketMapper;
import com.pulsepass.PulsePass.repository.EventRepository;
import com.pulsepass.PulsePass.repository.TicketRepository;
import com.pulsepass.PulsePass.repository.UserRepository;
import com.pulsepass.PulsePass.service.TicketPriceCalculator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceImplTest {

    private static final String EVENT_CODE = "CMF-2026";
    private static final String TICKET_CODE = "TKT-001";
    private static final BigDecimal VIP_PRICE = new BigDecimal("200.00");
    private static final LocalDateTime FUTURE_DATE = LocalDateTime.now().plusMonths(6);
    // La edad se evalúa en la fecha del evento (BR-TICKET-006)
    private static final LocalDate ADULT_BIRTH_DATE = FUTURE_DATE.toLocalDate().minusYears(25);
    private static final LocalDate MINOR_BIRTH_DATE = FUTURE_DATE.toLocalDate().minusYears(17);

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TicketMapper ticketMapper;

    @Mock
    private TicketPriceCalculator priceCalculator;

    @InjectMocks
    private TicketServiceImpl ticketService;

    // ---------- purchase ----------

    @Test
    void debeGenerarTicketPaidCuandoCompraEsValida_TEST_TICKET_001() {
        // ARRANGE
        User andrea = user("andrea", ADULT_BIRTH_DATE, true);
        Event event = event(EventStatus.PUBLISHED);
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(ticketRepository.countByEventEventCodeAndStatus(anyString(), eq(TicketStatus.PAID)))
                .thenReturn(0L);
        when(priceCalculator.calculate(TicketType.VIP)).thenReturn(VIP_PRICE);
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ticketMapper.toResponse(any(Ticket.class))).thenReturn(response(TicketStatus.PAID));

        // ACT
        TicketResponse result = ticketService.purchase(request("andrea@email.com"));

        // ASSERT
        assertThat(result.status()).isEqualTo(TicketStatus.PAID);

        ArgumentCaptor<Ticket> captor = ArgumentCaptor.forClass(Ticket.class);
        verify(ticketRepository).save(captor.capture());
        Ticket saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(TicketStatus.PAID);
        assertThat(saved.getPrice()).isEqualByComparingTo(VIP_PRICE);
        assertThat(saved.getType()).isEqualTo(TicketType.VIP);
        assertThat(saved.getUser()).isSameAs(andrea);
        assertThat(saved.getEvent()).isSameAs(event);

        // Quedan cupos: el evento sigue PUBLISHED y no se vuelve a guardar
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void debeLanzarNotFoundCuandoUsuarioNoExiste_TEST_TICKET_002() {
        // ARRANGE
        when(userRepository.findByEmailIgnoreCase("nadie@email.com")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(request("nadie@email.com")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found: nadie@email.com");

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void debeLanzarBusinessRuleCuandoUsuarioEstaInactivo_TEST_TICKET_003() {
        // ARRANGE
        User miguel = user("miguel", ADULT_BIRTH_DATE, false);
        when(userRepository.findByEmailIgnoreCase("miguel@email.com")).thenReturn(Optional.of(miguel));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(request("miguel@email.com")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not active");

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void debeLanzarBusinessRuleCuandoEventoEstaEnDraft_TEST_TICKET_004() {
        // ARRANGE
        User andrea = user("andrea", ADULT_BIRTH_DATE, true);
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(eventRepository.findByEventCode(EVENT_CODE))
                .thenReturn(Optional.of(event(EventStatus.DRAFT)));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(request("andrea@email.com")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("DRAFT");

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void debeLanzarBusinessRuleCuandoEventoEstaCancelado_TEST_TICKET_005() {
        // ARRANGE
        User andrea = user("andrea", ADULT_BIRTH_DATE, true);
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(eventRepository.findByEventCode(EVENT_CODE))
                .thenReturn(Optional.of(event(EventStatus.CANCELLED)));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(request("andrea@email.com")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("CANCELLED");

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void debeLanzarBusinessRuleCuandoUsuarioEsMenorDeEdad_TEST_TICKET_006() {
        // ARRANGE
        User laura = user("laura", MINOR_BIRTH_DATE, true);
        when(userRepository.findByEmailIgnoreCase("laura@email.com")).thenReturn(Optional.of(laura));
        when(eventRepository.findByEventCode(EVENT_CODE))
                .thenReturn(Optional.of(event(EventStatus.PUBLISHED)));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(request("laura@email.com")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("User does not meet minimum age.");

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void debeLanzarBusinessRuleCuandoEventoNoTieneCapacidad_TEST_TICKET_007() {
        // ARRANGE — venue con capacidad 3 y ya hay 3 tickets PAID
        User andrea = user("andrea", ADULT_BIRTH_DATE, true);
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(eventRepository.findByEventCode(EVENT_CODE))
                .thenReturn(Optional.of(event(EventStatus.PUBLISHED)));
        when(ticketRepository.countByEventEventCodeAndStatus(anyString(), eq(TicketStatus.PAID)))
                .thenReturn(3L);

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(request("andrea@email.com")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("capacity");

        verify(priceCalculator, never()).calculate(any(TicketType.class));
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void debeGuardarTicketYMarcarSoldOutCuandoEsElUltimoCupo_TEST_TICKET_008() {
        // ARRANGE — capacidad 3 y ya hay 2 tickets PAID: este es el último
        User andrea = user("andrea", ADULT_BIRTH_DATE, true);
        Event event = event(EventStatus.PUBLISHED);
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(ticketRepository.countByEventEventCodeAndStatus(anyString(), eq(TicketStatus.PAID)))
                .thenReturn(2L);
        when(priceCalculator.calculate(TicketType.VIP)).thenReturn(VIP_PRICE);
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ticketMapper.toResponse(any(Ticket.class))).thenReturn(response(TicketStatus.PAID));

        // ACT
        ticketService.purchase(request("andrea@email.com"));

        // ASSERT
        verify(ticketRepository).save(any(Ticket.class));
        assertThat(event.getStatus()).isEqualTo(EventStatus.SOLD_OUT);
        verify(eventRepository).save(event);
    }

    // ---------- cancel ----------

    @Test
    void debeCancelarTicketPaid_TEST_TICKET_009() {
        // ARRANGE
        Ticket ticket = ticket(TicketStatus.PAID);
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketMapper.toResponse(ticket)).thenReturn(response(TicketStatus.CANCELLED));

        // ACT
        TicketResponse result = ticketService.cancel(TICKET_CODE);

        // ASSERT
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        assertThat(result.status()).isEqualTo(TicketStatus.CANCELLED);
        verify(ticketRepository).save(ticket);
    }

    @Test
    void debeRechazarCancelarTicketUsado_TEST_TICKET_010() {
        // ARRANGE
        Ticket ticket = ticket(TicketStatus.USED);
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.cancel(TICKET_CODE))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("USED");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.USED);
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    // ---------- markAsUsed ----------

    @Test
    void debeMarcarTicketPaidComoUsado_TEST_TICKET_011() {
        // ARRANGE
        Ticket ticket = ticket(TicketStatus.PAID);
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketMapper.toResponse(ticket)).thenReturn(response(TicketStatus.USED));

        // ACT
        TicketResponse result = ticketService.markAsUsed(TICKET_CODE);

        // ASSERT
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.USED);
        assertThat(result.status()).isEqualTo(TicketStatus.USED);
        verify(ticketRepository).save(ticket);
    }

    @Test
    void debeRechazarUsarTicketCancelado_TEST_TICKET_012() {
        // ARRANGE
        Ticket ticket = ticket(TicketStatus.CANCELLED);
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.markAsUsed(TICKET_CODE))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("A CANCELLED ticket cannot be used.");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    // ---------- datos de prueba (escenario de la sección 47) ----------

    private User user(String name, LocalDate birthDate, boolean active) {
        User user = new User(name, name + "@email.com");
        user.setActive(active);
        UserProfile profile = new UserProfile(name, "Test");
        profile.setBirthDate(birthDate);
        user.setProfile(profile);
        return user;
    }

    private Event event(EventStatus status) {
        Venue venue = new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta",
                "Calle 10 # 1-23", 3, true);
        Event event = new Event(EVENT_CODE, "Caribbean Music Fest 2026", EventCategory.MUSIC,
                status, FUTURE_DATE, venue);
        event.setMinimumAge(18);
        return event;
    }

    private Ticket ticket(TicketStatus status) {
        return new Ticket(TICKET_CODE, TicketType.VIP, VIP_PRICE, status, LocalDateTime.now(),
                user("andrea", ADULT_BIRTH_DATE, true), event(EventStatus.PUBLISHED));
    }

    private PurchaseTicketRequest request(String userEmail) {
        return new PurchaseTicketRequest(userEmail, EVENT_CODE, TicketType.VIP);
    }

    private TicketResponse response(TicketStatus status) {
        return new TicketResponse(1L, TICKET_CODE, TicketType.VIP, VIP_PRICE, status,
                LocalDateTime.now(), "andrea@email.com", EVENT_CODE, "Caribbean Music Fest 2026");
    }
}