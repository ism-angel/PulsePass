package com.pulsepass.PulsePass.dto.response;

import com.pulsepass.PulsePass.domain.TicketStatus;
import com.pulsepass.PulsePass.domain.TicketType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        String ticketCode,
        TicketType type,
        BigDecimal price,
        TicketStatus status,
        LocalDateTime purchaseDate,
        String userEmail,
        String eventCode,
        String eventName
) {}
