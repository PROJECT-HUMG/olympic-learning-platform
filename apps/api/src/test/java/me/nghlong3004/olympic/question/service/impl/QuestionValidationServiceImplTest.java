package me.nghlong3004.olympic.question.service.impl;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.document.entity.Subject;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.topic.entity.Topic;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
class QuestionValidationServiceImplTest {
  private final QuestionValidationServiceImpl service = new QuestionValidationServiceImpl();

  @Test
  void acceptsMinimumQuestionStructure() {
    assertThatCode(() -> service.requireValid(validQuestion())).doesNotThrowAnyException();
  }

  @Test
  void rejectsQuestionWithoutContentText() {
    var question = validQuestion();
    question.setContentJson(JsonNodeFactory.instance.objectNode());

    assertThatThrownBy(() -> service.requireValid(question)).isInstanceOf(ApiException.class);
  }

  @Test
  void rejectsQuestionWithoutAnswer() {
    var question = validQuestion();
    question.setAnswerJson(JsonNodeFactory.instance.objectNode());

    assertThatThrownBy(() -> service.requireValid(question)).isInstanceOf(ApiException.class);
  }

  private Question validQuestion() {
    var subject = Subject.builder().id(UUID.randomUUID()).enabled(true).build();
    var topic = Topic.builder().id(UUID.randomUUID()).subject(subject).enabled(true).build();
    return Question.builder()
        .subject(subject)
        .topic(topic)
        .type("multiple_choice")
        .contentJson(JsonNodeFactory.instance.objectNode().put("text", "Question"))
        .answerJson(JsonNodeFactory.instance.objectNode().put("value", "Answer"))
        .build();
  }
}
