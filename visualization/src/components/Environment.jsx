import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Ground plane with animated grid
export function Ground() {
  const gridRef = useRef();

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group>
      {/* Dark terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, -0.1, 50]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0f1a2e" roughness={0.95} />
      </mesh>

      {/* Glowing grid overlay */}
      <gridHelper
        ref={gridRef}
        args={[120, 30, '#1e3a5f', '#0f2847']}
        position={[50, 0.01, 50]}
      />
    </group>
  );
}

// Obstacles rendered as futuristic buildings / crystals
export function Obstacles({ obstacles = [] }) {
  return (
    <group>
      {obstacles.map((obs, i) => {
        const isTree = i % 3 !== 0;
        return isTree ? (
          <Tree key={i} position={obs.position} radius={obs.radius} />
        ) : (
          <Crystal key={i} position={obs.position} radius={obs.radius} />
        );
      })}
    </group>
  );
}

// Sci-fi tree obstacle
function Tree({ position, radius }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle sway
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.03;
    }
  });

  const trunkH = radius * 1.8;
  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      {/* Trunk */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.15, radius * 0.25, trunkH, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>

      {/* Canopy layers */}
      <mesh position={[0, trunkH + radius * 0.2, 0]} castShadow>
        <sphereGeometry args={[radius * 0.9, 12, 12]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>
      <mesh position={[0, trunkH + radius * 0.7, 0]} castShadow>
        <sphereGeometry args={[radius * 0.6, 12, 12]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// Crystal / tower obstacle
function Crystal({ position, radius }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
      const s = 1.0 + Math.sin(state.clock.elapsedTime * 1.5 + position[2]) * 0.03;
      ref.current.scale.y = s;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh ref={ref} position={[0, radius * 1.2, 0]} castShadow>
        <octahedronGeometry args={[radius * 0.8, 0]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#4c1d95"
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Base glow */}
      <pointLight position={[position[0], 1, position[2]]} color="#a78bfa" intensity={1.5} distance={radius * 3} />
    </group>
  );
}

// Animated goal beacon
export function GoalBeacon({ position }) {
  const ringRef = useRef();
  const outerRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.8;
      ringRef.current.rotation.z = t * 0.5;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = -t * 0.3;
      const s = 1.0 + Math.sin(t * 2.5) * 0.15;
      outerRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={position}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#eab308"
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Spinning ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[5, 0.3, 16, 48]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.5} />
      </mesh>

      {/* Outer halo */}
      <mesh ref={outerRef}>
        <ringGeometry args={[6, 7, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Light source */}
      <pointLight color="#facc15" intensity={8} distance={40} />
    </group>
  );
}

// 100x100x100 world bounding box
export function WorldBounds() {
  const edges = useMemo(() => {
    const geo = new THREE.BoxGeometry(100, 100, 100);
    return new THREE.EdgesGeometry(geo);
  }, []);

  return (
    <lineSegments geometry={edges} position={[50, 50, 50]}>
      <lineBasicMaterial color="#1e3a5f" transparent opacity={0.4} />
    </lineSegments>
  );
}
