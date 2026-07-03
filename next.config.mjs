/** @type {import('next').NextConfig} */

function parseAllowedDevOrigins() {
  const fromEnv = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const fromSiteUrl = (() => {
    try {
      const host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").hostname;
      return host ? [host] : [];
    } catch {
      return [];
    }
  })();

  const defaults = ["localhost", "127.0.0.1", "*.local"];
  return [...new Set([...defaults, ...fromEnv, ...fromSiteUrl])];
}

const nextConfig = {
  allowedDevOrigins: parseAllowedDevOrigins(),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
