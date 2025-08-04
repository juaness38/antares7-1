# 🧬 Astroflora 7.1 - Suite de Diseño de Fármacos

Plataforma avanzada para análisis molecular y diseño de fármacos con visualización 3D interactiva, simulaciones de dinámica molecular y análisis conformacional.

## ✨ Características

- **Visualización Molecular 3D**: Integración con Mol* para visualización interactiva de estructuras moleculares
- **Análisis PCA**: Mapas conformacionales 2D con clustering automático
- **Dashboard Integrado**: Panel de control unificado para simulaciones
- **Arquitectura Moderna**: Built with Next.js 14, React 18, y TailwindCSS
- **Optimizado para Vercel**: Configurado para despliegue automático

## 🚀 Estructura del Proyecto

```
antares7-1/
├── package.json          # Dependencias y scripts de Node.js
├── next.config.js        # Configuración de Next.js
├── tailwind.config.js    # Configuración de TailwindCSS
├── postcss.config.js     # Configuración de PostCSS
├── Dockerfile           # Contenedor Docker
├── pages/               # Páginas de Next.js
│   ├── index.js         # Página principal
│   ├── _app.js          # Configuración global de la app
│   └── simulations/     # Dashboard de simulaciones
│       └── [simId].js   # Página dinámica por simulación
├── components/          # Componentes React
│   └── visualization/   # Componentes de visualización
│       ├── MolstarPlayer.jsx  # Visualizador 3D
│       └── PCAPlot.jsx        # Gráfico PCA
├── src/                 # Código fuente adicional
│   └── components/      # Componentes React alternativos
└── styles/              # Estilos CSS
    └── globals.css      # Estilos globales con TailwindCSS
```

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Visualización**: Mol* 4.1.0, Plotly.js 2.27.1
- **Análisis**: D3.js 7.8.5, Three.js 0.158.0
- **Comunicación**: Socket.io 4.7.4, Axios 1.6.2
- **Iconos**: Heroicons 2.0.18
- **Animaciones**: Framer Motion 10.16.16

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/juaness38/antares7-1.git
cd antares7-1

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

## 🌐 Despliegue en Vercel

Este proyecto está optimizado para Vercel. El despliegue es automático:

1. **Fork** este repositorio
2. **Conecta** tu repositorio con Vercel
3. **Deploya** automáticamente desde la rama main

### Variables de Entorno

```env
NEXT_PUBLIC_API_URL=https://tu-api-backend.com/api
```

## 🔧 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo (puerto 3000)
npm run build    # Construir para producción
npm run start    # Servidor de producción
npm run lint     # Linter de código
```

## 📱 Páginas Principales

- **`/`** - Página principal con información del proyecto
- **`/simulations/[simId]`** - Dashboard de simulación específica con:
  - Visualización molecular 3D interactiva
  - Gráfico PCA conformacional
  - Controles de frame y animación
  - Métricas en tiempo real

## � Componentes Científicos

### MolstarPlayer
Componente de visualización molecular 3D que permite:
- Carga de archivos PDB/DCD
- Control de frames de trayectoria
- Representaciones múltiples
- Mediciones interactivas

### PCAPlot
Visualización de análisis de componentes principales:
- Mapas conformacionales 2D
- Clustering automático
- Selección de frames
- Exportación de datos

## 🐳 Docker

```bash
docker build -t astroflora-7.1 .
docker run -p 3000:3000 astroflora-7.1
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🎯 Roadmap

- [ ] Integración con backend de simulaciones
- [ ] Análisis de energía libre
- [ ] Exportación de resultados
- [ ] Dashboard de múltiples simulaciones
- [ ] API REST completa

---

**Desarrollado con ❤️ para la comunidad científica**
