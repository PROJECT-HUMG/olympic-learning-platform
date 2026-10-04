package me.nghlong3004.olympic.group.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Original private group raster, kept separate from list metadata.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Entity
@Table(name = "group_avatars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupAvatar {
  @Id
  @Column(name = "group_id", nullable = false)
  private UUID groupId;

  @Column(name = "avatar_id", nullable = false)
  private UUID avatarId;

  @Column(name = "media_type", nullable = false, length = 20)
  private String mediaType;

  @Column(name = "content", nullable = false, columnDefinition = "bytea")
  private byte[] content;
}
