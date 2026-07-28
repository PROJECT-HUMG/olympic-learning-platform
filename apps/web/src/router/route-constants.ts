export const ROUTES = {
  // Public pages
  HOME: "/",
  SUBJECTS: "/subjects",
  DOCUMENTS: "/documents",
  NEWS: "/news",
  COMPETITIONS: "/competitions",
  ABOUT: "/about",
  TOOLKIT: "/toolkit",

  // Auth pages (Guest only)
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Private pages (Authenticated dashboard area)
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  PRACTICE: "/practice",
  HISTORY: "/history",

  // Admin area
  ADMIN: "/admin/dashboard",

  // Lecturer area
  LECTURER: "/lecturer/dashboard",
} as const;

export function getDashboardRoute(role?: string): string {
  if (role === "ADMIN") return ROUTES.ADMIN;
  if (role === "LECTURER") return ROUTES.LECTURER;
  return ROUTES.DASHBOARD;
}
