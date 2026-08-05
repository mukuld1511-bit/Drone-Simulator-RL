/**
 * Shaders.js
 * Custom GLSL shaders for glow effects, particle trails, and atmosphere.
 */
import * as THREE from 'three';

// Pulsing glow shader for the goal beacon
export const GoalGlowMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#facc15') },
    uIntensity: { value: 1.5 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float pulse = 0.6 + 0.4 * sin(uTime * 3.0);
      float rim = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), 2.0);
      vec3 glow = uColor * rim * uIntensity * pulse;
      gl_FragColor = vec4(glow, rim * 0.85);
    }
  `,
};

// Drone engine trail particle shader
export const TrailMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#38bdf8') },
  },
  vertexShader: `
    attribute float aAlpha;
    varying float vAlpha;
    void main() {
      vAlpha = aAlpha;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (6.0 * vAlpha) * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    varying float vAlpha;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
      vec3 color = uColor * (1.0 + 0.3 * sin(uTime * 5.0));
      gl_FragColor = vec4(color, alpha * 0.7);
    }
  `,
};

// Atmospheric ground fog shader
export const FogMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#0f172a') },
    uColor2: { value: new THREE.Color('#1e293b') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying vec2 vUv;
    void main() {
      float noise = sin(vUv.x * 20.0 + uTime) * cos(vUv.y * 20.0 + uTime * 0.7) * 0.5 + 0.5;
      vec3 color = mix(uColor1, uColor2, noise * 0.4);
      float edgeFade = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x)
                     * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
      gl_FragColor = vec4(color, 0.6 * edgeFade);
    }
  `,
};
