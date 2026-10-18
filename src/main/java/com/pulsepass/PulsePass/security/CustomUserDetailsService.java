package com.pulsepass.PulsePass.security;

import com.pulsepass.PulsePass.domain.Role;
import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.domain.UserCredential;
import com.pulsepass.PulsePass.domain.UserRole;
import com.pulsepass.PulsePass.repository.UserCredentialRepository;
import com.pulsepass.PulsePass.repository.UserRepository;
import com.pulsepass.PulsePass.repository.UserRoleRepository;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

// Carga identidad, hash, roles y estado (PRD §7.1). NO valida reglas comerciales.
@Service
public class CustomUserDetailsService implements UserDetailsService {

    // Mensaje único: nunca revelar si el usuario existe o no (FR-SEC-AUTH-003)
    private static final String GENERIC_MESSAGE = "Bad credentials";

    private final UserRepository userRepository;
    private final UserCredentialRepository credentialRepository;
    private final UserRoleRepository roleRepository;

    public CustomUserDetailsService(UserRepository userRepository,
                                    UserCredentialRepository credentialRepository,
                                    UserRoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.roleRepository = roleRepository;
    }

    /**
     * Usado en el LOGIN. "identifier" puede ser username o email (FR-SEC-AUTH-002).
     */
    @Override
    @Transactional(readOnly = true)
    public SecurityPrincipal loadUserByUsername(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new UsernameNotFoundException(GENERIC_MESSAGE);
        }
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() -> new UsernameNotFoundException(GENERIC_MESSAGE));

        // Usuario legado sin credencial => no puede iniciar sesión (§9.2)
        String passwordHash = credentialRepository.findById(user.getId())
                .map(UserCredential::getPasswordHash)
                .orElseThrow(() -> new UsernameNotFoundException(GENERIC_MESSAGE));

        return toPrincipal(user, passwordHash);
    }

    /**
     * Usado por el FILTRO JWT en cada request: el token solo trae el ID (sub).
     * Recarga estado y roles ACTUALES (SEC-011, FR-SEC-AUTH-009).
     */
    @Transactional(readOnly = true)
    public SecurityPrincipal loadUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException(GENERIC_MESSAGE));
        // El filtro no necesita el hash: la contraseña ya se verificó en el login
        return toPrincipal(user, null);
    }

    private SecurityPrincipal toPrincipal(User user, String passwordHash) {
        // Una sola consulta para todos los roles (NFR-SEC-003)
        Set<Role> roles = roleRepository.findByUserId(user.getId()).stream()
                .map(UserRole::getRole)
                .collect(Collectors.toSet());

        return new SecurityPrincipal(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                passwordHash,
                user.isActive(),
                roles
        );
    }
}