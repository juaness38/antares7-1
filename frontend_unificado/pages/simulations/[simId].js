// 🧬 ASTROFLORA 7.0 - SIMULATION DASHBOARD
// =======================================
// Panel de control interactivo para análisis molecular

import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import axios from 'axios';

// Componentes de visualización
import MolstarPlayer from '../../components/visualization/MolstarPlayer';
import PCAPlot from '../../components/visualization/PCAPlot';

// Configuración API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function SimulationDashboard() {
  const router = useRouter();
  const { simId } = router.query;

  // Estados principales
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle, running, completed, error
  const [jobIds, setJobIds] = useState([]);
  const [currentJobs, setCurrentJobs] = useState({});
  const [simulationResults, setSimulationResults] = useState(null);
  const [pcaData, setPcaData] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [error, setError] = useState(null);

  // Estados de UI
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Inicializar análisis
  const startAnalysis = useCallback(async (analysisType = 'full') => {
    if (!simId) return;

    try {
      setAnalysisStatus('running');
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/simulations/${simId}/analyze`, null, {
        params: { analysis_type: analysisType }
      });

      const { jobs } = response.data;
      setJobIds(jobs.map(job => job.job_id));
      
      // Inicializar estado de trabajos
      const jobsStatus = {};
      jobs.forEach(job => {
        jobsStatus[job.job_id] = {
          task: job.task,
          status: 'enqueued',
          result: null
        };
      });
      setCurrentJobs(jobsStatus);

      console.log('✅ Análisis iniciado:', response.data);
      
    } catch (err) {
      console.error('❌ Error iniciando análisis:', err);
      setError(`Error iniciando análisis: ${err.response?.data?.detail || err.message}`);
      setAnalysisStatus('error');
    }
  }, [simId]);

  // Consultar estado de trabajos
  const checkJobsStatus = useCallback(async () => {
    if (jobIds.length === 0) return;

    try {
      const jobStatusPromises = jobIds.map(jobId => 
        axios.get(`${API_BASE_URL}/jobs/${jobId}/status`)
          .then(response => ({ jobId, ...response.data }))
          .catch(error => ({ jobId, status: 'error', error: error.message }))
      );

      const jobsStatusResults = await Promise.all(jobStatusPromises);
      
      const updatedJobs = { ...currentJobs };
      let allCompleted = true;
      let hasError = false;

      jobsStatusResults.forEach(jobResult => {
        updatedJobs[jobResult.jobId] = {
          ...updatedJobs[jobResult.jobId],
          status: jobResult.status,
          result: jobResult.result,
          error: jobResult.error
        };

        if (jobResult.status !== 'completed') {
          allCompleted = false;
        }
        if (jobResult.status === 'error') {
          hasError = true;
        }
      });

      setCurrentJobs(updatedJobs);

      // Actualizar estado general
      if (hasError) {
        setAnalysisStatus('error');
        setAutoRefresh(false);
      } else if (allCompleted) {
        setAnalysisStatus('completed');
        setAutoRefresh(false);
        await loadSimulationResults();
      }

    } catch (err) {
      console.error('❌ Error consultando trabajos:', err);
    }
  }, [jobIds, currentJobs]);

  // Cargar resultados de simulación
  const loadSimulationResults = useCallback(async () => {
    if (!simId) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/simulations/${simId}/results`);
      const results = response.data;
      
      setSimulationResults(results);

      // Cargar datos PCA si están disponibles
      if (results.analysis_results?.pca) {
        const pcaResults = results.analysis_results.pca;
        setPcaData(pcaResults.projections || []);
        
        console.log('✅ Resultados PCA cargados:', pcaResults.projections?.length, 'frames');
      }

    } catch (err) {
      console.error('❌ Error cargando resultados:', err);
      setError(`Error cargando resultados: ${err.response?.data?.detail || err.message}`);
    }
  }, [simId]);

  // Manejar click en PCA plot
  const handlePCAPointClick = useCallback((frameNumber, pointData) => {
    setCurrentFrame(frameNumber);
    setSelectedCluster(pointData.cluster);
    
    console.log('📊 Frame seleccionado:', frameNumber, 'Cluster:', pointData.cluster);
  }, []);

  // Manejar cambio de frame en Mol*
  const handleFrameChange = useCallback((frameNumber) => {
    setCurrentFrame(frameNumber);
  }, []);

  // Auto-refresh de trabajos
  useEffect(() => {
    if (autoRefresh && analysisStatus === 'running') {
      const interval = setInterval(checkJobsStatus, 3000); // Cada 3 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh, analysisStatus, checkJobsStatus]);

  // Cargar resultados existentes al montar
  useEffect(() => {
    if (simId && analysisStatus === 'idle') {
      loadSimulationResults();
    }
  }, [simId, analysisStatus, loadSimulationResults]);

  // URLs de archivos de visualización
  const topologyUrl = simulationResults?.files?.topology 
    ? `${API_BASE_URL.replace('/api', '')}${simulationResults.files.topology}`
    : null;
  
  const trajectoryUrl = simulationResults?.files?.trajectory
    ? `${API_BASE_URL.replace('/api', '')}${simulationResults.files.trajectory}`
    : null;

  return (
    <>
      <Head>
        <title>Astroflora 7.0 - Análisis de Simulación {simId}</title>
        <meta name="description" content="Análisis interactivo de dinámica molecular con ML" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🧬 Análisis Molecular Interactivo
                </h1>
                <p className="text-gray-600">Simulación: <code className="bg-gray-100 px-2 py-1 rounded">{simId}</code></p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Indicador de estado */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    analysisStatus === 'completed' ? 'bg-green-500' :
                    analysisStatus === 'running' ? 'bg-yellow-500 animate-pulse' :
                    analysisStatus === 'error' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {analysisStatus === 'running' ? 'Procesando...' : analysisStatus}
                  </span>
                </div>

                {/* Botón de análisis */}
                {analysisStatus === 'idle' && (
                  <button
                    onClick={() => startAnalysis('full')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Iniciar Análisis
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          
          {/* Panel de estado de trabajos */}
          {analysisStatus === 'running' && Object.keys(currentJobs).length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Estado del Análisis</h3>
              <div className="space-y-2">
                {Object.entries(currentJobs).map(([jobId, job]) => (
                  <div key={jobId} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{job.task.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                        job.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                      {job.status === 'running' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Panel principal de visualización */}
          {analysisStatus === 'completed' && simulationResults && (
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Visualización 3D */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Visualización 3D
                  </h2>
                  <div className="text-sm text-gray-600">
                    Frame: <span className="font-mono">{currentFrame}</span>
                    {selectedCluster !== null && (
                      <span className="ml-2">
                        | Cluster: <span className="font-mono">{selectedCluster}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <MolstarPlayer
                  topologyUrl={topologyUrl}
                  trajectoryUrl={trajectoryUrl}
                  frameToShow={currentFrame}
                  onFrameChange={handleFrameChange}
                  height={500}
                  showControls={true}
                />
              </div>

              {/* Análisis conformacional */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Análisis Conformacional
                  </h2>
                  {simulationResults.analysis_results?.pca && (
                    <div className="text-sm text-gray-600">
                      Varianza explicada: {' '}
                      <span className="font-mono">
                        {(simulationResults.analysis_results.pca.stats?.total_variance_explained || 0).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <PCAPlot
                  data={pcaData}
                  onPointClick={handlePCAPointClick}
                  selectedFrame={currentFrame}
                  height={500}
                  showLegend={true}
                  colorBy="cluster"
                  title="Espacio Conformacional (PC1 vs PC2)"
                />
              </div>
            </div>
          )}

          {/* Panel de información adicional */}
          {analysisStatus === 'completed' && simulationResults && (
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              
              {/* Estadísticas generales */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Estadísticas</h3>
                <div className="space-y-2 text-sm">
                  {simulationResults.analysis_results?.pca?.stats && (
                    <>
                      <div className="flex justify-between">
                        <span>Total Frames:</span>
                        <span className="font-mono">{simulationResults.analysis_results.pca.stats.total_frames}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dimensiones PCA:</span>
                        <span className="font-mono">{simulationResults.analysis_results.pca.stats.pca_dimensions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Clusters:</span>
                        <span className="font-mono">{simulationResults.analysis_results.pca.clustering?.n_clusters || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Información de clusters */}
              {simulationResults.analysis_results?.pca?.clustering?.representative_frames && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Clusters Representativos</h3>
                  <div className="space-y-2 text-sm">
                    {simulationResults.analysis_results.pca.clustering.representative_frames.map(cluster => (
                      <div key={cluster.cluster} className="flex justify-between">
                        <span>Cluster {cluster.cluster}:</span>
                        <span className="font-mono">{cluster.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controles adicionales */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Controles</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAdvancedControls ? '▼' : '▶'} Opciones Avanzadas
                  </button>
                  
                  {showAdvancedControls && (
                    <div className="space-y-2 text-sm">
                      <button
                        onClick={() => startAnalysis('pca')}
                        className="w-full text-left px-2 py-1 text-gray-700 hover:bg-gray-100 rounded"
                      >
                        Re-ejecutar PCA
                      </button>
                      <button
                        onClick={loadSimulationResults}
                        className="w-full text-left px-2 py-1 text-gray-700 hover:bg-gray-100 rounded"
                      >
                        Recargar Datos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estado inicial */}
          {analysisStatus === 'idle' && !simulationResults && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🧬</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Panel de Análisis Molecular
                </h2>
                <p className="text-gray-600 mb-6">
                  Inicia el análisis de tu simulación para visualizar la dinámica molecular
                  con análisis PCA y clustering interactivo.
                </p>
                <button
                  onClick={() => startAnalysis('full')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🚀 Iniciar Análisis Completo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
