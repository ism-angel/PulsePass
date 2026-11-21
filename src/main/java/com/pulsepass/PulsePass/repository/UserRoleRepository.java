package com.pulsepass.PulsePass.repository;

import com.pulsepass.PulsePass.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRole.UserRoleId> {

    // Una sola consulta para todos los roles del usuario (NFR-SEC-003: evitar N+1)
    List<UserRole> findByUserId(Long userId);
}