package com.pulsepass.PulsePass.service.impl;

import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.dto.request.RegisterUserRequest;
import com.pulsepass.PulsePass.dto.response.UserResponse;
import com.pulsepass.PulsePass.exception.BusinessRuleException;
import com.pulsepass.PulsePass.exception.DuplicateResourceException;
import com.pulsepass.PulsePass.mapper.UserMapper;
import com.pulsepass.PulsePass.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    private static final String USERNAME = "andrea";
    private static final String EMAIL = "andrea@email.com";
    private static final LocalDate ADULT_BIRTH_DATE = LocalDate.now().minusYears(25);

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void debeRegistrarUsuarioValidoConPerfil_TEST_USER_001() {
        // ARRANGE
        UserResponse expected = response();
        when(userRepository.existsByUsername(USERNAME)).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase(EMAIL)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(User.class))).thenReturn(expected);

        // ACT
        UserResponse result = userService.register(request(ADULT_BIRTH_DATE));

        // ASSERT
        assertThat(result).isEqualTo(expected);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo(USERNAME);
        assertThat(saved.getEmail()).isEqualTo(EMAIL);
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getProfile()).isNotNull();
        assertThat(saved.getProfile().getFirstName()).isEqualTo("Andrea");
        assertThat(saved.getProfile().getBirthDate()).isEqualTo(ADULT_BIRTH_DATE);
        assertThat(saved.getProfile().getUser()).isSameAs(saved);
    }

    @Test
    void debeLanzarDuplicateCuandoUsernameYaExiste_TEST_USER_002() {
        // ARRANGE
        when(userRepository.existsByUsername(USERNAME)).thenReturn(true);

        // ACT + ASSERT
        assertThatThrownBy(() -> userService.register(request(ADULT_BIRTH_DATE)))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Username already exists.");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void debeLanzarDuplicateCuandoEmailYaExiste_TEST_USER_003() {
        // ARRANGE
        when(userRepository.existsByEmailIgnoreCase(EMAIL)).thenReturn(true);

        // ACT + ASSERT
        assertThatThrownBy(() -> userService.register(request(ADULT_BIRTH_DATE)))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Email already exists.");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void debeLanzarBusinessRuleCuandoFechaDeNacimientoEsFutura_TEST_USER_004() {
        // ARRANGE
        LocalDate futureBirthDate = LocalDate.now().plusDays(1);

        // ACT + ASSERT
        assertThatThrownBy(() -> userService.register(request(futureBirthDate)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Birth date cannot be in the future.");

        verify(userRepository, never()).save(any(User.class));
    }

    // ---------- datos de prueba (Andrea, sección 47) ----------

    private RegisterUserRequest request(LocalDate birthDate) {
        return new RegisterUserRequest(USERNAME, EMAIL, "Andrea", "Gómez",
                "3001234567", "Santa Marta", birthDate);
    }

    private UserResponse response() {
        return new UserResponse(1L, USERNAME, EMAIL, true, "Andrea", "Gómez",
                "3001234567", "Santa Marta", ADULT_BIRTH_DATE);
    }
}