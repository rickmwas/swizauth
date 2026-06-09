import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const NEST_ADMIN_BASE = "http://localhost:3001";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Session expired. Please sign in again." } },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${NEST_ADMIN_BASE}/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("API proxy GET roles error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch roles" } },
      { status: 500 }
    );
  }
}
