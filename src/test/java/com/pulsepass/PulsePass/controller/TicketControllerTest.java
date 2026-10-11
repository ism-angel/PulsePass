package com.pulsepass.PulsePass.controller;

import com.pulsepass.PulsePass.domain.TicketStatus;
import com.pulsepass.PulsePass.domain.TicketType;
import com.pulsepass.PulsePass.dto.request.PurchaseTicketRequest;
import com.pulsepass.PulsePass.dto.response.TicketResponse;
import com.pulsepass.PulsePass.exception.BusinessRuleException;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.service.TicketService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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

@WebMvcTest(TicketController.class)
class TicketControllerTest {

    private static final String TICKET_CODE = "TKT-0001";

    private static final String VALID_REQUEST = """
            {
              "userEmail": "andrea@example.com",
              "eventCode": "CMF-2026",
              "type": "GENERAL"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TicketService ticketService;

    private TicketResponse ticket(TicketStatus status) {
        return new TicketResponse(
                1L, TICKET_CODE, TicketType.GENERAL, new BigDecimal("100.00"), status,
                LocalDateTime.of(2026, 10, 5, 12, 0),
                "andrea@example.com", "CMF-2026", "Caribbean Music Fest 2026");
    }

    // TEST-CTRL-TKT-001 — AC-CTRL009
    @Test
    void purchase_withValidRequest_returns201() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class))).thenReturn(ticket(TicketStatus.PAID));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value(TICKET_CODE))
                .andExpect(jsonPath("$.type").value("GENERAL"))
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.userEmail").value("andrea@example.com"))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"));

        verify(ticketService).purchase(any(PurchaseTicketRequest.class));
    }

    // TEST-CTRL-TKT-002
    @Test
    void purchase_withInvalidRequest_returns400AndDoesNotCallService() throws Exception {
        String invalidRequest = """
                {
                  "userEmail": "",
                  "eventCode": "",
                  "type": null
                }
                """;

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.userEmail").value("User email is required"))
                .andExpect(jsonPath("$.details.eventCode").value("Event code is required"))
                .andExpect(jsonPath("$.details.type").value("Ticket type is required"));

        verify(ticketService, never()).purchase(any(PurchaseTicketRequest.class));
    }

    // Enum inexistente → JSON no legible → 400 sin invocar el Service
    @Test
    void purchase_withUnknownTicketType_returns400AndDoesNotCallService() throws Exception {
        String unknownType = VALID_REQUEST.replace("GENERAL", "PLATINUM");

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unknownType))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verify(ticketService, never()).purchase(any(PurchaseTicketRequest.class));
    }

    // TEST-CTRL-TKT-003
    @Test
    void purchase_whenUserDoesNotExist_returns404() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class)))
                .thenThrow(new ResourceNotFoundException("User not found: andrea@example.com"));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("User not found: andrea@example.com"));

        verify(ticketService).purchase(any(PurchaseTicketRequest.class));
    }

    // TEST-CTRL-TKT-004 — AC-CTRL010
    @Test
    void purchase_whenBusinessRuleFails_returns409() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class)))
                .thenThrow(new BusinessRuleException("User does not meet minimum age."));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("User does not meet minimum age."));

        verify(ticketService).purchase(any(PurchaseTicketRequest.class));
    }

    // Definition of Done — error inesperado → 500 sin exponer detalles internos
    @Test
    void purchase_whenUnexpectedErrorOccurs_returns500WithoutInternalDetails() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class)))
                .thenThrow(new IllegalStateException("connection pool exhausted: jdbc:postgresql://..."));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"))
                .andExpect(jsonPath("$.message").value("Unexpected internal error"))
                .andExpect(jsonPath("$.details").isEmpty());
    }

    // TEST-CTRL-TKT-005
    @Test
    void findByCode_whenTicketExists_returns200() throws Exception {
        when(ticketService.findByCode(TICKET_CODE)).thenReturn(ticket(TicketStatus.PAID));

        mockMvc.perform(get("/api/tickets/{ticketCode}", TICKET_CODE))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value(TICKET_CODE))
                .andExpect(jsonPath("$.status").value("PAID"));

        verify(ticketService).findByCode(TICKET_CODE);
    }

    // FR-CTRLTKT-002 — rama 404
    @Test
    void findByCode_whenTicketDoesNotExist_returns404() throws Exception {
        when(ticketService.findByCode("TKT-XXXX"))
                .thenThrow(new ResourceNotFoundException("Ticket not found: TKT-XXXX"));

        mockMvc.perform(get("/api/tickets/{ticketCode}", "TKT-XXXX"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Ticket not found: TKT-XXXX"));

        verify(ticketService).findByCode("TKT-XXXX");
    }

    // TEST-CTRL-TKT-006
    @Test
    void findByUserEmail_returns200WithTickets() throws Exception {
        when(ticketService.findByUserEmail("andrea@example.com"))
                .thenReturn(List.of(ticket(TicketStatus.PAID)));

        mockMvc.perform(get("/api/tickets/by-user").param("email", "andrea@example.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].userEmail").value("andrea@example.com"));

        verify(ticketService).findByUserEmail("andrea@example.com");
    }

    // TEST-CTRL-TKT-007
    @Test
    void findPaidTicketsByEvent_returns200WithPaidTickets() throws Exception {
        when(ticketService.findPaidTicketsByEvent("CMF-2026"))
                .thenReturn(List.of(ticket(TicketStatus.PAID)));

        mockMvc.perform(get("/api/events/{eventCode}/tickets/paid", "CMF-2026"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PAID"))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"));

        verify(ticketService).findPaidTicketsByEvent("CMF-2026");
    }

    // TEST-CTRL-TKT-008 — AC-CTRL011
    @Test
    void cancel_whenTicketIsPaid_returns200() throws Exception {
        when(ticketService.cancel(TICKET_CODE)).thenReturn(ticket(TicketStatus.CANCELLED));

        mockMvc.perform(patch("/api/tickets/{ticketCode}/cancel", TICKET_CODE))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value(TICKET_CODE))
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(ticketService).cancel(TICKET_CODE);
    }

    // TEST-CTRL-TKT-009 — AC-CTRL012
    @Test
    void cancel_whenTicketIsUsed_returns409() throws Exception {
        when(ticketService.cancel(TICKET_CODE))
                .thenThrow(new BusinessRuleException("Ticket cannot be cancelled. Current status: USED"));

        mockMvc.perform(patch("/api/tickets/{ticketCode}/cancel", TICKET_CODE))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Ticket cannot be cancelled. Current status: USED"));

        verify(ticketService).cancel(TICKET_CODE);
    }

    // TEST-CTRL-TKT-010 — AC-CTRL013
    @Test
    void markAsUsed_whenTicketIsPaid_returns200() throws Exception {
        when(ticketService.markAsUsed(TICKET_CODE)).thenReturn(ticket(TicketStatus.USED));

        mockMvc.perform(patch("/api/tickets/{ticketCode}/use", TICKET_CODE))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value(TICKET_CODE))
                .andExpect(jsonPath("$.status").value("USED"));

        verify(ticketService).markAsUsed(TICKET_CODE);
    }

    // TEST-CTRL-TKT-011 — AC-CTRL014
    @Test
    void markAsUsed_whenTicketIsCancelled_returns409() throws Exception {
        when(ticketService.markAsUsed(TICKET_CODE))
                .thenThrow(new BusinessRuleException("A CANCELLED ticket cannot be used."));

        mockMvc.perform(patch("/api/tickets/{ticketCode}/use", TICKET_CODE))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("A CANCELLED ticket cannot be used."));

        verify(ticketService).markAsUsed(TICKET_CODE);
    }
}
