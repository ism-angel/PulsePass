package com.pulsepass.PulsePass.repositories;

import com.pulsepass.PulsePass.TestcontainersConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
public abstract class BaseRepositoryTest {
}