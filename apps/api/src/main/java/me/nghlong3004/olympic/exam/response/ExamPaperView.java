package me.nghlong3004.olympic.exam.response;

/**
 * Paper projection. Student and staff-plain records have no answer fields.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public sealed interface ExamPaperView
    permits StaffExamPaperResponse, StaffExamSolutionResponse, StudentExamPaperResponse {}
