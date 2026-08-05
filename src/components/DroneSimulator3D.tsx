import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Compass, ShieldAlert, Target, Zap, Cpu, Eye } from 'lucide-react';

interface Obstacle {
  id: number;
  position: [number, number, number];
  radius: number;
}

export interface SimState {
  dronePos: [number, number, number];
  droneVel: [number, number, number];
  goalPos: [number, number, number];
  obstacles: Obstacle[];
  stepCount: number;
  episodeCount: number;
  distToGoal: number;
  lastActionName: string;
  lastReward: number;
  totalReward: number;
  status: 'flying' | 'goal_reached' | 'collision' | 'out_of_bounds';
  rayDistances: number[];
  rayVectors: [number, number, number][];
  trajectory: [number, number, number][];
  successCount: number;
  collisionCount: number;
  epsilon: number;
}

export function DroneSimulator3D({
  numRays = 10,
  numObstacles = 15,
  simSpeed = 1,
  mode = 'policy', // 'policy' | 'training' | 'teleop'
  onStateUpdate
}: {
  numRays?: number;
  numObstacles?: number;
  simSpeed?: number;
  mode?: 'policy' | 'training' | 'teleop';
  onStateUpdate?: (state: SimState) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'follow' | 'top'>('orbit');
  const [speedMultiplier, setSpeedMultiplier] = useState(simSpeed);

  // Simulation internal state ref for high performance rendering loop
  const simRef = useRef<SimState>({
    dronePos: [15, 15, 15],
    droneVel: [0, 0, 0],
    goalPos: [80, 80, 80],
    obstacles: [],
    stepCount: 0,
    episodeCount: 1,
    distToGoal: 0,
    lastActionName: 'NONE',
    lastReward: 0,
    totalReward: 0,
    status: 'flying',
    rayDistances: Array(numRays).fill(30),
    rayVectors: [],
    trajectory: [[15, 15, 15]],
    successCount: 0,
    collisionCount: 0,
    epsilon: 1.0,
  });

  const [uiState, setUiState] = useState<SimState>(simRef.current);

  // Generate 3D unit ray directions (Fibonacci sphere)
  const generateRayDirections = useCallback((count: number): [number, number, number][] => {
    const directions: [number, number, number][] = [];
    const phi = Math.PI * (3.0 - Math.sqrt(5.0));
    for (let i = 0; i < count; i++) {
      const y = count > 1 ? 1 - (i / (count - 1)) * 2 : 0;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      directions.push([x, y, z]);
    }
    return directions;
  }, []);

  // Reset World Episode
  const resetEpisode = useCallback(async () => {
    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numObstacles, numRays })
      });
      const data = await response.json();
      
      const startPos = data.drone_pos as [number, number, number];
      const goalPos = data.goal_pos as [number, number, number];
      const newObstacles = data.obstacles as Obstacle[];
      const distToGoal = Math.hypot(goalPos[0] - startPos[0], goalPos[1] - startPos[1], goalPos[2] - startPos[2]);
      const rayDirs = generateRayDirections(numRays);

      const updated: SimState = {
        ...simRef.current,
        dronePos: startPos,
        droneVel: [0, 0, 0],
        goalPos: goalPos,
        obstacles: newObstacles,
        stepCount: 0,
        episodeCount: simRef.current.episodeCount + (simRef.current.stepCount > 0 ? 1 : 0),
        distToGoal,
        lastActionName: 'RESET',
        lastReward: 0,
        totalReward: 0,
        status: 'flying',
        rayVectors: rayDirs,
        rayDistances: Array(numRays).fill(30),
        trajectory: [startPos],
        epsilon: Math.max(0.05, simRef.current.epsilon * 0.995)
      };

      simRef.current = updated;
      setUiState(updated);
      if (onStateUpdate) onStateUpdate(updated);
    } catch (err) {
      console.error("Failed to reset via API:", err);
    }
  }, [numObstacles, numRays, generateRayDirections, onStateUpdate]);

  // Initial setup trigger
  useEffect(() => {
    resetEpisode();
  }, [numObstacles, numRays]);

  // Three.js Render setup
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer - Light Theme!
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.003);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    camera.position.set(130, 120, 160);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(50, 50, 50);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(100, 150, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 80);
    scene.add(pointLight);

    // 100x100x100 Bounding Box Wireframe
    const boxGeo = new THREE.BoxGeometry(100, 100, 100);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });
    const worldBox = new THREE.LineSegments(boxEdges, boxMat);
    worldBox.position.set(50, 50, 50);
    scene.add(worldBox);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(100, 20, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.set(50, 0, 50);
    scene.add(gridHelper);

    // Drone Mesh Construction (Quadcopter Group)
    const droneGroup = new THREE.Group();

    // Central core
    const coreGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    droneGroup.add(core);

    // 4 Arm cross
    const armMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const arm1Geo = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    
    const arm1 = new THREE.Mesh(arm1Geo, armMat);
    arm1.rotation.z = Math.PI / 2;
    arm1.rotation.y = Math.PI / 4;
    droneGroup.add(arm1);

    const arm2 = new THREE.Mesh(arm1Geo, armMat);
    arm2.rotation.z = Math.PI / 2;
    arm2.rotation.y = -Math.PI / 4;
    droneGroup.add(arm2);

    // 4 Rotors
    const propGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.08, 16);
    const propMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const rotors: THREE.Mesh[] = [];

    const rotorOffsets = [
      [1.8, 0.4, 1.8],
      [-1.8, 0.4, 1.8],
      [1.8, 0.4, -1.8],
      [-1.8, 0.4, -1.8]
    ];

    rotorOffsets.forEach(([x, y, z]) => {
      const prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(x, y, z);
      droneGroup.add(prop);
      rotors.push(prop);
    });

    scene.add(droneGroup);

    // Goal Sphere Mesh
    const goalGeo = new THREE.SphereGeometry(5, 24, 24);
    const goalMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      emissive: 0xca8a04,
      emissiveIntensity: 0.5,
      wireframe: false,
      transparent: true,
      opacity: 0.85
    });
    const goalMesh = new THREE.Mesh(goalGeo, goalMat);
    scene.add(goalMesh);

    // Goal outer ring
    const ringGeo = new THREE.RingGeometry(6, 6.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const goalRing = new THREE.Mesh(ringGeo, ringMat);
    scene.add(goalRing);

    // Obstacle Meshes Pool
    const obstacleGroup = new THREE.Group();
    scene.add(obstacleGroup);

    // Ray Sensors Line Segments
    const rayLines: THREE.Line[] = [];
    const maxRays = 16;
    for (let i = 0; i < maxRays; i++) {
      const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 10, 0)]);
      const rayMat = new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2, transparent: true, opacity: 0.7 });
      const rayLine = new THREE.Line(rayGeo, rayMat);
      scene.add(rayLine);
      rayLines.push(rayLine);
    }

    // Trajectory Path Line
    const trajGeo = new THREE.BufferGeometry();
    const trajMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 3 });
    const trajLine = new THREE.Line(trajGeo, trajMat);
    scene.add(trajLine);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation / Physics Loop
    let animationFrameId: number;
    let stepTimer = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate quadcopter rotors
      rotors.forEach(r => {
        r.rotation.y += 0.4;
      });

      // Goal ring pulsing
      goalRing.rotation.x += 0.01;
      goalRing.rotation.y += 0.02;

      // Update positions from state ref
      const s = simRef.current;
      droneGroup.position.set(s.dronePos[0], s.dronePos[1], s.dronePos[2]);
      pointLight.position.set(s.dronePos[0], s.dronePos[1] + 2, s.dronePos[2]);

      goalMesh.position.set(s.goalPos[0], s.goalPos[1], s.goalPos[2]);
      goalRing.position.set(s.goalPos[0], s.goalPos[1], s.goalPos[2]);

      // Re-populate obstacle meshes if list changed (Convert red spheres to Trees)
      if (obstacleGroup.children.length !== s.obstacles.length) {
        while (obstacleGroup.children.length > 0) {
          obstacleGroup.remove(obstacleGroup.children[0]);
        }
        s.obstacles.forEach(obs => {
          const treeGroup = new THREE.Group();
          
          // Trunk
          const trunkHeight = obs.radius * 1.5;
          const trunkGeo = new THREE.CylinderGeometry(obs.radius * 0.2, obs.radius * 0.3, trunkHeight);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = trunkHeight / 2;
          trunk.castShadow = true;
          treeGroup.add(trunk);

          // Leaves
          const leafGeo = new THREE.SphereGeometry(obs.radius, 16, 16);
          const leafMat = new THREE.MeshStandardMaterial({ 
            color: 0x22c55e, 
            roughness: 0.8,
            transparent: true,
            opacity: 0.9
          });
          const leaves = new THREE.Mesh(leafGeo, leafMat);
          leaves.position.y = trunkHeight + obs.radius * 0.5;
          leaves.castShadow = true;
          treeGroup.add(leaves);

          treeGroup.position.set(obs.position[0], 0, obs.position[2]); // Place on ground
          obstacleGroup.add(treeGroup);
        });
      }

      // Update Ray Sensor Visualizers
      const rayDirs = s.rayVectors;
      for (let i = 0; i < maxRays; i++) {
        const line = rayLines[i];
        if (i < rayDirs.length) {
          line.visible = true;
          const dir = rayDirs[i];
          const dist = s.rayDistances[i] || 30.0;
          const endP = new THREE.Vector3(
            s.dronePos[0] + dir[0] * dist,
            s.dronePos[1] + dir[1] * dist,
            s.dronePos[2] + dir[2] * dist
          );
          line.geometry.setFromPoints([new THREE.Vector3(...s.dronePos), endP]);

          // Color coding: green (far), yellow (med), red (danger)
          const mat = line.material as THREE.LineBasicMaterial;
          if (dist < 8) mat.color.setHex(0xef4444);
          else if (dist < 18) mat.color.setHex(0xeab308);
          else mat.color.setHex(0x22c55e);
        } else {
          line.visible = false;
        }
      }

      // Update Trajectory path
      if (s.trajectory.length > 1) {
        const points = s.trajectory.map(p => new THREE.Vector3(p[0], p[1], p[2]));
        trajLine.geometry.setFromPoints(points);
      }

      // Camera view update
      if (cameraMode === 'follow') {
        controls.target.set(s.dronePos[0], s.dronePos[1], s.dronePos[2]);
        camera.position.set(s.dronePos[0] - 25, s.dronePos[1] + 15, s.dronePos[2] - 25);
      } else if (cameraMode === 'top') {
        controls.target.set(50, 0, 50);
        camera.position.set(50, 160, 50);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cameraMode]);

  // Physics Simulation Step execution via API
  const executeStep = useCallback(async () => {
    const s = simRef.current;
    if (s.status !== 'flying') {
      return;
    }

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await response.json();
      
      const actionIndex = data.action;
      const newPos = data.drone_pos as [number, number, number];
      const reward = data.reward;
      const goalReached = data.goal_reached;
      const collision = data.collision;
      
      const actionNames = ['+X (Forward)', '-X (Backward)', '+Y (Right)', '-Y (Left)', '+Z (Ascend)', '-Z (Descend)'];
      const currentDist = Math.hypot(s.goalPos[0] - newPos[0], s.goalPos[1] - newPos[1], s.goalPos[2] - newPos[2]);
      
      let status: SimState['status'] = 'flying';
      let successCount = s.successCount;
      let collisionCount = s.collisionCount;

      if (goalReached) {
        status = 'goal_reached';
        successCount += 1;
      } else if (collision || data.terminated || data.truncated) {
        status = collision ? 'collision' : 'out_of_bounds';
        collisionCount += 1;
      }

      const updated: SimState = {
        ...s,
        dronePos: newPos,
        droneVel: [newPos[0] - s.dronePos[0], newPos[1] - s.dronePos[1], newPos[2] - s.dronePos[2]],
        stepCount: s.stepCount + 1,
        distToGoal: currentDist,
        lastActionName: actionNames[actionIndex] || 'NONE',
        lastReward: reward,
        totalReward: s.totalReward + reward,
        status,
        trajectory: [...s.trajectory, newPos],
        successCount,
        collisionCount
      };

      simRef.current = updated;
      setUiState(updated);
      if (onStateUpdate) onStateUpdate(updated);

      if (status !== 'flying') {
        setTimeout(() => {
          resetEpisode();
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to execute step via API:", err);
      setIsPlaying(false);
    }
  }, [mode, resetEpisode, onStateUpdate]);

  // Ticking effect driven by speedMultiplier and play state
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(20, Math.floor(150 / speedMultiplier));
    
    let isProcessing = false;
    const timer = setInterval(async () => {
      if (isProcessing) return;
      isProcessing = true;
      await executeStep();
      isProcessing = false;
    }, intervalMs);
    
    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, executeStep]);

  return (
    <div className="relative w-full h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Overlay Stats Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200 text-xs shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${uiState.status === 'flying' ? 'bg-emerald-400' : uiState.status === 'goal_reached' ? 'bg-amber-400' : 'bg-rose-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${uiState.status === 'flying' ? 'bg-emerald-500' : uiState.status === 'goal_reached' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="font-semibold text-slate-800 uppercase tracking-wider">
              {uiState.status === 'flying' ? 'In Flight' : uiState.status === 'goal_reached' ? 'GOAL REACHED! (+100)' : 'COLLISION / OOB (-100)'}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-300 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-3 text-slate-600">
            <span>Ep: <strong className="text-slate-900 font-mono">{uiState.episodeCount}</strong></span>
            <span>Step: <strong className="text-slate-900 font-mono">{uiState.stepCount}</strong></span>
            <span>Action: <strong className="text-sky-600 font-mono">{uiState.lastActionName}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-700">
            <Target className="w-3.5 h-3.5" />
            <span>Successes: <strong className="font-mono text-emerald-600">{uiState.successCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-rose-700">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Collisions: <strong className="font-mono text-rose-600">{uiState.collisionCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200 text-xs shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-medium transition-all shadow-md active:scale-95 ${isPlaying ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          
          {/* Speed Slider */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-mono text-[10px] uppercase">Speed</span>
            <input 
              type="range" 
              min="0.5" 
              max="4" 
              step="0.5"
              value={speedMultiplier}
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-sky-600 font-mono text-xs w-6">{speedMultiplier}x</span>
          </div>

          <button
            onClick={resetEpisode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all active:scale-95 border border-slate-300 ml-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Env</span>
          </button>
        </div>

        {/* Camera Views Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setCameraMode('orbit')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${cameraMode === 'orbit' ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Orbit 3D
          </button>
          <button
            onClick={() => setCameraMode('follow')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${cameraMode === 'follow' ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Follow Drone
          </button>
          <button
            onClick={() => setCameraMode('top')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${cameraMode === 'top' ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Top-Down 2D
          </button>
        </div>

        {/* Real-time Telemetry Readout */}
        <div className="hidden lg:flex items-center gap-4 text-slate-600 font-mono text-[11px]">
          <div>
            Pos: <span className="text-sky-600">[{uiState.dronePos.map(v => v.toFixed(1)).join(', ')}]</span>
          </div>
          <div>
            Goal Dist: <span className="text-amber-500">{uiState.distToGoal.toFixed(1)}m</span>
          </div>
          <div>
            Total R: <span className={uiState.totalReward >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{uiState.totalReward.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
