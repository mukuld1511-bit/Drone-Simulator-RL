import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Drone({ position, trail = [] }) {
  const groupRef = useRef();
  const prop1 = useRef();
  const prop2 = useRef();
  const prop3 = useRef();
  const prop4 = useRef();
  const glowRef = useRef();
  const trailRef = useRef();

  // Smooth position interpolation
  const targetPos = useRef(new THREE.Vector3(position.x, position.y, position.z));
  const currentPos = useRef(new THREE.Vector3(position.x, position.y, position.z));

  React.useEffect(() => {
    targetPos.current.set(position.x, position.y, position.z);
  }, [position.x, position.y, position.z]);

  // Create trail geometry
  const trailGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const maxTrailPoints = 200;
    const positions = new Float32Array(maxTrailPoints * 3);
    const alphas = new Float32Array(maxTrailPoints);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth lerp to target position
    currentPos.current.lerp(targetPos.current, 0.12);
    groupRef.current.position.copy(currentPos.current);

    // Tilt drone in direction of movement
    const vel = targetPos.current.clone().sub(currentPos.current);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -vel.x * 0.3, 0.08);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, vel.z * 0.3, 0.08);

    // Spin propellers
    const propSpeed = 0.8;
    if (prop1.current) prop1.current.rotation.y += propSpeed;
    if (prop2.current) prop2.current.rotation.y -= propSpeed;
    if (prop3.current) prop3.current.rotation.y += propSpeed;
    if (prop4.current) prop4.current.rotation.y -= propSpeed;

    // Pulse glow
    if (glowRef.current) {
      const s = 1.0 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
      glowRef.current.scale.setScalar(s);
    }

    // Update trail
    if (trail.length > 1 && trailRef.current) {
      const posArr = trailGeometry.attributes.position.array;
      const alphaArr = trailGeometry.attributes.aAlpha.array;
      const len = Math.min(trail.length, 200);
      for (let i = 0; i < len; i++) {
        const t = trail[trail.length - len + i];
        posArr[i * 3] = t[0];
        posArr[i * 3 + 1] = t[1];
        posArr[i * 3 + 2] = t[2];
        alphaArr[i] = i / len;
      }
      trailGeometry.attributes.position.needsUpdate = true;
      trailGeometry.attributes.aAlpha.needsUpdate = true;
      trailGeometry.setDrawRange(0, len);
    }
  });

  const armLength = 2.2;
  const armPositions = [
    [armLength, 0.3, armLength],
    [-armLength, 0.3, armLength],
    [armLength, 0.3, -armLength],
    [-armLength, 0.3, -armLength],
  ];
  const propRefs = [prop1, prop2, prop3, prop4];

  return (
    <>
      <group ref={groupRef}>
        {/* Central body — sleek hexagonal capsule */}
        <mesh castShadow>
          <dodecahedronGeometry args={[1.0, 0]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.1} envMapIntensity={2} />
        </mesh>

        {/* Inner core glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
        </mesh>

        {/* Camera eye */}
        <mesh position={[0, -0.2, 0.9]} rotation={[Math.PI / 6, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.3, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[0, -0.2, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {/* 4 Arms + Rotors */}
        {armPositions.map(([ax, ay, az], i) => (
          <group key={i}>
            {/* Arm strut */}
            <mesh position={[ax / 2, 0.1, az / 2]} castShadow>
              <boxGeometry args={[Math.abs(ax) + 0.3, 0.15, 0.25]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Motor housing */}
            <mesh position={[ax, ay - 0.1, az]} castShadow>
              <cylinderGeometry args={[0.35, 0.35, 0.5, 12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.15} />
            </mesh>

            {/* Propeller disc */}
            <mesh ref={propRefs[i]} position={[ax, ay + 0.2, az]}>
              <cylinderGeometry args={[1.4, 1.4, 0.04, 3]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
            </mesh>

            {/* LED under motor */}
            <pointLight
              position={[ax, ay - 0.4, az]}
              color={i < 2 ? '#22c55e' : '#ef4444'}
              intensity={2}
              distance={5}
            />
          </group>
        ))}
      </group>

      {/* Trail points */}
      <points ref={trailRef} geometry={trailGeometry}>
        <pointsMaterial color="#38bdf8" size={0.8} transparent opacity={0.6} sizeAttenuation />
      </points>
    </>
  );
}
