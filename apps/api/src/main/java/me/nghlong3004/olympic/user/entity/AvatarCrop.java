package me.nghlong3004.olympic.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AvatarCrop {
  @Column(name = "avatar_crop_x", nullable = true)
  private Double x;

  @Column(name = "avatar_crop_y", nullable = true)
  private Double y;

  @Column(name = "avatar_crop_zoom", nullable = true)
  private Double zoom;
}
