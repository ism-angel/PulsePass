package com.pulsepass.PulsePass.exception;

/**
 * Se lanza cuando existe un conflicto de unicidad. Ejemplo: Username already exists.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
