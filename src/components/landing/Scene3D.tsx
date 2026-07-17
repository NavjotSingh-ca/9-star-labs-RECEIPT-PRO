'use client';

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
} from '@react-three/postprocessing';
import * as THREE from 'three';

// Module-scoped mouse tracker. Deliberately NOT a React ref or prop: React
// Compiler's immutability rule forbids mutating props/refs in useFrame, and a
// module-level singleton is the supported escape hatch for canvas globals.
const mouseTracker = { x: 0, y: 0 };

// ─── SSR-safe hooks ──────────────────────────────────────────────

function useIsMobile(): boolean {
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  return isMobile;
}

function usePrefersReducedMotion(): boolean {
  const [reduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  return reduced;
}

// ─── Custom GLSL Shader for the receipt card ─────────────────────

const ReceiptShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#c4a87c') },
    uColor2: { value: new THREE.Color('#8b7355') },
    uGlow: { value: new THREE.Color('#bea98e') },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uGlow;
    uniform vec2 uMouse;

    // Simplex-like noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      // Base color gradient
      vec3 baseColor = mix(uColor1, uColor2, vUv.y);

      // Noise-based organic distortion
      float n = noise(vUv * 3.0 + uTime * 0.05);
      float n2 = noise(vUv * 6.0 - uTime * 0.08);

      // Subtle iridescent shimmer
      float shimmer = sin(vUv.x * 12.0 + vUv.y * 8.0 + uTime * 0.4) * 0.5 + 0.5;
      vec3 shimmerColor = vec3(0.85, 0.75, 0.6);

      // Mouse-reactive edge glow
      float mouseDist = distance(vUv, uMouse);
      float mouseGlow = 1.0 - smoothstep(0.0, 0.8, mouseDist);

      // Fresnel-like edge highlight
      float fresnel = pow(1.0 - abs(vNormal.z), 1.5);

      // Combine layers
      vec3 finalColor = baseColor;
      finalColor += n * 0.04 * uGlow;
      finalColor += n2 * 0.02 * vec3(0.9, 0.85, 0.7);
      finalColor += shimmer * 0.06 * shimmerColor;
      finalColor += mouseGlow * 0.15 * uGlow;
      finalColor += fresnel * 0.2 * uGlow;

      // Subtle vignette
      float vignette = 1.0 - distance(vUv, vec2(0.5)) * 0.4;
      finalColor *= vignette;

      // Surface texture lines
      float lines = sin(vUv.y * 120.0 + uTime * 0.1) * 0.5 + 0.5;
      float lineMask = smoothstep(0.35, 0.4, lines);
      finalColor = mix(finalColor, finalColor * 0.92, 1.0 - lineMask);

      gl_FragColor = vec4(finalColor, 0.92);
    }
  `,
};

// ─── Shader receipt card ─────────────────────────────────────────

function ShaderReceiptCard({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  useFrame((state, _delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    // Smooth mouse follow
    const mx = mouseTracker.x * 0.5 + 0.5;
    const my = mouseTracker.y * -0.5 + 0.5;
    materialRef.current.uniforms.uMouse.value.lerp(
      new THREE.Vector2(mx, my),
      0.05,
    );
  });

  const scale = useMemo(
    () => Math.min(viewport.width / 10, 1.5),
    [viewport.width],
  );

  const card = (
    <group scale={scale}>
      {/* Glow backdrop */}
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[2.4, 3.5]} />
        <meshBasicMaterial
          color="#bea98e"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Main receipt card with custom shader */}
      <mesh ref={ref}>
        <boxGeometry args={[2, 3, 0.06]} />
        <shaderMaterial
          ref={materialRef}
          args={[ReceiptShaderMaterial]}
        />
      </mesh>

      {/* Edge glow ring */}
      <RoundedBox
        args={[2.04, 3.04, 0.01]}
        radius={0.1}
        smoothness={4}
        position={[0, 0, 0.04]}
      >
        <meshBasicMaterial
          color="#bea98e"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </RoundedBox>
    </group>
  );

  if (reducedMotion) return card;
  return (
    <Float speed={0.8} rotationIntensity={0.03} floatIntensity={0.3}>
      {card}
    </Float>
  );
}

// ─── Massive mouse-reactive particles ────────────────────────────

function ParticleField({
  reducedMotion,
  isMobile,
}: {
  reducedMotion: boolean;
  isMobile: boolean;
}) {
  const count = reducedMotion ? 150 : isMobile ? 400 : 800;
  const meshRef = useRef<THREE.Points>(null);

  // Seeded PRNG for stable particle positions (React Compiler purity)
  function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  const [positions, sizes] = useMemo(() => {
    const rng = seededRandom(42);
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = 2 + rng() * 6;
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      siz[i] = 0.01 + rng() * 0.04;
    }
    return [pos, siz];
  }, [count]);

  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(positions, 3),
    [positions],
  );
  const sizeAttr = useMemo(
    () => new THREE.BufferAttribute(sizes, 1),
    [sizes],
  );

  useFrame((state) => {
    if (!meshRef.current || reducedMotion) return;
    const positions_ = meshRef.current.geometry.attributes.position
      .array as Float32Array;

    const time = state.clock.elapsedTime;

    // Mouse influence
    const mx = mouseTracker.x * 2.0;
    const my = mouseTracker.y * -1.5;

    for (let i = 0; i < count; i++) {
      // Orbital drift
      const idx = i * 3;
      const speed = 0.05 + Math.sin(i * 0.1) * 0.03;
      const angle = time * speed + i * 0.01;

      // Base position from initial
      const baseX = positions[idx];
      const baseY = positions[idx + 1];
      const baseZ = positions[idx + 2];

      // Orbital rotation
      const newX = baseX * Math.cos(angle * 0.1) - baseZ * Math.sin(angle * 0.1);
      const newZ = baseX * Math.sin(angle * 0.1) + baseZ * Math.cos(angle * 0.1);
      const newY = baseY + Math.sin(time * 0.3 + i * 0.2) * 0.1;

      // Mouse attraction/repulsion
      const dx = newX - mx;
      const dy = newY - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = Math.max(0, 1 - dist * 0.2) * 0.4;

      positions_[idx] = newX + dx * force;
      positions_[idx + 1] = newY + dy * force;
      positions_[idx + 2] = newZ;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={sizeAttr} attach="attributes-size" />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#bea98e"
        transparent
        opacity={reducedMotion ? 0.3 : 0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Orbiting shapes ─────────────────────────────────────────────

type ShapeType = 'icosahedron' | 'torusKnot' | 'octahedron';

function OrbitingShape({
  radius,
  speed,
  offset,
  size,
  type,
  reducedMotion,
}: {
  radius: number;
  speed: number;
  offset: number;
  size: number;
  type: ShapeType;
  reducedMotion: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_state, _delta) => {
    if (reducedMotion || !ref.current) return;
    const t = _state.clock.elapsedTime * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 0.7) * 0.4;
    ref.current.rotation.x += 0.008;
    ref.current.rotation.y += 0.015;
  });

  const geometry = useMemo(() => {
    if (type === 'icosahedron')
      return <icosahedronGeometry args={[size, 0]} />;
    if (type === 'torusKnot')
      return <torusKnotGeometry args={[size, size * 0.4, 32, 8]} />;
    return <octahedronGeometry args={[size, 0]} />;
  }, [type, size]);

  return (
    <mesh ref={ref}>
      {geometry}
      <meshPhysicalMaterial
        color="#bea98e"
        emissive="#8b7355"
        emissiveIntensity={0.15}
        wireframe
        transparent
        opacity={0.4}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

// ─── Scene Content ───────────────────────────────────────────────

function SceneContent({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const isMobile = useIsMobile();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return;
    const targetX = state.pointer.y * 0.06;
    const targetY = state.pointer.x * 0.06;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.03,
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      0.03,
    );

    // Update global mouse tracker for particles/shaders
    mouseTracker.x = state.pointer.x;
    mouseTracker.y = state.pointer.y;
  });

  return (
    <>
      {!isMobile && !reducedMotion && (
        <>
          {/* Post-processing pipeline (desktop only) */}
          <EffectComposer multisampling={2}>
            <Bloom
              intensity={0.25}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.5}
            />
            <DepthOfField
              focusDistance={0}
              focalLength={0.02}
              bokehScale={1.2}
            />
            <ChromaticAberration
              offset={new THREE.Vector2(0.0015, 0.0015)}
            />
          </EffectComposer>
        </>
      )}

      <group ref={groupRef}>
        {/* Ambient glow */}
        <mesh position={[0, 0, -1.5]}>
          <planeGeometry args={[12, 12]} />
          <meshBasicMaterial
            color="#bea98e"
            transparent
            opacity={0.02}
            depthWrite={false}
          />
        </mesh>

        <ShaderReceiptCard reducedMotion={reducedMotion} />

        <ParticleField reducedMotion={reducedMotion} isMobile={isMobile} />

        {!reducedMotion && !isMobile && (
          <>
            <OrbitingShape
              radius={2.2}
              speed={0.35}
              offset={0}
              size={0.18}
              type="icosahedron"
              reducedMotion={reducedMotion}
            />
          </>
        )}
      </group>
    </>
  );
}

// ─── Exported Canvas wrapper ─────────────────────────────────────

interface Scene3DProps {
  className?: string;
}

export default function Scene3D({ className }: Scene3DProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        dpr={[1, 1.2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1.0}
            color="#bea98e"
          />
          <directionalLight
            position={[-3, 2, 0]}
            intensity={0.3}
            color="#d4c4a8"
          />
          <hemisphereLight
            args={['#bea98e', '#09090b', 0.3]}
          />
          <SceneContent
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
