/** @type {import('next').NextConfig} */

const API_URL = "";
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:domainAndPath*",
        destination: `https://:domainAndPath*`,
      },
    ];
  },

  // transpilePackages: ["actionschema"],
};

export default nextConfig;
