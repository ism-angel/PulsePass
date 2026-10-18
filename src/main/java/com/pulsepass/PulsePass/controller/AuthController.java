package com.pulsepass.PulsePass.controller;

import com.pulsepass.PulsePass.dto.request.LoginRequest;
import com.pulsepass.PulsePass.dto.response.AuthResponse;
import com.pulsepass.PulsePass.dto.response.AuthenticatedUserResponse;
import com.pulsepass.PulsePass.security.SecurityPrincipal;
import com.pulsepass.PulsePass.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Público — PRD §10.1
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Autenticado — Spring inyecta el principal que dejó el filtro JWT
    @GetMapping("/me")
    public ResponseEntity<AuthenticatedUserResponse> me(@AuthenticationPrincipal SecurityPrincipal principal) {
        return ResponseEntity.ok(authService.me(principal));
    }
}