package com.pulsepass.PulsePass.mapper;

import com.pulsepass.PulsePass.domain.Venue;
import com.pulsepass.PulsePass.dto.response.VenueResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VenueMapper {

    VenueResponse toResponse(Venue venue);
}
