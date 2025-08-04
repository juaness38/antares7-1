/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Optimización para Mol* y análisis científico
    esmExternals: false,
  },
  webpack: (config, { dev, isServer }) => {
    // Configuración para react-plotly.js
    config.resolve.alias = {
      ...config.resolve.alias,
      'plotly.js/dist/plotly': 'plotly.js/dist/plotly.min.js',
    };

    // Configuración para WebGL (Mol*) - simplificada para Vercel
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }

    return config;
  },
  env: {
    CUSTOM_KEY: 'astroflora_7.1',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  },
  // Optimización de memoria para servidor
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;
