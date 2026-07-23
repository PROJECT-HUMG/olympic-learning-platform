export const ROUTES = {
  // Public pages
  HOME: "/",
  SUBJECTS: "/subjects",
  DOCUMENTS: "/documents",
  NEWS: "/news",
  COMPETITIONS: "/competitions",
  ABOUT: "/about",

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
  ADMIN: "/admin",
} as const;
