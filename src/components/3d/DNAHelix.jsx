import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function DNAHelix() {
  const groupRef = useRef();
  const timeRef = useRef(0);
  const sphereCount = 40;
  const radius = 1.8;
  const height = 12;

  const sphereGeom = useMemo(() => new THREE.SphereGeometry(0.12, 16, 16), []);
  const connectorGeom = useMemo(() => new THREE.CylinderGeometry(0.03, 0.03, 1, 8), []);

  const strand1Material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#00e6d9'),
    emissive: new THREE.Color('#00e6d9'),
    emissiveIntensity: 0.6,
    metalness: 0.3,
    roughness: 0.4,
  }), []);

  const strand2Material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8b5cf6'),
    emissive: new THREE.Color('#8b5cf6'),
    emissiveIntensity: 0.6,
    metalness: 0.3,
    roughness: 0.4,
  }), []);

  const connectorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e3a5f'),
    emissive: new THREE.Color('#00e6d9'),
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.5,
  }), []);

  const spheres = useMemo(() => {
    const items = [];
    for (let i = 0; i < sphereCount; i++) {
      const t = i / sphereCount;
      const angle = t * Math.PI * 4;
      const y = (t - 0.5) * height;

      items.push({
        pos1: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
        pos2: [Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius],
        y,
      });
    }
    return items;
  }, []);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.15;
      groupRef.current.position.y = Math.sin(time * 0.3) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {spheres.map((s, i) => (
        <group key={i}>
          {/* Strand 1 */}
          <mesh geometry={sphereGeom} material={strand1Material} position={s.pos1} />
          {/* Strand 2 */}
          <mesh geometry={sphereGeom} material={strand2Material} position={s.pos2} />
          {/* Connector between strands (every 3rd pair) */}
          {i % 3 === 0 && (
            <mesh
              geometry={connectorGeom}
              material={connectorMaterial}
              position={[
                (s.pos1[0] + s.pos2[0]) / 2,
                s.y,
                (s.pos1[2] + s.pos2[2]) / 2,
              ]}
              scale={[1, radius * 2, 1]}
              rotation={[0, 0, Math.atan2(s.pos2[2] - s.pos1[2], s.pos2[0] - s.pos1[0])]}
            />
          )}
        </group>
      ))}
    </group>
  );
}
