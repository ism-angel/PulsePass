package com.pulsepass.PulsePass.repositories;

import com.pulsepass.PulsePass.domain.Venue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.*;

class VenuePersistenceTest extends BaseRepositoryTest {

    @Autowired
    private VenueRepositories venueRepository;

    @Test
    void debePersistirYRecuperarVenuePorCodigo_FR_VEN_001() {
        Venue venue = new Venue();
        venue.setCode("VEN-SMR-01");
        venue.setName("Marina Convention Center");
        venue.setCity("Santa Marta");
        venue.setAddress("Calle 10 # 1-23");
        venue.setCapacity(5000);
        venue.setActive(true);

        venueRepository.saveAndFlush(venue);
        Venue recuperado = venueRepository.findByCode("VEN-SMR-01").orElse(null);

        assertNotNull(recuperado);
        assertEquals(5000, recuperado.getCapacity());
        assertEquals("Calle 10 # 1-23", recuperado.getAddress());
    }

    @Test
    void debeRechazarCodigoDuplicado_FR_VEN_002() {
        Venue v1 = new Venue();
        v1.setCode("VEN-SMR-02");
        v1.setName("Teatro");
        v1.setCity("Bogotá");
        v1.setAddress("Carrera 7 # 45-67");
        v1.setCapacity(1000);
        v1.setActive(true);
        venueRepository.saveAndFlush(v1);

        Venue v2 = new Venue();
        v2.setCode("VEN-SMR-02");
        v2.setName("Otro Teatro");
        v2.setCity("Cali");
        v2.setAddress("Avenida 3 # 20-30");
        v2.setCapacity(500);
        v2.setActive(true);

        assertThrows(DataIntegrityViolationException.class, () -> {
            venueRepository.saveAndFlush(v2);
        });
    }
}