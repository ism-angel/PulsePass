package com.pulsepass.PulsePass.service;

import com.pulsepass.PulsePass.domain.Role;
import com.pulsepass.PulsePass.domain.Ticket;
import com.pulsepass.PulsePass.domain.TicketStatus;
import com.pulsepass.PulsePass.domain.TicketType;
import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.security.SecurityPrincipal;
import com.pulsepass.PulsePass.security.SecurityTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// PRD §17.1: dueño vs tercero; STAFF en uso; ADMIN; rechazo de correos ajenos
class AuthorizationServiceTest {

    private final AuthorizationService authz = new AuthorizationService();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();   // no contaminar otros tests
    }

    private void loginAs(long id, Role... roles) {
        SecurityPrincipal p = SecurityTestSupport.principal(id, "u" + id, roles);
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(p, null, p.getAuthorities()));
    }

    private static User user(long id) {
        User user = new User("u" + id, "u" + id + "@example.com");
        ReflectionTestUtils.setField(user, "id", id);   // el id lo genera la BD; aquí se fija a mano
        return user;
    }

    private static Ticket ticketOwnedBy(long ownerId) {
        return new Ticket("TKT-1", TicketType.GENERAL, BigDecimal.TEN, TicketStatus.PAID,
                LocalDateTime.now(), user(ownerId), null);
    }

    // ---------- Tickets ----------

    @Test
    void duenoPuedeLeerSuTicket() {
        loginAs(1L, Role.USER);
        assertThatCode(() -> authz.assertCanReadTicket(ticketOwnedBy(1L))).doesNotThrowAnyException();
    }

    @Test
    void userNoPuedeLeerTicketAjeno_T_SEC_009() {
        loginAs(1L, Role.USER);
        assertThatThrownBy(() -> authz.assertCanReadTicket(ticketOwnedBy(2L)))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void staffPuedeLeerTicketAjenoPeroNoCancelarlo() {
        loginAs(5L, Role.STAFF);
        assertThatCode(() -> authz.assertCanReadTicket(ticketOwnedBy(2L))).doesNotThrowAnyException();
        assertThatThrownBy(() -> authz.assertCanCancelTicket(ticketOwnedBy(2L)))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void adminPuedeCancelarTicketAjeno() {
        loginAs(9L, Role.ADMIN);
        assertThatCode(() -> authz.assertCanCancelTicket(ticketOwnedBy(2L))).doesNotThrowAnyException();
    }

    // ---------- Compra ----------

    @Test
    void compraConEmailAjeno_seRechaza_T_SEC_010() {
        loginAs(1L, Role.USER);
        assertThatThrownBy(() -> authz.assertSelf(Optional.of(user(2L))))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void compraConEmailInexistente_seRechaza() {
        loginAs(1L, Role.USER);
        assertThatThrownBy(() -> authz.assertSelf(Optional.empty()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void compraPropia_sePermite() {
        loginAs(1L, Role.USER);
        assertThatCode(() -> authz.assertSelf(Optional.of(user(1L)))).doesNotThrowAnyException();
    }

    // ---------- Datos personales ----------

    @Test
    void userNoPuedeConsultarOtroUsuario_T_SEC_015() {
        loginAs(1L, Role.USER);
        assertThatThrownBy(() -> authz.assertSelfOrAdmin(Optional.of(user(2L))))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void adminPuedeConsultarOtroUsuario() {
        loginAs(9L, Role.ADMIN);
        assertThatCode(() -> authz.assertSelfOrAdmin(Optional.of(user(2L)))).doesNotThrowAnyException();
    }

    // ---------- Eventos ----------

    @Test
    void soloStaffYAdminVenBorradores() {
        assertThat(authz.canViewUnpublishedEvents()).isFalse();       // anónimo
        loginAs(1L, Role.USER);
        assertThat(authz.canViewUnpublishedEvents()).isFalse();
        loginAs(5L, Role.STAFF);
        assertThat(authz.canViewUnpublishedEvents()).isTrue();
    }

    @Test
    void sinIdentidad_operacionesProtegidasSeDeniegan() {
        assertThatThrownBy(() -> authz.currentPrincipal()).isInstanceOf(AccessDeniedException.class);
    }
}