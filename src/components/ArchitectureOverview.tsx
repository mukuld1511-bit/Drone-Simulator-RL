import React from 'react';
import { Cpu, Layers, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';

export function ArchitectureOverview() {
  return (
    <div className="space-y-8 text-neutral-800">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-neutral-200 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-neutral-900 font-medium tracking-tight">
            <Cpu className="w-4 h-4" />
            <span>Q-Network Architecture</span>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Multi-Layer Perceptron (MLP) taking an observation vector of dimension <strong>18–24</strong> (Ray distances + Rel goal coordinates + Velocity + Altitude) and mapping through <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs text-neutral-900">Dense(128, ReLU) → Dense(64, ReLU) → Dense(6, Linear)</code> representing Q-values for translational actions.
          </p>
        </div>

        <div className="border border-neutral-200 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-neutral-900 font-medium tracking-tight">
            <Layers className="w-4 h-4" />
            <span>Gymnasium Physics Environment</span>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Inherits <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs text-neutral-900">gymnasium.Env</code> in a 3D bounding box (100×100×100). Implements continuous sphere-ray casting collision detection with zero-division protection (<code className="bg-neutral-100 px-1 py-0.5 rounded text-xs text-neutral-900">eps = 1e-9</code>).
          </p>
        </div>

        <div className="border border-neutral-200 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-neutral-900 font-medium tracking-tight">
            <Award className="w-4 h-4" />
            <span>Shaped Reward Function</span>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Sparse terminal rewards (+100 for Goal, -100 for Collision/Out-of-Bounds) combined with dense distance-progress deltas (+1.0 closer, -1.0 farther) and small per-step penalty (-0.1) for optimal pathing.
          </p>
        </div>
      </div>

      {/* Equations & Specifications Table */}
      <div className="border border-neutral-200 p-8 flex flex-col gap-6">
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-200 pb-4">
          <FileText className="w-4 h-4" />
          <span>Update Rule & State Representation</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
          <div className="flex flex-col gap-3 font-mono">
            <div className="text-neutral-900 font-medium uppercase tracking-widest text-xs">Observation Vector Formula</div>
            <div className="bg-neutral-50 p-4 border border-neutral-200 text-neutral-800">
              {"S_t = [ d_1, d_2, ..., d_k, (x_g - x_d), (y_g - y_d), (z_g - z_d), v_x, v_y, v_z, ||p_g - p_d||, z_d ]"}
            </div>
            <div className="text-xs text-neutral-500 font-sans">
              where d_i are 10 ray sensor distances, (p_g - p_d) is relative goal vector, v is velocity, and z_d is altitude.
            </div>
          </div>

          <div className="flex flex-col gap-3 font-mono">
            <div className="text-neutral-900 font-medium uppercase tracking-widest text-xs">Temporal Difference Bellman Equation</div>
            <div className="bg-neutral-50 p-4 border border-neutral-200 text-neutral-800">
              {"L(θ) = E[ ( r + γ max_{a'} Q(s', a'; θ_target) - Q(s, a; θ) )^2 ]"}
            </div>
            <div className="text-xs text-neutral-500 font-sans">
              Target network θ^- updated every 500 environment steps. Epsilon decayed exponentially from 1.0 to 0.05.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
