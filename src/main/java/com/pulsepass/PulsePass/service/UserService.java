package com.pulsepass.PulsePass.service;

import com.pulsepass.PulsePass.dto.request.RegisterUserRequest;
import com.pulsepass.PulsePass.dto.response.UserResponse;

public interface UserService {

    UserResponse register(RegisterUserRequest request);

    UserResponse findByEmail(String email);

    UserResponse findByUsername(String username);
}
