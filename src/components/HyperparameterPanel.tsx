import React from 'react';
import { Sliders, Cpu, Shield, Zap, Box, Database, Sparkles } from 'lucide-react';

interface HyperparameterPanelProps {
  numRays: number;
  setNumRays: (v: number) => void;
  numObstacles: number;
  setNumObstacles: (v: number) => void;
  simSpeed: number;
  setSimSpeed: (v: number) => void;
  mode: 'policy' | 'training' | 'teleop';
  setMode: (m: 'policy' | 'training' | 'teleop') => void;
}

export function HyperparameterPanel({
  numRays,
  setNumRays,
  numObstacles,
  setNumObstacles,
  simSpeed,
  setSimSpeed,
  mode,
  setMode
}: HyperparameterPanelProps) {
  const obsDim = numRays + 8; // num_rays + 3 rel_goal + 3 vel + 1 dist + 1 height_z

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>DQN & Environment Hyperparameters</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamically recalculates input dimensions and sensor resolution
          </p>
        </div>
        <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-lg">
          Obs Vector Dim: {obsDim}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ray Sensors (8 - 16) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="text-slate-300 font-medium">Ray-Cast Sensors</label>
            <span className="text-cyan-400 font-mono font-bold">{numRays} Rays</span>
          </div>
          <input
            type="range"
            min={8}
            max={16}
            step={1}
            value={numRays}
            onChange={e => setNumRays(parseInt(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="text-[11px] text-slate-400">Range: 8 to 16 3D laser probes</div>
        </div>

        {/* Obstacle Density (5 - 30) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="text-slate-300 font-medium">3D Obstacle Spheres</label>
            <span className="text-rose-400 font-mono font-bold">{numObstacles} Spheres</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={numObstacles}
            onChange={e => setNumObstacles(parseInt(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="text-[11px] text-slate-400">Random placement in 100³ box</div>
        </div>

        {/* Simulation Speed */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="text-slate-300 font-medium">Simulation Clock Speed</label>
            <span className="text-amber-400 font-mono font-bold">{simSpeed}x Speed</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`flex-1 py-1 text-xs rounded-md font-medium transition-all ${
                  simSpeed === s ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Agent Operating Mode */}
        <div className="space-y-2">
          <label className="text-xs text-slate-300 font-medium block">Agent Behavior Mode</label>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMode('policy')}
              className={`flex-1 py-1 text-xs rounded-md font-medium transition-all ${
                mode === 'policy' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pre-Trained
            </button>
            <button
              onClick={() => setMode('training')}
              className={`flex-1 py-1 text-xs rounded-md font-medium transition-all ${
                mode === 'training' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live RL Loop
            </button>
          </div>
        </div>
      </div>

      {/* Preset Hyperparameters Summary Badges */}
      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400 font-mono">
        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">Learning Rate (lr): 0.001</span>
        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">Discount (gamma): 0.99</span>
        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">Replay Buffer: 50,000</span>
        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">Batch Size: 64</span>
        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">Target Sync: 500 Steps</span>
      </div>
    </div>
  );
}
