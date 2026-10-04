package com.pulsepass.PulsePass.service.impl;

import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.domain.UserProfile;
import com.pulsepass.PulsePass.dto.request.RegisterUserRequest;
import com.pulsepass.PulsePass.dto.response.UserResponse;
import com.pulsepass.PulsePass.exception.BusinessRuleException;
import com.pulsepass.PulsePass.exception.DuplicateResourceException;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.mapper.UserMapper;
import com.pulsepass.PulsePass.repository.UserRepository;
import com.pulsepass.PulsePass.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    // BR-USER-004: User y UserProfile se crean en la misma transacción
    @Override
    @Transactional
    public UserResponse register(RegisterUserRequest request) {
        // BR-USER-001 — username único
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already exists.");
        }

        // BR-USER-002 — email único ignorando mayúsculas/minúsculas
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("Email already exists.");
        }

        // BR-USER-005 — birthDate no puede ser futura
        if (request.birthDate() != null && request.birthDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Birth date cannot be in the future.");
        }

        User user = new User(request.username(), request.email());
        // BR-USER-003 — todo usuario nuevo inicia activo
        user.setActive(true);

        UserProfile profile = new UserProfile(request.firstName(), request.lastName());
        profile.setPhone(request.phone());
        profile.setCity(request.city());
        profile.setBirthDate(request.birthDate());
        user.setProfile(profile);

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findByEmail(String email) {
        return userRepository
                .findByEmailIgnoreCase(email)
                .map(userMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findByUsername(String username) {
        return userRepository
                .findByUsername(username)
                .map(userMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
