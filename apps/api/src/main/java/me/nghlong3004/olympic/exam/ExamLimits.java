package me.nghlong3004.olympic.exam;

/**
 * Bounds shared with V16 checks. Placement points never write back into bank questions.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public final class ExamLimits {
  public static final int MAX_PLACEMENTS = 100;
  public static final int MAX_TITLE = 300;
  public static final int MAX_INSTRUCTIONS = 4_000;
  public static final int MAX_FIGURE_BYTES = 5 * 1024 * 1024;
  public static final String MAX_ITEM_POINTS = "1000.00";

  private ExamLimits() {}
}
