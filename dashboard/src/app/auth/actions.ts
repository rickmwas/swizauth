"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const GO_AUTH_BASE = "http://localhost:8080/api/v1";

export interface ActionResponse {
  success: boolean;
  mfaRequired?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export async function loginAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Email and password are required" },
    };
  }

  try {
    const res = await fetch(`${GO_AUTH_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || { code: "UNAUTHORIZED", message: "Login failed" },
      };
    }

    if (data.mfa_required) {
      const cookieStore = await cookies();
      cookieStore.set({
        name: "tsauth_mfa_challenge",
        value: data.mfa_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 300, // 5 mins
      });

      return { success: true, mfaRequired: true };
    }

    // Otherwise login completed immediately
    const cookieStore = await cookies();
    cookieStore.set({
      name: "access_token",
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900, // 15 mins
    });

    cookieStore.set({
      name: "refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return { success: true, mfaRequired: false };
  } catch (error) {
    console.error("Login action error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to connect to authentication server" },
    };
  }
}

export async function verifyMfaAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const code = formData.get("code")?.toString();
  const cookieStore = await cookies();
  const mfaToken = cookieStore.get("tsauth_mfa_challenge")?.value;

  if (!mfaToken) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "MFA challenge expired. Please login again." },
    };
  }

  if (!code || code.length !== 6) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Please enter a valid 6-digit code" },
    };
  }

  try {
    const res = await fetch(`${GO_AUTH_BASE}/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfa_token: mfaToken, code }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || { code: "UNAUTHORIZED", message: "MFA code verification failed" },
      };
    }

    // Success! Setup final cookies and clear MFA cookie
    cookieStore.delete("tsauth_mfa_challenge");
    
    cookieStore.set({
      name: "access_token",
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });

    cookieStore.set({
      name: "refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return { success: true };
  } catch (error) {
    console.error("MFA verification action error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to connect to authentication server" },
    };
  }
}

export async function registerAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const organizationId = formData.get("organization_id")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("first_name")?.toString();
  const lastName = formData.get("last_name")?.toString();

  if (!organizationId || !email || !password || !firstName || !lastName) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "All fields are required" },
    };
  }

  try {
    const res = await fetch(`${GO_AUTH_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: organizationId,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || { code: "BAD_REQUEST", message: "Registration failed" },
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Register action error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to connect to registration server" },
    };
  }
}

export async function forgotPasswordAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const email = formData.get("email")?.toString();

  if (!email) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Email is required" },
    };
  }

  try {
    const res = await fetch(`${GO_AUTH_BASE}/auth/password/reset-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || { code: "BAD_REQUEST", message: "Failed to request password reset" },
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Forgot password action error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to connect to authentication server" },
    };
  }
}

export async function resetPasswordAction(token: string, prevState: any, formData: FormData): Promise<ActionResponse> {
  const password = formData.get("password")?.toString();

  if (!password) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Password is required" },
    };
  }

  try {
    const res = await fetch(`${GO_AUTH_BASE}/auth/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || { code: "BAD_REQUEST", message: "Failed to reset password" },
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Reset password action error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to connect to authentication server" },
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    try {
      await fetch(`${GO_AUTH_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    } catch (err) {
      console.error("Failed to revoke session on logout:", err);
    }
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("tsauth_mfa_challenge");
  
  redirect("/auth/login");
}
