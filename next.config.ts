import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: true, // websockets break locally unless you do this
  turbopack: {
    // Repo root so pages can import shared data modules from ../src.
    root: path.resolve(".."),
  },
  async rewrites() {
    if (!isDev) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
      {
        source: "/socket.io/",
        destination: "http://localhost:3000/socket.io/",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:3000/socket.io/:path*",
      },
      {
        source: "/login/:path*",
        destination: "http://localhost:3000/login/:path*",
      },
      {
        source: "/activity/:path*",
        destination: "http://localhost:3000/activity/:path*",
      }
    ];
  }
};

export default nextConfig;
