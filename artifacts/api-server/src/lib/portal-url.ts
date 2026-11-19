function asOrigin(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * In development, prefer the origin that made the authenticated admin request.
 * This avoids sending links to an old, hard-coded Replit preview domain.
 */
export function getPortalBaseUrl(requestOrigin?: string): string {
  const configured = process.env.PUBLIC_APP_URL || process.env.BASE_URL || process.env.FRONTEND_URL;

  if (process.env.NODE_ENV !== "production") {
    const origin = asOrigin(requestOrigin);
    if (origin) return origin;

    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    if (devDomain) return asOrigin(`https://${devDomain}`) ?? "https://presentation.thanarah.com";
  }

  const configuredOrigin = asOrigin(configured);
  if (configuredOrigin && !new URL(configuredOrigin).hostname.endsWith(".replit.dev")) {
    return configuredOrigin;
  }

  return "https://presentation.thanarah.com";
}
