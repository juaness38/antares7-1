/**
 * 🧬 ASTROFLORA 7.1 - MOLSTAR PLAYER COMPONENT
 * ============================================
 * Componente de visualización molecular usando Mol* para Astroflora 7.1
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DefaultPluginSpec, PluginContext } from 'molstar/lib/mol-plugin/spec';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Color } from 'molstar/lib/mol-util/color';
import { PlayIcon, PauseIcon, SquareIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface MolstarPlayerProps {
  /** URL del archivo PDB de topología */
  topologyUrl?: string;
  /** URL del archivo DCD de trayectoria */
  trajectoryUrl?: string;
  /** Frame específico a mostrar (0-indexed) */
  currentFrame?: number;
  /** Callback cuando cambia el frame */
  onFrameChange?: (frame: number) => void;
  /** Altura del viewer */
  height?: string;
  /** Si debe mostrar controles de animación */
  showControls?: boolean;
  /** ID único del componente */
  viewerId?: string;
}

interface FrameInfo {
  current: number;
  total: number;
  time_ns: number;
}

export const MolstarPlayer: React.FC<MolstarPlayerProps> = ({
  topologyUrl,
  trajectoryUrl,
  currentFrame = 0,
  onFrameChange,
  height = '500px',
  showControls = true,
  viewerId = 'molstar-viewer'
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameInfo, setFrameInfo] = useState<FrameInfo>({
    current: 0,
    total: 0,
    time_ns: 0
  });
  const [error, setError] = useState<string | null>(null);
  
  // Refs para animación
  const animationRef = useRef<number | null>(null);
  const frameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Inicializa el plugin Mol*
   */
  const initializeMolstar = useCallback(async () => {
    if (!containerRef.current || pluginRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Configuración del plugin
      const spec = DefaultPluginSpec();
      
      // Crear plugin UI
      const plugin = await createPluginUI(containerRef.current, spec);
      pluginRef.current = plugin;

      // Configurar tema oscuro para Astroflora
      plugin.managers.interactivity.setProps({
        granularity: 'element'
      });

      console.log(`[${viewerId}] Mol* inicializado exitosamente`);
      
    } catch (err) {
      console.error(`[${viewerId}] Error inicializando Mol*:`, err);
      setError('Error inicializando visualizador molecular');
    } finally {
      setIsLoading(false);
    }
  }, [viewerId]);

  /**
   * Carga estructura molecular
   */
  const loadStructure = useCallback(async () => {
    if (!pluginRef.current || !topologyUrl) return;

    try {
      setIsLoading(true);
      setError(null);

      // Limpiar estructuras previas
      await pluginRef.current.clear();

      // Cargar topología PDB
      const data = await pluginRef.current.builders.data.download({
        url: topologyUrl,
        isBinary: false
      });

      const trajectory = await pluginRef.current.builders.structure.parseTrajectory(data, 'pdb');
      
      let totalFrames = 1;
      
      // Si hay archivo de trayectoria, cargarlo
      if (trajectoryUrl) {
        try {
          const trajData = await pluginRef.current.builders.data.download({
            url: trajectoryUrl,
            isBinary: true
          });
          
          const trajTrajectory = await pluginRef.current.builders.structure.parseTrajectory(trajData, 'dcd');
          totalFrames = trajTrajectory.frameCount;
          
          console.log(`[${viewerId}] Trayectoria cargada: ${totalFrames} frames`);
        } catch (trajErr) {
          console.warn(`[${viewerId}] No se pudo cargar trayectoria:`, trajErr);
        }
      }

      // Crear modelo inicial
      const model = await pluginRef.current.builders.structure.createModel(trajectory);
      const structure = await pluginRef.current.builders.structure.createStructure(model);

      // Representaciones visuales
      await pluginRef.current.builders.structure.representation.addRepresentation(structure, {
        type: 'cartoon',
        color: 'chain-id',
        size: 'uniform'
      });

      await pluginRef.current.builders.structure.representation.addRepresentation(structure, {
        type: 'ball-and-stick',
        color: 'element-symbol',
        size: 'physical',
        sizeParams: { scale: 0.5 }
      });

      // Actualizar información de frames
      setFrameInfo({
        current: 0,
        total: totalFrames,
        time_ns: 0
      });

      // Centrar vista
      pluginRef.current.managers.camera.focusLoci(structure.selection);

      console.log(`[${viewerId}] Estructura cargada exitosamente`);

    } catch (err) {
      console.error(`[${viewerId}] Error cargando estructura:`, err);
      setError('Error cargando estructura molecular');
    } finally {
      setIsLoading(false);
    }
  }, [topologyUrl, trajectoryUrl, viewerId]);

  /**
   * Navega a un frame específico
   */
  const goToFrame = useCallback(async (frameNumber: number) => {
    if (!pluginRef.current || frameNumber < 0 || frameNumber >= frameInfo.total) return;

    try {
      // Navegar al frame
      const trajectory = pluginRef.current.managers.structure.hierarchy.current.trajectories[0];
      if (trajectory) {
        await pluginRef.current.managers.structure.trajectory.setFrame(trajectory.ref, frameNumber);
        
        // Actualizar estado
        setFrameInfo(prev => ({
          ...prev,
          current: frameNumber,
          time_ns: frameNumber * 0.1 // Asumiendo 0.1 ns por frame
        }));

        // Notificar cambio
        onFrameChange?.(frameNumber);
      }
    } catch (err) {
      console.error(`[${viewerId}] Error navegando al frame ${frameNumber}:`, err);
    }
  }, [frameInfo.total, onFrameChange, viewerId]);

  /**
   * Controles de animación
   */
  const playAnimation = useCallback(() => {
    if (isPlaying || frameInfo.total <= 1) return;

    setIsPlaying(true);
    
    const animate = () => {
      setFrameInfo(prev => {
        const nextFrame = (prev.current + 1) % prev.total;
        goToFrame(nextFrame);
        return prev;
      });
      
      frameTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          animationRef.current = requestAnimationFrame(animate);
        }
      }, 100); // 10 FPS
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, frameInfo.total, goToFrame]);

  const pauseAnimation = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (frameTimeoutRef.current) {
      clearTimeout(frameTimeoutRef.current);
      frameTimeoutRef.current = null;
    }
  }, []);

  const stopAnimation = useCallback(() => {
    pauseAnimation();
    goToFrame(0);
  }, [pauseAnimation, goToFrame]);

  const previousFrame = useCallback(() => {
    const prevFrame = Math.max(0, frameInfo.current - 1);
    goToFrame(prevFrame);
  }, [frameInfo.current, goToFrame]);

  const nextFrame = useCallback(() => {
    const nextFrame = Math.min(frameInfo.total - 1, frameInfo.current + 1);
    goToFrame(nextFrame);
  }, [frameInfo.current, frameInfo.total, goToFrame]);

  // Efectos
  useEffect(() => {
    initializeMolstar();
    
    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (frameTimeoutRef.current) {
        clearTimeout(frameTimeoutRef.current);
      }
      if (pluginRef.current) {
        pluginRef.current.dispose();
        pluginRef.current = null;
      }
    };
  }, [initializeMolstar]);

  useEffect(() => {
    if (pluginRef.current && topologyUrl) {
      loadStructure();
    }
  }, [loadStructure, topologyUrl]);

  useEffect(() => {
    if (currentFrame !== frameInfo.current && !isPlaying) {
      goToFrame(currentFrame);
    }
  }, [currentFrame, frameInfo.current, isPlaying, goToFrame]);

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-200">
            🧬 Visualizador Molecular
          </h3>
          <div className="text-xs text-gray-400">
            {frameInfo.total > 1 && (
              <span>
                Frame {frameInfo.current + 1} / {frameInfo.total} ({frameInfo.time_ns.toFixed(1)} ns)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Viewer Container */}
      <div className="relative" style={{ height }}>
        <div 
          ref={containerRef} 
          className="w-full h-full"
          id={viewerId}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-300">Cargando estructura...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && frameInfo.total > 1 && (
        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-2">
            {/* Play/Pause */}
            <button
              onClick={isPlaying ? pauseAnimation : playAnimation}
              className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              disabled={frameInfo.total <= 1}
            >
              {isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </button>

            {/* Stop */}
            <button
              onClick={stopAnimation}
              className="p-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            >
              <SquareIcon className="h-4 w-4" />
            </button>

            {/* Previous Frame */}
            <button
              onClick={previousFrame}
              className="p-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              disabled={frameInfo.current === 0}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {/* Frame Slider */}
            <div className="flex-1 max-w-md mx-4">
              <input
                type="range"
                min={0}
                max={frameInfo.total - 1}
                value={frameInfo.current}
                onChange={(e) => goToFrame(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Next Frame */}
            <button
              onClick={nextFrame}
              className="p-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              disabled={frameInfo.current === frameInfo.total - 1}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MolstarPlayer;
