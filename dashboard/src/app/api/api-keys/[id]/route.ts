import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const NEST_ADMIN_BASE = "http://localhost:3001";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Session expired. Please sign in again." } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const res = await fetch(`${NEST_ADMIN_BASE}/api-keys/${id}`, {
      method: "DELETE",
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
    console.error("API proxy DELETE api-key error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to revoke API key" } },
      { status: 500 }
    );
  }
}
