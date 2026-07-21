# Olympic Learning Platform -- Kiến trúc Hệ thống (Architecture Contract) v1.0

> **Trạng thái:** Draft (Chờ xác nhận để đóng băng)\
> **Cập nhật lần cuối:** 21/07/2026

## 1. Triết lý dự án

### Loại dự án

-   Nền tảng học tập và quản lý Olympic theo định hướng Enterprise.
-   Hướng tới khả năng triển khai thực tế.
-   Tài liệu là nguồn tham chiếu chính cho cả lập trình viên và AI.

### Nguyên tắc phát triển

-   Specification First Development
-   API First
-   Documentation Driven
-   Convention over Configuration
-   AI-Friendly Codebase

Quy trình phát triển chuẩn:

``` text
Yêu cầu
    ↓
Kiến trúc
    ↓
API
    ↓
Cơ sở dữ liệu
    ↓
Backend
    ↓
Frontend
    ↓
Kiểm thử
```

------------------------------------------------------------------------

# 2. Kiến trúc tổng thể

-   Kiến trúc: **Modular Monolith**
-   Định hướng:
    -   Spring Modulith
    -   DDD Lite
    -   Layered Architecture

Không sử dụng Microservice ở giai đoạn hiện tại.

------------------------------------------------------------------------

# 3. Công nghệ Backend

  Thành phần   Quyết định
  ------------ -------------------------
  Java         Java 26
  Framework    Spring Boot 4.x
  Build        Maven
  Database     PostgreSQL
  Migration    Flyway
  ORM          Spring Data JPA
  Validation   Jakarta Validation
  Security     Spring Security
  JWT          OAuth2 Resource Server
  Mapper       MapStruct
  Mail         Spring Mail
  API Docs     springdoc OpenAPI
  Metrics      Micrometer + Prometheus
  Cache        Redis (khi cần)
  AI           Spring AI

------------------------------------------------------------------------

# 4. Quy ước Package Backend

Mỗi domain là một module độc lập.

``` text
problem/
├── controller/
├── service/
│   └── impl/
├── repository/
├── mapper/
├── entity/
├── request/
├── response/
├── dto/
└── exception/
```

Không tổ chức project theo controller/service/repository ở thư mục gốc.

------------------------------------------------------------------------

# 5. Service

-   Sử dụng Interface + Implementation.

``` text
ProblemService
ProblemServiceImpl
```

-   Không đặt business logic trong Controller.

------------------------------------------------------------------------

# 6. DTO

-   Tất cả DTO sử dụng `record`.
-   Ưu tiên chia theo:
    -   request
    -   response
    -   dto (nếu thật sự cần)

Ví dụ:

-   CreateProblemRequest
-   UpdateProblemRequest
-   ProblemSummaryResponse
-   ProblemDetailResponse

Không sử dụng tên chung chung như `ProblemDto`.

------------------------------------------------------------------------

# 7. Entity

-   Sử dụng Lombok.
-   Không dùng `@Data`.
-   Không inject dependency.
-   Không truy cập Repository.
-   Chỉ chứa logic liên quan đến persistence.

------------------------------------------------------------------------

# 8. Mapper

-   Sử dụng MapStruct.
-   Mapper chỉ thực hiện mapping.
-   Không validate.
-   Không truy vấn cơ sở dữ liệu.

------------------------------------------------------------------------

# 9. Quy ước REST API

Base URL:

``` text
/api/v1
```

Resource luôn ở dạng số nhiều:

``` text
/users
/problems
/subjects
```

  Method   Ý nghĩa
  -------- -------------------
  GET      Lấy dữ liệu
  POST     Tạo mới
  PUT      Thay thế toàn bộ
  PATCH    Cập nhật một phần
  DELETE   Soft Delete

Response thành công trả trực tiếp DTO.

Response lỗi sử dụng RFC7807 ProblemDetail.

Không sử dụng `ApiResponse<T>`.

------------------------------------------------------------------------

# 10. Phân trang

Hỗ trợ song song:

-   Offset Pagination (Admin, Dashboard...)
-   Cursor Pagination (News, Leaderboard...)

------------------------------------------------------------------------

# 11. Sorting

``` text
sort=name,asc
sort=createdAt,desc
```

Hỗ trợ nhiều trường.

------------------------------------------------------------------------

# 12. Filtering

Ưu tiên Query Parameters.

Ví dụ:

``` text
?difficulty=EASY
&status=PUBLISHED
&subjectId=...
```

Không dùng RSQL ở phiên bản đầu.

------------------------------------------------------------------------

# 13. Định danh

-   Primary Key: UUID v4.
-   Slug chỉ phục vụ SEO, không phải khóa chính.

------------------------------------------------------------------------

# 14. Database

-   Bảng: dạng số nhiều (`users`, `problems`...).
-   Tên cột: `snake_case`.
-   Mọi bảng đều có:
    -   created_at
    -   updated_at
    -   deleted_at
-   Migration: Flyway.

------------------------------------------------------------------------

# 15. Security

-   JWT
-   Access Token
-   Refresh Token Rotation
-   HttpOnly Cookie
-   Refresh Queue (Frontend)
-   CSRF Protection
-   Password Policy
-   Audit Log
-   Email Verification

Không lưu JWT trong LocalStorage.

------------------------------------------------------------------------

# 16. Frontend

  Thành phần        Quyết định
  ----------------- ---------------------------
  React             Phiên bản Stable mới nhất
  TypeScript        7.x
  Vite              Có
  pnpm              Có
  Tailwind CSS      v4
  Radix UI          Có
  shadcn/ui         Có
  Lucide            Có
  Sonner            Có
  Framer Motion     Có
  GSAP              Chỉ dùng khi cần
  React Hook Form   Có
  Zod               v4
  TanStack Query    Có
  Axios             Có
  Zustand           Có

------------------------------------------------------------------------

# 17. Kiến trúc Frontend

-   Client Side Rendering.
-   Feature-first.
-   Route-level Lazy Loading.
-   Alias `@`.

------------------------------------------------------------------------

# 18. State Management

-   TanStack Query quản lý Server State.
-   Zustand quản lý UI State.

Không lưu dữ liệu server vào Zustand.

------------------------------------------------------------------------

# 19. Giao tiếp API

-   Axios Instance.
-   Axios Interceptor.
-   Refresh Queue.
-   Retry đúng một lần sau khi refresh.
-   Refresh thất bại =\> Logout.

------------------------------------------------------------------------

# 20. Design System

Bắt buộc có:

-   Dark Mode
-   Primary
-   Secondary
-   Danger
-   Ghost
-   Link

Sử dụng Design Tokens, không hard-code màu trong component.

------------------------------------------------------------------------

# 21. Validation

-   Frontend: trải nghiệm người dùng.
-   Backend: bảo mật.
-   Database: toàn vẹn dữ liệu.

Frontend Validation không thay thế Backend Validation.

------------------------------------------------------------------------

# 22. Coding Convention

-   Không wildcard import.
-   Constructor Injection.
-   Không Field Injection.
-   Không business logic trong Controller.
-   Không query trong Mapper.
-   Không DTO trong Repository.
-   Không ResponseEntity trong Service.
-   Không static util tùy tiện.
-   Composition over Inheritance.
-   SOLID.
-   KISS.
-   YAGNI.
-   DRY.

------------------------------------------------------------------------

# 23. Documentation

Mỗi class đều có Javadoc:

``` java
/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 2026-07-21
 */
```

Interface Service phải mô tả:

-   Chức năng.
-   Ý nghĩa tham số.
-   Giá trị trả về.
-   Exception (nếu có).

------------------------------------------------------------------------

# 24. Engineering Convention

-   pnpm
-   Oxlint
-   Prettier
-   Conventional Commits
-   GitHub
-   GitHub Actions
-   Coverage tối thiểu 80%.

------------------------------------------------------------------------

# 25. Kiểm thử

-   Unit Test
-   Integration Test
-   Repository Test
-   Security Test

E2E chưa phải ưu tiên ở giai đoạn đầu.

------------------------------------------------------------------------

# 26. Quyết định bổ sung

## OpenAPI là Single Source of Truth

Frontend ưu tiên sinh type từ OpenAPI.

## ADR

Mọi thay đổi kiến trúc lớn đều phải ghi vào `docs/adr`.

## Performance by Default

-   Route-level Lazy Loading.
-   Phân trang và lọc ở Backend.
-   Tree-shaking icon.
-   Chỉ dùng GSAP khi CSS hoặc Framer Motion không đáp ứng.
