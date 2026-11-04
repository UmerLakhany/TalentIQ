/** App URLs. */
export const route = {
  home: "/dashboard",
  login: "/auth/login",
  forgotPassword: "/auth/forgot-password",
} as const;

/** Pages under /auth are shown without the dashboard chrome (sidebar, header, footer). */
export const isAuthRoute = (pathname: string) => pathname === "/auth" || pathname.startsWith("/auth/");
