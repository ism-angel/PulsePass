package com.pulsepass.PulsePass.mapper;

import com.pulsepass.PulsePass.domain.Event;
import com.pulsepass.PulsePass.dto.response.EventResponse;
import com.pulsepass.PulsePass.dto.response.EventSummaryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = ArtistMapper.class)
public interface EventMapper {

    @Mapping(
            target = "venueCode",
            source = "venue.code"
    )
    @Mapping(
            target = "venueName",
            source = "venue.name"
    )
    EventResponse toResponse(Event event);

    @Mapping(
            target = "venueName",
            source = "venue.name"
    )
    EventSummaryResponse toSummary(Event event);
}
