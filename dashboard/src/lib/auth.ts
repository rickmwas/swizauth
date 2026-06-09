import { cookies } from "next/headers";
import { decodeJwt } from "jose";

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
}

export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  status: string;
  plan: string;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;

    const claims = decodeJwt(token);
    if (!claims || !claims.sub || !claims.org) {
      return null;
    }

    return {
      id: claims.sub,
      email: claims.email as string || "",
      organizationId: claims.org as string,
      roles: (claims.roles as string[]) || [],
      permissions: (claims.permissions as string[]) || [],
    };
  } catch (err) {
    console.error("Failed to decode user token:", err);
    return null;
  }
}

export async function getOrganizationDetails(
  orgId: string
): Promise<OrganizationDetails | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;

    const res = await fetch(`http://localhost:3001/organizations/${orgId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // Cache organization lookup for 60 seconds
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch organization details:", err);
    return null;
  }
}
