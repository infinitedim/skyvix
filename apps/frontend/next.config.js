import process from "node:process";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@skyvix/ui', '@skyvix/shared'],
  compress: true,
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
    XENDIT_PUBLIC_KEY: process.env.XENDIT_PUBLIC_KEY,
  },
}

export default nextConfig