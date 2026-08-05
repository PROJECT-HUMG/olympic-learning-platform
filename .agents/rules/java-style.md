---
trigger: always_on
---

# Java Style Guide

## Purpose

This document defines the Java coding style for the project.

These rules are mandatory.

When generated code conflicts with this guide,
this guide wins.

---

# Java Version

Current Version

Java 25

Always write code targeting Java 25.

Never generate code targeting Java 8/11/17
unless explicitly requested.

Prefer modern Java language features.

---

# General Principles

Code should be

- Readable
- Predictable
- Explicit
- Maintainable

Never sacrifice readability for shorter code.

Prefer boring code over clever code.

---

# Class Design

Each class should have

One responsibility.

Avoid God Classes.

Prefer composition.

Avoid inheritance unless it models a real IS-A relationship.

Maximum

~300 lines

If larger

Split.

---

# Naming

Classes

PascalCase

Services

UserService

Controllers

UserController

Repositories

UserRepository

Requests

CreateUserRequest

Responses

UserResponse

Enums

UserStatus

Never abbreviate names.

Bad

UsrSvc

Good

UserService

---

# Imports

Always

Explicit imports

Example

import java.util.UUID;

Never

import java.util.*;

Never use fully qualified class names
inside implementation.

---

# Dependency Injection

Always

Constructor Injection

@RequiredArgsConstructor

Never

@Autowired

Field Injection

Setter Injection

---

# Null Handling

Never return null.

Prefer

Optional

Throw Business Exception

Empty Collection

depending on context.

---

# Collections

Prefer

List

Map

Set

Use immutable collections
when modification is unnecessary.

Never expose mutable collections directly.

---

# UUID

All primary entities use UUID.

Never use Long IDs
unless legacy compatibility requires it.

---

# Time

Always use

OffsetDateTime

Never

Date

Calendar

LocalDateTime
for persisted timestamps.

---

# Records

Use Java Records for

- Request DTO
- Response DTO
- Immutable Value Objects

Do not use Records for

JPA Entities.

---

# Enums

Use enums for

Stable business values.

Examples

Role

Status

PostType

Never create lookup tables
for fixed values.

---

# Exceptions

Never

throw RuntimeException()

Always

Throw business exceptions.

Use ErrorCode.

Every exception must describe
the business problem.

---

# Logging

Always use

@Slf4j

Log

Business events

Unexpected failures

Never log

Passwords

Tokens

Secrets

PII

---

# Streams

Prefer Streams
for transformations.

Prefer loops
when logic becomes difficult to read.

Readability is more important.

---

# Switch

Prefer

Modern switch expressions.

Avoid long if-else chains.

---

# Optionals

Never use Optional as entity fields.

Never use Optional parameters.

Use Optional only as return values.

---

# Lombok

Use

@Getter

@Builder

@RequiredArgsConstructor

Never use

@Data

unless explicitly justified.

---

# Comments

Code should explain itself.

Comment only

Business rules

Complex algorithms

Unexpected decisions

Never comment obvious code.

---

# Magic Values

Never

if(role == 3)

Always

Role.ADMIN

---

# Code Smells

Avoid

Long methods

Large classes

Deep nesting

Duplicated code

Boolean flags

Feature envy

Primitive obsession

---

# Before Finishing

Verify

✓ Constructor Injection

✓ No RuntimeException

✓ No null return

✓ Modern Java syntax

✓ Explicit imports

✓ UUID

✓ OffsetDateTime

✓ Records for DTO

✓ Enum for business values

✓ Readable code