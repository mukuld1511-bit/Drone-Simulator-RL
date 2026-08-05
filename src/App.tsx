import React, { useState } from 'react';
import { DroneSimulator3D, SimState } from './components/DroneSimulator3D';
import { MetricsDashboard } from './components/MetricsDashboard';
import { CodeInspector } from './components/CodeInspector';
import { HyperparameterPanel } from './components/HyperparameterPanel';
import { ArchitectureOverview } from './components/ArchitectureOverview';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sim' | 'metrics' | 'code' | 'docs'>('sim');

  // Interactive Hyperparameters State
  const [numRays, setNumRays] = useState<number>(10);
  const [numObstacles, setNumObstacles] = useState<number>(15);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [mode, setMode] = useState<'policy' | 'training' | 'teleop'>('policy');

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-200 selection:text-neutral-900">
      {/* Top Header */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-wide text-neutral-900">
              DRONE NAV
            </h1>
            <span className="text-xs text-neutral-500 uppercase tracking-widest">
              Deep Q-Network
            </span>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('sim')}
              className={`pb-1 transition-colors border-b-2 ${
                activeTab === 'sim' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Simulator
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`pb-1 transition-colors border-b-2 ${
                activeTab === 'metrics' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`pb-1 transition-colors border-b-2 ${
                activeTab === 'code' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`pb-1 transition-colors border-b-2 ${
                activeTab === 'docs' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Architecture
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {activeTab === 'sim' && (
          <div className="space-y-12">
            {/* Hero Section - Minimalist */}
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl font-medium tracking-tight text-neutral-900">
                Autonomous Navigation
              </h2>
              <p className="text-neutral-500 text-sm max-w-2xl leading-relaxed">
                A Deep Q-Network agent navigating a 3D obstacle field. The neural network processes LiDAR-like raycasts and makes real-time control decisions. Trained over 10,000 episodes.
              </p>
              <div className="flex gap-8 mt-4 pt-4 border-t border-neutral-100">
                <div className="flex flex-col">
                  <span className="text-2xl font-light text-neutral-900">10k+</span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Episodes</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-light text-neutral-900">85%</span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Success Rate</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 border border-neutral-200 p-6 bg-neutral-50">
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
              </div>
              <div className="lg:col-span-3 border border-neutral-200 bg-white">
                <DroneSimulator3D
                  numRays={numRays}
                  numObstacles={numObstacles}
                  simSpeed={simSpeed}
                  mode={mode}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && <MetricsDashboard />}
        {activeTab === 'code' && <CodeInspector />}
        {activeTab === 'docs' && <ArchitectureOverview />}
      </main>
    </div>
  );
}
