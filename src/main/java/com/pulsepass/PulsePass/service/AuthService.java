package com.pulsepass.PulsePass.service;

import com.pulsepass.PulsePass.domain.Role;
import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.domain.UserCredential;
import com.pulsepass.PulsePass.domain.UserRole;
import com.pulsepass.PulsePass.dto.request.LoginRequest;
import com.pulsepass.PulsePass.dto.request.RegisterUserRequest;
import com.pulsepass.PulsePass.dto.response.AuthResponse;
import com.pulsepass.PulsePass.dto.response.AuthenticatedUserResponse;
import com.pulsepass.PulsePass.dto.response.UserResponse;
import com.pulsepass.PulsePass.exception.InvalidCredentialsException;
import com.pulsepass.PulsePass.repository.UserCredentialRepository;
import com.pulsepass.PulsePass.repository.UserRepository;
import com.pulsepass.PulsePass.repository.UserRoleRepository;
import com.pulsepass.PulsePass.security.JwtService;
import com.pulsepass.PulsePass.security.SecurityPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

// Orquesta autenticación y alta de credenciales (PRD §7.1).
// NO reemplaza a UserService: le delega las reglas de negocio del usuario.
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserService userService;
    private final UserRepository userRepository;
    private final UserCredentialRepository credentialRepository;
    private final UserRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserService userService,
                       UserRepository userRepository,
                       UserCredentialRepository credentialRepository,
                       UserRoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /**
     * FR-SEC-AUTH-001: User + credencial BCrypt + ROLE_USER en UNA transacción.
     * Si cualquier paso falla, se revierte todo: nunca queda un usuario sin credencial.
     */
    @Transactional
    public UserResponse register(RegisterUserRequest request) {
        // 1. Reglas de negocio existentes (unicidad, fecha de nacimiento, perfil)
        UserResponse created = userService.register(request);

        // 2. Credencial: solo se guarda el hash, jamás la contraseña (SEC-003)
        User user = userRepository.getReferenceById(created.id());
        credentialRepository.save(new UserCredential(user, passwordEncoder.encode(request.password())));

        // 3. Rol inicial: SIEMPRE USER. El cliente no puede pedir STAFF/ADMIN (NFR-SEC-009)
        roleRepository.save(new UserRole(created.id(), Role.USER));

        return created; // mismo contrato UserResponse de la Fase 3, sin hash
    }

    /**
     * FR-SEC-AUTH-002/003: autentica y emite el JWT.
     */
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(request.identifier(), request.password()));

            SecurityPrincipal principal = (SecurityPrincipal) authentication.getPrincipal();
            log.info("Login succeeded for userId={}", principal.getId());       // NFR-SEC-006, sin credenciales

            return new AuthResponse(
                    jwtService.generateToken(principal.getId()),
                    "Bearer",
                    jwtService.getExpiresInSeconds());

        } catch (AuthenticationException ex) {
            // BadCredentials, Disabled, UsernameNotFound... => misma respuesta genérica
            log.info("Login failed: {}", ex.getClass().getSimpleName());
            throw new InvalidCredentialsException();
        }
    }

    /**
     * FR-SEC-AUTH-010: datos mínimos del principal autenticado.
     */
    public AuthenticatedUserResponse me(SecurityPrincipal principal) {
        return new AuthenticatedUserResponse(
                principal.getId(),
                principal.getUsername(),
                principal.getEmail(),
                principal.getRoles().stream().map(Role::name).collect(Collectors.toSet()));
    }
}