package com.pulsepass.PulsePass.service.impl;

import com.pulsepass.PulsePass.dto.response.VenueResponse;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.mapper.VenueMapper;
import com.pulsepass.PulsePass.repository.VenueRepository;
import com.pulsepass.PulsePass.service.VenueService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final VenueMapper venueMapper;

    public VenueServiceImpl(VenueRepository venueRepository, VenueMapper venueMapper) {
        this.venueRepository = venueRepository;
        this.venueMapper = venueMapper;
    }

    // BR-VENUE-001
    @Override
    @Transactional(readOnly = true)
    public VenueResponse findByCode(String code) {
        return venueRepository
                .findByCode(code)
                .map(venueMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + code));
    }

    // BR-VENUE-002
    @Override
    @Transactional(readOnly = true)
    public List<VenueResponse> findActiveVenues() {
        return venueRepository
                .findByActiveTrueOrderByNameAsc()
                .stream()
                .map(venueMapper::toResponse)
                .toList();
    }
}
