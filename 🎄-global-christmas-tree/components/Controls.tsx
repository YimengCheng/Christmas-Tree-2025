
import React, { useState, useRef, useEffect } from 'react';
import { DecorationType, DecorationData, MagicParams } from '../types';
import { Camera, Square, X, Wand2, Lightbulb, Eraser, Sparkles, UserRound, Mic, Loader2 } from 'lucide-react';
import { generateChristmasWish, getFaceCoordinates, transcribeAudio, generateMagicParamsFromAudio } from '../services/geminiService';

interface ControlsProps {
  selectedType: DecorationType;
  setSelectedType: (t: DecorationType) => void;
  pendingData: Partial<DecorationData> | null;
  onConfirm: (data: Partial<DecorationData>) => void;
  onCancel: () => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => Promise<string>;
}

const ControlButton = ({ 
  selected, 
  onClick, 
  icon: Icon, 
  label,
  customContent 
}: { 
  selected: boolean, 
  onClick: () => void, 
  icon?: any, 
  label: string,
  customContent?: React.ReactNode
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="relative flex flex-col items-center">
      {showTooltip && (
         <div className="absolute bottom-full mb-3 px-2 py-1 bg-black/80 text-white text-[10px] rounded whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
           {label}
           <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45"></div>
         </div>
      )}
      <button 
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setTimeout(() => setShowTooltip(false), 800)}
        className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${selected ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'text-amber-100 hover:bg-white/10'}`}
      >
        {customContent ? customContent : <Icon size={20} />}
      </button>
    </div>
  );
};

export const Controls: React.FC<ControlsProps> = ({
  selectedType,
  setSelectedType,
  pendingData,
  onConfirm,
  onCancel,
  isRecording,
  startRecording,
  stopRecording
}) => {
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎄');
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [isGenerating, setIsGenerating] = useState(false);
  const [magicProcessing, setMagicProcessing] = useState(false);
  const [isFaceProcessing, setIsFaceProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [penColor, setPenColor] = useState<'#FFD700' | '#C0C0C0' | '#000000'>('#000000');
  const [isDrawing, setIsDrawing] = useState(false);

  const emojis = ['🎄', '🎅', '⛄', '🎁', '🔔', '🕯️', '🍪', '🦌', '❄️', '⭐'];
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#06b6d4', '#7e22ce', '#EC4899', '#FCD34D', '#FFFFFF', '#000000'];

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleGenerateWish = async () => {
    setIsGenerating(true);
    const wish = await generateChristmasWish(authorName || "Friend", "heartfelt");
    setMessage(wish);
    setIsGenerating(false);
  };

  const handleTranscribeToggle = async () => {
    if (isRecording) {
      setIsTranscribing(true);
      try {
        const audioUrl = await stopRecording();
        if (audioUrl) {
           const response = await fetch(audioUrl);
           const blob = await response.blob();
           const text = await transcribeAudio(blob);
           setMessage(prev => (prev ? prev + " " : "") + text);
        }
      } catch (err) {
        console.error("Transcription failed", err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      startRecording();
    }
  };

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       setIsFaceProcessing(true);
       const reader = new FileReader();
       reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
             const bbox = await getFaceCoordinates(base64);
             const img = new Image();
             img.onload = () => {
                 const canvas = document.createElement('canvas');
                 const ctx = canvas.getContext('2d');
                 let x = 0, y = 0, w = img.width, h = img.height;
                 if (bbox) {
                    const boxW = (bbox.xmax - bbox.xmin) * img.width;
                    const boxH = (bbox.ymax - bbox.ymin) * img.height;
                    const centerX = bbox.xmin * img.width + boxW / 2;
                    const centerY = bbox.ymin * img.height + boxH / 2;
                    const size = Math.max(boxW, boxH) * 1.4;
                    x = centerX - size / 2;
                    y = centerY - size / 2;
                    w = size; h = size;
                 } else {
                    const size = Math.min(img.width, img.height);
                    x = (img.width - size) / 2; y = (img.height - size) / 2;
                    w = size; h = size;
                 }
                 canvas.width = 512; canvas.height = 512;
                 if (ctx) {
                     ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 512, 512);
                     ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.clip();
                     ctx.drawImage(img, x, y, w, h, 0, 0, 512, 512);
                 }
                 setFaceImage(canvas.toDataURL());
                 setSelectedColor('#000000');
                 setIsFaceProcessing(false);
             };
             img.src = base64;
          } catch (err) {
             setFaceImage(base64);
             setIsFaceProcessing(false);
          }
       };
       reader.readAsDataURL(file);
    }
  }

  const handleMagicRecordingStop = async () => {
    setMagicProcessing(true);
    const audioUrl = await stopRecording();
    
    if (audioUrl) {
       try {
         const response = await fetch(audioUrl);
         const blob = await response.blob();
         const result = await generateMagicParamsFromAudio(blob);
         
         onConfirm({
           author: authorName || "Holiday Friend",
           message: result.wish,
           type: 'magic',
           color: result.color,
           magicParams: result.params,
           content: audioUrl,
           scale: result.params.scaleVar || 1.2
         });
       } catch (err) {
         console.error("Magic generation failed", err);
       } finally {
         setMagicProcessing(false);
       }
    } else {
       setMagicProcessing(false);
    }
  };

  const finalize = () => {
    let signatureData = undefined;
    if (selectedType === 'photo' && canvasRef.current) {
       signatureData = canvasRef.current.toDataURL('image/png');
    }
    let finalContent = undefined;
    if (selectedType === 'emoji') finalContent = selectedEmoji;
    else if (selectedType === 'photo') finalContent = photoPreview || '';
    else if (selectedType === 'orb' && faceImage) finalContent = faceImage;

    onConfirm({
      author: authorName,
      message,
      content: finalContent,
      color: selectedColor,
      signature: signatureData
    });
    
    setMessage('');
    setPhotoPreview(null);
    setFaceImage(null);
    setSelectedColor('#EF4444');
    clearSignature();
  };

  if (!pendingData) {
    return (
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-xl border border-amber-500/20 p-2 rounded-full flex gap-3 shadow-2xl z-50 max-w-[95vw] overflow-x-auto">
        <ControlButton selected={selectedType === 'orb'} onClick={() => setSelectedType('orb')} label="Ornament" customContent={<div className={`w-5 h-5 rounded-full border-2 border-current ${selectedType === 'orb' ? 'bg-white' : 'bg-transparent'}`} />} />
        <ControlButton selected={selectedType === 'light'} onClick={() => setSelectedType('light')} icon={Lightbulb} label="Lights" />
        <ControlButton selected={selectedType === 'emoji'} onClick={() => setSelectedType('emoji')} label="Sticker" customContent={<span className="text-xl leading-none">😊</span>} />
        <ControlButton selected={selectedType === 'photo'} onClick={() => setSelectedType('photo')} icon={Camera} label="Photo" />
        <ControlButton selected={selectedType === 'magic'} onClick={() => setSelectedType('magic')} icon={Sparkles} label="Magic Wish" />
      </div>
    );
  }

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl w-[90%] max-w-sm max-h-[85vh] overflow-y-auto z-50 border border-amber-500/20 text-slate-200 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 sticky top-0 bg-[#0f172a]/95 z-10">
        <h3 className="text-xl font-cinzel font-bold text-amber-400">Place {selectedType === 'light' ? 'Light' : selectedType === 'magic' ? 'Magic Decoration' : 'Decoration'}</h3>
        <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
      </div>

      <div className="space-y-6">
        {selectedType === 'magic' && (
           <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="p-4 bg-amber-500/10 rounded-full mb-2"><Sparkles size={48} className="text-amber-400 animate-pulse" /></div>
              <p className="text-sm text-amber-200/80">Hold the button and say <br/><span className="text-white font-bold">"Your Wish"</span></p>
              <p className="text-xs text-slate-400 mb-4">Gemini will turn your voice into a unique 3D shape!</p>
              {magicProcessing ? (
                 <div className="flex items-center gap-2 text-amber-400 font-cinzel font-bold animate-pulse"><Wand2 className="animate-spin" /> Transmuting...</div>
              ) : (
                <button onMouseDown={startRecording} onMouseUp={handleMagicRecordingStop} onTouchStart={startRecording} onTouchEnd={handleMagicRecordingStop} className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:scale-105'}`}>
                   <Mic size={32} className="text-white" />
                   {isRecording && <span className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></span>}
                </button>
              )}
           </div>
        )}

        {(selectedType === 'orb' || selectedType === 'photo' || selectedType === 'light') && (
          <div>
            <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">{selectedType === 'photo' ? 'Frame Color' : 'Color'}</label>
            <div className="flex gap-2 justify-center flex-wrap">
              {selectedType === 'orb' && (
                <>
                  <input type="file" accept="image/*" ref={faceInputRef} onChange={handleFaceUpload} className="hidden" />
                  <button onClick={() => !isFaceProcessing && faceInputRef.current?.click()} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center bg-slate-700 ${faceImage ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border-slate-500'}`} disabled={isFaceProcessing}>
                     {isFaceProcessing ? <Loader2 size={16} className="animate-spin text-white" /> : <UserRound size={16} className={faceImage ? "text-amber-500" : "text-slate-300"} />}
                  </button>
                </>
              )}
              {colors.map(c => (
                <button key={c} onClick={() => setSelectedColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        )}

        {selectedType === 'emoji' && (
          <div className="grid grid-cols-5 gap-2">
            {emojis.map(e => (
              <button key={e} onClick={() => setSelectedEmoji(e)} className={`text-2xl p-2 rounded-lg transition-colors ${selectedEmoji === e ? 'bg-white/10 ring-1 ring-amber-500' : 'hover:bg-white/5'}`}>{e}</button>
            ))}
          </div>
        )}

        {selectedType === 'photo' && (
          <div className="flex flex-col items-center gap-3">
             <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setPhotoPreview(r.result as string); r.readAsDataURL(f); } }} className="hidden" />
             <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border border-dashed border-slate-500 rounded-xl text-slate-400 hover:border-amber-500 hover:text-amber-500 hover:bg-amber-500/5 transition-all text-sm">{photoPreview ? 'Change Photo' : 'Select Photo from Library'}</button>
             {photoPreview && <div className="p-1 bg-white shadow-lg transform rotate-2"><img src={photoPreview} className="w-32 h-32 object-cover" /></div>}
             <div className="w-full mt-4">
               <div className="flex justify-between items-center mb-2"><label className="text-xs text-slate-400 uppercase tracking-wider">Sign / Doodle</label><button onClick={clearSignature} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"><Eraser size={12} /> Clear</button></div>
               <div className="bg-white rounded-lg overflow-hidden touch-none relative"><canvas ref={canvasRef} width={300} height={100} className="w-full h-[100px] cursor-crosshair block" onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onMouseMove={draw} onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw} /><div className="absolute top-2 right-2 flex gap-1">{[{ c: '#FFD700', n: 'Gold' }, { c: '#C0C0C0', n: 'Silver' }, { c: '#000000', n: 'Black' }].map(pen => (<button key={pen.c} onClick={() => setPenColor(pen.c as any)} className={`w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm ${penColor === pen.c ? 'ring-2 ring-blue-500' : ''}`} style={{ backgroundColor: pen.c }} />))}</div></div>
             </div>
          </div>
        )}

        {selectedType !== 'magic' && (
          <div className="space-y-3">
             <input type="text" placeholder="Your Name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white text-sm" />
             <div className="relative">
               <textarea placeholder="Write a warm wish..." value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:border-amber-500 outline-none resize-none h-24 text-white text-sm" />
               <div className="absolute bottom-2 right-2 flex gap-1">
                 <button onClick={handleTranscribeToggle} className={`p-2 rounded-lg border transition-all ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-amber-600/20 text-amber-400 border-amber-600/50 hover:bg-amber-600/40'}`}>
                   {isTranscribing ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                 </button>
                 <button onClick={handleGenerateWish} disabled={isGenerating} className="p-2 bg-amber-600/20 text-amber-400 border border-amber-600/50 rounded-lg hover:bg-amber-600/40 transition-all disabled:opacity-50"><Wand2 size={16} className={isGenerating ? "animate-spin" : ""} /></button>
               </div>
             </div>
          </div>
        )}

        {selectedType !== 'magic' && (
          <button onClick={finalize} disabled={isFaceProcessing} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-cinzel font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Add to Tree</button>
        )}
      </div>
    </div>
  );
};
