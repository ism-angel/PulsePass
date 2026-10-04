package com.pulsepass.PulsePass.dto.request;

import com.pulsepass.PulsePass.domain.TicketType;

public record PurchaseTicketRequest(
        String userEmail,
        String eventCode,
        TicketType type
) {}
