package com.pulsepass.PulsePass.exception;

/**
 * Se lanza cuando el recurso solicitado no existe. Ejemplo: Event not found: CMF-2026
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
