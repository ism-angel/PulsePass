package com.pulsepass.PulsePass.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

// 401: ruta protegida sin identidad válida (sin Bearer, token expirado, firma alterada...)
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final SecurityErrorWriter errorWriter;

    public RestAuthenticationEntryPoint(SecurityErrorWriter errorWriter) {
        this.errorWriter = errorWriter;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // RFC 6750: indica al cliente que debe usar un Bearer token
        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        // Mensaje uniforme: no se dice si el token expiró o fue manipulado (SEC-009)
        errorWriter.write(response, HttpStatus.UNAUTHORIZED, "Authentication required");
    }
}