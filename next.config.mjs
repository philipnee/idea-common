import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ["better-sqlite3"]
  },
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(process.cwd());
    return config;
  }
};

export default nextConfig;
