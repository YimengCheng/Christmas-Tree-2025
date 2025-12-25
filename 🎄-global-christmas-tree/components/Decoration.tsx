
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Html, Image, useTexture, Decal } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DecorationData, MagicParams } from '../types';

interface DecorationProps {
  data: DecorationData;
  onPlayAudio: (url: string) => void;
  onViewImage?: (data: DecorationData) => void;
}

const useEmojiTexture = (emoji: string) => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; 
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 128, 128);
      ctx.font = '90px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 64, 70); 
    }
    return new THREE.CanvasTexture(canvas);
  }, [emoji]);
};

const seededRandom = (str: string) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
    }
};

const MagicShape = ({ data }: { data: DecorationData }) => {
  const groupRef = useRef<THREE.Group>(null);
  const params = data.magicParams || { 
    core: 'dodecahedron',
    metalness: 0.5, 
    roughness: 0.5, 
    wireframe: false, 
    emissiveIntensity: 0.5,
    secondaryColor: '#ffffff',
    hasShell: false,
    hasRings: false,
    hasSatellites: false,
    hasSpikes: false,
    scaleVar: 1,
    rotationSpeed: 0.01
  } as MagicParams;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += params.rotationSpeed || 0.01;
      groupRef.current.rotation.z += (params.rotationSpeed || 0.01) * 0.5;
    }
  });

  const primaryColor = data.color || '#F59E0B';
  const secondaryColor = params.secondaryColor || '#ffffff';

  const materialProps = {
    color: primaryColor,
    roughness: params.roughness || 0.3,
    metalness: params.metalness || 0.8,
    emissive: primaryColor,
    emissiveIntensity: (params.emissiveIntensity || 0.5) * 2.0, // 加强发光
    wireframe: params.wireframe,
    toneMapped: false, // 允许溢出产生辉光效果
  };

  const secondaryMatProps = {
    color: secondaryColor,
    roughness: 0.1,
    metalness: 0.9,
    emissive: secondaryColor,
    emissiveIntensity: 1.5,
    wireframe: params.wireframe,
    toneMapped: false,
  };

  const compositeParts = useMemo(() => {
    if (params.core !== 'composite') return [];
    const rng = seededRandom(data.id);
    const count = 4 + Math.floor(rng() * 4); 
    const parts = [];
    const shapes = ['box', 'sphere', 'cone', 'torus', 'octahedron'];

    for(let i=0; i<count; i++) {
        parts.push({
            shape: shapes[Math.floor(rng() * shapes.length)],
            position: [(rng()-0.5)*0.8, (rng()-0.5)*0.8, (rng()-0.5)*0.8] as [number, number, number],
            rotation: [rng()*Math.PI, rng()*Math.PI, 0] as [number, number, number],
            scale: 0.3 + rng() * 0.4,
            useSecondaryColor: rng() > 0.6,
            wireframe: rng() > 0.7
        });
    }
    return parts;
  }, [data.id, params.core]);

  const baseScale = 0.12;
  const finalScale = baseScale * (params.scaleVar || 1.2);

  return (
    <group ref={groupRef} scale={finalScale}>
      <mesh>
        {params.core === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
        {params.core === 'box' && <boxGeometry args={[1.1, 1.1, 1.1]} />}
        {params.core === 'octahedron' && <octahedronGeometry args={[1]} />}
        {params.core === 'dodecahedron' && <dodecahedronGeometry args={[1]} />}
        {params.core === 'icosahedron' && <icosahedronGeometry args={[1]} />}
        {params.core === 'torusKnot' && <torusKnotGeometry args={[0.6, 0.2, 64, 8]} />}
        
        {params.core === 'composite' && (
           <group>
             {compositeParts.map((part, i) => (
                <mesh key={i} position={part.position} rotation={part.rotation} scale={part.scale}>
                    {part.shape === 'box' && <boxGeometry args={[1,1,1]} />}
                    {part.shape === 'sphere' && <sphereGeometry args={[0.6]} />}
                    {part.shape === 'cone' && <coneGeometry args={[0.5, 1, 4]} />}
                    {part.shape === 'torus' && <torusGeometry args={[0.4, 0.15, 8, 16]} />}
                    {part.shape === 'octahedron' && <octahedronGeometry args={[0.7]} />}
                    <meshStandardMaterial 
                        {...(part.useSecondaryColor ? secondaryMatProps : materialProps)} 
                        wireframe={part.wireframe}
                    />
                </mesh>
             ))}
           </group>
        )}

        {params.core !== 'composite' && params.core !== 'empty' && (
          <meshStandardMaterial {...materialProps} />
        )}
      </mesh>

      {params.hasShell && (
        <mesh>
          <icosahedronGeometry args={[1.4, 0]} />
          <meshStandardMaterial 
            color={secondaryColor} 
            wireframe={true} 
            emissive={secondaryColor} 
            emissiveIntensity={2.5} 
            transparent
            opacity={0.4}
            toneMapped={false}
          />
        </mesh>
      )}

      {params.hasRings && (
         <>
          <mesh rotation={[Math.PI/2 + 0.2, 0, 0]}>
            <torusGeometry args={[1.6, 0.05, 16, 64]} />
            <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={5} toneMapped={false} />
          </mesh>
          <mesh rotation={[0, Math.PI/2 - 0.2, 0]}>
            <torusGeometry args={[1.9, 0.05, 16, 64]} />
            <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={5} toneMapped={false} />
          </mesh>
         </>
      )}

      {params.hasSatellites && (
         [...Array(5)].map((_, i) => (
          <mesh key={i} position={[Math.sin(i * 1.5)*2.4, Math.cos(i * 1.5)*2.4, Math.sin(i)*0.5]}>
            <octahedronGeometry args={[0.25]} />
            <meshStandardMaterial color={i % 2 === 0 ? primaryColor : secondaryColor} emissive={i % 2 === 0 ? primaryColor : secondaryColor} emissiveIntensity={3} toneMapped={false} />
          </mesh>
        ))
      )}

      {params.hasSpikes && (
        [...Array(12)].map((_, i) => (
          <mesh key={`spike-${i}`} rotation={[Math.random()*Math.PI, Math.random()*Math.PI, 0]} position={[0,0,0]}>
             <cylinderGeometry args={[0, 0.06, 3.8]} />
             <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))
      )}

      <pointLight color={primaryColor} intensity={2} distance={5} />
    </group>
  );
};

const FaceDecal = ({ textureUrl }: { textureUrl: string }) => {
  const texture = useTexture(textureUrl);
  return (
    <Decal 
      position={[0, 0, 0.2]} 
      rotation={[0, 0, 0]} 
      scale={[0.6, 0.6, 1]} 
    >
      <meshStandardMaterial 
        map={texture}
        transparent={false}
        depthTest={true}
        depthWrite={true}
        polygonOffset
        polygonOffsetFactor={-1} 
        roughness={0.4}
        metalness={0.0}
      />
    </Decal>
  );
};

export const Decoration: React.FC<DecorationProps> = ({ data, onPlayAudio, onViewImage }) => {
  const meshRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Group>(null);
  const bulbRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  
  const [hovered, setHovered] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  
  const emojiTexture = useEmojiTexture(data.type === 'emoji' && data.content ? data.content : '🎄');
  const isFaceOrb = data.type === 'orb' && !!data.content;
  
  useFrame((state) => {
    if (meshRef.current) {
      if (data.type !== 'light') {
        meshRef.current.position.y = data.position.y + Math.sin(state.clock.elapsedTime * 1.5 + data.timestamp) * 0.03;
        
        if (data.type === 'magic') {
           meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
           meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
        }

        if (data.type === 'orb') {
             if (data.content) {
                 meshRef.current.rotation.y = data.rotation.y + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
             } else {
                 meshRef.current.rotation.z = data.rotation.z + Math.sin(state.clock.elapsedTime * 1 + data.timestamp) * 0.05;
             }
        }
      } 
      
      if (data.type === 'light' && lightRef.current && meshRef.current) {
         const worldDown = new THREE.Vector3(0, -1, 0);
         const parentQ = meshRef.current.quaternion.clone().invert();
         const localDown = worldDown.applyQuaternion(parentQ);
         const swayAmount = 0.1;
         localDown.x += Math.sin(state.clock.elapsedTime * 2 + data.timestamp) * swayAmount;
         localDown.z += Math.cos(state.clock.elapsedTime * 1.5 + data.timestamp) * swayAmount;
         lightRef.current.lookAt(localDown);

         const breath = (Math.sin(state.clock.elapsedTime * 3 + data.timestamp * 0.1) + 1) * 0.5; 
         if (bulbRef.current) {
            const material = bulbRef.current.material as THREE.MeshPhysicalMaterial;
            const isWarm = ['#EF4444', '#EC4899', '#D42F2F', '#F59E0B'].includes(data.color || '');
            const baseEmissive = isWarm ? 1.5 : 0.3; 
            const pulseAmount = isWarm ? 1.0 : 0.4;
            material.emissiveIntensity = baseEmissive + (breath * pulseAmount); 
         }
         if (glowRef.current) {
            glowRef.current.intensity = 0.2 + (breath * 0.5);
         }
      }
      
      if ((data.type === 'audio' || data.type === 'magic') && audioPlaying) {
         meshRef.current.scale.setScalar(data.scale * (1 + Math.sin(state.clock.elapsedTime * 10) * 0.1));
      }
    }
  });

  const Tooltip = () => (
    <div className="bg-black/20 backdrop-blur-md text-white p-3 rounded-xl pointer-events-none min-w-[160px] text-center border border-white/20 flex flex-col gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative bottom-full mb-4 select-none transform transition-all">
      {data.type === 'photo' && data.content && (
        <div className="w-full aspect-square overflow-hidden rounded-lg border border-white/20 mb-1 bg-black/20">
          <img src={data.content} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <p className="font-bold text-amber-300 font-cinzel text-sm drop-shadow-md text-shadow">{data.author || 'Anonymous'}</p>
        <p className="italic text-white mt-1 text-xs leading-relaxed font-serif text-shadow-sm">"{data.message || 'Merry Christmas!'}"</p>
        {data.type === 'photo' && <p className="text-[10px] text-slate-200 mt-1 font-sans opacity-90">(Tap to view)</p>}
        {data.type === 'magic' && <p className="text-[10px] text-amber-200 mt-1 font-sans opacity-90">(Tap to hear wish ✨)</p>}
      </div>
    </div>
  );

  return (
    <group 
      position={[data.position.x, data.position.y, data.position.z]} 
      rotation={[data.rotation.x, data.rotation.y, data.rotation.z]}
      scale={data.scale}
      ref={meshRef}
      onClick={(e) => {
          e.stopPropagation();
          if (data.type === 'photo' && data.content && onViewImage) {
            onViewImage(data);
          }
          if (data.type === 'magic' && data.content) {
            setAudioPlaying(true);
            onPlayAudio(data.content);
            setTimeout(() => setAudioPlaying(false), 5000); 
          }
      }}
    >
      <mesh 
        position={[0, 0, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <group> 
        {data.type === 'orb' && (
          <group>
             <mesh castShadow receiveShadow>
               <sphereGeometry args={[0.2, 32, 32]} />
               <meshStandardMaterial 
                  color={isFaceOrb ? "#000000" : (data.color || "#EF4444")}
                  roughness={isFaceOrb ? 0.2 : 0.1}
                  metalness={isFaceOrb ? 0.5 : 0.9}
               />
               {isFaceOrb && data.content && (
                 <FaceDecal textureUrl={data.content} />
               )}
             </mesh>
          </group>
        )}

        {data.type === 'light' && (
          <group position={[0, -0.15, 0]}> 
             <group ref={lightRef}>
                <mesh 
                  ref={bulbRef} 
                  position={[0, 0, 0]} 
                  scale={[0.09, 0.09, 0.09]} 
                  rotation={[Math.PI/4, Math.PI/4, 0]}
                >
                   <dodecahedronGeometry args={[1, 0]} /> 
                   <meshPhysicalMaterial 
                      color={data.color}
                      emissive={data.color}
                      emissiveIntensity={1.0} 
                      roughness={0.0} 
                      metalness={0.1} 
                      transmission={0.98} 
                      thickness={0.5} 
                      attenuationColor={data.color} 
                      attenuationDistance={1.0} 
                      clearcoat={1.0} 
                      transparent={true}
                      opacity={0.4} 
                      side={THREE.DoubleSide}
                      toneMapped={false} 
                   />
                </mesh>
                <mesh position={[0,0,0]}>
                   <sphereGeometry args={[0.03, 8, 8]} />
                   <meshBasicMaterial color={data.color} toneMapped={false} />
                </mesh>
                <pointLight 
                   ref={glowRef} 
                   position={[0, 0, 0]} 
                   color={data.color} 
                   intensity={0.5} 
                   distance={1.5} 
                   decay={2} 
                />
             </group>
          </group>
        )}

        {data.type === 'magic' && (
           <group castShadow>
             <MagicShape data={data} />
           </group>
        )}

        {data.type === 'emoji' && (
          <mesh position={[0, 0.25, 0]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial 
              map={emojiTexture} 
              transparent 
              alphaTest={0.5} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        )}

        {data.type === 'photo' && data.content && (
          <group>
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.6, 0.75, 0.02]} />
              <meshStandardMaterial 
                color={data.color || '#ffffff'} 
                roughness={0.5} 
                metalness={0}
                toneMapped={false} 
                emissive={data.color || '#ffffff'} 
                emissiveIntensity={0.1} 
              />
            </mesh>
            <Image 
              url={data.content} 
              position={[0, 0.08, 0.011]} 
              scale={[0.52, 0.52]} 
              transparent
            />
            {data.signature && (
               <Image 
                 url={data.signature}
                 position={[0, -0.26, 0.011]}
                 scale={[0.52, 0.15]}
                 transparent
                 opacity={0.9}
               />
            )}
          </group>
        )}
      </group>

      {hovered && (
        <Html 
          position={[0, 0.8, 0.6]} 
          center 
          distanceFactor={10} 
          zIndexRange={[100, 0]} 
          style={{ 
            pointerEvents: 'none', 
            whiteSpace: 'nowrap',
          }}
        >
          <Tooltip />
        </Html>
      )}
    </group>
  );
};
