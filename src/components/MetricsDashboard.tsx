import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, Award, Zap, AlertTriangle } from 'lucide-react';
import { apiUrl } from '../lib/api';

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(apiUrl('/api/metrics'))
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
      <div className="flex items-center justify-center h-64 text-neutral-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mr-3"></div>
        Loading metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
        Error loading metrics: {error}. Make sure the Python backend is running on port 5000.
      </div>
    );
  }

  if (metrics.length === 0) {
    return <div className="text-center p-12 text-neutral-400 text-sm">No metrics data found.</div>;
  }

  const finalMetrics = metrics[metrics.length - 1];
  
  // Calculate average steps of last 50 episodes
  const last50 = metrics.slice(-50);
  const avgSteps = last50.reduce((acc, curr) => acc + curr.steps, 0) / (last50.length || 1);

  return (
    <div className="space-y-8">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border border-neutral-200 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-500">
            <Award className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Success Rate</span>
          </div>
          <div className="text-3xl font-light text-neutral-900">{finalMetrics.successRate.toFixed(1)}%</div>
          <div className="text-[10px] text-neutral-400 uppercase tracking-widest mt-auto pt-2 border-t border-neutral-100">
            Final Goal Success
          </div>
        </div>

        <div className="border border-neutral-200 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-500">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Final Reward</span>
          </div>
          <div className="text-3xl font-light text-neutral-900">{finalMetrics.reward > 0 ? '+' : ''}{finalMetrics.reward}</div>
          <div className="text-[10px] text-neutral-400 uppercase tracking-widest mt-auto pt-2 border-t border-neutral-100">
            Episode {finalMetrics.episode}
          </div>
        </div>

        <div className="border border-neutral-200 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-500">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Avg Steps</span>
          </div>
          <div className="text-3xl font-light text-neutral-900">{Math.round(avgSteps)}</div>
          <div className="text-[10px] text-neutral-400 uppercase tracking-widest mt-auto pt-2 border-t border-neutral-100">
            Last 50 Episodes
          </div>
        </div>

        <div className="border border-neutral-200 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-500">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Epsilon</span>
          </div>
          <div className="text-3xl font-light text-neutral-900">{finalMetrics.epsilon.toFixed(4)}</div>
          <div className="text-[10px] text-neutral-400 uppercase tracking-widest mt-auto pt-2 border-t border-neutral-100">
            Exploration Rate
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Reward Progress */}
        <div className="border border-neutral-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">Episode Reward</h3>
            <span className="text-[10px] text-neutral-400 tracking-widest uppercase">{metrics.length} Points</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="episode" stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '4px', fontSize: '11px', color: '#171717', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="reward" stroke="#171717" strokeWidth={1.5} fillOpacity={1} fill="url(#rewardGrad)" name="Reward" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Success Rate % */}
        <div className="border border-neutral-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">Success Rate</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="episode" stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '4px', fontSize: '11px', color: '#171717', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="successRate" stroke="#171717" strokeWidth={1.5} dot={false} name="Success Rate (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Steps to Goal */}
        <div className="border border-neutral-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">Steps per Episode</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="episode" stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '4px', fontSize: '11px', color: '#171717', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="steps" stroke="#171717" strokeWidth={1.5} dot={false} name="Steps Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Neural Net Loss & Epsilon Decay */}
        <div className="border border-neutral-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">Loss & Epsilon</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="episode" stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#a3a3a3" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '4px', fontSize: '11px', color: '#171717', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#737373' }} />
                <Line yAxisId="left" type="monotone" dataKey="loss" stroke="#171717" strokeWidth={1.5} dot={false} name="Loss" />
                <Line yAxisId="right" type="monotone" dataKey="epsilon" stroke="#737373" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Epsilon" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
