import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa");

const nextConfig: NextConfig = {
  // next-pwa injects a webpack plugin; tell Next.js 16+ this is intentional
  // by providing an empty turbopack config so the warning is suppressed.
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/shifts",
        destination: "/income",
        permanent: false,
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default pwaConfig(nextConfig);
