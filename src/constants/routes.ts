/** App URLs. */
export const route = {
  home: "/dashboard",
  login: "/auth/login",
  register: "/auth/register",
  verifyEmail: "/auth/verify-email",
  forgotPassword: "/auth/forgot-password",
  changePassword: "/auth/change-password",
} as const;

/** Pages under /auth are shown without the dashboard chrome (sidebar, header, footer). */
export const isAuthRoute = (pathname: string) => pathname === "/auth" || pathname.startsWith("/auth/");
