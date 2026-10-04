package com.pulsepass.PulsePass.exception;

/**
 * Se lanza cuando el recurso existe pero la operación no es válida. Ejemplo: User does not meet minimum age.
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
