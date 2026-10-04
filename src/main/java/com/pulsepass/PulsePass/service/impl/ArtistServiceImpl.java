package com.pulsepass.PulsePass.service.impl;

import com.pulsepass.PulsePass.dto.response.ArtistResponse;
import com.pulsepass.PulsePass.exception.ResourceNotFoundException;
import com.pulsepass.PulsePass.mapper.ArtistMapper;
import com.pulsepass.PulsePass.repository.ArtistRepository;
import com.pulsepass.PulsePass.service.ArtistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ArtistServiceImpl implements ArtistService {

    private final ArtistRepository artistRepository;
    private final ArtistMapper artistMapper;

    public ArtistServiceImpl(ArtistRepository artistRepository, ArtistMapper artistMapper) {
        this.artistRepository = artistRepository;
        this.artistMapper = artistMapper;
    }

    // BR-ARTIST-001
    @Override
    @Transactional(readOnly = true)
    public ArtistResponse findById(Long id) {
        return artistRepository
                .findById(id)
                .map(artistMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + id));
    }

    // BR-ARTIST-001
    @Override
    @Transactional(readOnly = true)
    public ArtistResponse findByStageName(String stageName) {
        return artistRepository
                .findByStageNameIgnoreCase(stageName)
                .map(artistMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + stageName));
    }

    // BR-ARTIST-002
    @Override
    @Transactional(readOnly = true)
    public List<ArtistResponse> findActiveArtists() {
        return artistRepository
                .findByActiveTrueOrderByStageNameAsc()
                .stream()
                .map(artistMapper::toResponse)
                .toList();
    }
}
