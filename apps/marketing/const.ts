export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = process.env.NEXT_PUBLIC_OAUTH_PORTAL_URL || process.env.VITE_OAUTH_PORTAL_URL;
  const appId = process.env.NEXT_PUBLIC_APP_ID || process.env.VITE_APP_ID;
  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/oauth/callback` : "";
  const state = typeof window !== "undefined" ? btoa(redirectUri) : "";

  const url = new URL(`${oauthPortalUrl || ""}/app-auth`);
  url.searchParams.set("appId", appId || "");
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
