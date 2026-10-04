package com.pulsepass.PulsePass.dto.response;

import com.pulsepass.PulsePass.domain.EventCategory;
import com.pulsepass.PulsePass.domain.EventStatus;

import java.time.LocalDateTime;

public record EventSummaryResponse(
        Long id,
        String eventCode,
        String name,
        EventCategory category,
        EventStatus status,
        LocalDateTime eventDate,
        String venueName
) {}
