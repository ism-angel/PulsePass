package com.pulsepass.PulsePass.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

// Responsabilidad única: emitir y validar JWT (PRD §7.1). No consulta tickets ni ejecuta negocio.
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String EXPECTED_ALGORITHM = "HS256";

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        // La clave se construye una sola vez a partir del secreto ya validado en JwtProperties
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secretBase64()));
    }

    /** Emite un access token para el usuario con el ID persistente indicado (FR-SEC-AUTH-005). */
    public String generateToken(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())                                  // sub: ID inmutable, no el email
                .issuer(properties.issuer())                                 // iss
                .issuedAt(Date.from(now))                                    // iat
                .expiration(Date.from(now.plus(properties.accessTokenTtl())))// exp
                .id(UUID.randomUUID().toString())                            // jti
                .signWith(key, Jwts.SIG.HS256)                               // algoritmo explícito
                .compact();
    }

    /** Segundos de vida del token, para AuthResponse.expiresIn (900). */
    public long getExpiresInSeconds() {
        return properties.accessTokenTtl().toSeconds();
    }

    /**
     * Valida firma, algoritmo, issuer, exp y sub (FR-SEC-AUTH-006).
     * Devuelve el ID del usuario si TODO es válido; vacío en cualquier otro caso.
     */
    public Optional<Long> extractUserId(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            Jws<Claims> jws = Jwts.parser()
                    .verifyWith(key)                       // verifica firma ANTES de confiar en los claims
                    .requireIssuer(properties.issuer())    // iss debe coincidir
                    .build()
                    .parseSignedClaims(token);             // rechaza tokens sin firma (alg=none) y expirados

            // Defensa adicional: solo aceptamos exactamente HS256
            if (!EXPECTED_ALGORITHM.equals(jws.getHeader().getAlgorithm())) {
                return Optional.empty();
            }

            Claims claims = jws.getPayload();
            // No asumir que exp y sub existen solo porque la firma es válida (§14.4)
            if (claims.getExpiration() == null || claims.getSubject() == null || claims.getSubject().isBlank()) {
                return Optional.empty();
            }
            return Optional.of(Long.parseLong(claims.getSubject()));

        } catch (JwtException | IllegalArgumentException ex) {
            // JwtException agrupa: Expired, Malformed, Signature, Unsupported, IncorrectClaim...
            // Se registra SOLO el tipo de error, nunca el token (NFR-SEC-001)
            log.debug("Rejected JWT: {}", ex.getClass().getSimpleName());
            return Optional.empty();
        }
    }
}