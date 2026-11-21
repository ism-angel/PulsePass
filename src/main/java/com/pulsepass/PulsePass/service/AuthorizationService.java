package com.pulsepass.PulsePass.service;

import com.pulsepass.PulsePass.domain.Role;
import com.pulsepass.PulsePass.domain.Ticket;
import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.security.SecurityPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Compara el principal autenticado con el propietario del recurso (PRD §7.1, §11.1).
 * NUNCA confía en IDs o emails enviados por el cliente como prueba de identidad (SEC-006).
 *
 * Política única para recurso ajeno: 403 (decisión §20.1 documentada).
 * Limitación MVP: STAFF opera tickets de cualquier evento; restringir en producción (§11.1).
 */
@Service
public class AuthorizationService {

    private static final String DENIED = "Access denied";

    /** Principal del request actual, o vacío si es anónimo. */
    public Optional<SecurityPrincipal> findCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SecurityPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty(); // anónimo: Spring pone "anonymousUser" (un String)
    }

    /** Principal obligatorio para operaciones que exigen identidad. */
    public SecurityPrincipal currentPrincipal() {
        return findCurrentPrincipal().orElseThrow(() -> new AccessDeniedException(DENIED));
    }

    // ---------- Eventos ----------

    /** EVT-02 / EVT-06: solo STAFF/ADMIN ven eventos no publicados. */
    public boolean canViewUnpublishedEvents() {
        return findCurrentPrincipal()
                .map(p -> p.hasRole(Role.STAFF) || p.hasRole(Role.ADMIN))
                .orElse(false);
    }

    // ---------- Usuarios ----------

    /**
     * USR-02/03, TKT-03: el usuario solicitado debe ser el propio, salvo ADMIN.
     * Si no existe y quien pregunta no es ADMIN => 403 (no 404): así no se revela
     * qué emails/usernames existen.
     */
    public void assertSelfOrAdmin(Optional<User> requestedUser) {
        SecurityPrincipal principal = currentPrincipal();
        if (principal.hasRole(Role.ADMIN)) {
            return;
        }
        boolean isSelf = requestedUser
                .map(user -> user.getId().equals(principal.getId()))
                .orElse(false);
        if (!isSelf) {
            throw new AccessDeniedException(DENIED);
        }
    }

    /** TKT-01: solo se compra para uno mismo (el email del DTO debe ser el del principal). */
    public void assertSelf(Optional<User> requestedUser) {
        SecurityPrincipal principal = currentPrincipal();
        boolean isSelf = requestedUser
                .map(user -> user.getId().equals(principal.getId()))
                .orElse(false);
        if (!isSelf) {
            throw new AccessDeniedException(DENIED);
        }
    }

    // ---------- Tickets ----------

    /** TKT-02: propietario, o STAFF/ADMIN. */
    public void assertCanReadTicket(Ticket ticket) {
        SecurityPrincipal principal = currentPrincipal();
        if (isOwner(ticket, principal) || principal.hasRole(Role.STAFF) || principal.hasRole(Role.ADMIN)) {
            return;
        }
        throw new AccessDeniedException(DENIED);
    }

    /** TKT-05: propietario, o ADMIN (STAFF no cancela). */
    public void assertCanCancelTicket(Ticket ticket) {
        SecurityPrincipal principal = currentPrincipal();
        if (isOwner(ticket, principal) || principal.hasRole(Role.ADMIN)) {
            return;
        }
        throw new AccessDeniedException(DENIED);
    }

    // El dueño se obtiene de la BD (ticket.user.id), no del request (§11.1)
    private boolean isOwner(Ticket ticket, SecurityPrincipal principal) {
        return ticket.getUser().getId().equals(principal.getId());
    }
}