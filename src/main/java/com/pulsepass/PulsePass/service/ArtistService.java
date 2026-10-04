package com.pulsepass.PulsePass.service;

import com.pulsepass.PulsePass.dto.response.ArtistResponse;

import java.util.List;

public interface ArtistService {

    ArtistResponse findById(Long id);

    ArtistResponse findByStageName(String stageName);

    List<ArtistResponse> findActiveArtists();
}
