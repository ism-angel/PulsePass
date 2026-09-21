package com.pulsepass.PulsePass.repository;

import com.pulsepass.PulsePass.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Sección 14: buscar usuario por email ignorando mayúsculas
    Optional<User> findByEmailIgnoreCase(String email);

    // FR-USR-001: recuperar un usuario por su username (único)
    Optional<User> findByUsername(String username);
}