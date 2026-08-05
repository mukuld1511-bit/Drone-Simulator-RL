import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { Drone } from './Drone';
import { Ground, Obstacles, GoalBeacon, WorldBounds } from './Environment';
import { UI } from './UI';
import { resetEnvironmentFromAPI, predictStepFromAPI } from '../utils/trajectoryLoader';

/* ════════════════════════════════════════════════════════════
   HERO SECTION — Light theme, drone image, animated badges
   ════════════════════════════════════════════════════════════ */
function HeroSection({ onLaunch }) {
  const [visible, setVisible] = useState(true);

  const handleLaunch = () => {
    setVisible(false);
    setTimeout(onLaunch, 500);
  };

  const stats = [
    { label: 'Episodes Trained', value: '10,000', icon: '🧠' },
    { label: 'Success Rate', value: '~85%', icon: '🎯' },
    { label: 'Architecture', value: 'DQN', icon: '🔬' },
    { label: 'Environment', value: '3D Obstacles', icon: '🌍' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 40%, #e0f2fe 100%)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-30px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      pointerEvents: visible ? 'all' : 'none',
      overflowY: 'auto',
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🚁</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: -0.5 }}>
            DroneRL
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['PyTorch', 'DQN', 'Gymnasium', 'Three.js'].map(t => (
            <span key={t} style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
            }}>{t}</span>
          ))}
        </div>
      </nav>

      {/* Hero Content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 60px', gap: 60, flexWrap: 'wrap',
      }}>
        {/* Left — Text */}
        <div style={{ maxWidth: 520, flex: '1 1 400px' }}>
          <div style={{
            display: 'inline-block', padding: '5px 14px', borderRadius: 999,
            background: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
            color: '#4338ca', fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
            marginBottom: 20,
          }}>
            DEEP REINFORCEMENT LEARNING
          </div>

          <h1 style={{
            fontSize: 52, fontWeight: 900, lineHeight: 1.1, color: '#0f172a',
            letterSpacing: -2, margin: 0,
          }}>
            Autonomous
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1, #f97316)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Drone Navigation
            </span>
          </h1>

          <p style={{
            fontSize: 17, color: '#64748b', marginTop: 20, lineHeight: 1.7, maxWidth: 440,
          }}>
            A Deep Q-Network agent trained for <strong style={{ color: '#0f172a' }}>10,000 episodes</strong> to
            autonomously navigate a 3D obstacle field. Watch the trained neural network make real-time
            decisions in a live WebGL environment.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button onClick={handleLaunch} style={{
              padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(14,165,233,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(14,165,233,0.45)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(14,165,233,0.35)'; }}
            >
              🚀 Launch 3D Visualization
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 40,
          }}>
            {stats.map(s => (
              <div key={s.label} style={{
                padding: '14px 12px', borderRadius: 12,
                background: '#ffffff', border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Drone Image */}
        <div style={{
          flex: '1 1 380px', maxWidth: 500, display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <div style={{
            position: 'relative',
            animation: 'heroFloat 4s ease-in-out infinite',
          }}>
            {/* Glow ring behind drone */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 320, height: 320,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
              animation: 'pulseGlow 3s ease-in-out infinite',
            }} />
            <img
              src="/drone_hero.png"
              alt="AI Drone"
              style={{
                width: '100%', maxWidth: 420, height: 'auto',
                position: 'relative', zIndex: 2,
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div style={{
        padding: '16px 40px', borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'center', gap: 32,
        color: '#94a3b8', fontSize: 12,
      }}>
        <span>Built with PyTorch + React + Three.js</span>
        <span>•</span>
        <span>Deep Reinforcement Learning Project</span>
      </div>

      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN VISUALIZER
   ════════════════════════════════════════════════════════════ */
export function DroneVisualizer() {
  const [launched, setLaunched] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const [dronePos, setDronePos] = useState({ x: 15, y: 15, z: 15 });
  const [goalPos, setGoalPos] = useState([80, 80, 80]);
  const [obstacles, setObstacles] = useState([]);
  const [trajectory, setTrajectory] = useState([]);
  const [status, setStatus] = useState('flying');
  const [stepCount, setStepCount] = useState(0);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [collisionCount, setCollisionCount] = useState(0);
  const [distToGoal, setDistToGoal] = useState(0);
  const [lastAction, setLastAction] = useState('NONE');

  const processingRef = useRef(false);
  const statusRef = useRef('flying');
  const actionNames = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];

  const resetEnv = useCallback(async () => {
    try {
      const data = await resetEnvironmentFromAPI();
      const dp = data.drone_pos;
      const gp = data.goal_pos;
      setDronePos({ x: dp[0], y: dp[1], z: dp[2] });
      setGoalPos(gp);
      setObstacles(data.obstacles || []);
      setTrajectory([[dp[0], dp[1], dp[2]]]);
      setStatus('flying');
      statusRef.current = 'flying';
      setStepCount(0);
      setTotalReward(0);
      setLastAction('RESET');
      setDistToGoal(Math.hypot(gp[0] - dp[0], gp[1] - dp[1], gp[2] - dp[2]));
      setEpisodeCount(prev => prev + 1);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  }, []);

  const executeStep = useCallback(async () => {
    if (statusRef.current !== 'flying' || processingRef.current) return;
    processingRef.current = true;
    try {
      const data = await predictStepFromAPI('policy');
      const np = data.drone_pos;
      setDronePos({ x: np[0], y: np[1], z: np[2] });
      setTrajectory(prev => [...prev.slice(-200), [np[0], np[1], np[2]]]);
      setStepCount(prev => prev + 1);
      setTotalReward(prev => prev + data.reward);
      setLastAction(actionNames[data.action] || '?');

      if (data.goal_reached) {
        setStatus('goal_reached'); statusRef.current = 'goal_reached';
        setSuccessCount(prev => prev + 1);
        setTimeout(resetEnv, 1500);
      } else if (data.collision) {
        setStatus('collision'); statusRef.current = 'collision';
        setCollisionCount(prev => prev + 1);
        setTimeout(resetEnv, 1500);
      } else if (data.terminated || data.truncated) {
        setStatus('out_of_bounds'); statusRef.current = 'out_of_bounds';
        setCollisionCount(prev => prev + 1);
        setTimeout(resetEnv, 1500);
      }
    } catch (err) {
      console.error('Predict failed:', err);
    } finally {
      processingRef.current = false;
    }
  }, [resetEnv]);

  useEffect(() => {
    if (!isPlaying) return;
    const ms = Math.max(30, Math.floor(150 / playbackSpeed));
    const timer = setInterval(executeStep, ms);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, executeStep]);

  useEffect(() => {
    if (launched) resetEnv().then(() => setIsPlaying(true));
  }, [launched, resetEnv]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#0a0e17' }}>
      {/* Hero — shown before launch */}
      {!launched && <HeroSection onLaunch={() => setLaunched(true)} />}

      {/* 3D Canvas */}
      <Canvas shadows style={{ position: 'absolute', inset: 0 }}>
        <PerspectiveCamera makeDefault position={[130, 90, 140]} fov={50} />
        <OrbitControls target={[50, 30, 50]} enableDamping dampingFactor={0.05} />
        <color attach="background" args={['#0a0e17']} />
        <fog attach="fog" args={['#0a0e17', 80, 250]} />
        <Stars radius={200} depth={60} count={1500} factor={4} saturation={0.5} fade speed={1} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[80, 120, 60]} intensity={1.5} castShadow />
        <pointLight position={[dronePos.x, dronePos.y + 3, dronePos.z]} color="#38bdf8" intensity={3} distance={30} />
        <Ground />
        <WorldBounds />
        <GoalBeacon position={goalPos} />
        <Obstacles obstacles={obstacles} />
        <Drone position={dronePos} trail={trajectory} />
      </Canvas>

      {/* UI overlay — only after launch */}
      {launched && (
        <UI
          dronePosition={dronePos}
          currentFrame={stepCount}
          totalFrames={stepCount}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onPlayToggle={() => setIsPlaying(p => !p)}
          onSpeedChange={setPlaybackSpeed}
          onReset={resetEnv}
          status={status}
          stepCount={stepCount}
          episodeCount={episodeCount}
          totalReward={totalReward}
          successCount={successCount}
          collisionCount={collisionCount}
          distToGoal={distToGoal}
          lastAction={lastAction}
        />
      )}
    </div>
  );
}
