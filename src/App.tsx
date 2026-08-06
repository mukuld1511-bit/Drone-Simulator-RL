import React, { useState } from 'react';
import { DroneSimulator3D, SimState } from './components/DroneSimulator3D';
import { MetricsDashboard } from './components/MetricsDashboard';
import { CodeInspector } from './components/CodeInspector';
import { HyperparameterPanel } from './components/HyperparameterPanel';
import { ArchitectureOverview } from './components/ArchitectureOverview';

const TABS = [
  { id: 'sim',     label: 'Simulator' },
  { id: 'metrics', label: 'Metrics'   },
  { id: 'code',    label: 'Code'      },
  { id: 'docs',    label: 'Docs'      },
] as const;

type Tab = typeof TABS[number]['id'];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('sim');
  const [numRays, setNumRays] = useState<number>(10);
  const [numObstacles, setNumObstacles] = useState<number>(15);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [mode, setMode] = useState<'policy' | 'training' | 'teleop'>('policy');

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-widest uppercase text-neutral-900">
              DroneNav
            </span>
            <span className="hidden sm:inline text-[10px] font-medium text-neutral-400 uppercase tracking-widest border border-neutral-200 px-2 py-0.5">
              DQN · v1.0
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">

        {activeTab === 'sim' && (
          <div className="space-y-12">

            {/* ── Hero ──────────────────────────────────────── */}
            <div className="space-y-6">
              {/* Eyebrow */}
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Deep Reinforcement Learning · 3D Navigation
              </p>

              {/* Big heading */}
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-neutral-900 leading-none max-w-3xl">
                Autonomous<br />
                <span className="text-neutral-400">Drone Navigation</span>
              </h1>

              {/* Descriptor */}
              <p className="text-sm text-neutral-500 max-w-xl leading-relaxed font-normal">
                A DQN agent processes LiDAR-like raycasts and makes real-time 3D control decisions.
                Trained over 10,000 episodes with target network sync and shaped reward shaping.
              </p>

              {/* Stats bar */}
              <div className="flex flex-wrap gap-10 pt-6 border-t border-neutral-100">
                {[
                  { value: '10k+',  label: 'Episodes'    },
                  { value: '85%',   label: 'Success Rate' },
                  { value: '6',     label: 'Actions'      },
                  { value: '18',    label: 'Obs Dims'     },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-3xl font-black tracking-tight text-neutral-900 leading-none">
                      {value}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Simulator Grid ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 border border-neutral-200 p-5 bg-neutral-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">
                  Parameters
                </p>
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
              <div className="lg:col-span-3 border border-neutral-200 overflow-hidden">
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

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
                Training Analytics
              </p>
              <h2 className="text-4xl font-black tracking-tighter text-neutral-900">
                Performance Metrics
              </h2>
            </div>
            <MetricsDashboard />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
                Source Files
              </p>
              <h2 className="text-4xl font-black tracking-tighter text-neutral-900">
                Python Codebase
              </h2>
            </div>
            <CodeInspector />
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
                System Design
              </p>
              <h2 className="text-4xl font-black tracking-tighter text-neutral-900">
                Architecture Overview
              </h2>
            </div>
            <ArchitectureOverview />
          </div>
        )}

      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-neutral-300">
          <span>Drone Nav · DQN · 2026</span>
          <span>Gymnasium · PyTorch · Three.js</span>
        </div>
      </footer>
    </div>
  );
}


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
