package com.pulsepass.PulsePass.dto.request;

import com.pulsepass.PulsePass.domain.EventCategory;

import java.time.LocalDateTime;

public record CreateEventRequest(
        String eventCode,
        String name,
        String description,
        EventCategory category,
        LocalDateTime eventDate,
        Integer minimumAge,
        String venueCode
) {}
