package me.nghlong3004.olympic.post.mapper;

import me.nghlong3004.olympic.post.entity.Post;
import me.nghlong3004.olympic.post.response.PostDetailResponse;
import me.nghlong3004.olympic.post.response.PostSummaryResponse;
import org.mapstruct.Mapper;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {UserMapper.class})
public interface PostMapper {

  PostSummaryResponse toSummaryResponse(Post post);

  PostDetailResponse toDetailResponse(Post post);
}
