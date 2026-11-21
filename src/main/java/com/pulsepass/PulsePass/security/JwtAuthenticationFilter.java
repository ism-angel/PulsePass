package com.pulsepass.PulsePass.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

// Lee el Bearer, valida el JWT y construye el contexto seguro (PRD §7.1).
// NO crea cuentas ni persiste tokens.
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   CustomUserDetailsService userDetailsService,
                                   AuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // Solo el encabezado Authorization; jamás ?token= en la URL (FR-SEC-AUTH-007)
        List<String> headers = Collections.list(request.getHeaders(HttpHeaders.AUTHORIZATION));

        // 1. Sin header => sigue ANÓNIMO. La cadena decide si la ruta es pública o da 401 (§14.3 adv. 5)
        if (headers.isEmpty()) {
            chain.doFilter(request, response);
            return;
        }

        // 2. Doble header Authorization => sospechoso, se rechaza
        if (headers.size() > 1) {
            reject(request, response);
            return;
        }

        String header = headers.get(0);

        // 3. Otro esquema (p. ej. Basic): no es nuestro, se ignora y sigue anónimo
        if (!header.startsWith(BEARER_PREFIX)) {
            chain.doFilter(request, response);
            return;
        }

        // 4. No sobrescribir una autenticación ya establecida
        if (SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()
                && SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof SecurityPrincipal) {
            chain.doFilter(request, response);
            return;
        }

        // 5. Validar firma, alg, iss, exp, sub
        String token = header.substring(BEARER_PREFIX.length()).trim();
        Optional<Long> userId = jwtService.extractUserId(token);
        if (userId.isEmpty()) {
            reject(request, response);          // Bearer inválido NUNCA se autentica (SEC-008)
            return;
        }

        // 6. Recargar estado y roles ACTUALES desde la BD (SEC-011)
        SecurityPrincipal principal;
        try {
            principal = userDetailsService.loadUserById(userId.get());
        } catch (UsernameNotFoundException ex) {
            reject(request, response);          // el usuario del token ya no existe
            return;
        }
        if (!principal.isEnabled()) {
            reject(request, response);          // usuario desactivado con token aún vigente (UC-SEC-10)
            return;
        }

        // 7. Construir el contexto seguro
        UsernamePasswordAuthenticationToken authentication =
                UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        chain.doFilter(request, response);
    }

    // Respuesta 401 uniforme a través del EntryPoint (mismo JSON ErrorResponse)
    private void reject(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        SecurityContextHolder.clearContext();
        authenticationEntryPoint.commence(request, response,
                new InsufficientAuthenticationException("Invalid bearer token"));
    }
}