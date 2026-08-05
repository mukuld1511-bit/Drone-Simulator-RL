import React from 'react';

const panelStyle = {
  fontFamily: "'Inter', 'JetBrains Mono', sans-serif",
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export function UI({
  dronePosition = { x: 0, y: 0, z: 0 },
  currentFrame = 0,
  totalFrames = 0,
  isPlaying = false,
  playbackSpeed = 1,
  onPlayToggle = () => {},
  onSpeedChange = () => {},
  onReset = () => {},
  status = 'flying',
  stepCount = 0,
  episodeCount = 1,
  totalReward = 0,
  successCount = 0,
  collisionCount = 0,
  distToGoal = 0,
  lastAction = 'NONE',
  mode = 'live',
}) {
  const statusColors = {
    flying: { bg: '#064e3b', text: '#34d399', dot: '#10b981', label: 'IN FLIGHT' },
    goal_reached: { bg: '#713f12', text: '#fbbf24', dot: '#f59e0b', label: 'GOAL REACHED!' },
    collision: { bg: '#7f1d1d', text: '#fca5a5', dot: '#ef4444', label: 'COLLISION' },
    out_of_bounds: { bg: '#7f1d1d', text: '#fca5a5', dot: '#ef4444', label: 'OUT OF BOUNDS' },
  };
  const st = statusColors[status] || statusColors.flying;

  return (
    <>
      {/* ── Top HUD Bar ── */}
      <div style={{
        ...panelStyle,
        position: 'absolute', top: 16, left: 16, right: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        background: 'rgba(2, 6, 23, 0.75)', border: '1px solid rgba(51,65,85,0.5)',
        padding: '12px 20px', borderRadius: 14,
        color: '#94a3b8', fontSize: 12,
      }}>
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: st.dot,
            boxShadow: `0 0 8px ${st.dot}`, display: 'inline-block',
            animation: status === 'flying' ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{ color: st.text, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 11 }}>
            {st.label}
          </span>

          <span style={{ width: 1, height: 18, background: '#1e293b', margin: '0 6px' }} />
          <span>Ep <strong style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>{episodeCount}</strong></span>
          <span>Step <strong style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>{stepCount}</strong></span>
          <span>Action <strong style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>{lastAction}</strong></span>
        </div>

        {/* Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#34d399', fontSize: 11,
          }}>
            ✓ {successCount}
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: 11,
          }}>
            ✕ {collisionCount}
          </div>
        </div>
      </div>

      {/* ── Bottom Control Bar ── */}
      <div style={{
        ...panelStyle,
        position: 'absolute', bottom: 16, left: 16, right: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
        background: 'rgba(2, 6, 23, 0.85)', border: '1px solid rgba(51,65,85,0.5)',
        padding: '14px 20px', borderRadius: 14,
      }}>
        {/* Play / Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onPlayToggle} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 12, fontFamily: 'Inter, sans-serif',
            background: isPlaying ? 'linear-gradient(135deg, #e11d48, #be123c)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            boxShadow: isPlaying ? '0 0 16px rgba(225,29,72,0.4)' : '0 0 16px rgba(16,185,129,0.4)',
            transition: 'all 0.2s',
          }}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <button onClick={onReset} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, border: '1px solid #334155', cursor: 'pointer',
            fontWeight: 500, fontSize: 12, fontFamily: 'Inter, sans-serif',
            background: 'rgba(30,41,59,0.8)', color: '#94a3b8',
            transition: 'all 0.2s',
          }}>
            ↻ Reset
          </button>

          {/* Speed slider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 10,
            background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b',
          }}>
            <span style={{ color: '#64748b', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Speed</span>
            <input
              type="range" min="0.5" max="4" step="0.5" value={playbackSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              style={{ width: 80, accentColor: '#0ea5e9', cursor: 'pointer' }}
            />
            <span style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, minWidth: 28 }}>
              {playbackSpeed}x
            </span>
          </div>
        </div>

        {/* Real-time telemetry */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94a3b8',
        }}>
          <span>
            Pos <span style={{ color: '#38bdf8' }}>
              [{dronePosition.x?.toFixed?.(1) ?? '—'}, {dronePosition.y?.toFixed?.(1) ?? '—'}, {dronePosition.z?.toFixed?.(1) ?? '—'}]
            </span>
          </span>
          <span>
            Goal <span style={{ color: '#fbbf24' }}>{distToGoal?.toFixed?.(1) ?? '—'}m</span>
          </span>
          <span>
            Reward <span style={{ color: totalReward >= 0 ? '#34d399' : '#fca5a5' }}>{totalReward?.toFixed?.(1) ?? '0'}</span>
          </span>
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
