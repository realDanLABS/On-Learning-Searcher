import path from 'node:path'

const defaultDistDir =
  process.env.VERCEL === '1'
    ? '.next'
    : process.env.NODE_ENV === 'production'
      ? '.next-build'
      : '.next-dev'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve('.'),
  distDir: process.env.NEXT_DIST_DIR || defaultDistDir,
  devIndicators: false,
}

export default nextConfig
