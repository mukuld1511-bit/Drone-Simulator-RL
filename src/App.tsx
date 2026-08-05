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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
      {/* Navigation Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 border border-sky-200 rounded-xl text-sky-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Autonomous Drone Navigation</span>
                <span className="text-[10px] font-mono bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full uppercase">
                  Deep RL (DQN)
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">3D Gymnasium Env, PyTorch Agent & 8 Complete Deliverables</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab('sim')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'sim' ? 'bg-white text-sky-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>3D WebGL Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'metrics' ? 'bg-white text-sky-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Training Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'code' ? 'bg-white text-sky-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Python Code (8 Files)</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'docs' ? 'bg-white text-sky-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="max-w-xl">
                <div className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold tracking-wide mb-4">
                  DEEP REINFORCEMENT LEARNING
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                  Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">Drone Navigation</span>
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  A Deep Q-Network agent trained for 10,000 episodes to autonomously navigate a 3D obstacle field. Watch the trained neural network make real-time decisions below in the WebGL canvas.
                </p>
                <div className="flex gap-4">
                  <div className="text-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    <div className="text-xl font-bold text-slate-800">10k+</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Episodes</div>
                  </div>
                  <div className="text-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    <div className="text-xl font-bold text-slate-800">85%</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Success</div>
                  </div>
                </div>
              </div>
              <div className="relative mt-8 md:mt-0">
                <div className="absolute inset-0 bg-sky-100 blur-3xl opacity-50 rounded-full w-64 h-64 m-auto"></div>
                <img src="/drone_hero.png" alt="Drone" className="relative z-10 w-80 drop-shadow-2xl animate-[float_4s_ease-in-out_infinite]" />
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                  }
                `}</style>
              </div>
            </div>

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
