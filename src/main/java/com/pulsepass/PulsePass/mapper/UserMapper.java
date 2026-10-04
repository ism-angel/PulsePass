package com.pulsepass.PulsePass.mapper;

import com.pulsepass.PulsePass.domain.User;
import com.pulsepass.PulsePass.dto.response.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "firstName", source = "profile.firstName")
    @Mapping(target = "lastName", source = "profile.lastName")
    @Mapping(target = "phone", source = "profile.phone")
    @Mapping(target = "city", source = "profile.city")
    @Mapping(target = "birthDate", source = "profile.birthDate")
    UserResponse toResponse(User user);
}
