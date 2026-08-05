import React from 'react';
import { Cpu, Layers, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';

export function ArchitectureOverview() {
  return (
    <div className="space-y-6 text-slate-300">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2.5 text-cyan-400 font-semibold text-sm">
            <Cpu className="w-5 h-5" />
            <span>Q-Network Architecture</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-Layer Perceptron (MLP) taking an observation vector of dimension <strong>18–24</strong> (Ray distances + Rel goal coordinates + Velocity + Altitude) and mapping through <code>Dense(128, ReLU) → Dense(64, ReLU) → Dense(6, Linear)</code> representing Q-values for translational actions.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm">
            <Layers className="w-5 h-5" />
            <span>Gymnasium Physics Environment</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inherits <code>gymnasium.Env</code> in a 3D bounding box (100×100×100). Implements continuous sphere-ray casting collision detection with zero-division protection (<code>eps = 1e-9</code>).
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
            <Award className="w-5 h-5" />
            <span>Shaped Reward Function</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sparse terminal rewards (+100 for Goal, -100 for Collision/Out-of-Bounds) combined with dense distance-progress deltas (+1.0 closer, -1.0 farther) and small per-step penalty (-0.1) for optimal pathing.
          </p>
        </div>
      </div>

      {/* Equations & Specifications Table */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Deep Q-Learning Update Rule & State Representation</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono">
            <div className="text-cyan-300 font-bold border-b border-slate-800 pb-1">Observation Vector Formula</div>
            <div className="text-slate-300">
              {"S_t = [ d_1, d_2, ..., d_k, (x_g - x_d), (y_g - y_d), (z_g - z_d), v_x, v_y, v_z, ||p_g - p_d||, z_d ]"}
            </div>
            <div className="text-[11px] text-slate-400">
              where d_i are 10 ray sensor distances, (p_g - p_d) is relative goal vector, v is velocity, and z_d is altitude.
            </div>
          </div>

          <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono">
            <div className="text-emerald-300 font-bold border-b border-slate-800 pb-1">DQN Temporal Difference Bellman Equation</div>
            <div className="text-slate-300">
              {"L(θ) = E[ ( r + γ max_{a'} Q(s', a'; θ_target) - Q(s, a; θ) )^2 ]"}
            </div>
            <div className="text-[11px] text-slate-400">
              Target network θ^- updated every 500 environment steps. Epsilon decayed exponentially from 1.0 to 0.05.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
