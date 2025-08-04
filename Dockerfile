# 🧬 ASTROFLORA 7.0 - FRONTEND UNIFICADO DOCKERFILE
# =================================================
# Análisis Molecular Interactivo con Mol* + Plotly

# Etapa 1: Build
FROM node:18-alpine AS builder

LABEL maintainer="Astroflora Team"
LABEL description="Frontend interactivo para análisis molecular"
LABEL version="7.0.0"

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY next.config.js ./

# Instalar dependencias
RUN npm ci --only=production --no-audit --no-fund

# Copiar código fuente
COPY . .

# Build de Next.js
RUN npm run build

# Etapa 2: Runtime
FROM node:18-alpine AS runner

# Variables de entorno
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no privilegiado
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios desde builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Cambiar propietario
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Comando de inicio
CMD ["node", "server.js"]
