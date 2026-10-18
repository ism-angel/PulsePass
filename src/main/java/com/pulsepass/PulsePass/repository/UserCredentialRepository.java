package com.pulsepass.PulsePass.repository;

import com.pulsepass.PulsePass.domain.UserCredential;
import org.springframework.data.jpa.repository.JpaRepository;

// La PK de UserCredential es el id del usuario: findById(userId) devuelve su credencial.
public interface UserCredentialRepository extends JpaRepository<UserCredential, Long> {
}