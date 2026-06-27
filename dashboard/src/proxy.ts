import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { GO_AUTH_URL } from "./lib/config";

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    const isAuthRoute = pathname.startsWith("/auth");
    const isDashboardRoute = pathname.startsWith("/dashboard");

    // Helper to check if token is valid and not expired
    const isTokenValid = (token: string | undefined): boolean => {
      if (!token) return false;
      try {
        const claims = decodeJwt(token);
        if (claims && claims.exp) {
          // Return true if token is valid for at least 10 more seconds
          return claims.exp * 1000 > Date.now() + 10000;
        }
        return false;
      } catch {
        return false;
      }
    };

    const hasActiveSession = isTokenValid(accessToken);

    // If dashboard route and session is invalid, try to rotate token
    if (isDashboardRoute && !hasActiveSession) {
      if (refreshToken) {
        try {
          // Hit Go auth-service to rotate refresh token
          const refreshResponse = await fetch(
            `${GO_AUTH_URL}/api/v1/auth/refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            }
          );

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            if (data && data.access_token && data.refresh_token) {
              // Success! Proceed and set new cookies on the response
              const response = NextResponse.next();
              
              response.cookies.set({
                name: "access_token",
                value: data.access_token,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 900, // 15 mins
              });

              response.cookies.set({
                name: "refresh_token",
                value: data.refresh_token,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 30 * 24 * 60 * 60, // 30 days
              });

              return response;
            }
          }
        } catch (err) {
          console.error("Token rotation failed in middleware:", err);
        }
      }

      // If rotation fails or no refresh token is present, redirect to login
      const loginUrl = new URL("/auth/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      // Clear cookies
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    // If auth route (login/register) and user is already logged in, redirect to dashboard
    if (isAuthRoute && hasActiveSession) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // Allow the request to continue by default
    return NextResponse.next();
  } catch (err) {
    console.error("Critical error in Next.js middleware proxy:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
