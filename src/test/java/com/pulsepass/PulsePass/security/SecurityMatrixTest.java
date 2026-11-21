package com.pulsepass.PulsePass.security;

import com.pulsepass.PulsePass.controller.ArtistController;
import com.pulsepass.PulsePass.controller.AuthController;
import com.pulsepass.PulsePass.controller.EventController;
import com.pulsepass.PulsePass.controller.TicketController;
import com.pulsepass.PulsePass.controller.UserController;
import com.pulsepass.PulsePass.controller.VenueController;
import com.pulsepass.PulsePass.domain.Role;
import com.pulsepass.PulsePass.dto.response.AuthResponse;
import com.pulsepass.PulsePass.exception.InvalidCredentialsException;
import com.pulsepass.PulsePass.service.ArtistService;
import com.pulsepass.PulsePass.service.AuthService;
import com.pulsepass.PulsePass.service.EventService;
import com.pulsepass.PulsePass.service.TicketService;
import com.pulsepass.PulsePass.service.UserService;
import com.pulsepass.PulsePass.service.VenueService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.Set;

import static com.pulsepass.PulsePass.security.SecurityTestSupport.asAdmin;
import static com.pulsepass.PulsePass.security.SecurityTestSupport.asStaff;
import static com.pulsepass.PulsePass.security.SecurityTestSupport.asUser;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// PRD §17.2 — T-SEC-001..019 a nivel HTTP, con SecurityFilterChain REAL
@WebMvcTest({VenueController.class, ArtistController.class, EventController.class,
        TicketController.class, UserController.class, AuthController.class})
@WithSecurityLayer
class SecurityMatrixTest {

    private static final String VALID_EVENT = """
            {"eventCode":"CMF-2026","name":"Caribbean Music Fest 2026","description":"Festival",
             "category":"MUSIC","eventDate":"2030-12-10T20:00:00","minimumAge":18,"venueCode":"VEN-SMR-01"}
            """;
    private static final String LOGIN = """
            {"identifier":"andrea","password":"UnaFraseSeguraLarga2026!"}
            """;

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;                       // mock (de @WithSecurityLayer)
    @Autowired private CustomUserDetailsService userDetailsService; // mock (de @WithSecurityLayer)

    @MockitoBean private VenueService venueService;
    @MockitoBean private ArtistService artistService;
    @MockitoBean private EventService eventService;
    @MockitoBean private TicketService ticketService;
    @MockitoBean private UserService userService;
    @MockitoBean private AuthService authService;

    // ---------- Rutas públicas ----------

    @Test
    void anonimoVeEventosPublicados_T_SEC_001() throws Exception {
        mockMvc.perform(get("/api/events/published")).andExpect(status().isOk());
    }

    @Test
    void anonimoVeVenuesYArtistasActivos_FR_SEC_VEN_02_ART_03() throws Exception {
        mockMvc.perform(get("/api/venues/active")).andExpect(status().isOk());
        mockMvc.perform(get("/api/artists/active")).andExpect(status().isOk());
    }

    // ---------- 401 ----------

    @Test
    void anonimoNoCreaEventos_T_SEC_002() throws Exception {
        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(VALID_EVENT))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.details").isMap());
    }

    @Test
    void rutaEspecificaNoQuedaAbiertaPorPatronGeneral() throws Exception {
        // /api/events/* es público, pero /api/events/*/tickets/paid NO
        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid")).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenInvalidoOExpirado_da401SinInvocarNegocio_T_SEC_007_008() throws Exception {
        when(jwtService.extractUserId(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/tickets")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer token.alterado.o.vencido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userEmail\":\"andrea@example.com\",\"eventCode\":\"CMF-2026\",\"type\":\"GENERAL\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        verify(ticketService, never()).purchase(any());
    }

    @Test
    void tokenValidoDeUsuarioInactivo_da401_T_SEC_016() throws Exception {
        when(jwtService.extractUserId("valid-token")).thenReturn(Optional.of(1L));
        when(userDetailsService.loadUserById(1L)).thenReturn(
                new SecurityPrincipal(1L, "andrea", "andrea@example.com", null, false, Set.of(Role.USER)));

        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer valid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenValidoDeUsuarioActivo_pasaPorElFiltro() throws Exception {
        when(jwtService.extractUserId("valid-token")).thenReturn(Optional.of(1L));
        when(userDetailsService.loadUserById(1L)).thenReturn(
                new SecurityPrincipal(1L, "andrea", "andrea@example.com", null, true, Set.of(Role.USER)));

        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));   // stateless, sin JSESSIONID
    }

    // ---------- Login ----------

    @Test
    void loginCorrecto_devuelveBearer_T_SEC_005() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse("jwt", "Bearer", 900));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900));
    }

    @Test
    void loginIncorrecto_401GenericoSinDetallesInternos_T_SEC_006_019() throws Exception {
        when(authService.login(any())).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"))
                .andExpect(content().string(not(containsString("UnaFraseSeguraLarga2026!"))))
                .andExpect(content().string(not(containsString("Exception"))))
                .andExpect(content().string(not(containsString("$2a$"))));
    }

    // ---------- 403 por rol ----------

    @Test
    void userNoCreaEventosNiInvocaService_T_SEC_003() throws Exception {
        mockMvc.perform(post("/api/events").with(asUser())
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_EVENT))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("No tiene permisos para realizar esta operación"));

        verify(eventService, never()).create(any());
    }

    @Test
    void adminCreaEvento_T_SEC_004() throws Exception {
        mockMvc.perform(post("/api/events").with(asAdmin())
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_EVENT))
                .andExpect(status().isCreated());
    }

    @Test
    void userNoPuedeUsarTickets_T_SEC_012() throws Exception {
        mockMvc.perform(patch("/api/tickets/TKT-1/use").with(asUser())).andExpect(status().isForbidden());
        verify(ticketService, never()).markAsUsed(anyString());
    }

    @Test
    void staffMarcaTicketComoUsado_T_SEC_013() throws Exception {
        mockMvc.perform(patch("/api/tickets/TKT-1/use").with(asStaff())).andExpect(status().isOk());
    }

    @Test
    void soloAdminPublicaEventos_T_SEC_014_UC_SEC_08() throws Exception {
        mockMvc.perform(patch("/api/events/CMF-2026/publish").with(asAdmin())).andExpect(status().isOk());
        mockMvc.perform(patch("/api/events/CMF-2026/publish").with(asStaff())).andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/events/CMF-2026/publish").with(asUser())).andExpect(status().isForbidden());
    }

    @Test
    void ticketsPagadosSoloParaStaffYAdmin_FR_SEC_TKT_04() throws Exception {
        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid").with(asStaff())).andExpect(status().isOk());
        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid").with(asUser())).andExpect(status().isForbidden());
    }

    @Test
    void staffNoCompraTickets_FR_SEC_TKT_01() throws Exception {
        mockMvc.perform(post("/api/tickets").with(asStaff())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userEmail\":\"laura@example.com\",\"eventCode\":\"CMF-2026\",\"type\":\"GENERAL\"}"))
                .andExpect(status().isForbidden());
    }

    // ---------- Validación tras autorización ----------

    @Test
    void requestInvalidoPeroAutorizado_da400_T_SEC_018() throws Exception {
        mockMvc.perform(post("/api/events").with(asAdmin())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void meSinToken_da401() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
}