package com.pulsepass.PulsePass.service.impl;

import com.pulsepass.PulsePass.domain.Artist;
import com.pulsepass.PulsePass.domain.Event;
import com.pulsepass.PulsePass.domain.EventCategory;
import com.pulsepass.PulsePass.domain.EventStatus;
import com.pulsepass.PulsePass.domain.Venue;
import com.pulsepass.PulsePass.dto.request.CreateEventRequest;
import com.pulsepass.PulsePass.dto.response.EventResponse;
import com.pulsepass.PulsePass.dto.response.EventSummaryResponse;
import com.pulsepass.PulsePass.exception.BusinessRuleException;
import com.pulsepass.PulsePass.exception.DuplicateResourceException;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.mapper.EventMapper;
import com.pulsepass.PulsePass.repository.ArtistRepository;
import com.pulsepass.PulsePass.repository.EventRepository;
import com.pulsepass.PulsePass.repository.VenueRepository;
import com.pulsepass.PulsePass.service.AuthorizationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    private static final String EVENT_CODE = "CMF-2026";
    private static final String VENUE_CODE = "VEN-SMR-01";
    private static final LocalDateTime FUTURE_DATE = LocalDateTime.now().plusMonths(6);
    private static final LocalDateTime PAST_DATE = LocalDateTime.now().minusDays(1);

    @Mock
    private EventRepository eventRepository;

    @Mock
    private VenueRepository venueRepository;

    @Mock
    private ArtistRepository artistRepository;

    @Mock
    private EventMapper eventMapper;

    // Fase 4: EventServiceImpl ahora lo recibe por constructor.
    // Sin este @Mock, @InjectMocks le pasaría null => NullPointerException.
    @Mock
    private AuthorizationService authorizationService;

    @InjectMocks
    private EventServiceImpl eventService;

    // ---------- findByCode ----------

    @Test
    void debeRetornarDtoCuandoEventoExiste_TEST_EVENT_001() {
        // ARRANGE
        Event event = event(EventStatus.PUBLISHED);
        EventResponse expected = response(EventStatus.PUBLISHED);
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(eventMapper.toResponse(event)).thenReturn(expected);

        // ACT
        EventResponse result = eventService.findByCode(EVENT_CODE);

        // ASSERT
        assertThat(result).isEqualTo(expected);
        verify(eventRepository).findByEventCode(EVENT_CODE);
    }

    @Test
    void debeLanzarNotFoundCuandoEventoNoExiste_TEST_EVENT_002() {
        // ARRANGE
        when(eventRepository.findByEventCode("NO-EXISTE")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> eventService.findByCode("NO-EXISTE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event not found: NO-EXISTE");

        verify(eventMapper, never()).toResponse(any(Event.class));
    }

    // ---------- create ----------

    @Test
    void debeGuardarEventoEnDraftCuandoRequestEsValido_TEST_EVENT_003() {
        // ARRANGE
        Venue venue = venue(true);
        EventResponse expected = response(EventStatus.DRAFT);
        when(eventRepository.existsByEventCode(EVENT_CODE)).thenReturn(false);
        when(venueRepository.findByCode(VENUE_CODE)).thenReturn(Optional.of(venue));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(eventMapper.toResponse(any(Event.class))).thenReturn(expected);

        // ACT
        EventResponse result = eventService.create(request(FUTURE_DATE));

        // ASSERT
        assertThat(result).isEqualTo(expected);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        Event saved = captor.getValue();
        assertThat(saved.getEventCode()).isEqualTo(EVENT_CODE);
        assertThat(saved.getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(saved.getVenue()).isSameAs(venue);
        assertThat(saved.getMinimumAge()).isEqualTo(18);
    }

    @Test
    void debeFallarYNoGuardarCuandoVenueNoExiste_TEST_EVENT_004() {
        // ARRANGE
        when(venueRepository.findByCode(VENUE_CODE)).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> eventService.create(request(FUTURE_DATE)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Venue not found: " + VENUE_CODE);

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void debeLanzarBusinessRuleCuandoVenueEstaInactivo_TEST_EVENT_005() {
        // ARRANGE
        when(venueRepository.findByCode(VENUE_CODE)).thenReturn(Optional.of(venue(false)));

        // ACT + ASSERT
        assertThatThrownBy(() -> eventService.create(request(FUTURE_DATE)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining(VENUE_CODE);

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void debeLanzarBusinessRuleCuandoFechaEsPasada_TEST_EVENT_006() {
        // ARRANGE
        when(venueRepository.findByCode(VENUE_CODE)).thenReturn(Optional.of(venue(true)));

        // ACT + ASSERT
        assertThatThrownBy(() -> eventService.create(request(PAST_DATE)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Event date must be in the future.");

        verify(eventRepository, never()).save(any(Event.class));
    }

    // ---------- publish ----------

    @Test
    void debePublicarEventoDraftValido_TEST_EVENT_007() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT);
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(eventRepository.save(event)).thenReturn(event);
        when(eventMapper.toResponse(event)).thenReturn(response(EventStatus.PUBLISHED));

        // ACT
        EventResponse result = eventService.publish(EVENT_CODE);

        // ASSERT
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(result.status()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository).save(event);
    }

    @Test
    void debeRechazarPublicarEventoCanceladoYNoPersistir_TEST_EVENT_008() {
        // ARRANGE
        Event event = event(EventStatus.CANCELLED);
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));

        // ACT + ASSERT
        assertThatThrownBy(() -> eventService.publish(EVENT_CODE))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("CANCELLED");

        assertThat(event.getStatus()).isEqualTo(EventStatus.CANCELLED);
        verify(eventRepository, never()).save(any(Event.class));
    }

    // ---------- addArtist (FR-SVC-007, unit test requerido por la sección 49) ----------

    @Test
    void debeAsociarArtistaNuevoAlEvento_FR_SVC_007() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT);
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic");
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));
        when(eventRepository.save(event)).thenReturn(event);
        when(eventMapper.toResponse(event)).thenReturn(response(EventStatus.DRAFT));

        // ACT
        eventService.addArtist(EVENT_CODE, 1L);

        // ASSERT
        assertThat(event.getArtists()).containsExactly(artist);
        verify(eventRepository).save(event);
    }

    @Test
    void debeRechazarArtistaYaAsociadoYNoGuardar_BR_EVENT_010() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT);
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic");
        event.addArtist(artist);
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));

        // ACT + ASSERT
        assertThatThrownBy(() -> eventService.addArtist(EVENT_CODE, 1L))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Solar Beat");

        verify(eventRepository, never()).save(any(Event.class));
    }

    // ---------- Fase 4: visibilidad de borradores (FR-SEC-EVT-02 / EVT-06) ----------

    // T-SEC-017 — anónimo/USER no ve un borrador: 404, igual que si no existiera
    @Test
    void noDebeExponerEventoBorradorAQuienNoEsStaff_T_SEC_017() {
        // ARRANGE
        Event draft = event(EventStatus.DRAFT);
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(draft));
        when(authorizationService.canViewUnpublishedEvents()).thenReturn(false);

        // ACT + ASSERT
        assertThatThrownBy(() -> eventService.findByCode(EVENT_CODE))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event not found: " + EVENT_CODE);

        verify(eventMapper, never()).toResponse(any(Event.class));
    }

    // STAFF/ADMIN sí ven el borrador
    @Test
    void debeMostrarEventoBorradorAStaffOAdmin() {
        // ARRANGE
        Event draft = event(EventStatus.DRAFT);
        EventResponse expected = response(EventStatus.DRAFT);
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(draft));
        when(authorizationService.canViewUnpublishedEvents()).thenReturn(true);
        when(eventMapper.toResponse(draft)).thenReturn(expected);

        // ACT
        EventResponse result = eventService.findByCode(EVENT_CODE);

        // ASSERT
        assertThat(result).isEqualTo(expected);
    }

    // FR-SEC-EVT-06 — búsqueda pública por artista: solo PUBLISHED
    @Test
    void busquedaPorArtistaSinPrivilegios_soloDevuelvePublicados() {
        // ARRANGE
        Event published = event(EventStatus.PUBLISHED);
        Event draft = new Event("DRAFT-2026", "Borrador secreto", EventCategory.MUSIC,
                EventStatus.DRAFT, FUTURE_DATE, venue(true));
        EventSummaryResponse publishedSummary = summary(EventStatus.PUBLISHED);
        when(eventRepository.findEventsByArtistStageName("Solar Beat")).thenReturn(List.of(published, draft));
        when(authorizationService.canViewUnpublishedEvents()).thenReturn(false);
        when(eventMapper.toSummary(published)).thenReturn(publishedSummary);

        // ACT
        List<EventSummaryResponse> result = eventService.findByArtist("Solar Beat");

        // ASSERT
        assertThat(result).containsExactly(publishedSummary);
        verify(eventMapper, never()).toSummary(draft);
    }

    // FR-SEC-EVT-06 — STAFF/ADMIN ven todos los estados
    @Test
    void busquedaPorArtistaConPrivilegios_devuelveTodos() {
        // ARRANGE
        Event published = event(EventStatus.PUBLISHED);
        Event draft = new Event("DRAFT-2026", "Borrador secreto", EventCategory.MUSIC,
                EventStatus.DRAFT, FUTURE_DATE, venue(true));
        when(eventRepository.findEventsByArtistStageName("Solar Beat")).thenReturn(List.of(published, draft));
        when(authorizationService.canViewUnpublishedEvents()).thenReturn(true);
        when(eventMapper.toSummary(published)).thenReturn(summary(EventStatus.PUBLISHED));
        when(eventMapper.toSummary(draft)).thenReturn(summary(EventStatus.DRAFT));

        // ACT
        List<EventSummaryResponse> result = eventService.findByArtist("Solar Beat");

        // ASSERT
        assertThat(result).hasSize(2);
    }

    // ---------- datos de prueba (escenario de la sección 47) ----------

    private Venue venue(boolean active) {
        return new Venue(VENUE_CODE, "Marina Convention Center", "Santa Marta",
                "Calle 10 # 1-23", 3, active);
    }

    private Event event(EventStatus status) {
        return new Event(EVENT_CODE, "Caribbean Music Fest 2026", EventCategory.MUSIC,
                status, FUTURE_DATE, venue(true));
    }

    private CreateEventRequest request(LocalDateTime eventDate) {
        return new CreateEventRequest(EVENT_CODE, "Caribbean Music Fest 2026",
                "Festival de música del Caribe", EventCategory.MUSIC, eventDate, 18, VENUE_CODE);
    }

    private EventResponse response(EventStatus status) {
        return new EventResponse(1L, EVENT_CODE, "Caribbean Music Fest 2026",
                "Festival de música del Caribe", EventCategory.MUSIC, status, FUTURE_DATE,
                18, VENUE_CODE, "Marina Convention Center", Set.of());
    }

    private EventSummaryResponse summary(EventStatus status) {
        return new EventSummaryResponse(1L, EVENT_CODE, "Caribbean Music Fest 2026",
                EventCategory.MUSIC, status, FUTURE_DATE, "Marina Convention Center");
    }
}