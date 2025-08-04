// 🧬 ASTROFLORA 7.0 - PCA PLOT COMPONENT
// =====================================
// Gráfico interactivo 2D de análisis conformacional con Plotly

import React, { useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Importación dinámica de Plotly para optimización
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Cargando gráfico PCA...</span>
  </div>
});

/**
 * Componente de visualización PCA interactivo.
 * Muestra mapa conformacional 2D con clustering y permite selección de frames.
 */
const PCAPlot = ({ 
  data = [], 
  onPointClick = null,
  selectedFrame = null,
  height = 400,
  showLegend = true,
  colorBy = 'cluster',
  title = 'Mapa Conformacional (PCA)' 
}) => {
  
  // Preparar datos para Plotly
  const plotData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Agrupar por cluster si hay información de clustering
    const hasClusterInfo = data.some(point => point.cluster !== undefined);
    
    if (hasClusterInfo && colorBy === 'cluster') {
      // Crear series separadas por cluster
      const clusters = [...new Set(data.map(p => p.cluster))].sort((a, b) => a - b);
      
      return clusters.map(clusterId => {
        const clusterData = data.filter(p => p.cluster === clusterId);
        
        return {
          x: clusterData.map(p => p.pc1),
          y: clusterData.map(p => p.pc2),
          text: clusterData.map(p => 
            `Frame: ${p.frame}<br>` +
            `Tiempo: ${p.time_ns?.toFixed(2) || 'N/A'} ns<br>` +
            `Cluster: ${p.cluster}<br>` +
            `PC1: ${p.pc1.toFixed(3)}<br>` +
            `PC2: ${p.pc2.toFixed(3)}`
          ),
          mode: 'markers',
          type: 'scattergl', // scattergl para mejor rendimiento
          name: `Cluster ${clusterId}`,
          marker: {
            size: clusterData.map(p => 
              p.frame === selectedFrame ? 12 : 6
            ),
            color: clusterId,
            colorscale: 'Viridis',
            opacity: clusterData.map(p => 
              p.frame === selectedFrame ? 1.0 : 0.7
            ),
            line: {
              width: clusterData.map(p => 
                p.frame === selectedFrame ? 2 : 0
              ),
              color: 'white'
            }
          },
          customdata: clusterData.map(p => ({
            frame: p.frame,
            cluster: p.cluster,
            pc1: p.pc1,
            pc2: p.pc2,
            time_ns: p.time_ns
          })),
          hovertemplate: '%{text}<extra></extra>',
          showlegend: showLegend
        };
      });
    } else {
      // Sin clustering o colorear por tiempo
      const colorValues = colorBy === 'time' && data[0].time_ns !== undefined
        ? data.map(p => p.time_ns)
        : data.map((_, i) => i);

      return [{
        x: data.map(p => p.pc1),
        y: data.map(p => p.pc2),
        text: data.map(p => 
          `Frame: ${p.frame}<br>` +
          `Tiempo: ${p.time_ns?.toFixed(2) || 'N/A'} ns<br>` +
          `PC1: ${p.pc1.toFixed(3)}<br>` +
          `PC2: ${p.pc2.toFixed(3)}`
        ),
        mode: 'markers',
        type: 'scattergl',
        name: 'Conformaciones',
        marker: {
          size: data.map(p => 
            p.frame === selectedFrame ? 12 : 6
          ),
          color: colorValues,
          colorscale: colorBy === 'time' ? 'Plasma' : 'Viridis',
          showscale: colorBy === 'time',
          opacity: data.map(p => 
            p.frame === selectedFrame ? 1.0 : 0.7
          ),
          line: {
            width: data.map(p => 
              p.frame === selectedFrame ? 2 : 0
            ),
            color: 'white'
          },
          colorbar: colorBy === 'time' ? {
            title: 'Tiempo (ns)',
            titleside: 'right'
          } : undefined
        },
        customdata: data.map(p => ({
          frame: p.frame,
          cluster: p.cluster,
          pc1: p.pc1,
          pc2: p.pc2,
          time_ns: p.time_ns
        })),
        hovertemplate: '%{text}<extra></extra>',
        showlegend: showLegend && colorBy !== 'time'
      }];
    }
  }, [data, selectedFrame, colorBy, showLegend]);

  // Configuración del layout
  const plotLayout = useMemo(() => ({
    title: {
      text: title,
      font: { size: 16, color: '#1f2937' }
    },
    xaxis: { 
      title: 'Componente Principal 1 (PC1)',
      gridcolor: '#f3f4f6',
      zerolinecolor: '#d1d5db'
    },
    yaxis: { 
      title: 'Componente Principal 2 (PC2)',
      gridcolor: '#f3f4f6',
      zerolinecolor: '#d1d5db'
    },
    hovermode: 'closest',
    showlegend: showLegend,
    legend: {
      orientation: 'v',
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: '#d1d5db',
      borderwidth: 1
    },
    margin: { l: 60, r: showLegend ? 120 : 20, t: 60, b: 60 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    autosize: true
  }), [title, showLegend]);

  // Configuración adicional
  const plotConfig = useMemo(() => ({
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'pan2d', 'lasso2d', 'select2d', 'autoScale2d', 'hoverClosestCartesian', 
      'hoverCompareCartesian', 'toggleSpikelines'
    ],
    toImageButtonOptions: {
      format: 'png',
      filename: 'astroflora_pca_plot',
      height: height,
      width: 800,
      scale: 2
    },
    responsive: true
  }), [height]);

  // Manejar clicks en puntos
  const handlePlotClick = useCallback((event) => {
    if (!onPointClick || !event.points || event.points.length === 0) return;
    
    const point = event.points[0];
    const customData = point.customdata;
    
    if (customData && customData.frame !== undefined) {
      onPointClick(customData.frame, {
        pc1: customData.pc1,
        pc2: customData.pc2,
        cluster: customData.cluster,
        time_ns: customData.time_ns
      });
    }
  }, [onPointClick]);

  // Estadísticas del dataset
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const pc1Values = data.map(p => p.pc1);
    const pc2Values = data.map(p => p.pc2);
    const clusters = data.filter(p => p.cluster !== undefined).map(p => p.cluster);
    
    return {
      totalFrames: data.length,
      pc1Range: [Math.min(...pc1Values), Math.max(...pc1Values)],
      pc2Range: [Math.min(...pc2Values), Math.max(...pc2Values)],
      uniqueClusters: clusters.length > 0 ? [...new Set(clusters)].length : 0,
      timeRange: data[0].time_ns !== undefined ? [
        Math.min(...data.map(p => p.time_ns)),
        Math.max(...data.map(p => p.time_ns))
      ] : null
    };
  }, [data]);

  // Mostrar mensaje si no hay datos
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-2a7 7 0 0114 0v2M9 19v8a5 5 0 0010 0v-8M9 19h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos PCA</h3>
          <p className="mt-1 text-sm text-gray-500">Los resultados del análisis PCA aparecerán aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pca-plot-container">
      {/* Información estadística */}
      {stats && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 p-2 rounded">
            <span className="font-semibold text-blue-800">Frames:</span>
            <span className="ml-1 text-blue-600">{stats.totalFrames}</span>
          </div>
          {stats.uniqueClusters > 0 && (
            <div className="bg-green-50 p-2 rounded">
              <span className="font-semibold text-green-800">Clusters:</span>
              <span className="ml-1 text-green-600">{stats.uniqueClusters}</span>
            </div>
          )}
          {stats.timeRange && (
            <div className="bg-purple-50 p-2 rounded">
              <span className="font-semibold text-purple-800">Tiempo:</span>
              <span className="ml-1 text-purple-600">
                {stats.timeRange[1].toFixed(1)} ns
              </span>
            </div>
          )}
          {selectedFrame !== null && (
            <div className="bg-orange-50 p-2 rounded">
              <span className="font-semibold text-orange-800">Frame:</span>
              <span className="ml-1 text-orange-600">{selectedFrame}</span>
            </div>
          )}
        </div>
      )}

      {/* Gráfico principal */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Plot
          data={plotData}
          layout={plotLayout}
          config={plotConfig}
          style={{ width: '100%', height: `${height}px` }}
          onClick={handlePlotClick}
          useResizeHandler={true}
        />
      </div>

      {/* Controles adicionales */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Colorear por:</span>
          <select 
            value={colorBy}
            onChange={(e) => {
              // Esta funcionalidad se implementaría con un callback del padre
              console.log('Cambiar colorBy a:', e.target.value);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="cluster">Cluster</option>
            <option value="time">Tiempo</option>
            <option value="frame">Frame</option>
          </select>
        </div>
        
        <div className="text-xs text-gray-500">
          Click en cualquier punto para ver la conformación 3D
        </div>
      </div>
    </div>
  );
};

export default PCAPlot;
