import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, Award, Zap, AlertTriangle, RefreshCw } from 'lucide-react';

export function MetricsDashboard() {
  const [dataPoints, setDataPoints] = useState(500);

  // Generate synthetic training episode analytics matching 10,000 episode DQN convergence profile
  const mockMetrics = useMemo(() => {
    const data = [];
    let rewardAcc = -150;
    let successRate = 5;
    let epsilon = 1.0;
    
    for (let i = 1; i <= dataPoints; i++) {
      const ep = Math.round((i / dataPoints) * 10000);
      const progress = i / dataPoints;

      // Reward curve approaching +85 average
      const targetReward = 85;
      rewardAcc += (targetReward - rewardAcc) * 0.008 + (Math.random() - 0.5) * 20;

      // Success rate curve rising to 94%
      const targetSuccess = 94;
      successRate += (targetSuccess - successRate) * 0.006 + (Math.random() - 0.5) * 3;
      successRate = Math.min(100, Math.max(0, successRate));

      // Steps decrease as path efficiency improves
      const steps = Math.round(180 - progress * 130 + (Math.random() - 0.5) * 25);

      // Loss curve stabilizes around 0.12
      const loss = Math.max(0.05, 4.5 * Math.exp(-progress * 5) + (Math.random() * 0.15));

      // Epsilon decay
      epsilon = Math.max(0.05, 1.0 * Math.pow(0.9995, ep));

      data.push({
        episode: ep,
        reward: Math.round(rewardAcc * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
        steps: Math.max(25, steps),
        loss: Math.round(loss * 1000) / 1000,
        epsilon: Math.round(epsilon * 1000) / 1000
      });
    }
    return data;
  }, [dataPoints]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-950/80 text-emerald-400 rounded-lg border border-emerald-800/50">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Final Goal Success Rate</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">94.2%</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>↑ +89.2% from initial random</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="p-3 bg-cyan-950/80 text-cyan-400 rounded-lg border border-cyan-800/50">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Mean Episode Reward</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">+84.5</div>
            <div className="text-[11px] text-cyan-400 flex items-center gap-1 mt-0.5">
              <span>Converged at Ep 7,500</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="p-3 bg-amber-950/80 text-amber-400 rounded-lg border border-amber-800/50">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Average Steps to Goal</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">48 steps</div>
            <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
              <span>~73.3% optimal path ratio</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="p-3 bg-purple-950/80 text-purple-400 rounded-lg border border-purple-800/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Epsilon Exploration Rate</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">0.05</div>
            <div className="text-[11px] text-purple-400 flex items-center gap-1 mt-0.5">
              <span>Minimum bound reached</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Reward Progress over 10,000 Episodes */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Episode Reward Curve</h3>
              <p className="text-xs text-slate-400">Target +100 for Goal, -100 for Collision</p>
            </div>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-1 rounded-md">
              10,000 Episodes
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMetrics}>
                <defs>
                  <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="episode" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[-150, 120]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="reward" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#rewardGrad)" name="Reward" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Success Rate % */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Goal Success Rate (%)</h3>
              <p className="text-xs text-slate-400">100-Episode Moving Average</p>
            </div>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded-md">
              Target 90%+
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="episode" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={2.5} dot={false} name="Success Rate (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Steps to Goal */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Path Efficiency (Steps Count)</h3>
              <p className="text-xs text-slate-400">Fewer steps indicate direct optimal trajectory</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="episode" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="steps" stroke="#f59e0b" strokeWidth={2} dot={false} name="Steps Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Neural Net Loss & Epsilon Decay */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Loss & Exploration Decay</h3>
              <p className="text-xs text-slate-400">MSE Loss convergence and Epsilon schedule</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="episode" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} name="DQN Loss" />
                <Line type="monotone" dataKey="epsilon" stroke="#a855f7" strokeWidth={2} dot={false} name="Epsilon Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
