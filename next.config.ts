import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
