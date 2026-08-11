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
  async redirects() {
    return [
      {
        source: "/baking-materials",
        destination: "/shop/categories",
        permanent: true,
      },
      {
        source: "/baking-materials/:slug",
        destination: "/shop/category/:slug",
        permanent: true,
      },
      {
        source: "/notifications",
        destination: "/member/notifications",
        permanent: true,
      },
      {
        source: "/ai-tools",
        destination: "/ai",
        permanent: true,
      },
      {
        source: "/ai-tools/:path*",
        destination: "/ai",
        permanent: true,
      },
      {
        source: "/products",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/products/:slug",
        destination: "/shop/products/:slug",
        permanent: true,
      },
      {
        source: "/member/favorites",
        destination: "/favorites",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Capacitor native projects open too many files for the Next.js file watcher
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/android/**",
          "**/ios/**",
          "**/www/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
