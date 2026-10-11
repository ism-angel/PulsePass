package com.pulsepass.PulsePass.controller;

import com.pulsepass.PulsePass.domain.EventCategory;
import com.pulsepass.PulsePass.domain.EventStatus;
import com.pulsepass.PulsePass.dto.request.CreateEventRequest;
import com.pulsepass.PulsePass.dto.response.ArtistResponse;
import com.pulsepass.PulsePass.dto.response.EventResponse;
import com.pulsepass.PulsePass.dto.response.EventSummaryResponse;
import com.pulsepass.PulsePass.exception.BusinessRuleException;
import com.pulsepass.PulsePass.exception.DuplicateResourceException;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.service.EventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventController.class)
class EventControllerTest {

    private static final LocalDateTime EVENT_DATE = LocalDateTime.of(2026, 12, 15, 20, 0);

    private static final String VALID_REQUEST = """
            {
              "eventCode": "CMF-2026",
              "name": "Caribbean Music Fest 2026",
              "description": "Festival de música del Caribe",
              "category": "MUSIC",
              "eventDate": "2026-12-15T20:00:00",
              "minimumAge": 18,
              "venueCode": "VEN-SMR-01"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventService eventService;

    private EventResponse event(EventStatus status, Set<ArtistResponse> artists) {
        return new EventResponse(
                1L, "CMF-2026", "Caribbean Music Fest 2026", "Festival de música del Caribe",
                EventCategory.MUSIC, status, EVENT_DATE, 18,
                "VEN-SMR-01", "Marina Convention Center", artists);
    }

    private EventSummaryResponse summary() {
        return new EventSummaryResponse(
                1L, "CMF-2026", "Caribbean Music Fest 2026",
                EventCategory.MUSIC, EventStatus.PUBLISHED, EVENT_DATE, "Marina Convention Center");
    }

    // TEST-CTRL-EVT-001 — AC-CTRL003
    @Test
    void create_withValidRequest_returns201() throws Exception {
        when(eventService.create(any(CreateEventRequest.class)))
                .thenReturn(event(EventStatus.DRAFT, Set.of()));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.venueCode").value("VEN-SMR-01"));

        verify(eventService).create(any(CreateEventRequest.class));
    }

    // TEST-CTRL-EVT-002 — AC-CTRL004
    @Test
    void create_withInvalidRequest_returns400AndDoesNotCallService() throws Exception {
        String invalidRequest = """
                {
                  "eventCode": "",
                  "name": "Caribbean Music Fest 2026",
                  "category": "MUSIC",
                  "eventDate": "2026-12-15T20:00:00",
                  "minimumAge": 18,
                  "venueCode": ""
                }
                """;

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.eventCode").value("Event code is required"))
                .andExpect(jsonPath("$.details.venueCode").value("Venue code is required"));

        verify(eventService, never()).create(any(CreateEventRequest.class));
    }

    // QT-CTRL-010 — minimumAge negativo (@Min)
    @Test
    void create_withNegativeMinimumAge_returns400AndDoesNotCallService() throws Exception {
        String negativeAgeRequest = VALID_REQUEST.replace("\"minimumAge\": 18", "\"minimumAge\": -1");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(negativeAgeRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.minimumAge")
                        .value("Minimum age must be greater than or equal to 0"));

        verify(eventService, never()).create(any(CreateEventRequest.class));
    }

    // PRD §11.4 — JSON mal formado → 400
    @Test
    void create_withMalformedJson_returns400AndDoesNotCallService() throws Exception {
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"eventCode\": "))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Malformed JSON request"));

        verify(eventService, never()).create(any(CreateEventRequest.class));
    }

    // Conflicto de unicidad propagado desde Service → 409
    @Test
    void create_whenEventCodeAlreadyExists_returns409() throws Exception {
        when(eventService.create(any(CreateEventRequest.class)))
                .thenThrow(new DuplicateResourceException("Event already exists: CMF-2026"));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Event already exists: CMF-2026"));
    }

    // TEST-CTRL-EVT-003
    @Test
    void findByCode_whenEventExists_returns200() throws Exception {
        when(eventService.findByCode("CMF-2026")).thenReturn(event(EventStatus.DRAFT, Set.of()));

        mockMvc.perform(get("/api/events/{eventCode}", "CMF-2026"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.name").value("Caribbean Music Fest 2026"))
                .andExpect(jsonPath("$.category").value("MUSIC"))
                .andExpect(jsonPath("$.minimumAge").value(18));

        verify(eventService).findByCode("CMF-2026");
    }

    // TEST-CTRL-EVT-004
    @Test
    void findByCode_whenEventDoesNotExist_returns404() throws Exception {
        when(eventService.findByCode("NOPE"))
                .thenThrow(new ResourceNotFoundException("Event not found: NOPE"));

        mockMvc.perform(get("/api/events/{eventCode}", "NOPE"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Event not found: NOPE"));

        verify(eventService).findByCode("NOPE");
    }

    // TEST-CTRL-EVT-005
    @Test
    void findPublishedEvents_returns200WithSummaries() throws Exception {
        when(eventService.findPublishedEvents()).thenReturn(List.of(summary()));

        mockMvc.perform(get("/api/events/published"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$[0].status").value("PUBLISHED"))
                .andExpect(jsonPath("$[0].venueName").value("Marina Convention Center"));

        verify(eventService).findPublishedEvents();
    }

    // TEST-CTRL-EVT-006 — AC-CTRL005
    @Test
    void publish_whenTransitionIsValid_returns200() throws Exception {
        when(eventService.publish("CMF-2026")).thenReturn(event(EventStatus.PUBLISHED, Set.of()));

        mockMvc.perform(patch("/api/events/{eventCode}/publish", "CMF-2026"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        verify(eventService).publish("CMF-2026");
    }

    // TEST-CTRL-EVT-007 — AC-CTRL006
    @Test
    void publish_whenBusinessRuleFails_returns409() throws Exception {
        when(eventService.publish("CMF-2026"))
                .thenThrow(new BusinessRuleException(
                        "Only DRAFT events can be published. Current status: PUBLISHED"));

        mockMvc.perform(patch("/api/events/{eventCode}/publish", "CMF-2026"))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message")
                        .value("Only DRAFT events can be published. Current status: PUBLISHED"));

        verify(eventService).publish("CMF-2026");
    }

    // TEST-CTRL-EVT-008
    @Test
    void addArtist_whenAssociationIsValid_returns200() throws Exception {
        ArtistResponse solarBeat = new ArtistResponse(1L, "Solar Beat", "Colombia", "Electronic", true);
        when(eventService.addArtist("CMF-2026", 1L))
                .thenReturn(event(EventStatus.DRAFT, Set.of(solarBeat)));

        mockMvc.perform(post("/api/events/{eventCode}/artists/{artistId}", "CMF-2026", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.artists.length()").value(1))
                .andExpect(jsonPath("$.artists[0].stageName").value("Solar Beat"));

        verify(eventService).addArtist("CMF-2026", 1L);
    }

    // FRCTRLEVT-005 — conflicto (artista ya asociado) → 409
    @Test
    void addArtist_whenArtistAlreadyAssociated_returns409() throws Exception {
        when(eventService.addArtist("CMF-2026", 1L))
                .thenThrow(new DuplicateResourceException(
                        "Artist Solar Beat is already associated with event CMF-2026"));

        mockMvc.perform(post("/api/events/{eventCode}/artists/{artistId}", "CMF-2026", 1L))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));

        verify(eventService).addArtist("CMF-2026", 1L);
    }

    // FRCTRLEVT-005 — conflicto de regla de negocio (evento CANCELLED/FINISHED) → 409
    @Test
    void addArtist_whenEventIsCancelled_returns409() throws Exception {
        when(eventService.addArtist("CMF-2026", 2L))
                .thenThrow(new BusinessRuleException("Cannot add artists to an event with status CANCELLED"));

        mockMvc.perform(post("/api/events/{eventCode}/artists/{artistId}", "CMF-2026", 2L))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("Cannot add artists to an event with status CANCELLED"));
    }

    // TEST-CTRL-EVT-009
    @Test
    void findByArtist_returns200WithSummaries() throws Exception {
        when(eventService.findByArtist("Solar Beat")).thenReturn(List.of(summary()));

        mockMvc.perform(get("/api/events/by-artist").param("stageName", "Solar Beat"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"));

        verify(eventService).findByArtist("Solar Beat");
    }
}
