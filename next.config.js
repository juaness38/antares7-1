/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Optimización para Mol* y análisis científico
    esmExternals: false,
  },
  webpack: (config, { dev, isServer }) => {
    // Configuración para Mol* y dependencias científicas
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Configuración para react-plotly.js
    config.resolve.alias = {
      ...config.resolve.alias,
      'plotly.js/dist/plotly': 'plotly.js/dist/plotly.min.js',
    };

    // Configuración para WebGL y WebAssembly (Mol*)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    return config;
  },
  env: {
    CUSTOM_KEY: 'astroflora_7.0',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  },
  // Optimización de memoria para servidor
  poweredByHeader: false,
  compress: true,
  // Configuración para archivos científicos
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy', 
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
