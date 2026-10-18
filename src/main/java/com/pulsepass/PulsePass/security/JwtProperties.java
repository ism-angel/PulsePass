package com.pulsepass.PulsePass.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.Base64;

// Enlaza el bloque pulsepass.security.jwt del application.yaml (PRD Seguridad §14.2).
// Si la configuración es insegura, la app NO arranca (fail-fast, SEC-004 / §12.2).
@ConfigurationProperties(prefix = "pulsepass.security.jwt")
public record JwtProperties(
        String issuer,
        String secretBase64,
        Duration accessTokenTtl
) {

    private static final int MIN_SECRET_BYTES = 32; // 256 bits para HS256

    // Constructor compacto: se ejecuta al crear el record, antes de que nadie lo use
    public JwtProperties {
        if (issuer == null || issuer.isBlank()) {
            throw new IllegalStateException("pulsepass.security.jwt.issuer must be configured");
        }
        if (accessTokenTtl == null || accessTokenTtl.isNegative() || accessTokenTtl.isZero()) {
            throw new IllegalStateException("pulsepass.security.jwt.access-token-ttl must be positive");
        }
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(secretBase64);
        } catch (IllegalArgumentException | NullPointerException ex) {
            // El mensaje NO incluye el valor recibido: nunca imprimir secretos
            throw new IllegalStateException(
                    "PULSEPASS_JWT_SECRET_BASE64 is missing or is not valid Base64");
        }
        if (decoded.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "PULSEPASS_JWT_SECRET_BASE64 must decode to at least " + MIN_SECRET_BYTES + " bytes");
        }
    }

    // Evita que el secreto aparezca si alguien hace log.info(properties)
    @Override
    public String toString() {
        return "JwtProperties[issuer=" + issuer + ", accessTokenTtl=" + accessTokenTtl + ", secretBase64=***]";
    }
}