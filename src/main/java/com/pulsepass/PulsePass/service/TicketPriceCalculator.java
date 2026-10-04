package com.pulsepass.PulsePass.service;

import com.pulsepass.PulsePass.domain.TicketType;
import com.pulsepass.PulsePass.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumMap;
import java.util.Map;

/**
 * Estrategia de precio encapsulada (sección 28):
 * GENERAL → precio base, STUDENT → descuento, VIP → multiplicador,
 * BACKSTAGE → multiplicador superior.
 */
@Component
public class TicketPriceCalculator {

    static final BigDecimal BASE_PRICE = new BigDecimal("100.00");

    private final Map<TicketType, BigDecimal> multipliers = new EnumMap<>(TicketType.class);

    public TicketPriceCalculator() {
        multipliers.put(TicketType.GENERAL, new BigDecimal("1.00"));
        multipliers.put(TicketType.STUDENT, new BigDecimal("0.50"));
        multipliers.put(TicketType.VIP, new BigDecimal("2.00"));
        multipliers.put(TicketType.BACKSTAGE, new BigDecimal("3.00"));
    }

    public BigDecimal calculate(TicketType type) {
        BigDecimal multiplier = multipliers.get(type);
        if (multiplier == null) {
            throw new BusinessRuleException("Unsupported ticket type: " + type);
        }
        BigDecimal price = BASE_PRICE.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        // BR-TICKET-009 — nunca price < 0
        if (price.signum() < 0) {
            throw new BusinessRuleException("Ticket price cannot be negative.");
        }
        return price;
    }
}
