import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages. The site is served from
 * https://<owner>.github.io/batch/ so all asset URLs carry the
 * /batch base path.
 */
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/batch",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
