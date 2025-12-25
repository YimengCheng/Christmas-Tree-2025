
import React, { useState, useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Environment, Float, PerspectiveCamera } from '@react-three/drei';
import { Tree, LAYER_HEIGHT_STEP } from './components/Tree';
import { Decoration } from './components/Decoration';
import { Controls } from './components/Controls';
import { PosterModal } from './components/PosterModal';
import { DecorationData, DecorationType, TreeMode } from './types';
import * as THREE from 'three';
import { Share2, Music as MusicIcon, VolumeX, Settings2, ArrowUpCircle, RotateCcw, User, Users, Calendar, Eye, Users2, Trophy, Image as ImageIcon, Mic2, Star, X, MousePointer2 } from 'lucide-react';

const useSnowflakeTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
};

const Snow = () => {
  const count = 3500; 
  const texture = useSnowflakeTexture();
  const { positions, colors, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;     
      pos[i * 3 + 1] = Math.random() * 80;          
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120; 
      if (Math.random() > 0.85) color.setHSL(Math.random() * 0.1 + 0.5, 0.8, 0.95);
      else color.setHex(0xffffff);
      col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
      spd[i] = 0.5 + Math.random() * 2.5;
    }
    return { positions: pos, colors: col, speeds: spd };
  }, []);
  const pointsRef = useRef<THREE.Points>(null);
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const positions = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3 + 1] -= delta * speeds[i];
      if (positions[i3 + 1] < -10) {
        positions[i3 + 1] = 70; 
        positions[i3] = (Math.random() - 0.5) * 120;
        positions[i3 + 2] = (Math.random() - 0.5) * 120;
      }
    }
    posAttr.needsUpdate = true;
  });
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={texture} vertexColors size={0.5} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

const ActionButton = ({ onClick, icon: Icon, label, disabled = false, active = false }: { onClick: () => void, icon: any, label: string, disabled?: boolean, active?: boolean }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="relative group">
      <button 
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`p-2 md:p-2.5 rounded-full transition-all active:scale-95 disabled:opacity-30 ${active ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-amber-100'}`}
      >
        <Icon size={18} md:size={20} strokeWidth={1.5} />
      </button>
      <div className={`absolute top-full right-0 md:left-1/2 md:-translate-x-1/2 mt-2 px-3 py-1.5 bg-black/90 backdrop-blur text-white text-[10px] md:text-xs rounded-lg whitespace-nowrap pointer-events-none transition-opacity duration-200 z-50 border border-white/10 ${showTooltip ? 'opacity-100' : 'opacity-0'}`}>
        {label}
      </div>
    </div>
  );
};

const SFX_URLS = {
  orb: 'https://cdn.freesound.org/previews/337/337049_3232293-lq.mp3', 
  emoji: 'https://cdn.freesound.org/previews/411/411642_5121236-lq.mp3',
  magic: 'https://cdn.freesound.org/previews/560/560580_6081048-lq.mp3',
  grow: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3',
};

const StatsModal = ({ isOpen, onClose, stats }: { isOpen: boolean, onClose: () => void, stats: any }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl overflow-y-auto overflow-x-hidden animate-in fade-in duration-500 flex flex-col items-center">
      <div className="w-full max-w-lg min-h-screen py-10 px-6 flex flex-col justify-center">
        <div 
          className="w-full bg-[#0a1120]/95 border border-amber-500/20 rounded-[3rem] p-8 md:p-12 relative shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
          <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-all text-white/30 hover:text-white group">
            <X size={28} className="group-hover:rotate-90 transition-transform" />
          </button>
          <div className="flex flex-col items-center text-center mb-12">
             <div className="w-24 h-24 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-500 mb-8 shadow-[0_0_40px_rgba(245,158,11,0.25)] border border-amber-500/20 group animate-float">
               <Star size={48} fill="currentColor" className="animate-pulse" />
             </div>
             <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-white tracking-[0.2em]">WORLD REGISTRY</h2>
             <p className="text-[11px] text-amber-500/70 uppercase tracking-[0.6em] mt-4 font-black">Sacred Christmas Data 2025</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
             {[
               { label: 'Published Date', value: '2025.12.25', icon: Calendar, color: 'text-amber-500' },
               { label: 'Total Wishmakers', value: stats.totalParticipants, icon: Users2, color: 'text-blue-400' },
               { label: 'Total Ornaments', value: stats.decorationCount, icon: Trophy, color: 'text-emerald-400' },
               { label: 'Voice Wishes', value: stats.audioCount, icon: Mic2, color: 'text-red-400' },
               { label: 'Captured Moments', value: stats.photoCount, icon: ImageIcon, color: 'text-indigo-400' },
               { label: 'Global Share Actions', value: stats.shareCount, icon: Share2, color: 'text-pink-400' },
               { label: 'Online Spirits', value: stats.onlineUsers, icon: Eye, color: 'text-amber-300' },
               { label: 'Current Tree Height', value: `${stats.layers} Layers`, icon: ArrowUpCircle, color: 'text-green-400' },
             ].map((item, i) => (
               <div key={i} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col gap-3 transition-all hover:bg-white/[0.07] hover:border-amber-500/30 group">
                  <div className="flex items-center gap-3">
                     <div className={`p-2.5 rounded-xl bg-black/30 ${item.color} shadow-inner`}>
                       <item.icon size={18} />
                     </div>
                     <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{item.label}</span>
                  </div>
                  <div className="text-2xl font-cinzel font-bold text-white group-hover:translate-x-1 transition-transform">{item.value}</div>
               </div>
             ))}
          </div>
          <button onClick={onClose} className="w-full py-6 bg-gradient-to-r from-amber-600/10 to-amber-500/10 hover:from-amber-600/20 hover:to-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-[12px] uppercase tracking-[0.5em] rounded-3xl transition-all shadow-2xl active:scale-[0.97]">
            RETURN TO TREE
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [mode, setMode] = useState<TreeMode>('none');
  const [layers, setLayers] = useState(5); 
  const [decorations, setDecorations] = useState<DecorationData[]>([]);
  const [history, setHistory] = useState<('decoration' | 'growth')[]>([]); 
  const [selectedType, setSelectedType] = useState<DecorationType>('orb');
  const [pendingSpot, setPendingSpot] = useState<{pos: THREE.Vector3, rot: THREE.Vector3} | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false); 
  const [viewingImage, setViewingImage] = useState<DecorationData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHint, setShowHint] = useState(true);
  
  const [shareCount, setShareCount] = useState(0);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [lastUserInfo, setLastUserInfo] = useState({ name: 'Holiday Friend', message: 'Merry Christmas to everyone!' });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxCache = useRef<Record<string, HTMLAudioElement>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (mode === 'none') return;
    const timer = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(timer);
  }, [mode]);

  useEffect(() => {
    if (mode === 'none') return;
    const key = mode === 'personal' ? 'xtree_personal' : 'xtree_shared';
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      setDecorations(parsed.decorations || []);
      setLayers(parsed.layers || 5);
      setShareCount(parsed.shareCount || 0);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'none') return;
    const key = mode === 'personal' ? 'xtree_personal' : 'xtree_shared';
    localStorage.setItem(key, JSON.stringify({ decorations, layers, shareCount }));
  }, [decorations, layers, mode, shareCount]);

  useEffect(() => {
    Object.entries(SFX_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      sfxCache.current[key] = audio;
    });
    bgMusicRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=christmas-background-music-126529.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.08;
    return () => bgMusicRef.current?.pause();
  }, []); 

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Could not access microphone", err);
      alert("Please allow microphone access to use this feature!");
    }
  };

  const stopRecording = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        setIsRecording(false);
        resolve('');
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        resolve(audioUrl);
      };

      mediaRecorderRef.current.stop();
    });
  };

  const toggleMusic = () => {
    if (!bgMusicRef.current) return;
    if (isMusicPlaying) {
      bgMusicRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      bgMusicRef.current.play().catch(() => {});
      setIsMusicPlaying(true);
    }
  };

  const playDecorationSound = (type: DecorationType | 'grow') => {
     let key = type === 'grow' ? 'grow' : type;
     if (!SFX_URLS[key as keyof typeof SFX_URLS]) key = 'orb';
     const audio = sfxCache.current[key];
     if (audio) { audio.currentTime = 0; audio.volume = 0.6; audio.play().catch(() => {}); }
  };

  const handleDecorate = (point: THREE.Vector3, normal: THREE.Vector3) => {
    if (pendingSpot) return;
    const offsetDistance = selectedType === 'light' ? 0.05 : 0.25;
    const offsetPoint = point.clone().add(normal.clone().multiplyScalar(offsetDistance));
    const dummyObj = new THREE.Object3D();
    dummyObj.lookAt(normal);
    setPendingSpot({
      pos: offsetPoint,
      rot: new THREE.Vector3(dummyObj.rotation.x, dummyObj.rotation.y, dummyObj.rotation.z)
    });
    setShowHint(false);
  };

  const confirmDecoration = (data: Partial<DecorationData>) => {
    if (!pendingSpot) return;
    const newDeco: DecorationData = {
      id: Math.random().toString(36).substr(2, 9),
      type: data.type || selectedType, 
      position: pendingSpot.pos,
      rotation: pendingSpot.rot,
      scale: (data.type || selectedType) === 'emoji' ? 1.5 : 1,
      timestamp: Date.now(),
      ...data,
    } as DecorationData;
    
    if (data.author || data.message) {
      setLastUserInfo({ name: data.author || 'Holiday Friend', message: data.message || 'Merry Christmas!' });
    }

    setDecorations(prev => [...prev, newDeco]);
    setHistory(prev => [...prev, 'decoration']);
    setPendingSpot(null);
    playDecorationSound(newDeco.type);
  };

  const addTreeLayer = () => {
    if (layers >= 15) return;
    setLayers(prev => prev + 1);
    setHistory(prev => [...prev, 'growth']);
    playDecorationSound('grow');
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    if (lastAction === 'decoration') setDecorations(prev => prev.slice(0, -1));
    else if (lastAction === 'growth' && layers > 1) setLayers(prev => prev - 1);
  };

  const worldStats = useMemo(() => {
    const audioCount = decorations.filter(d => d.type === 'audio' || d.type === 'magic').length;
    const photoCount = decorations.filter(d => d.type === 'photo').length;
    return {
      onlineUsers: 25 + (decorations.length % 12),
      totalParticipants: 2500 + decorations.length,
      shareCount: 1500 + shareCount,
      decorationCount: decorations.length,
      audioCount, photoCount, layers
    };
  }, [decorations, layers, shareCount]);

  const controlsTargetY = (layers * LAYER_HEIGHT_STEP) * 0.45;

  if (mode === 'none') {
    return (
      <div className="w-full h-screen bg-[#050b14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576692139209-66c3c4314757?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-md scale-105" />
        <div className="z-10 text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-4xl md:text-7xl font-cinzel font-bold text-amber-100 mb-4 drop-shadow-xl">Merry <span className="text-red-500 italic">Christmas</span></h1>
          <p className="text-amber-200/60 font-cinzel tracking-widest uppercase text-xs md:text-base">Select Your Holiday Journey</p>
        </div>
        <div className="z-10 flex flex-col md:flex-row gap-6 w-full max-w-4xl px-4">
          <button onClick={() => { if (bgMusicRef.current) { bgMusicRef.current.play(); setIsMusicPlaying(true); } setMode('personal'); }} className="flex-1 group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all hover:scale-[1.02] flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><User size={40} /></div>
            <div><h2 className="text-2xl font-cinzel font-bold text-white mb-2">My Private Tree</h2><p className="text-slate-400 text-sm">A personal sanctuary for your wishes.</p></div>
            <div className="mt-auto px-5 py-2 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest group-hover:bg-amber-500">Enter Private</div>
          </button>
          <button onClick={() => { if (bgMusicRef.current) { bgMusicRef.current.play(); setIsMusicPlaying(true); } setMode('shared'); }} className="flex-1 group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all hover:scale-[1.02] flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform"><Users size={40} /></div>
            <div><h2 className="text-2xl font-cinzel font-bold text-white mb-2">Global Shared Tree</h2><p className="text-slate-400 text-sm">Join others to co-create a masterpiece.</p></div>
            <div className="mt-auto px-5 py-2 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest group-hover:bg-red-500">Join World</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full pt-14 px-12 z-[50] flex justify-between items-start pointer-events-none">
        <div className="flex flex-col drop-shadow-lg text-left pl-1">
           <h1 className="text-lg md:text-3xl font-cinzel font-bold text-white flex flex-col leading-[0.85]">
             <span className="opacity-70 text-xs md:text-sm tracking-wider uppercase">The</span>
             <span className="text-red-500 italic text-2xl md:text-5xl my-1">Christmas</span>
             <span className="opacity-70 text-xs md:text-sm tracking-wider uppercase">Tree</span>
           </h1>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-5">
           <div className="flex gap-2.5 bg-black/40 p-1.5 rounded-2xl backdrop-blur-xl items-center border border-white/10">
             <ActionButton onClick={() => setMode('none')} icon={Settings2} label="Switch Mode" />
             <ActionButton onClick={handleUndo} icon={RotateCcw} label="Undo" disabled={history.length === 0} />
             <button onClick={addTreeLayer} disabled={layers >= 15} className="bg-gradient-to-br from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 text-white px-5 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-xl disabled:opacity-50">
               <ArrowUpCircle size={20} /><span className="hidden md:inline font-cinzel text-xs font-bold">Grow</span>
             </button>
             <ActionButton onClick={toggleMusic} icon={isMusicPlaying ? MusicIcon : VolumeX} label={isMusicPlaying ? "Mute" : "Unmute"} />
             <ActionButton onClick={() => setShowPosterModal(true)} icon={Share2} label="Share" />
           </div>
        </div>
      </div>

      {showHint && !pendingSpot && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[40] pointer-events-none flex flex-col items-center gap-4 animate-bounce">
           <div className="p-4 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white flex items-center gap-2">
             <MousePointer2 size={24} />
             <span className="font-cinzel font-bold text-sm tracking-widest uppercase">Tap tree to decorate</span>
           </div>
        </div>
      )}

      <Canvas shadows gl={{ preserveDrawingBuffer: true }} onCreated={({ gl }) => { canvasRef.current = gl.domElement; }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault fov={45} position={[0, 5, 20]} />
          <ambientLight intensity={1.5} />
          <hemisphereLight intensity={1.0} color="#ffffff" groundColor="#000000" />
          <directionalLight position={[20, 30, 20]} intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} />
          <Stars radius={150} depth={50} count={6000} factor={4} saturation={1} fade speed={1.5} />
          <Sparkles count={500} scale={40} size={5} speed={0.4} color="#fbbf24" />
          <Snow />
          <Tree layers={layers} onDecorate={handleDecorate} onStarClick={() => mode === 'shared' && setShowStatsModal(true)} />
          {decorations.map((deco) => (
            <Decoration key={deco.id} data={deco} onPlayAudio={(url) => {
              if (audioRef.current) audioRef.current.pause();
              audioRef.current = new Audio(url);
              audioRef.current.play();
            }} onViewImage={setViewingImage} />
          ))}
          {pendingSpot && (
              <group position={pendingSpot.pos} rotation={[pendingSpot.rot.x, pendingSpot.rot.y, pendingSpot.rot.z]}>
                <mesh><ringGeometry args={[0.08, 0.12, 32]} /><meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.8} /></mesh>
                <pointLight color="#fbbf24" intensity={2} distance={2} />
              </group>
          )}
          <Environment preset="night" />
          <OrbitControls dampingFactor={0.05} enableDamping={true} minDistance={4} maxDistance={60} target={[0, controlsTargetY, 0]} />
        </Suspense>
      </Canvas>

      <Controls 
        selectedType={selectedType} setSelectedType={setSelectedType}
        pendingData={pendingSpot ? {} : null} onConfirm={confirmDecoration} onCancel={() => setPendingSpot(null)}
        isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording}
      />

      <StatsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} stats={worldStats} />
      
      {viewingImage && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6" onClick={() => setViewingImage(null)}>
          <button onClick={() => setViewingImage(null)} className="absolute top-8 right-8 p-3 bg-white/10 rounded-full"><X size={32} className="text-white" /></button>
          <div className="relative p-1 bg-white rounded-sm max-w-[90vw] max-h-[85vh] flex flex-col items-center animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
             {viewingImage.content && <img src={viewingImage.content} className="w-full h-full object-cover" />}
             <div className="p-6 w-full text-center bg-white">
               <p className="font-cinzel text-black text-sm uppercase font-bold">{viewingImage.author || 'Anonymous'}</p>
               {viewingImage.message && <p className="italic text-slate-500 mt-2 text-xs">"{viewingImage.message}"</p>}
             </div>
          </div>
        </div>
      )}

      {showPosterModal && (
        <PosterModal onClose={() => setShowPosterModal(false)} userName={lastUserInfo.name} userMessage={lastUserInfo.message} canvasElement={canvasRef.current} />
      )}
    </div>
  );
}
