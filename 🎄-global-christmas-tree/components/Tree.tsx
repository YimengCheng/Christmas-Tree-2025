
import React, { useMemo, useRef } from 'react';
import '../types';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TreeProps {
  layers: number;
  onDecorate: (point: THREE.Vector3, normal: THREE.Vector3) => void;
  onStarClick?: () => void;
}

const AnimatedStar = ({ position, onClick }: { position: [number, number, number], onClick?: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
    const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
    if (coreRef.current) {
       const scale = 1 + pulse * 0.2;
       coreRef.current.scale.set(scale, scale, scale);
       (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + pulse * 2;
    }
    if (haloRef.current) {
       const haloScale = 1.2 + pulse * 0.3;
       haloRef.current.scale.set(haloScale, haloScale, haloScale);
       (haloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + (1 - pulse) * 0.1;
    }
  });

  return (
    <group 
      position={position} 
      ref={groupRef} 
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <pointLight intensity={3} distance={12} color="#ffaa00" decay={2} />
      <mesh>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#fbbf24" emissive="#ff8c00" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh ref={coreRef} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.15} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
};

export const LAYER_HEIGHT_STEP = 1.4; 

export const Tree: React.FC<TreeProps> = ({ layers, onDecorate, onStarClick }) => {
  const treeStructure = useMemo(() => {
    const parts = [];
    
    // Trunk - Grows slightly with tree layers but remains grounded
    parts.push({
      type: 'trunk',
      position: [0, 1.0, 0] as [number, number, number],
      args: [0.6, 0.85, 2.5 + (layers * 0.25), 10] as [number, number, number, number],
      color: '#3f1d0b'
    });

    const layerHeight = 2.0;
    const step = LAYER_HEIGHT_STEP;
    let currentY = 1.5; 
    
    for (let i = 0; i < layers; i++) {
      const distanceIndex = (layers - 1) - i;
      const isTopLayer = distanceIndex === 0;

      // Logarithmic-like scaling for a nice pine cone shape
      const spreadFactor = Math.pow(distanceIndex + 1, 1.03); 
      const topRadius = isTopLayer ? 0.0 : 0.25 + (spreadFactor * 0.11); 
      const bottomRadius = 0.6 + (spreadFactor * 0.52); 
      
      parts.push({
        type: 'foliage',
        position: [0, currentY, 0] as [number, number, number],
        args: [topRadius, bottomRadius, layerHeight, 8] as [number, number, number, number],
        color: '#154f30',
      });
      currentY += step;
    }

    const topY = currentY - step + (layerHeight / 2);
    return { parts, topY };
  }, [layers]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.object.userData.type === 'foliage' && e.face) {
      onDecorate(e.point, e.face.normal);
    }
  };

  return (
    <group>
      {treeStructure.parts.map((part, idx) => (
        <mesh 
          key={`${part.type}-${idx}`} 
          position={part.position} 
          onClick={part.type === 'foliage' ? handleClick : undefined}
          receiveShadow 
          castShadow
          userData={part.type === 'foliage' ? { type: 'foliage' } : undefined}
        >
          <cylinderGeometry args={part.args} />
          <meshStandardMaterial 
            color={part.color} 
            emissive={part.color}
            emissiveIntensity={part.type === 'foliage' ? 0.08 : 0} 
            roughness={part.type === 'foliage' ? 0.5 : 1} 
            flatShading={part.type === 'foliage'} 
          />
        </mesh>
      ))}
      <AnimatedStar position={[0, treeStructure.topY, 0]} onClick={onStarClick} />
    </group>
  );
};
