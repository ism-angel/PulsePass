package com.pulsepass.PulsePass.service;

import com.pulsepass.PulsePass.dto.response.VenueResponse;

import java.util.List;

public interface VenueService {

    VenueResponse findByCode(String code);

    List<VenueResponse> findActiveVenues();
}
