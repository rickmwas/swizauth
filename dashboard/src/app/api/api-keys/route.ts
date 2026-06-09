import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const NEST_ADMIN_BASE = "http://localhost:3001";

// GET /api/api-keys
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
    const res = await fetch(`${NEST_ADMIN_BASE}/api-keys`, {
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
    console.error("API proxy GET api-keys error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch API keys" } },
      { status: 500 }
    );
  }
}

// POST /api/api-keys
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Session expired. Please sign in again." } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const res = await fetch(`${NEST_ADMIN_BASE}/api-keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("API proxy POST api-keys error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create API key" } },
      { status: 500 }
    );
  }
}
