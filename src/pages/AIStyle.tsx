import React, { useState, useRef } from 'react';
import { Camera, Sparkles, RefreshCw, Scissors, User, Zap, Download } from 'lucide-react';
import { analyzeFaceAndSuggestStyles, generateGroomedLook } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { compressImage } from '../lib/utils';

const HAIRCUTS = [
  "Curly Long Hair",
  "Curly Faded Haircut",
  "Wolfcut",
  "Textured Haircut",
  "Buzz Cut",
  "Taper Fade",
  "Side Part",
  "Modern Mullet"
];

const BEARDS = [
  "Clean Shave",
  "Italian Beard + Skin Fade",
  "Short Stubble",
  "Heavy Stubble",
  "Full Groomed Beard",
  "Goatee"
];

export default function AIStyle() {
  const [image, setImage] = useState<string | null>(null);
  const [groomedImage, setGroomedImage] = useState<string | null>(null);
  const [selectedHair, setSelectedHair] = useState<string | null>("Curly Long Hair");
  const [selectedBeard, setSelectedBeard] = useState<string | null>("Short Stubble");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!image) {
      toast.error("Please upload your photo first");
      return;
    }
    
    setIsAnalyzing(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(p => p < 98 ? p + 2 : p);
    }, 100);

    try {
      const response = await fetch('/api/groom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: image.split(',')[1],
          haircut: selectedHair,
          beard: selectedBeard || 'Clean Shave'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server Error');
      }

      const data = await response.json();
      setResults(data.analysis);
      setGroomedImage(data.groomedImage);
      toast.success('Style match identified!');
    } catch (error: any) {
      toast.error(error.message || 'AI mismatch. Try again.');
      console.error(error);
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const downloadResult = () => {
    if (!groomedImage) return;
    const link = document.createElement('a');
    link.href = groomedImage;
    link.download = `shabnam-grooming-${selectedHair?.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-black italic uppercase tracking-tight">AI Grooming</h2>
        <p className="text-white/40 text-sm">See how you'll look with a new trendy haircut.</p>
      </div>

      <div className="space-y-8">
        {/* Step 1: Image Control */}
        {!image ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card aspect-square rounded-[2.5rem] mt-4 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 hover:border-gold/30 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-xl font-bold mb-2">Upload Selfie</h3>
            <p className="text-white/30 text-[10px] uppercase tracking-widest leading-relaxed">Front facing photo for<br/>accurate AI scalp mapping</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                   try {
                     const compressed = await compressImage(file, 800, 800, 0.7);
                     setImage(compressed);
                     setResults(null);
                     setGroomedImage(null);
                   } catch (err) { toast.error("File error"); }
                }
              }} 
            />
          </motion.div>
        ) : (
          <div className="space-y-8">
             {/* Progress / Scan View */}
             {isAnalyzing ? (
               <div className="space-y-8 flex flex-col items-center justify-center py-10">
                 <div className="relative w-64 h-64 rounded-[2rem] overflow-hidden glass-card shadow-2xl">
                   <img src={image} className="w-full h-full object-cover grayscale opacity-40" alt="Scanning" />
                   <motion.div 
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-0.5 bg-gold shadow-[0_0_20px_#D4AF37] z-10"
                   />
                   <div className="absolute inset-0 bg-gold/5" />
                 </div>
                 <div className="text-center space-y-3">
                   <div className="flex items-center justify-center gap-3">
                      <Sparkles className="w-4 h-4 text-gold animate-spin" />
                      <h3 className="text-xl font-black italic uppercase tracking-tighter text-gold">AI Profiling</h3>
                   </div>
                   <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ ease: "linear" }}
                        className="h-full bg-gold"
                      />
                   </div>
                   <p className="text-[10px] text-white/30 uppercase tracking-[0.3em]">Synthesizing Follicles • {scanProgress}%</p>
                 </div>
               </div>
             ) : !results ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="relative w-32 h-32 mx-auto">
                    <img src={image} className="w-full h-full object-cover rounded-full border-2 border-gold/50 shadow-xl" alt="Preview" />
                    <button 
                      onClick={() => setImage(null)} 
                      className="absolute -bottom-1 -right-1 p-3 bg-charcoal border border-white/10 rounded-full text-white/60 hover:text-white"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <section className="space-y-4">
                       <h3 className="text-[10px] uppercase font-bold text-gold tracking-[0.2em] flex items-center gap-2">
                         <Scissors className="w-3 h-3" /> Step 2: Choose Haircut
                       </h3>
                       <div className="grid grid-cols-2 gap-2">
                          {HAIRCUTS.map(name => (
                            <button 
                              key={name}
                              onClick={() => setSelectedHair(name)}
                              className={`py-4 px-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedHair === name ? 'bg-gold text-charcoal border-gold shadow-lg shadow-gold/10 scale-[1.02]' : 'bg-white/5 border-white/5 text-white/50'}`}
                            >
                              {name}
                            </button>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h3 className="text-[10px] uppercase font-bold text-gold tracking-[0.2em] flex items-center gap-2">
                         <Sparkles className="w-3 h-3" /> Step 3: Beard Style
                       </h3>
                       <div className="flex flex-wrap gap-2">
                          {BEARDS.map(name => (
                            <button 
                              key={name}
                              onClick={() => setSelectedBeard(name)}
                              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all border ${selectedBeard === name ? 'bg-white text-charcoal border-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                              {name}
                            </button>
                          ))}
                       </div>
                    </section>
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    className="gold-button w-full h-20 text-xl italic font-black uppercase flex items-center justify-center gap-4 shadow-[0_15px_40px_rgba(212,175,55,0.25)]"
                  >
                    <Zap className="w-8 h-8" />
                    Generate My Look
                  </button>
               </motion.div>
             ) : (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6"
               >
                 <div className="glass-card overflow-hidden border-t-4 border-t-gold shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                    <div className="p-4 bg-gold/5 flex items-center justify-between border-b border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">AI Masterpiece</p>
                       <Zap className="w-4 h-4 text-gold fill-gold" />
                    </div>
                    
                    <div className="p-6 space-y-6">
                       <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                          {groomedImage ? (
                            <img src={groomedImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Groomed Result" />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                              <RefreshCw className="w-8 h-8 animate-spin text-white/20" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-charcoal via-charcoal/80 to-transparent">
                             <div className="space-y-1">
                                <p className="text-[9px] font-bold text-gold uppercase tracking-[0.5em]">Vision Confirmed</p>
                                <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedHair}</h4>
                                <p className="text-xs font-medium text-white/60 tracking-widest mt-1">{selectedBeard || 'Clean Shave'}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-4 flex gap-2 bg-white/[0.02] border-t border-white/5">
                       <button 
                         onClick={() => { setResults(null); setGroomedImage(null); }}
                         className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:bg-white/10 transition-colors"
                       >
                         Redesign
                       </button>
                       <button 
                         onClick={downloadResult}
                         className="flex-[2] py-4 bg-gold text-charcoal rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                         <Download className="w-3 h-3" />
                         Save Look
                       </button>
                    </div>
                 </div>
                 <p className="text-center text-[9px] text-white/20 uppercase tracking-[0.4em] font-medium leading-relaxed">Show this digital blueprint to your barber<br/>at Shabnam Salon</p>
               </motion.div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
