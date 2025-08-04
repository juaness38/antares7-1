/**
 * 🧬 ASTROFLORA 7.1 - PCA PLOT COMPONENT
 * ======================================
 * Componente de visualización PCA interactivo para análisis conformacional
 */

import React, { useState, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { ChartBarIcon, ViewfinderCircleIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

// Tipos de datos esperados (comentarios JSDoc para documentación)
/**
 * @typedef {Object} PCAData
 * @property {number} frame - Número de frame
 * @property {number} pc1 - Componente principal 1
 * @property {number} pc2 - Componente principal 2  
 * @property {number} pc3 - Componente principal 3
 * @property {number} time_ns - Tiempo en nanosegundos
 * @property {number} [cluster] - ID del cluster (opcional)
 */

/**
 * @typedef {Object} ClusterInfo
 * @property {number} cluster - ID del cluster
 * @property {number} frame - Frame representativo
 * @property {number} population - Población del cluster
 * @property {number} percentage - Porcentaje del total
 */

/**
 * @typedef {Object} PCAPlotProps
 * @property {PCAData[]} [pcaData=[]] - Datos de PCA
 * @property {ClusterInfo[]} [clusterInfo=[]] - Información de clusters
 * @property {Object} [explainedVariance] - Varianza explicada por componente
 * @property {number} [currentFrame=0] - Frame actual seleccionado
 * @property {function} [onPointClick] - Callback para click en punto
 * @property {number} [height=500] - Altura del plot
 * @property {'2d'|'3d'} [viewMode='2d'] - Modo de visualización
 * @property {boolean} [showControls=true] - Si mostrar controles
 */

const CLUSTER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0932B', '#6C5CE7', '#A29BFE', '#FD79A8'
];

export const PCAPlot = ({
  pcaData = [],
  clusterInfo = [],
  explainedVariance,
  currentFrame = 0,
  onPointClick,
  height = 500,
  viewMode = '2d',
  showControls = true
}) => {
  // Estado local
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [colorBy, setColorBy] = useState('cluster');

  /**
   * Preparar datos para Plotly
   */
  const plotData = useMemo(() => {
    if (!pcaData.length) return [];

    const traces = [];

    if (colorBy === 'cluster' && pcaData.some(d => d.cluster !== undefined)) {
      // Agrupar por clusters
      const clusterGroups = pcaData.reduce((groups, point) => {
        const cluster = point.cluster ?? -1;
        if (!groups[cluster]) groups[cluster] = [];
        groups[cluster].push(point);
        return groups;
      }, {});

      Object.entries(clusterGroups).forEach(([clusterStr, points]) => {
        const cluster = parseInt(clusterStr);
        const color = cluster >= 0 ? CLUSTER_COLORS[cluster % CLUSTER_COLORS.length] : '#CCCCCC';
        
        // Filtrar por cluster seleccionado si hay uno
        if (selectedCluster !== null && cluster !== selectedCluster) return;

        const trace = {
          x: points.map(p => p.pc1),
          y: points.map(p => p.pc2),
          mode: 'markers',
          type: viewMode === '3d' ? 'scatter3d' : 'scatter',
          name: cluster >= 0 ? `Cluster ${cluster}` : 'Sin cluster',
          marker: {
            color: color,
            size: points.map(p => p.frame === currentFrame ? 12 : 6),
            opacity: 0.7,
            line: {
              color: points.map(p => p.frame === currentFrame ? '#FFFFFF' : color),
              width: points.map(p => p.frame === currentFrame ? 2 : 0)
            }
          },
          text: points.map(p => 
            `Frame: ${p.frame}<br>` +
            `Tiempo: ${p.time_ns.toFixed(1)} ns<br>` +
            `PC1: ${p.pc1.toFixed(3)}<br>` +
            `PC2: ${p.pc2.toFixed(3)}<br>` +
            `PC3: ${p.pc3.toFixed(3)}<br>` +
            (p.cluster !== undefined ? `Cluster: ${p.cluster}` : '')
          ),
          hovertemplate: '%{text}<extra></extra>',
          customdata: points.map(p => p.frame)
        };

        if (viewMode === '3d') {
          trace.z = points.map(p => p.pc3);
        }

        traces.push(trace);
      });

    } else {
      // Colorear por tiempo
      const trace = {
        x: pcaData.map(p => p.pc1),
        y: pcaData.map(p => p.pc2),
        mode: 'markers',
        type: viewMode === '3d' ? 'scatter3d' : 'scatter',
        name: 'Trayectoria',
        marker: {
          color: pcaData.map(p => p.time_ns),
          colorscale: 'Viridis',
          size: pcaData.map(p => p.frame === currentFrame ? 12 : 6),
          opacity: 0.7,
          colorbar: {
            title: 'Tiempo (ns)',
            titleside: 'right'
          },
          line: {
            color: pcaData.map(p => p.frame === currentFrame ? '#FFFFFF' : undefined),
            width: pcaData.map(p => p.frame === currentFrame ? 2 : 0)
          }
        },
        text: pcaData.map(p => 
          `Frame: ${p.frame}<br>` +
          `Tiempo: ${p.time_ns.toFixed(1)} ns<br>` +
          `PC1: ${p.pc1.toFixed(3)}<br>` +
          `PC2: ${p.pc2.toFixed(3)}<br>` +
          `PC3: ${p.pc3.toFixed(3)}`
        ),
        hovertemplate: '%{text}<extra></extra>',
        customdata: pcaData.map(p => p.frame)
      };

      if (viewMode === '3d') {
        trace.z = pcaData.map(p => p.pc3);
      }

      traces.push(trace);
    }

    // Agregar trayectoria como línea si está habilitada
    if (showTrajectory && pcaData.length > 1) {
      const trajectoryTrace = {
        x: pcaData.map(p => p.pc1),
        y: pcaData.map(p => p.pc2),
        mode: 'lines',
        type: viewMode === '3d' ? 'scatter3d' : 'scatter',
        name: 'Trayectoria',
        line: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1
        },
        showlegend: false,
        hoverinfo: 'skip'
      };

      if (viewMode === '3d') {
        trajectoryTrace.z = pcaData.map(p => p.pc3);
      }

      traces.unshift(trajectoryTrace);
    }

    return traces;
  }, [pcaData, colorBy, selectedCluster, currentFrame, viewMode, showTrajectory]);

  /**
   * Configuración del layout de Plotly
   */
  const layout = useMemo(() => {
    const baseLayout = {
      title: {
        text: '🧬 Análisis de Componentes Principales (PCA)',
        font: { color: '#FFFFFF', size: 16 }
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(31, 41, 55, 1)',
      font: { color: '#FFFFFF' },
      showlegend: true,
      legend: {
        x: 1.05,
        y: 1,
        bgcolor: 'rgba(31, 41, 55, 0.8)',
        bordercolor: '#4B5563',
        borderwidth: 1
      },
      margin: { t: 50, b: 50, l: 50, r: 50 },
      height
    };

    if (viewMode === '3d') {
      baseLayout.scene = {
        xaxis: {
          title: `PC1 (${explainedVariance?.pc1?.toFixed(1) || 'N/A'}%)`,
          gridcolor: '#4B5563',
          color: '#FFFFFF'
        },
        yaxis: {
          title: `PC2 (${explainedVariance?.pc2?.toFixed(1) || 'N/A'}%)`,
          gridcolor: '#4B5563',
          color: '#FFFFFF'
        },
        zaxis: {
          title: `PC3 (${explainedVariance?.pc3?.toFixed(1) || 'N/A'}%)`,
          gridcolor: '#4B5563',
          color: '#FFFFFF'
        },
        bgcolor: 'rgba(31, 41, 55, 1)'
      };
    } else {
      baseLayout.xaxis = {
        title: `PC1 (${explainedVariance?.pc1?.toFixed(1) || 'N/A'}%)`,
        gridcolor: '#4B5563',
        color: '#FFFFFF',
        zeroline: false
      };
      baseLayout.yaxis = {
        title: `PC2 (${explainedVariance?.pc2?.toFixed(1) || 'N/A'}%)`,
        gridcolor: '#4B5563',
        color: '#FFFFFF',
        zeroline: false
      };
    }

    return baseLayout;
  }, [viewMode, explainedVariance, height]);

  /**
   * Configuración de Plotly
   */
  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true
  };

  /**
   * Handler para click en puntos
   */
  const handlePointClick = useCallback((event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const frame = point.customdata;
      if (typeof frame === 'number' && onPointClick) {
        onPointClick(frame);
      }
    }
  }, [onPointClick]);

  /**
   * Handler para selección de cluster
   */
  const handleClusterSelect = useCallback((cluster) => {
    setSelectedCluster(cluster);
  }, []);

  if (!pcaData.length) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-8 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No hay datos de PCA disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      {/* Header con controles */}
      {showControls && (
        <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {/* Modo de vista */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Vista:</span>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500"
                >
                  <option value="2d">2D</option>
                  <option value="3d">3D</option>
                </select>
              </div>

              {/* Colorear por */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Color:</span>
                <select
                  value={colorBy}
                  onChange={(e) => setColorBy(e.target.value)}
                  className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500"
                >
                  <option value="time">Tiempo</option>
                  <option value="cluster">Cluster</option>
                </select>
              </div>

              {/* Mostrar trayectoria */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showTrajectory}
                  onChange={(e) => setShowTrajectory(e.target.checked)}
                  className="rounded bg-gray-600 border-gray-500"
                />
                <span className="text-sm text-gray-300">Trayectoria</span>
              </label>
            </div>

            {/* Información */}
            <div className="text-sm text-gray-400">
              {pcaData.length} frames • Frame actual: {currentFrame + 1}
            </div>
          </div>
        </div>
      )}

      {/* Plot */}
      <div className="p-4">
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          onClick={handlePointClick}
          className="w-full"
        />
      </div>

      {/* Cluster Info */}
      {colorBy === 'cluster' && clusterInfo.length > 0 && (
        <div className="bg-gray-700 px-4 py-3 border-t border-gray-600">
          <h4 className="text-sm font-medium text-gray-200 mb-2">Clusters</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleClusterSelect(null)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCluster === null 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Todos
            </button>
            {clusterInfo.map((cluster) => (
              <button
                key={cluster.cluster}
                onClick={() => handleClusterSelect(cluster.cluster)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCluster === cluster.cluster
                    ? 'text-white'
                    : 'text-gray-300 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: selectedCluster === cluster.cluster 
                    ? CLUSTER_COLORS[cluster.cluster % CLUSTER_COLORS.length]
                    : `${CLUSTER_COLORS[cluster.cluster % CLUSTER_COLORS.length]}80`
                }}
              >
                Cluster {cluster.cluster} ({cluster.percentage.toFixed(1)}%)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PCAPlot;
