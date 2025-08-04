// 🧬 ASTROFLORA 7.1 - PÁGINA PRINCIPAL
// ===================================
// Dashboard principal de Astroflora 7.1

import Head from 'next/head';
import Link from 'next/link';
import { BeakerIcon, CpuChipIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <>
      <Head>
        <title>Astroflora 7.1 - Suite de Diseño de Fármacos</title>
        <meta name="description" content="Plataforma avanzada para análisis molecular y diseño de fármacos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🧬 Astroflora <span className="text-blue-600">7.1</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Suite avanzada de diseño de fármacos con análisis molecular interactivo, 
              simulaciones de dinámica molecular y visualización 3D.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <BeakerIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Simulaciones Moleculares
              </h3>
              <p className="text-gray-600 mb-4">
                Análisis conformacional avanzado con visualización 3D interactiva usando Mol*.
              </p>
              <Link 
                href="/simulations/demo" 
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                Ver Demo →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Análisis PCA
              </h3>
              <p className="text-gray-600 mb-4">
                Mapas conformacionales 2D con clustering y análisis de componentes principales.
              </p>
              <Link 
                href="/simulations/demo" 
                className="text-green-600 hover:text-green-800 font-medium inline-flex items-center"
              >
                Explorar →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <CpuChipIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Dashboard Integrado
              </h3>
              <p className="text-gray-600 mb-4">
                Control unificado de simulaciones con análisis en tiempo real.
              </p>
              <Link 
                href="/simulations/demo" 
                className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center"
              >
                Acceder →
              </Link>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ¿Listo para empezar?
              </h2>
              <p className="text-gray-600 mb-6">
                Explora el poder del análisis molecular con nuestras herramientas avanzadas.
              </p>
              <Link 
                href="/simulations/demo"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Comenzar Análisis
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
