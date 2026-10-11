package com.pulsepass.PulsePass.dto.request;

import com.pulsepass.PulsePass.domain.EventCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CreateEventRequest(
        @NotBlank(message = "Event code is required")
        String eventCode,

        @NotBlank(message = "Event name is required")
        String name,

        @Size(max = 1000, message = "Description must not exceed 1000 characters")
        String description,

        @NotNull(message = "Event category is required")
        EventCategory category,

        @NotNull(message = "Event date is required")
        LocalDateTime eventDate,

        @NotNull(message = "Minimum age is required")
        @Min(value = 0, message = "Minimum age must be greater than or equal to 0")
        Integer minimumAge,

        @NotBlank(message = "Venue code is required")
        String venueCode
) {}
