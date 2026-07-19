package me.nghlong3004.olympic.common.error;

import jakarta.validation.ConstraintViolation;

public record FieldViolation(String field, String message) {

  protected static final String PROPERTY = "fieldErrors";

  public static FieldViolation toFieldVioLation(ConstraintViolation<?> violation) {
    return new FieldViolation(violation.getPropertyPath().toString(), violation.getMessage());
  }
}
