/**
 * APEX Photo Studio - Animated 3D Background
 * 
 * Immersive Three.js Fiber background with:
 * - Morphing icosahedron with distort material
 * - Floating particle system (1000 particles)
 * - Floating spheres with emissive materials
 * - Dynamic lighting setup
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Inner scene component with animated elements
function AnimatedScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Animate meshes on each frame
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  // Create particle positions (memoized for performance)
  const particlePositions = useMemo(() => {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 50;
    }
    
    return positions;
  }, []);

  return (
    <>
      {/* Main morphing icosahedron */}
      <mesh ref={meshRef} position={[0, 0, -10]}>
        <icosahedronGeometry args={[8, 4]} />
        <MeshDistortMaterial
          color="#0ea5e9"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          emissive="#38bdf8"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Particle system */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#0ea5e9"
          size={0.1}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Floating purple sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[2, 32, 32]} position={[-8, 3, -5]}>
          <meshStandardMaterial
            color="#7c3aed"
            emissive="#7c3aed"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      {/* Floating amber sphere */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <Sphere args={[1.5, 32, 32]} position={[8, -2, -3]}>
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      {/* Lighting setup */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#0ea5e9" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7c3aed" />
      <spotLight
        position={[0, 15, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        color="#38bdf8"
      />
      
      <Environment preset="night" />
    </>
  );
}

// Main exported component with Canvas
export function AnimatedBackground3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <AnimatedScene />
      </Canvas>
    </div>
  );
}

export default AnimatedBackground3D;
