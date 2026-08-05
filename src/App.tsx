import React, { useState } from 'react';
import { DroneSimulator3D, SimState } from './components/DroneSimulator3D';
import { MetricsDashboard } from './components/MetricsDashboard';
import { CodeInspector } from './components/CodeInspector';
import { HyperparameterPanel } from './components/HyperparameterPanel';
import { ArchitectureOverview } from './components/ArchitectureOverview';
import { Box, Activity, Code2, BookOpen, Download, Cpu, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sim' | 'metrics' | 'code' | 'docs'>('sim');

  // Interactive Hyperparameters State
  const [numRays, setNumRays] = useState<number>(10);
  const [numObstacles, setNumObstacles] = useState<number>(15);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [mode, setMode] = useState<'policy' | 'training' | 'teleop'>('policy');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Navigation Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>Autonomous Drone Navigation</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded-full uppercase">
                  Deep RL (DQN)
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">3D Gymnasium Env, PyTorch Agent & 8 Complete Deliverables</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('sim')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'sim' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>3D WebGL Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'metrics' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Training Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'code' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Python Code (8 Files)</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'docs' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Architecture & Specs</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'sim' && (
          <div className="space-y-6">
            <HyperparameterPanel
              numRays={numRays}
              setNumRays={setNumRays}
              numObstacles={numObstacles}
              setNumObstacles={setNumObstacles}
              simSpeed={simSpeed}
              setSimSpeed={setSimSpeed}
              mode={mode}
              setMode={setMode}
            />

            <DroneSimulator3D
              numRays={numRays}
              numObstacles={numObstacles}
              simSpeed={simSpeed}
              mode={mode}
            />
          </div>
        )}

        {activeTab === 'metrics' && <MetricsDashboard />}

        {activeTab === 'code' && <CodeInspector />}

        {activeTab === 'docs' && <ArchitectureOverview />}
      </main>
    </div>
  );
}
