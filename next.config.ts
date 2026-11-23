import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // fuentes del informe PDF, que se leen del disco en el servidor
  outputFileTracingIncludes: { '/kiosko/[id]': ['./src/server/datos/fuentes/**'] },
  serverExternalPackages: ['@react-pdf/renderer'],
  partialPrefetching: true,
  // la foto del análisis de piel viaja en una server action
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
