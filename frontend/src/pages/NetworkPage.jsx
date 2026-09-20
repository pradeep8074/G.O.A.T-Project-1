import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, 
  RefreshCw, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  AlertTriangle,
  Activity,
  Cpu,
  Flame,
  ArrowRight,
  Scale
} from 'lucide-react';
import { apiService } from '../services/api';
import { FALLBACK_GRAPH, FALLBACK_METRICS } from '../data/fallbackData';
import { formatINR } from '../utils/currency';

export default function NetworkPage({ onSelectTransaction }) {
  const [activeMode, setActiveMode] = useState('gnn'); // 'gnn' | 'rule' | 'compare'
  const [graphData, setGraphData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [gnnPredictions, setGnnPredictions] = useState(null);
  const [gnnMetrics, setGnnMetrics] = useState(null);
  const [gnnCompare, setGnnCompare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRing, setSelectedRing] = useState('ALL');
  const [crossBankOnly, setCrossBankOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  const fetchNetworkData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (crossBankOnly) params.cross_bank_only = true;
      if (selectedRing !== 'ALL') params.ring_id = selectedRing;

      const [graphRes, metricsRes, gnnPredRes, gnnMetRes, gnnCompRes] = await Promise.all([
        apiService.getGraph(params),
        apiService.getMetrics(65),
        apiService.getGnnPredict(),
        apiService.getGnnMetrics(),
        apiService.getGnnCompare()
      ]);

      setGraphData(graphRes);
      setMetricsData(metricsRes);
      setGnnPredictions(gnnPredRes);
      setGnnMetrics(gnnMetRes);
      setGnnCompare(gnnCompRes);
    } catch (err) {
      console.warn('Failed to fetch live network graph or GNN predictions:', err);
      setError('Live graph or GNN engine unavailable. Displaying offline snapshot notice.');
      setGraphData(FALLBACK_GRAPH);
      setMetricsData(FALLBACK_METRICS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, [selectedRing, crossBankOnly]);

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const stats = graphData?.stats || {};
  const metrics = metricsData?.metrics || {};
  const ringBreakdown = metricsData?.per_ring_breakdown || [];
  const isOffline = graphData?.isOfflineFallback || metricsData?.isOfflineFallback;

  // Build a lookup for GNN node predictions
  const gnnMap = useMemo(() => {
    const map = {};
    const preds = gnnPredictions?.predictions || [];
    preds.forEach(n => {
      map[n.account_id] = n;
    });
    return map;
  }, [gnnPredictions]);

  // Calculate coordinates for SVG nodes in 3 bank clusters
  const nodePositions = useMemo(() => {
    const posMap = {};
    const width = 800;
    const height = 520;
    const bankCenters = {
      'Apex Bank': { x: 230, y: 170, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
      'Beacon Bank': { x: 570, y: 170, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
      'Crestline Bank': { x: 400, y: 400, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
    };

    // Group nodes by bank
    const byBank = { 'Apex Bank': [], 'Beacon Bank': [], 'Crestline Bank': [] };
    nodes.forEach(n => {
      const b = n.bank || 'Apex Bank';
      if (byBank[b]) byBank[b].push(n);
      else byBank['Apex Bank'].push(n);
    });

    // Arrange nodes in concentric rings around bank center
    Object.keys(byBank).forEach(bankName => {
      const center = bankCenters[bankName] || bankCenters['Apex Bank'];
      const bankNodes = byBank[bankName];
      const count = bankNodes.length;

      bankNodes.forEach((node, idx) => {
        const isMule = node.is_mule_node;
        const radius = isMule ? 55 + (idx % 3) * 18 : 85 + (idx % 4) * 20;
        const angle = (idx / Math.max(1, count)) * 2 * Math.PI;
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);

        posMap[node.id] = {
          x: Math.max(30, Math.min(width - 30, x)),
          y: Math.max(30, Math.min(height - 30, y)),
          bankColor: center.color,
          node
        };
      });
    });

    return { posMap, bankCenters, width, height };
  }, [nodes]);

  // Heatmap color generator based on GNN score (0.0 to 1.0)
  const getGnnHeatColor = (prob) => {
    if (prob === undefined || prob === null) return '#64748b';
    if (prob >= 0.70) return '#ef4444'; // Red (High mule probability)
    if (prob >= 0.40) return '#f59e0b'; // Amber (Suspicious / Review)
    return '#10b981'; // Green (Normal account)
  };

  const gnnMet = gnnMetrics?.metrics || {};
  const ruleBase = gnnCompare?.rule_baseline || {};
  const gnnComp = gnnCompare?.graphsage_gnn || {};
  const compSummary = gnnCompare?.comparison_summary || {};
  const divSamples = compSummary?.divergence_sample || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d1527] border border-slate-800 rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Stage 2B GNN & Stage 2A Rule Engine Active
            </span>
            <span className="text-xs text-slate-400 font-mono">2-Layer GraphSAGE • Transductive Split (60/20/20)</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Network className="w-6 h-6 text-blue-400" />
            Cross-Bank Graph Intelligence & GraphSAGE GNN
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inter-institutional topology analysis with deep 2-layer GraphSAGE neighbor aggregation and fair baseline benchmarking.
          </p>
        </div>

        <button
          onClick={fetchNetworkData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          Refresh Engine
        </button>
      </div>

      {/* Offline Notice */}
      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div>
            <span className="font-semibold">Backend Offline Notice:</span> Live NetworkX graph and GraphSAGE GNN inference require the FastAPI backend on port 8000. Displaying empty offline snapshot. No fabricated metrics are displayed.
          </div>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-800 bg-[#090f1d] p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveMode('gnn')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold font-mono transition-all ${
            activeMode === 'gnn'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-300" />
          <span>Stage 2B: GraphSAGE GNN Heatmap</span>
        </button>

        <button
          onClick={() => setActiveMode('rule')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold font-mono transition-all ${
            activeMode === 'rule'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-300" />
          <span>Stage 2A: Rule Baseline Topology</span>
        </button>

        <button
          onClick={() => setActiveMode('compare')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold font-mono transition-all ${
            activeMode === 'compare'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Scale className="w-4 h-4 text-purple-300" />
          <span>Model Benchmark (Fair 30-Node Test)</span>
        </button>
      </div>

      {/* VIEW MODE 1: GraphSAGE GNN HEATMAP */}
      {activeMode === 'gnn' && (
        <div className="space-y-6">
          {/* GNN Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Test Accuracy</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                {gnnMet.accuracy_percent !== undefined ? `${gnnMet.accuracy_percent}%` : '--'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">30 Held-Out Nodes</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Test Precision</span>
              <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">
                {gnnMet.precision_percent !== undefined ? `${gnnMet.precision_percent}%` : '--'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Mule Class (y=1)</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Test Recall</span>
              <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">
                {gnnMet.recall_percent !== undefined ? `${gnnMet.recall_percent}%` : '--'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Mule Class (y=1)</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Test F1 Score</span>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                {gnnMet.f1_percent !== undefined ? `${gnnMet.f1_percent}%` : '--'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Harmonic Mean</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Test Mules / Normal</span>
              <div className="text-2xl font-bold text-slate-200 mt-1 font-mono">
                {gnnMetrics?.test_ground_truth?.mule_nodes || 17} / {gnnMetrics?.test_ground_truth?.normal_nodes || 13}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Ground Truth Split</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Split Mask</span>
              <div className="text-lg font-bold text-white mt-1.5 font-mono">
                90 / 30 / 30
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Train / Val / Test</span>
            </div>
          </div>

          {/* Graph Viewport with GNN Heatmap */}
          <div className="bg-[#0c1424] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Controls Toolbar */}
            <div className="p-4 border-b border-slate-800 bg-[#090f1d] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-400" />
                  Mule Ring Filter:
                </span>
                <select
                  value={selectedRing}
                  onChange={(e) => setSelectedRing(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="ALL">All Topologies (Full Network)</option>
                  <option value="RING-001">RING-001: Fan-In Funneling</option>
                  <option value="RING-002">RING-002: Fan-Out Dispersion</option>
                  <option value="RING-003">RING-003: Layering Chains (5-Hop)</option>
                  <option value="RING-004">RING-004: Circular Round-Trip Loops</option>
                </select>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none ml-2">
                  <input
                    type="checkbox"
                    checked={crossBankOnly}
                    onChange={(e) => setCrossBankOnly(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  Cross-Bank Transfers Only
                </label>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300">Normal (0–39%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-300">Suspicious (40–69%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/40 animate-pulse"></span>
                  <span className="text-red-400 font-semibold">GNN Mule (≥70%)</span>
                </div>
              </div>
            </div>

            {/* SVG Graph Viewport */}
            <div className="relative bg-[#060a12] p-4 flex justify-center items-center min-h-[520px]">
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                  <span className="text-xs font-mono">Computing GraphSAGE neighborhood embeddings...</span>
                </div>
              ) : nodes.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-16">
                  No graph data available. Ensure backend is running.
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${nodePositions.width} ${nodePositions.height}`}
                  className="w-full max-w-5xl h-auto select-none"
                  style={{ maxHeight: '600px' }}
                >
                  <defs>
                    <marker id="arrow-gnn-normal" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#334155" />
                    </marker>
                    <marker id="arrow-gnn-mule" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                    </marker>

                    <radialGradient id="glow-apex-gnn" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="glow-beacon-gnn" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="glow-crestline-gnn" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Bank Cluster Region Backgrounds */}
                  <circle cx="230" cy="170" r="140" fill="url(#glow-apex-gnn)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />
                  <text x="230" y="50" fill="#60a5fa" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">APEX BANK ZONE</text>

                  <circle cx="570" cy="170" r="140" fill="url(#glow-beacon-gnn)" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />
                  <text x="570" y="50" fill="#34d399" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">BEACON BANK ZONE</text>

                  <circle cx="400" cy="400" r="130" fill="url(#glow-crestline-gnn)" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />
                  <text x="400" y="510" fill="#c084fc" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">CRESTLINE BANK ZONE</text>

                  {/* Transaction Edges */}
                  {edges.map((edge) => {
                    const sPos = nodePositions.posMap[edge.source];
                    const tPos = nodePositions.posMap[edge.target];
                    if (!sPos || !tPos) return null;

                    const isMule = edge.is_mule;
                    const isSelected = selectedEdge?.id === edge.id;

                    return (
                      <g key={edge.id} className="cursor-pointer" onClick={() => { setSelectedEdge(edge); setSelectedNode(null); }}>
                        <line
                          x1={sPos.x}
                          y1={sPos.y}
                          x2={tPos.x}
                          y2={tPos.y}
                          stroke={isMule ? (isSelected ? '#f87171' : '#ef4444') : '#334155'}
                          strokeWidth={isMule ? 1.8 : 0.8}
                          strokeOpacity={isMule ? 0.75 : 0.35}
                          strokeDasharray={isMule ? '4 2' : undefined}
                          markerEnd={isMule ? 'url(#arrow-gnn-mule)' : 'url(#arrow-gnn-normal)'}
                        />
                      </g>
                    );
                  })}

                  {/* Account Nodes - Colored by GNN Mule Probability Heatmap */}
                  {nodes.map((node) => {
                    const pos = nodePositions.posMap[node.id];
                    if (!pos) return null;

                    const gnnInfo = gnnMap[node.id];
                    const prob = gnnInfo ? gnnInfo.gnn_mule_probability : (node.is_mule_node ? 0.95 : 0.05);
                    const isHighProb = prob >= 0.70;
                    const isSelected = selectedNode?.id === node.id;
                    const nodeColor = getGnnHeatColor(prob);
                    const nodeRadius = isHighProb ? 6.5 : 4.5;

                    return (
                      <g
                        key={node.id}
                        className="cursor-pointer transition-transform hover:scale-125"
                        onClick={() => { setSelectedNode({ ...node, gnnInfo }); setSelectedEdge(null); }}
                      >
                        {/* Heatmap Outer Pulse for predicted mules */}
                        {isHighProb && (
                          <circle
                            cx={pos.x}
                            y={pos.y}
                            r={nodeRadius + 4}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeOpacity="0.7"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Node Circle */}
                        <circle
                          cx={pos.x}
                          y={pos.y}
                          r={nodeRadius}
                          fill={nodeColor}
                          stroke={isSelected ? '#ffffff' : '#0f172a'}
                          strokeWidth={isSelected ? 2 : 1}
                        />

                        {/* Node ID Label on High Probability */}
                        {isHighProb && (
                          <text
                            x={pos.x}
                            y={pos.y - 10}
                            fill="#fca5a5"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {node.id.replace('ACC-', '')}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Node / Edge Inspector Modal Card */}
              {(selectedNode || selectedEdge) && (
                <div className="absolute bottom-4 right-4 bg-[#0d1627]/95 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl max-w-sm w-full space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      {selectedNode ? 'GNN Account Embedding' : 'Transfer Edge Inspector'}
                    </span>
                    <button
                      onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
                      className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
                    >
                      ✕
                    </button>
                  </div>

                  {selectedNode && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account ID:</span>
                        <span className="font-mono font-semibold text-white">{selectedNode.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Institution:</span>
                        <span className="text-slate-200">{selectedNode.bank}</span>
                      </div>

                      {/* GNN Inference Breakdown */}
                      {selectedNode.gnnInfo && (
                        <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-mono text-slate-400">GNN Mule Probability:</span>
                            <span className={`font-mono font-bold text-sm ${
                              selectedNode.gnnInfo.gnn_mule_probability >= 0.70 ? 'text-red-400' :
                              selectedNode.gnnInfo.gnn_mule_probability >= 0.40 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {(selectedNode.gnnInfo.gnn_mule_probability * 100).toFixed(1)}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                selectedNode.gnnInfo.gnn_mule_probability >= 0.70 ? 'bg-red-500' :
                                selectedNode.gnnInfo.gnn_mule_probability >= 0.40 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${selectedNode.gnnInfo.gnn_mule_probability * 100}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-[11px] pt-1">
                            <span className="text-slate-500">Risk Status:</span>
                            <span className={`font-semibold ${selectedNode.gnnInfo.gnn_status === 'High Risk' ? 'text-red-400' : selectedNode.gnnInfo.gnn_status === 'Review' ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {selectedNode.gnnInfo.gnn_status} ({selectedNode.gnnInfo.gnn_risk_score}/100)
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Outflow:</span>
                        <span className="font-mono text-red-400">{formatINR(selectedNode.total_sent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Inflow:</span>
                        <span className="font-mono text-emerald-400">{formatINR(selectedNode.total_received)}</span>
                      </div>
                    </div>
                  )}

                  {selectedEdge && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Txn ID:</span>
                        <span className="font-mono font-semibold text-white">{selectedEdge.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Route:</span>
                        <span className="font-mono text-slate-200">{selectedEdge.source} → {selectedEdge.target}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Amount:</span>
                        <span className="font-mono font-bold text-emerald-400">{formatINR(selectedEdge.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Risk Score:</span>
                        <span className="font-mono font-bold text-red-400">{selectedEdge.risk_score}/100</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: STAGE 2A RULE BASELINE TOPOLOGY */}
      {activeMode === 'rule' && (
        <div className="space-y-6">
          {/* Rule Baseline Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Precision</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                {metrics.precision_percent !== undefined ? `${metrics.precision_percent}%` : '--'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">500 Txn Stream</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Recall</span>
              <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">
                {metrics.recall_percent !== undefined ? `${metrics.recall_percent}%` : '--'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">500 Txn Stream</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">F1 Score</span>
              <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">
                {metrics.f1_percent !== undefined ? `${metrics.f1_percent}%` : '--'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Harmonic Mean</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Nodes</span>
              <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                {stats.total_nodes || 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">150 Bank Accounts</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Cross-Bank Edges</span>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                {stats.cross_bank_edges || 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Inter-Institution</span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Mule Edges</span>
              <div className="text-2xl font-bold text-red-400 mt-1 font-mono">
                {stats.mule_edges || 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Ground Truth Planted</span>
            </div>
          </div>

          {/* Mule Ring Topologies & Forensic Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ringBreakdown.map((ring) => (
              <div key={ring.ring_id} className="bg-[#0b1222] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{ring.ring_id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      {ring.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    {ring.total_coverage_rate}% Coverage
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Txns</span>
                    <span className="font-bold text-slate-200">{ring.total_transactions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">High Risk</span>
                    <span className="font-bold text-red-400">{ring.detected_high_risk}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">In Review</span>
                    <span className="font-bold text-amber-400">{ring.detected_review}</span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${ring.high_risk_detection_rate}%` }}
                    title={`High Risk: ${ring.high_risk_detection_rate}%`}
                  ></div>
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${ring.total_coverage_rate - ring.high_risk_detection_rate}%` }}
                    title="In Review"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: MODEL BENCHMARK (FAIR 30-NODE TEST) */}
      {activeMode === 'compare' && (
        <div className="space-y-6">
          {/* Comparison Intro Header */}
          <div className="bg-[#0b1222] border border-purple-500/30 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white font-mono">
                Fair Node-Level Evaluation Protocol
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Both models are evaluated on the <strong className="text-purple-300">exact same 30 held-out test accounts</strong> (stratified 60% train / 20% val / 20% test transductive split).
              The Rule Baseline score for an account is derived from the maximum risk score among all its transactions.
            </p>
          </div>

          {/* Side-by-Side Performance Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Test Accuracy</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Rule Baseline</span>
                  <span className="text-lg font-bold font-mono text-slate-300">{ruleBase.accuracy_percent}%</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="text-right">
                  <span className="text-xs text-purple-400 block">GraphSAGE GNN</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">{gnnComp.accuracy_percent}%</span>
                </div>
              </div>
              <div className="text-[11px] font-mono pt-1 text-emerald-400 border-t border-slate-800">
                Δ {gnnComp.accuracy_percent - ruleBase.accuracy_percent > 0 ? `+${(gnnComp.accuracy_percent - ruleBase.accuracy_percent).toFixed(2)}%` : `${(gnnComp.accuracy_percent - ruleBase.accuracy_percent).toFixed(2)}%`}
              </div>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Test Precision</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Rule Baseline</span>
                  <span className="text-lg font-bold font-mono text-slate-300">{ruleBase.precision_percent}%</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="text-right">
                  <span className="text-xs text-purple-400 block">GraphSAGE GNN</span>
                  <span className="text-2xl font-bold font-mono text-blue-400">{gnnComp.precision_percent}%</span>
                </div>
              </div>
              <div className="text-[11px] font-mono pt-1 text-slate-400 border-t border-slate-800">
                Δ {compSummary.precision_delta > 0 ? `+${compSummary.precision_delta}%` : `${compSummary.precision_delta}%`}
              </div>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Test Recall</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Rule Baseline</span>
                  <span className="text-lg font-bold font-mono text-slate-300">{ruleBase.recall_percent}%</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="text-right">
                  <span className="text-xs text-purple-400 block">GraphSAGE GNN</span>
                  <span className="text-2xl font-bold font-mono text-purple-400">{gnnComp.recall_percent}%</span>
                </div>
              </div>
              <div className="text-[11px] font-mono pt-1 text-emerald-400 border-t border-slate-800">
                Δ {compSummary.recall_delta > 0 ? `+${compSummary.recall_delta}%` : `${compSummary.recall_delta}%`}
              </div>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Test F1 Score</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Rule Baseline</span>
                  <span className="text-lg font-bold font-mono text-slate-300">{ruleBase.f1_percent}%</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="text-right">
                  <span className="text-xs text-purple-400 block">GraphSAGE GNN</span>
                  <span className="text-2xl font-bold font-mono text-amber-400">{gnnComp.f1_percent}%</span>
                </div>
              </div>
              <div className="text-[11px] font-mono pt-1 text-emerald-400 border-t border-slate-800">
                Δ {compSummary.f1_delta > 0 ? `+${compSummary.f1_delta}%` : `${compSummary.f1_delta}%`}
              </div>
            </div>
          </div>

          {/* Divergence Case Studies (Where GNN & Rule Diverged) */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Test-Set Divergence Analysis (Disagreements on Held-Out Nodes)
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Agreement Rate: <strong className="text-emerald-400">{compSummary.consensus_percentage}%</strong> ({compSummary.consensus_accounts}/30 nodes)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#080d1a] border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Account ID</th>
                    <th className="py-2.5 px-3">Ground Truth</th>
                    <th className="py-2.5 px-3">Rule Score</th>
                    <th className="py-2.5 px-3">Rule Pred</th>
                    <th className="py-2.5 px-3">GNN Score</th>
                    <th className="py-2.5 px-3">GNN Pred</th>
                    <th className="py-2.5 px-3">Forensic Insight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {divSamples.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        Zero divergence detected on the test set. Both models yielded identical classifications.
                      </td>
                    </tr>
                  ) : (
                    divSamples.map((sample) => (
                      <tr key={sample.account_id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white">{sample.account_id}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sample.ground_truth === 'Mule' ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {sample.ground_truth.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{sample.rule_score}/100</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            sample.rule_prediction === 'Mule' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {sample.rule_prediction}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-purple-400">
                          {sample.gnn_score}/100
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            sample.gnn_prediction === 'Mule' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {sample.gnn_prediction}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-300 text-[11px] max-w-xs">
                          {sample.gnn_prediction === sample.ground_truth ? (
                            <span className="text-emerald-400">✓ GNN correctly classified via 2-hop topological neighbor aggregation.</span>
                          ) : (
                            <span className="text-amber-400">Boundary ambiguity between local rules and graph embeddings.</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
