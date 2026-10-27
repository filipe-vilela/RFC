import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Contratos assinados em PDF podem passar de 1MB (padrão do Next).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
