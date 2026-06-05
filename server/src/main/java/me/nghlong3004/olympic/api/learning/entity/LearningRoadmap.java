package me.nghlong3004.olympic.api.learning.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.nghlong3004.olympic.api.common.entity.BaseEntity;

/**
 * JPA entity representing a learning roadmap for a subject.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Entity
@Table(name = "learning_roadmaps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningRoadmap extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "difficulty", nullable = false, length = 30)
    @Builder.Default
    private String difficulty = "INTERMEDIATE";

    @Column(name = "estimated_weeks")
    private Integer estimatedWeeks;

    @Column(name = "published", nullable = false)
    @Builder.Default
    private boolean published = false;
}
