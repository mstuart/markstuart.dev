import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: "/rss.xml",
        destination: "/feed.xml",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
