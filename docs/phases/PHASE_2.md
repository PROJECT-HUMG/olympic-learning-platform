# Phase 2 — Domain Analysis

Mục tiêu: trả lời câu hỏi “Nghiệp vụ có những khái niệm nào?”

## Artifact

```text
2.1 Glossary
2.2 Domain Model
2.3 Business Rules
2.4 Domain Events
2.5 State Diagrams
2.6 Core Workflows

```

### Example

```text
Subject là gì?
Topic là gì?
Question là gì?
Exam là gì?
Exam Attempt là gì?
Attempt Answer là gì?
Result là gì?

```

Ví dụ business rule

```text

BR-001: Một câu hỏi trắc nghiệm phải có ít nhất 2 options.
BR-002: Một câu hỏi trắc nghiệm single-choice chỉ có đúng 1 correct option.
BR-003: Một exam attempt chỉ được submit một lần.
BR-004: Student chỉ được xem result của chính mình.

```

## Exit criteria

```text

- Có glossary thống nhất.
- Có domain model.
- Có business rules.
- Có workflow chính.
- Có state transition cho các object quan trọng như ExamAttempt.

```