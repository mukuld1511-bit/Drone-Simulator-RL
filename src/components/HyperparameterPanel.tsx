import React from 'react';

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
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-neutral-200 pb-4">
        <h3 className="text-sm font-semibold text-neutral-900 tracking-wide uppercase">
          Controls
        </h3>
        <p className="text-xs text-neutral-500">
          Environment and hyperparameter tuning
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Ray Sensors */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="text-neutral-700 font-medium">Ray-Cast Sensors</label>
            <span className="text-neutral-900 font-mono">{numRays}</span>
          </div>
          <input
            type="range"
            min={8}
            max={16}
            step={1}
            value={numRays}
            onChange={e => setNumRays(parseInt(e.target.value))}
            className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
          />
        </div>

        {/* Obstacle Density */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="text-neutral-700 font-medium">3D Obstacles</label>
            <span className="text-neutral-900 font-mono">{numObstacles}</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={numObstacles}
            onChange={e => setNumObstacles(parseInt(e.target.value))}
            className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
          />
        </div>

        {/* Simulation Speed */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="text-neutral-700 font-medium">Clock Speed</label>
            <span className="text-neutral-900 font-mono">{simSpeed}x</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`flex-1 py-1.5 text-xs border rounded-md transition-colors ${
                  simSpeed === s ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-transparent text-neutral-500 hover:border-neutral-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Agent Mode */}
        <div className="space-y-2">
          <label className="text-xs text-neutral-700 font-medium block">Behavior Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('policy')}
              className={`flex-1 py-1.5 text-xs border rounded-md transition-colors ${
                mode === 'policy' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-transparent text-neutral-500 hover:border-neutral-300'
              }`}
            >
              Pre-Trained
            </button>
            <button
              onClick={() => setMode('training')}
              className={`flex-1 py-1.5 text-xs border rounded-md transition-colors ${
                mode === 'training' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-transparent text-neutral-500 hover:border-neutral-300'
              }`}
            >
              Live RL Loop
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-200 space-y-2">
        <h4 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
          Hyperparameters
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-600">
          <div className="flex justify-between"><span>Obs Dim</span><span className="text-neutral-900">{obsDim}</span></div>
          <div className="flex justify-between"><span>LR</span><span className="text-neutral-900">0.001</span></div>
          <div className="flex justify-between"><span>Gamma</span><span className="text-neutral-900">0.99</span></div>
          <div className="flex justify-between"><span>Batch</span><span className="text-neutral-900">64</span></div>
        </div>
      </div>
    </div>
  );
}
