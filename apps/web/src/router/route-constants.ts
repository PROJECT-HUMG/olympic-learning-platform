export const ROUTES = {
  // Public pages
  HOME: "/",
  SUBJECTS: "/subjects",
  DOCUMENTS: "/documents",
  NEWS: "/news",
  COMPETITIONS: "/competitions",
  ABOUT: "/about",
  TOOLKIT: "/toolkit",
  STUDY_ROOMS: "/study-rooms",

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
  QUESTION_IMPORT: "/questions/import",
  QUESTION_BANK: "/questions",

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

export function getPostLoginRoute(role: string | undefined, from: unknown): string {
  // Reject whitespace/control characters before passing a local path to the router.
  // eslint-disable-next-line no-control-regex
  if (typeof from === "string" && /^\/(?!\/)[^\u0000-\u0020\\]*$/.test(from)) {
    const path = from.split(/[?#]/)[0].replace(/\/+$/, "").toLowerCase();
    const authPaths: string[] = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD, ROUTES.VERIFY_EMAIL];
    if (!authPaths.includes(path)) return from;
  }
  return getDashboardRoute(role);
}
