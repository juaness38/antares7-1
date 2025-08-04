/**
 * 🧬 ASTROFLORA 7.1 - SIMULATION DASHBOARD
 * ========================================
 * Panel de control unificado para pipelines de diseño de fármacos
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  BeakerIcon,
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import MolstarPlayer from './MolstarPlayer';
import PCAPlot from './PCAPlot';

/**
 * @typedef {Object} PipelineJob
 * @property {string} id - ID único del trabajo
 * @property {string} status - Estado del trabajo
 * @property {string} name - Nombre del pipeline
 * @property {number} progress - Progreso (0-100)
 * @property {Date} startTime - Tiempo de inicio
 * @property {string[]} steps - Pasos del pipeline
 * @property {number} currentStep - Paso actual
 * @property {Object} [results] - Resultados del pipeline
 */

/**
 * @typedef {Object} SimulationResults
 * @property {Object[]} molecules - Moléculas generadas
 * @property {Object[]} pcaData - Datos de PCA
 * @property {string} trajectoryPath - Ruta a la trayectoria
 * @property {Object} metrics - Métricas de evaluación
 */

const PIPELINE_STEPS = {
  scaffold_hopping: [
    'Análisis de estructura base',
    'Generación de scaffolds',
    'Filtrado por propiedades',
    'Evaluación de similitud'
  ],
  molecular_scoring: [
    'Carga de moléculas',
    'Cálculo de descriptores',
    'Evaluación con IA',
    'Ranking de candidatos'
  ],
  docking: [
    'Preparación de proteína',
    'Preparación de ligandos',
    'Docking molecular',
    'Análisis de resultados'
  ],
  md_simulation: [
    'Preparación del sistema',
    'Minimización de energía',
    'Equilibración',
    'Simulación de producción',
    'Análisis de trayectoria'
  ],
  full_pipeline: [
    'Scaffold hopping',
    'Evaluación molecular', 
    'Docking molecular',
    'Simulación MD',
    'Análisis PCA',
    'Generación de reporte'
  ]
};

const STATUS_COLORS = {
  pending: 'text-gray-400',
  running: 'text-blue-400 animate-pulse',
  completed: 'text-green-400',
  failed: 'text-red-400',
  cancelled: 'text-yellow-400'
};

const STATUS_ICONS = {
  pending: ClockIcon,
  running: ArrowPathIcon,
  completed: CheckCircleIcon,
  failed: ExclamationTriangleIcon,
  cancelled: StopIcon
};

export const SimulationDashboard = () => {
  // Estados principales
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [results, setResults] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  
  // Estados de visualización
  const [activeTab, setActiveTab] = useState('overview');
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // Estados del formulario de nuevo pipeline
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [pipelineConfig, setPipelineConfig] = useState({
    type: 'full_pipeline',
    name: '',
    target_molecule: '',
    target_protein: '',
    parameters: {}
  });

  /**
   * Cargar trabajos desde el backend
   */
  const loadJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/jobs');
      if (response.ok) {
        const jobsData = await response.json();
        setJobs(jobsData);
        
        // Actualizar trabajo seleccionado si existe
        if (selectedJob) {
          const updated = jobsData.find(j => j.id === selectedJob.id);
          if (updated) {
            setSelectedJob(updated);
            
            // Cargar resultados si está completo
            if (updated.status === 'completed' && updated.results) {
              loadResults(updated.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  }, [selectedJob]);

  /**
   * Cargar resultados de un trabajo específico
   */
  const loadResults = useCallback(async (jobId) => {
    try {
      const response = await fetch(`/api/v1/jobs/${jobId}/results`);
      if (response.ok) {
        const resultsData = await response.json();
        setResults(resultsData);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }, []);

  /**
   * Iniciar un nuevo pipeline
   */
  const startPipeline = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/design/start-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pipelineConfig)
      });
      
      if (response.ok) {
        const newJob = await response.json();
        setJobs(prev => [newJob, ...prev]);
        setSelectedJob(newJob);
        setShowNewPipeline(false);
        
        // Reset form
        setPipelineConfig({
          type: 'full_pipeline',
          name: '',
          target_molecule: '',
          target_protein: '',
          parameters: {}
        });
        
        // Start polling
        setIsPolling(true);
      }
    } catch (error) {
      console.error('Error starting pipeline:', error);
    }
  }, [pipelineConfig]);

  /**
   * Cancelar un trabajo
   */
  const cancelJob = useCallback(async (jobId) => {
    try {
      const response = await fetch(`/api/v1/jobs/${jobId}/cancel`, {
        method: 'POST'
      });
      
      if (response.ok) {
        loadJobs();
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  }, [loadJobs]);

  /**
   * Polling para trabajos activos
   */
  useEffect(() => {
    let interval;
    
    if (isPolling || jobs.some(job => ['pending', 'running'].includes(job.status))) {
      interval = setInterval(loadJobs, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, jobs, loadJobs]);

  /**
   * Cargar trabajos al montar
   */
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  /**
   * Handler para click en puntos PCA
   */
  const handlePCAPointClick = useCallback((frame) => {
    setCurrentFrame(frame);
  }, []);

  /**
   * Renderizar la lista de trabajos
   */
  const renderJobsList = () => (
    <div className="space-y-2">
      {jobs.map((job) => {
        const StatusIcon = STATUS_ICONS[job.status];
        const steps = PIPELINE_STEPS[job.type] || [];
        
        return (
          <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedJob?.id === job.id 
                ? 'border-blue-500 bg-blue-900/20' 
                : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-white">{job.name}</h3>
              <div className="flex items-center space-x-2">
                <StatusIcon className={`h-4 w-4 ${STATUS_COLORS[job.status]}`} />
                <span className={`text-xs ${STATUS_COLORS[job.status]}`}>
                  {job.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-400 mb-2">
              {job.type.replace('_', ' ').toUpperCase()}
            </div>
            
            {/* Barra de progreso */}
            <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${job.progress || 0}%` }}
              />
            </div>
            
            {/* Paso actual */}
            {job.status === 'running' && steps[job.currentStep] && (
              <div className="text-xs text-blue-400">
                {steps[job.currentStep]}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              Iniciado: {new Date(job.startTime).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );

  /**
   * Renderizar el formulario de nuevo pipeline
   */
  const renderNewPipelineForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Nuevo Pipeline de Diseño</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              value={pipelineConfig.name}
              onChange={(e) => setPipelineConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Mi proyecto de diseño de fármacos"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Pipeline
            </label>
            <select
              value={pipelineConfig.type}
              onChange={(e) => setPipelineConfig(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="full_pipeline">Pipeline Completo</option>
              <option value="scaffold_hopping">Solo Scaffold Hopping</option>
              <option value="molecular_scoring">Solo Evaluación Molecular</option>
              <option value="docking">Solo Docking</option>
              <option value="md_simulation">Solo Simulación MD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Molécula Objetivo (SMILES)
            </label>
            <input
              type="text"
              value={pipelineConfig.target_molecule}
              onChange={(e) => setPipelineConfig(prev => ({ ...prev, target_molecule: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
              placeholder="CCO"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proteína Objetivo (PDB ID)
            </label>
            <input
              type="text"
              value={pipelineConfig.target_protein}
              onChange={(e) => setPipelineConfig(prev => ({ ...prev, target_protein: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="1ABC"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowNewPipeline(false)}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={startPipeline}
            disabled={!pipelineConfig.name || !pipelineConfig.target_molecule}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Iniciar Pipeline
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BeakerIcon className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Astroflora 7.1</h1>
              <p className="text-gray-400 text-sm">Panel de Control de Diseño de Fármacos</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowNewPipeline(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <PlayIcon className="h-4 w-4" />
            <span>Nuevo Pipeline</span>
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Lista de trabajos */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Trabajos Activos</h2>
            <div className="text-sm text-gray-400">
              {jobs.length} total
            </div>
          </div>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CpuChipIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay trabajos activos</p>
              <p className="text-sm">Inicia un nuevo pipeline para comenzar</p>
            </div>
          ) : (
            renderJobsList()
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {selectedJob ? (
            <>
              {/* Job header */}
              <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedJob.name}</h2>
                    <p className="text-gray-400">{selectedJob.type.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {selectedJob.status === 'running' && (
                      <button
                        onClick={() => cancelJob(selectedJob.id)}
                        className="flex items-center space-x-2 text-red-400 hover:text-red-300"
                      >
                        <StopIcon className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    )}
                    
                    <div className={`text-sm ${STATUS_COLORS[selectedJob.status]}`}>
                      {selectedJob.status.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Progreso</span>
                    <span>{selectedJob.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${selectedJob.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-gray-800 border-b border-gray-700 px-6">
                <div className="flex space-x-6">
                  {['overview', 'visualization', 'results'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Información del Trabajo</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-gray-400">ID:</span> {selectedJob.id}</div>
                          <div><span className="text-gray-400">Tipo:</span> {selectedJob.type}</div>
                          <div><span className="text-gray-400">Estado:</span> {selectedJob.status}</div>
                          <div><span className="text-gray-400">Inicio:</span> {new Date(selectedJob.startTime).toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Pasos del Pipeline</h3>
                        <div className="space-y-2">
                          {(PIPELINE_STEPS[selectedJob.type] || []).map((step, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                index < (selectedJob.currentStep || 0) ? 'bg-green-400' :
                                index === (selectedJob.currentStep || 0) ? 'bg-blue-400' : 'bg-gray-600'
                              }`} />
                              <span className={
                                index < (selectedJob.currentStep || 0) ? 'text-green-400' :
                                index === (selectedJob.currentStep || 0) ? 'text-blue-400' : 'text-gray-400'
                              }>
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'visualization' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Molecular visualization */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Visualización Molecular</h3>
                      <MolstarPlayer
                        structureUrl={results?.trajectoryPath}
                        currentFrame={currentFrame}
                        onFrameChange={setCurrentFrame}
                        height={400}
                      />
                    </div>

                    {/* PCA plot */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Análisis PCA</h3>
                      <PCAPlot
                        pcaData={results?.pcaData || []}
                        currentFrame={currentFrame}
                        onPointClick={handlePCAPointClick}
                        height={400}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'results' && (
                  <div className="space-y-6">
                    {results ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h3 className="font-semibold mb-4">Moléculas Generadas</h3>
                          <div className="text-2xl font-bold text-blue-400">
                            {results.molecules?.length || 0}
                          </div>
                          <p className="text-gray-400 text-sm">candidatos identificados</p>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h3 className="font-semibold mb-4">Métricas</h3>
                          {results.metrics && (
                            <div className="space-y-2 text-sm">
                              {Object.entries(results.metrics).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-400">{key}:</span>
                                  <span>{typeof value === 'number' ? value.toFixed(3) : value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Los resultados aparecerán cuando el trabajo esté completo</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BeakerIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Bienvenido a Astroflora 7.1</h2>
                <p className="mb-4">Selecciona un trabajo de la lista o inicia un nuevo pipeline</p>
                <button
                  onClick={() => setShowNewPipeline(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
                >
                  Iniciar Nuevo Pipeline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para nuevo pipeline */}
      {showNewPipeline && renderNewPipelineForm()}
    </div>
  );
};

export default SimulationDashboard;
