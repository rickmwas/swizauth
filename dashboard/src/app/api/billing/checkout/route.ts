import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const NEST_ADMIN_BASE = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || "http://localhost:3001";

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
    const res = await fetch(`${NEST_ADMIN_BASE}/billing/checkout`, {
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
    console.error("API proxy POST checkout error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to initialize payment checkout" } },
      { status: 500 }
    );
  }
}
