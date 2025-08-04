// 🧬 ASTROFLORA 7.0 - MOLSTAR PLAYER COMPONENT
// =============================================
// Visualización 3D interactiva con Mol* y control de frames

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Asset } from 'molstar/lib/mol-util/assets';

/**
 * Componente de visualización molecular con Mol*.
 * Permite cargar topología + trayectoria y controlar frames específicos.
 */
const MolstarPlayer = ({ 
  topologyUrl, 
  trajectoryUrl, 
  frameToShow = 0, 
  onFrameChange = null,
  height = 600,
  showControls = true 
}) => {
  const containerRef = useRef(null);
  const pluginRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Inicializar Mol* Plugin
  const initializeMolstar = useCallback(async () => {
    if (!containerRef.current || pluginRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Crear especificación personalizada de Mol*
      const spec = DefaultPluginSpec();
      
      // Configuración optimizada para trayectorias MD
      const plugin = new PluginContext(spec);
      await plugin.init();

      // Asociar al DOM
      plugin.initViewer(containerRef.current, {
        layoutIsExpanded: false,
        layoutShowControls: showControls,
        layoutShowRemoteState: false,
        layoutShowSequence: true,
        layoutShowLog: false,
        layoutShowLeftPanel: true,
        viewportShowExpand: true,
        viewportShowSelectionMode: true,
        viewportShowAnimation: true,
      });

      pluginRef.current = plugin;

      // Cargar estructura si está disponible
      if (topologyUrl) {
        await loadMolecularData();
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error inicializando Mol*:', err);
      setError(`Error de inicialización: ${err.message}`);
      setIsLoading(false);
    }
  }, [topologyUrl, trajectoryUrl, showControls]);

  // Cargar datos moleculares
  const loadMolecularData = useCallback(async () => {
    if (!pluginRef.current || !topologyUrl) return;

    try {
      const plugin = pluginRef.current;

      // Limpiar estructuras anteriores
      await plugin.clear();

      // Cargar topología (PDB)
      const topologyData = await plugin.builders.data.download(
        { url: topologyUrl },
        { state: { isGhost: false } }
      );

      const trajectory = await plugin.builders.structure.parseTrajectory(
        topologyData, 
        'pdb'
      );

      // Si hay trayectoria DCD, cargarla
      if (trajectoryUrl) {
        const trajectoryData = await plugin.builders.data.download(
          { url: trajectoryUrl },
          { state: { isGhost: false } }
        );

        // Combinar topología + trayectoria
        const model = await plugin.builders.structure.createModel(trajectory);
        const structure = await plugin.builders.structure.createStructure(model);

        // Configurar representación visual
        const component = await plugin.builders.structure.representation.addRepresentation(
          structure,
          { 
            type: 'cartoon',
            color: 'chain-id',
            size: 'uniform'
          }
        );

        // Obtener información de frames
        const frameInfo = plugin.managers.structure.hierarchy.current.structures[0]?.models[0]?.trajectory;
        if (frameInfo) {
          setTotalFrames(frameInfo.frameCount || 1);
        }

      } else {
        // Solo topología estática
        const model = await plugin.builders.structure.createModel(trajectory);
        const structure = await plugin.builders.structure.createStructure(model);
        
        await plugin.builders.structure.representation.addRepresentation(
          structure,
          { 
            type: 'cartoon',
            color: 'chain-id',
            size: 'uniform'
          }
        );

        setTotalFrames(1);
      }

      // Ajustar cámara
      plugin.managers.camera.focusLoci();

    } catch (err) {
      console.error('Error cargando datos moleculares:', err);
      setError(`Error cargando estructura: ${err.message}`);
    }
  }, [topologyUrl, trajectoryUrl]);

  // Cambiar a frame específico
  const goToFrame = useCallback(async (frameNumber) => {
    if (!pluginRef.current || totalFrames <= 1) return;
    
    try {
      const plugin = pluginRef.current;
      const trajectory = plugin.managers.structure.hierarchy.current.structures[0]?.models[0]?.trajectory;
      
      if (trajectory && frameNumber >= 0 && frameNumber < totalFrames) {
        await plugin.managers.structure.trajectory.setCurrentFrame(frameNumber);
        setCurrentFrame(frameNumber);
        
        if (onFrameChange) {
          onFrameChange(frameNumber);
        }
      }
    } catch (err) {
      console.error('Error cambiando frame:', err);
    }
  }, [totalFrames, onFrameChange]);

  // Control de reproducción
  const togglePlayback = useCallback(() => {
    if (!pluginRef.current || totalFrames <= 1) return;

    const plugin = pluginRef.current;
    const animator = plugin.managers.structure.trajectory;

    if (isPlaying) {
      animator.pause();
      setIsPlaying(false);
    } else {
      animator.play();
      setIsPlaying(true);
    }
  }, [isPlaying, totalFrames]);

  // Efecto para cambiar frame externamente
  useEffect(() => {
    if (frameToShow !== currentFrame) {
      goToFrame(frameToShow);
    }
  }, [frameToShow, currentFrame, goToFrame]);

  // Efecto de inicialización
  useEffect(() => {
    initializeMolstar();

    return () => {
      // Cleanup
      if (pluginRef.current) {
        pluginRef.current.dispose();
        pluginRef.current = null;
      }
    };
  }, [initializeMolstar]);

  // Efecto para recargar cuando cambian las URLs
  useEffect(() => {
    if (pluginRef.current && topologyUrl) {
      loadMolecularData();
    }
  }, [topologyUrl, trajectoryUrl, loadMolecularData]);

  return (
    <div className="molstar-container relative">
      {/* Contenedor principal de Mol* */}
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: `${height}px`,
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        className="bg-gray-900"
      />

      {/* Overlay de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Cargando visualización molecular...</p>
          </div>
        </div>
      )}

      {/* Overlay de error */}
      {error && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center text-white p-4">
            <p className="font-semibold">Error de Visualización</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      )}

      {/* Controles de trayectoria */}
      {showControls && totalFrames > 1 && !isLoading && !error && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 rounded-lg p-3">
          <div className="flex items-center space-x-4">
            {/* Botón Play/Pause */}
            <button
              onClick={togglePlayback}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Slider de frame */}
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={totalFrames - 1}
                value={currentFrame}
                onChange={(e) => goToFrame(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Indicador de frame */}
            <div className="text-white text-sm font-mono min-w-max">
              {currentFrame + 1} / {totalFrames}
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS adicionales */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default MolstarPlayer;
