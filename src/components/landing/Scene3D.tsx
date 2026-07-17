'use client';

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, MeshDistortMaterial, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// ─── SSR-safe media query hook ──────────────────────────────────────────────

function useIsMobile(): boolean {
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  return isMobile;
}

// ─── Scan-line canvas texture ──────────────────────────────────────────────

function useScanLineTexture(): THREE.CanvasTexture | null {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1, 128);
    ctx.fillStyle = 'rgba(190, 169, 142, 0.3)';
    for (let i = 0; i < 128; i += 6) {
      ctx.fillRect(0, i, 1, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 10);
    return tex;
  }, []);
}

// ─── Receipt card ──────────────────────────────────────────────────────────

function ReceiptMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const scanTexture = useScanLineTexture();
  const { viewport } = useThree();

  const scale = useMemo(
    () => Math.min(viewport.width / 10, 1.5),
    [viewport.width],
  );

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.4}>
      <group ref={groupRef} scale={scale}>
        {/* Glow backdrop */}
        <mesh position={[0, 0, -0.07]}>
          <planeGeometry args={[2.2, 3.3]} />
          <meshBasicMaterial
            color="#bea98e"
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </mesh>

        {/* Main receipt card */}
        <RoundedBox args={[2, 3, 0.06]} radius={0.1} smoothness={4}>
          <MeshDistortMaterial
            color="#c4a87c"
            emissive="#8b7355"
            emissiveIntensity={0.2}
            roughness={0.3}
            metalness={0.15}
            distort={0.04}
            speed={1.5}
            transparent
            opacity={0.92}
          />
        </RoundedBox>

        {/* Edge glow ring */}
        <RoundedBox
          args={[2.04, 3.04, 0.01]}
          radius={0.1}
          smoothness={4}
          position={[0, 0, 0.035]}
        >
          <meshBasicMaterial
            color="#bea98e"
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </RoundedBox>

        {/* Scan-line overlay */}
        {scanTexture && (
          <mesh position={[0, 0, 0.07]}>
            <planeGeometry args={[2, 3]} />
            <meshBasicMaterial
              map={scanTexture}
              transparent
              opacity={0.15}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
    </Float>
  );
}

// ─── Orbiting decorative shape ────────────────────────────────────────────

type ShapeType = 'icosahedron' | 'torusKnot';

interface OrbitingShapeProps {
  radius: number;
  speed: number;
  offset: number;
  size: number;
  type: ShapeType;
}

function OrbitingShape({ radius, speed, offset, size, type }: OrbitingShapeProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 0.7) * 0.4;
    ref.current.rotation.x += 0.01;
    ref.current.rotation.y += 0.02;
    ref.current.rotation.z += 0.005;
  });

  const geometry = useMemo(() => {
    if (type === 'icosahedron') {
      return <icosahedronGeometry args={[size, 0]} />;
    }
    return <torusKnotGeometry args={[size, size * 0.4, 32, 8]} />;
  }, [type, size]);

  return (
    <mesh ref={ref}>
      {geometry}
      <meshPhysicalMaterial
        color="#bea98e"
        emissive="#8b7355"
        emissiveIntensity={0.12}
        wireframe
        transparent
        opacity={0.45}
      />
    </mesh>
  );
}

// ─── Scene content (inside Canvas, has R3F context) ──────────────────────

function SceneContent() {
  const isMobile = useIsMobile();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const targetX = state.pointer.y * 0.08;
    const targetY = state.pointer.x * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.05,
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      0.05,
    );
  });

  return (
    <group ref={groupRef}>
      {/* Ambient glow behind the receipt */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial
          color="#bea98e"
          transparent
          opacity={0.03}
          depthWrite={false}
        />
      </mesh>

      <ReceiptMesh />

      <Sparkles
        count={200}
        scale={8}
        size={0.03}
        speed={0.3}
        color="#bea98e"
        opacity={0.5}
      />

      {!isMobile && (
        <>
          <OrbitingShape
            radius={2.2}
            speed={0.4}
            offset={0}
            size={0.18}
            type="icosahedron"
          />
          <OrbitingShape
            radius={2.8}
            speed={-0.3}
            offset={Math.PI}
            size={0.14}
            type="torusKnot"
          />
          <OrbitingShape
            radius={1.9}
            speed={0.5}
            offset={Math.PI / 2}
            size={0.1}
            type="icosahedron"
          />
        </>
      )}
    </group>
  );
}

// ─── Canvas wrapper (default export) ────────────────────────────────────

interface Scene3DProps {
  className?: string;
}

export default function Scene3D({ className }: Scene3DProps) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1.2}
            color="#bea98e"
          />
          <directionalLight
            position={[-3, 2, 0]}
            intensity={0.4}
            color="#d4c4a8"
          />
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
