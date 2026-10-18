package com.pulsepass.PulsePass.controller;

import com.pulsepass.PulsePass.dto.request.RegisterUserRequest;
import com.pulsepass.PulsePass.dto.response.UserResponse;
import com.pulsepass.PulsePass.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.pulsepass.PulsePass.service.AuthService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;   // NUEVO

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    // FR-CTRLUSR-001 — misma URL, mismo 201 y mismo UserResponse.
    // Fase 4: delega en AuthService para crear usuario + credencial + rol de forma atómica (§9.3)
    @PostMapping
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // FR-CTRLUSR-002
    @GetMapping("/by-email")
    public ResponseEntity<UserResponse> findByEmail(@RequestParam("email") String email) {
        return ResponseEntity.ok(userService.findByEmail(email));
    }

    // FR-CTRLUSR-003
    @GetMapping("/by-username")
    public ResponseEntity<UserResponse> findByUsername(@RequestParam("username") String username) {
        return ResponseEntity.ok(userService.findByUsername(username));
    }
}
