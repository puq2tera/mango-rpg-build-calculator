import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // required if using next/image
  },
  trailingSlash: true, // optional: helps GitHub Pages routing
}

export default nextConfig;
