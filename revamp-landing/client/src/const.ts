export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Get dashboard base URL from env or fallback
export const getDashboardUrl = () => {
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  if (portalUrl) {
    return portalUrl.replace(/\/$/, "");
  }
  return "https://tsauth-dashboard.vercel.app";
};

export const getRegisterUrl = () => {
  return `${getDashboardUrl()}/auth/register`;
};

export const getLoginPortalUrl = () => {
  return `${getDashboardUrl()}/auth/login`;
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = getDashboardUrl();
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

