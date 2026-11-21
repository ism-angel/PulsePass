package com.pulsepass.PulsePass.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// PRD §17.1: firma, claims, expiración, issuer, manipulación, token vacío, clave débil
class JwtServiceTest {

    private static final String SECRET = "cHVsc2VwYXNzLXRlc3Qtb25seS1zZWNyZXQtbm90LWZvci1wcm9kISE=";
    private static final String OTHER_SECRET = "cHVsc2VwYXNzLU9USEVSLXNlY3JldC11c2VkLW9ubHktaW4tdGVzdHMh";
    private static final String ISSUER = "pulsepass-api-test";
    private static final Duration TTL = Duration.ofMinutes(15);

    private final JwtService jwtService = new JwtService(new JwtProperties(ISSUER, SECRET, TTL));

    private static SecretKey key(String secret) {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    @Test
    void tokenValido_devuelveElIdDelUsuario() {
        String token = jwtService.generateToken(42L);
        assertThat(jwtService.extractUserId(token)).contains(42L);
    }

    @Test
    void tokenContieneClaimsObligatorios_FR_SEC_AUTH_005() {
        Claims claims = Jwts.parser().verifyWith(key(SECRET)).build()
                .parseSignedClaims(jwtService.generateToken(42L)).getPayload();

        assertThat(claims.getSubject()).isEqualTo("42");
        assertThat(claims.getIssuer()).isEqualTo(ISSUER);
        assertThat(claims.getId()).isNotBlank();                       // jti
        assertThat(claims.getIssuedAt()).isNotNull();                  // iat
        long ttlSeconds = (claims.getExpiration().getTime() - claims.getIssuedAt().getTime()) / 1000;
        assertThat(ttlSeconds).isEqualTo(900);                         // exp = iat + 15 min
        assertThat(jwtService.getExpiresInSeconds()).isEqualTo(900);
    }

    @Test
    void tokenManipulado_seRechaza_T_SEC_008() {
        String token = jwtService.generateToken(42L);
        int i = token.indexOf('.') + 5;                                // un carácter del payload
        char replacement = token.charAt(i) == 'a' ? 'b' : 'a';
        String tampered = token.substring(0, i) + replacement + token.substring(i + 1);

        assertThat(jwtService.extractUserId(tampered)).isEmpty();
    }

    @Test
    void tokenDeOtroIssuer_seRechaza() {
        JwtService otherIssuer = new JwtService(new JwtProperties("otro-emisor", SECRET, TTL));
        assertThat(jwtService.extractUserId(otherIssuer.generateToken(42L))).isEmpty();
    }

    @Test
    void tokenFirmadoConOtraClave_seRechaza() {
        JwtService otherKey = new JwtService(new JwtProperties(ISSUER, OTHER_SECRET, TTL));
        assertThat(jwtService.extractUserId(otherKey.generateToken(42L))).isEmpty();
    }

    @Test
    void tokenExpirado_seRechaza_T_SEC_007() {
        Instant past = Instant.now().minus(Duration.ofHours(1));
        String expired = Jwts.builder()
                .subject("42").issuer(ISSUER).id(UUID.randomUUID().toString())
                .issuedAt(Date.from(past))
                .expiration(Date.from(past.plus(TTL)))                 // venció hace 45 min
                .signWith(key(SECRET), Jwts.SIG.HS256)
                .compact();

        assertThat(jwtService.extractUserId(expired)).isEmpty();
    }

    @Test
    void tokenSinFirma_algNone_seRechaza() {
        String unsigned = Jwts.builder()
                .subject("42").issuer(ISSUER)
                .expiration(Date.from(Instant.now().plus(TTL)))
                .compact();                                            // sin signWith => alg=none

        assertThat(jwtService.extractUserId(unsigned)).isEmpty();
    }

    @Test
    void tokenSinSubject_seRechaza() {
        String noSub = Jwts.builder()
                .issuer(ISSUER).expiration(Date.from(Instant.now().plus(TTL)))
                .signWith(key(SECRET), Jwts.SIG.HS256)
                .compact();

        assertThat(jwtService.extractUserId(noSub)).isEmpty();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "basura", "a.b.c", "Bearer xyz"})
    void entradasMalformadas_seRechazanSinExcepcion_NFR_SEC_002(String token) {
        assertThat(jwtService.extractUserId(token)).isEmpty();
    }

    @Test
    void claveMenorA32Bytes_impideArrancar() {
        assertThatThrownBy(() -> new JwtProperties(ISSUER, "c2hvcnQta2V5LTE2Ynl0ZQ==", TTL))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    void claveAusente_impideArrancar() {
        assertThatThrownBy(() -> new JwtProperties(ISSUER, "${PULSEPASS_JWT_SECRET_BASE64}", TTL))
                .isInstanceOf(IllegalStateException.class);
    }
}