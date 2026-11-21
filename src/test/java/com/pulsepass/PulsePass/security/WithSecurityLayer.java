package com.pulsepass.PulsePass.security;

import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Carga la capa de seguridad REAL en un @WebMvcTest (PRD §17.2):
 * SecurityConfig + handlers 401/403. JwtService y CustomUserDetailsService se mockean
 * porque dependen de la BD; los filtros NO se desactivan.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import({SecurityConfig.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class,
        SecurityErrorWriter.class})
@ActiveProfiles("test")
@MockitoBean(types = {JwtService.class, CustomUserDetailsService.class})
public @interface WithSecurityLayer {
}