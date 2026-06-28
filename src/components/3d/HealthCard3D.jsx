import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

export default function HealthCard3D({ userName = 'USER', healthCardNo = '0000', role = 'Patient' }) {
  const groupRef = useRef();
  const glowRef = useRef();
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.2;
      groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
      groupRef.current.position.y = Math.sin(time * 0.7) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Card body */}
      <RoundedBox args={[3.6, 2.2, 0.08]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          color="#111827"
          metalness={0.5}
          roughness={0.3}
          envMapIntensity={1}
        />
      </RoundedBox>

      {/* Glowing border */}
      <RoundedBox ref={glowRef} args={[3.7, 2.3, 0.04]} radius={0.14} smoothness={4}>
        <meshStandardMaterial
          color="#004d48"
          emissive="#00e6d9"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
          side={THREE.BackSide}
        />
      </RoundedBox>

      {/* CHC Logo Text */}
      <Text
        position={[-1.2, 0.7, 0.06]}
        fontSize={0.28}
        fontWeight={800}
        color="#00e6d9"
        anchorX="left"
      >
        CHC
      </Text>

      {/* Title */}
      <Text
        position={[0.2, 0.7, 0.06]}
        fontSize={0.12}
        color="#94a3b8"
        anchorX="left"
      >
        Centralized Health Card
      </Text>

      {/* Chip */}
      <RoundedBox args={[0.5, 0.38, 0.05]} radius={0.04} position={[-1.2, 0.15, 0.06]}>
        <meshStandardMaterial
          color="#fbbf24"
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Card Number - new auto-generated format */}
      <Text
        position={[-1.2, -0.25, 0.06]}
        fontSize={0.18}
        color="#00e6d9"
        anchorX="left"
        letterSpacing={0.1}
      >
        {healthCardNo || 'N/A'}
      </Text>

      {/* User Name */}
      <Text
        position={[-1.2, -0.6, 0.06]}
        fontSize={0.14}
        color="#94a3b8"
        anchorX="left"
      >
        {userName.toUpperCase()}
      </Text>

      {/* Role Badge */}
      <Text
        position={[1.2, -0.6, 0.06]}
        fontSize={0.11}
        color={role === 'Doctor' ? '#8b5cf6' : role === 'Chemist' ? '#f59e0b' : role === 'Admin' ? '#f43f5e' : '#00e6d9'}
        anchorX="right"
      >
        {role.toUpperCase()}
      </Text>

      {/* Cross / Plus symbol */}
      <group position={[1.2, 0.7, 0.06]}>
        <mesh>
          <boxGeometry args={[0.06, 0.22, 0.02]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.22, 0.06, 0.02]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}
