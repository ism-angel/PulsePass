package com.pulsepass.PulsePass.exception;

// Login fallido por cualquier motivo (usuario inexistente, contraseña errónea, inactivo,
// sin credencial). Un solo tipo => un solo mensaje => no se revela qué falló (FR-SEC-AUTH-003).
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid credentials");
    }
}