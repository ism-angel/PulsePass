package com.pulsepass.PulsePass.dto.response;

import com.pulsepass.PulsePass.domain.EventCategory;
import com.pulsepass.PulsePass.domain.EventStatus;

import java.time.LocalDateTime;
import java.util.Set;

public record EventResponse(
        Long id,
        String eventCode,
        String name,
        String description,
        EventCategory category,
        EventStatus status,
        LocalDateTime eventDate,
        Integer minimumAge,
        String venueCode,
        String venueName,
        Set<ArtistResponse> artists
) {}
