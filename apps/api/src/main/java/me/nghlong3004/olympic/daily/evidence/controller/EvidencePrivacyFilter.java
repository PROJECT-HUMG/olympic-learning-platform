package me.nghlong3004.olympic.daily.evidence.controller;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Marks private evidence responses, including validation/access errors, as non-cacheable. Does not
 * change the existing security chain or authenticate requests.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class EvidencePrivacyFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    var path = request.getRequestURI().substring(request.getContextPath().length());
    if (path.startsWith("/api/v1/daily/plans/")
        && (path.endsWith("/evidence") || path.contains("/evidence/"))) {
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("X-Content-Type-Options", "nosniff");
    }
    chain.doFilter(request, response);
  }
}
