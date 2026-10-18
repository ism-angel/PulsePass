package com.pulsepass.PulsePass.repositories;

import com.pulsepass.PulsePass.TestcontainersConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")     // NUEVO: carga application-test.yaml (clave JWT de pruebas)
public abstract class BaseRepositoryTest {
}