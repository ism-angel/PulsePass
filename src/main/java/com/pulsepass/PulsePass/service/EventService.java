package com.pulsepass.PulsePass.service;

import com.pulsepass.PulsePass.dto.request.CreateEventRequest;
import com.pulsepass.PulsePass.dto.response.EventResponse;
import com.pulsepass.PulsePass.dto.response.EventSummaryResponse;

import java.util.List;

public interface EventService {

    EventResponse create(CreateEventRequest request);

    EventResponse findByCode(String eventCode);

    List<EventSummaryResponse> findPublishedEvents();

    EventResponse publish(String eventCode);

    EventResponse addArtist(
            String eventCode,
            Long artistId
    );

    List<EventSummaryResponse> findByArtist(
            String stageName
    );
}
