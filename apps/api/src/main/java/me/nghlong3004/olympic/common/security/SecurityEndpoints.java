package me.nghlong3004.olympic.common.security;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/2/2026
 */
public class SecurityEndpoints {

  protected static final String API_PATH = "/api/**";
  protected static final String ADMIN_PATH = "/api/v1/admin/**";

  protected static final String[] PUBLIC_POST_ENDPOINTS = {
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
    "/api/v1/auth/verify-email",
    "/api/v1/auth/password/forgot",
    "/api/v1/auth/password/reset"
  };

  protected static final String[] PUBLIC_GET_ENDPOINTS = {
    "/api/v1/documents",
    "/api/v1/documents/**",
    "/api/v1/document-metadata",
    "/api/v1/document-metadata/**",
    "/api/v1/cms/contents",
    "/api/v1/cms/contents/**",
    "/api/v1/cms/categories",
    "/api/v1/cms/tags",
    "/api/v1/posts",
    "/api/v1/posts/**"
  };

  protected static final String[] PUBLIC_FALLBACK_ENDPOINTS = {"/actuator/health/readiness"};

  private SecurityEndpoints() {}
}
