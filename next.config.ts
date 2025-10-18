import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'mysql2', '@clerk/backend'],
};

export default nextConfig;
