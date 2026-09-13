/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { dev }) => {
    // Windows antivirus/file watchers can remove Next's incremental cache chunks mid-build.
    if (dev) config.cache = false;
    return config;
  }
};

export default nextConfig;
