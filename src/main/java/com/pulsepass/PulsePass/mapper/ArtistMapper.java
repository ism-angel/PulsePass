package com.pulsepass.PulsePass.mapper;

import com.pulsepass.PulsePass.domain.Artist;
import com.pulsepass.PulsePass.dto.response.ArtistResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ArtistMapper {

    ArtistResponse toResponse(Artist artist);
}
