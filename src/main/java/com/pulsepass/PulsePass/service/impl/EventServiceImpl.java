package com.pulsepass.PulsePass.service.impl;

import com.pulsepass.PulsePass.domain.Artist;
import com.pulsepass.PulsePass.domain.Event;
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
import com.pulsepass.PulsePass.service.EventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final ArtistRepository artistRepository;
    private final EventMapper eventMapper;

    public EventServiceImpl(EventRepository eventRepository,
                            VenueRepository venueRepository,
                            ArtistRepository artistRepository,
                            EventMapper eventMapper) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
        this.artistRepository = artistRepository;
        this.eventMapper = eventMapper;
    }

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request) {
        // BR-EVENT-001 — Código único
        if (eventRepository.existsByEventCode(request.eventCode())) {
            throw new DuplicateResourceException("Event already exists: " + request.eventCode());
        }

        // BR-EVENT-002 — Venue obligatorio
        Venue venue = venueRepository
                .findByCode(request.venueCode())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + request.venueCode()));

        // BR-EVENT-003 — Venue activo
        if (!venue.isActive()) {
            throw new BusinessRuleException("Venue is not active: " + venue.getCode());
        }

        // BR-EVENT-004 — Fecha válida
        if (request.eventDate() == null || !request.eventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Event date must be in the future.");
        }

        // BR-EVENT-006 — Edad mínima
        if (request.minimumAge() == null || request.minimumAge() < 0) {
            throw new BusinessRuleException("Minimum age must be greater than or equal to 0.");
        }

        // BR-EVENT-005 — Estado inicial: DRAFT (el request no lo controla)
        Event event = new Event(
                request.eventCode(),
                request.name(),
                request.category(),
                EventStatus.DRAFT,
                request.eventDate(),
                venue
        );
        event.setDescription(request.description());
        event.setMinimumAge(request.minimumAge());

        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponse findByCode(String eventCode) {
        return eventRepository
                .findByEventCode(eventCode)
                .map(eventMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventCode));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventSummaryResponse> findPublishedEvents() {
        return eventRepository
                .findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED)
                .stream()
                .map(eventMapper::toSummary)
                .toList();
    }

    // DRAFT → PUBLISHED
    @Override
    @Transactional
    public EventResponse publish(String eventCode) {
        Event event = eventRepository
                .findByEventCode(eventCode)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventCode));

        // BR-EVENT-007 — Solo DRAFT
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BusinessRuleException(
                    "Only DRAFT events can be published. Current status: " + event.getStatus());
        }

        // BR-EVENT-008 — Fecha futura
        if (!event.getEventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Event date must be in the future.");
        }

        // BR-EVENT-009 — Venue activo
        if (!event.getVenue().isActive()) {
            throw new BusinessRuleException("Venue is not active: " + event.getVenue().getCode());
        }

        event.setStatus(EventStatus.PUBLISHED);

        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional
    public EventResponse addArtist(String eventCode, Long artistId) {
        // 1. buscar evento
        Event event = eventRepository
                .findByEventCode(eventCode)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventCode));

        // 2. buscar artista
        Artist artist = artistRepository
                .findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + artistId));

        // 3. validar ambos recursos — BR-EVENT-011
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.FINISHED) {
            throw new BusinessRuleException(
                    "Cannot add artists to an event with status " + event.getStatus());
        }

        // 4. evitar duplicados — BR-EVENT-010
        if (event.getArtists().contains(artist)) {
            throw new DuplicateResourceException(
                    "Artist " + artist.getStageName() + " is already associated with event " + eventCode);
        }

        // 5. asociar el artista
        event.addArtist(artist);

        // 6. guardar y 7. retornar EventResponse
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventSummaryResponse> findByArtist(String stageName) {
        return eventRepository
                .findEventsByArtistStageName(stageName)
                .stream()
                .map(eventMapper::toSummary)
                .toList();
    }
}
