
import React from 'react';

export type DecorationType = 'orb' | 'emoji' | 'photo' | 'audio' | 'star' | 'light' | 'magic';
export type TreeMode = 'none' | 'personal' | 'shared';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MagicParams {
  core: 'sphere' | 'box' | 'octahedron' | 'dodecahedron' | 'icosahedron' | 'torusKnot' | 'composite' | 'empty';
  hasShell: boolean;
  hasRings: boolean;
  hasSatellites: boolean;
  hasSpikes: boolean;
  scaleVar: number;
  rotationSpeed: number;
  metalness: number;
  roughness: number;
  wireframe: boolean;
  emissiveIntensity: number;
  secondaryColor: string;
}

export interface DecorationData {
  id: string;
  type: DecorationType;
  position: Vector3;
  rotation: Vector3;
  scale: number;
  content?: string;
  signature?: string;
  message?: string;
  author?: string;
  color?: string;
  magicParams?: MagicParams;
  timestamp: number;
}

export interface TreeState {
  decorations: DecorationData[];
  layers: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: any; span: any; p: any; img: any; button: any; h1: any; h2: any; h3: any; h4: any; h5: any; h6: any; br: any; label: any; input: any; textarea: any; canvas: any; ul: any; li: any; a: any;
      mesh: any; group: any; sphereGeometry: any; boxGeometry: any; cylinderGeometry: any; planeGeometry: any; ringGeometry: any; dodecahedronGeometry: any; icosahedronGeometry: any; octahedronGeometry: any; torusGeometry: any; torusKnotGeometry: any; coneGeometry: any; meshStandardMaterial: any; meshBasicMaterial: any; meshPhysicalMaterial: any; pointLight: any; ambientLight: any; spotLight: any; hemisphereLight: any; directionalLight: any; primitive: any; points: any; bufferGeometry: any; bufferAttribute: any; pointsMaterial: any;
    }
  }
}
