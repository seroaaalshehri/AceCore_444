
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
      "localhost",
    ],
  },
   async rewrites() {
    return [
      // serve SPA entry no matter which top path the iframe asks
      { source: "/agora-app-builder",         destination: `http://localhost:9000/index.html` },
      { source: "/agora-app-builder/",        destination: `http://localhost:9000/index.html` },
      { source: "/agora-app-builder/index.html", destination: `http://localhost:9000/index.html` },

      // proxy all sub-assets (js/css/img/wasm, etc.)
      { source: "/agora-app-builder/:path*",  destination: `http://localhost:9000/:path*` },
    ];
  },
};

export default nextConfig;
