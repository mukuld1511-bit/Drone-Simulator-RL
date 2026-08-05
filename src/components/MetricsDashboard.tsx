import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, Award, Zap, AlertTriangle } from 'lucide-react';

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/metrics')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metrics');
        return res.json();
      })
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mr-3"></div>
        Loading real training metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-xl">
        Error loading metrics: {error}. Make sure the Python backend is running on port 5000 and proxy is set up.
      </div>
    );
  }

  if (metrics.length === 0) {
    return <div className="text-center p-12 text-slate-400">No metrics data found.</div>;
  }

  const finalMetrics = metrics[metrics.length - 1];
  
  // Calculate average steps of last 50 episodes
  const last50 = metrics.slice(-50);
  const avgSteps = last50.reduce((acc, curr) => acc + curr.steps, 0) / (last50.length || 1);

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
            <div className="text-2xl font-bold text-slate-100 font-mono">{finalMetrics.successRate.toFixed(1)}%</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>Real data from training</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="p-3 bg-cyan-950/80 text-cyan-400 rounded-lg border border-cyan-800/50">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Final Episode Reward</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{finalMetrics.reward > 0 ? '+' : ''}{finalMetrics.reward}</div>
            <div className="text-[11px] text-cyan-400 flex items-center gap-1 mt-0.5">
              <span>At episode {finalMetrics.episode}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="p-3 bg-amber-950/80 text-amber-400 rounded-lg border border-amber-800/50">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Average Steps to Goal</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{Math.round(avgSteps)} steps</div>
            <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
              <span>Based on last 50 episodes</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="p-3 bg-purple-950/80 text-purple-400 rounded-lg border border-purple-800/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Epsilon Exploration Rate</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{finalMetrics.epsilon.toFixed(4)}</div>
            <div className="text-[11px] text-purple-400 flex items-center gap-1 mt-0.5">
              <span>Final decay value</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Reward Progress */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Episode Reward Curve</h3>
              <p className="text-xs text-slate-400">Real training rewards over time</p>
            </div>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-1 rounded-md">
              {metrics.length} Points
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="episode" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
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
              <p className="text-xs text-slate-400">Rolling average of successes</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
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
              <h3 className="text-sm font-semibold text-slate-200">Steps per Episode</h3>
              <p className="text-xs text-slate-400">Total moves taken per run</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="episode" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="steps" stroke="#f59e0b" strokeWidth={1} dot={false} name="Steps Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Neural Net Loss & Epsilon Decay */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Loss & Exploration Decay</h3>
              <p className="text-xs text-slate-400">DQN Loss and Epsilon</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="episode" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#ef4444" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#a855f7" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={1} dot={false} name="Loss" />
                <Line yAxisId="right" type="monotone" dataKey="epsilon" stroke="#a855f7" strokeWidth={2} dot={false} name="Epsilon" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
