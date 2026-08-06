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
    <div className="min-h-screen bg-transparent text-white selection:bg-[#ff5500] selection:text-white">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-widest uppercase text-white drop-shadow-[0_0_10px_rgba(255,85,0,0.5)]">
              DroneNav
            </span>
            <span className="hidden sm:inline text-[10px] font-medium text-[#ff5500] uppercase tracking-widest border border-[#ff5500]/30 bg-[#ff5500]/10 px-2 py-0.5 rounded-full">
              DQN · v1.0
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all rounded-full ${
                  activeTab === tab.id
                    ? 'bg-[#ff5500] text-black shadow-[0_0_15px_rgba(255,85,0,0.4)]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
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
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ff5500] drop-shadow-[0_0_8px_rgba(255,85,0,0.5)]">
                Deep Reinforcement Learning · 3D Navigation
              </p>

              {/* Big heading */}
              <h1 className="text-6xl sm:text-7xl font-display font-black tracking-tighter leading-[0.9] max-w-4xl">
                <span className="text-white">Autonomous</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] to-[#ffaa00] drop-shadow-[0_0_20px_rgba(255,85,0,0.3)]">Drone Navigation</span>
              </h1>

              {/* Descriptor */}
              <p className="text-sm text-neutral-400 max-w-xl leading-relaxed font-light">
                A DQN agent processes LiDAR-like raycasts and makes real-time 3D control decisions.
                Trained over 10,000 episodes with target network sync and shaped reward shaping.
              </p>

              {/* Stats bar */}
              <div className="flex flex-wrap gap-10 pt-8 border-t border-white/10">
                {[
                  { value: '10k+',  label: 'Episodes'    },
                  { value: '85%',   label: 'Success Rate' },
                  { value: '6',     label: 'Actions'      },
                  { value: '18',    label: 'Obs Dims'     },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-4xl font-display font-black tracking-tight text-white leading-none">
                      {value}
                    </span>
                    <span className="text-[10px] font-bold text-[#ff5500] uppercase tracking-widest">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Simulator Grid ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 glass-panel p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#ff5500] mb-4">
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
              <div className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,85,0,0.05)] border border-[#ff5500]/20">
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
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff5500] mb-2">
                Training Analytics
              </p>
              <h2 className="text-4xl font-display font-black tracking-tighter text-white">
                Performance Metrics
              </h2>
            </div>
            <MetricsDashboard />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff5500] mb-2">
                Source Files
              </p>
              <h2 className="text-4xl font-display font-black tracking-tighter text-white">
                Python Codebase
              </h2>
            </div>
            <CodeInspector />
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff5500] mb-2">
                System Design
              </p>
              <h2 className="text-4xl font-display font-black tracking-tighter text-white">
                Architecture Overview
              </h2>
            </div>
            <ArchitectureOverview />
          </div>
        )}

      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/10 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          <span>Drone Nav · DQN · 2026</span>
          <span className="text-[#ff5500]/50">Gymnasium · PyTorch · Three.js</span>
        </div>
      </footer>
    </div>
  );
}

