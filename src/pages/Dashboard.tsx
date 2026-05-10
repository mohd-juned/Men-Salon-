import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Clock, User, Phone, Calendar, Scissors, Settings, Save, Image as ImageIcon, Upload, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Booking, SalonConfig } from '../types';
import { compressImage } from '../lib/utils';

export default function Dashboard({ config, isAdmin }: { config: SalonConfig | null; isAdmin: boolean }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editConfig, setEditConfig] = useState<SalonConfig | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error("Bookings listener error:", error);
      if (error.code === 'permission-denied') {
        toast.error("Access denied. Are you using the admin email?");
      }
    });

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (config) setEditConfig(config);
  }, [config]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 600, 0.6); // Shrink to reasonable size for web
        setEditConfig(prev => prev ? { ...prev, photoUrl: compressed } : null);
        toast.success("Photo optimized & updated. Save changes to finalize.");
      } catch (error) {
        toast.error("Failed to process image.");
      }
    }
  };

  const handleUpdateConfig = async () => {
    if (!editConfig) return;
    try {
      await updateDoc(doc(db, 'salon', 'config'), {
        ...editConfig,
        lastUpdated: serverTimestamp(),
      });
      toast.success('Salon settings updated!');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const handleStatusChange = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Booking ${status}`);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
          <Settings className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black italic">Restricted Access</h2>
        <p className="text-white/50">Only the salon owner can access the dashboard. Please sign in with the admin account.</p>
        <div className="bg-gold/10 p-4 border border-gold/20 rounded-xl text-xs font-mono text-gold">
          {auth?.currentUser?.email ? `Current: ${auth.currentUser.email}` : "Not Signed In"}
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto py-8 lg:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter">Owner Dashboard</h2>
          <p className="text-white/50 text-lg">Manage your salon operations and bookings in real-time.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 pr-6 rounded-full border border-white/10">
          <div className="bg-gold p-2 rounded-full text-charcoal">
             <User className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-gold">Admin Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-8 space-y-6">
              <h3 className="text-xl font-bold italic flex items-center gap-2">
                <Settings className="text-gold w-5 h-5" />
                Salon Settings
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">Auto Status</span>
                    <button 
                      onClick={() => setEditConfig(prev => prev ? {...prev, autoStatus: !prev.autoStatus} : null)}
                      className={`w-12 h-6 rounded-full transition-all relative ${editConfig?.autoStatus ? 'bg-gold' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editConfig?.autoStatus ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 italic">When active, salon status updates based on opening hours automatically.</p>
                  
                  {!editConfig?.autoStatus && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                       <span className="text-xs font-bold uppercase tracking-widest text-white/60">Manual Status</span>
                       <button 
                        onClick={() => setEditConfig(prev => prev ? {...prev, status: prev.status === 'open' ? 'closed' : 'open'} : null)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${editConfig?.status === 'open' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                       >
                         {editConfig?.status === 'open' ? 'OPEN' : 'CLOSED'}
                       </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Opening Hours</label>
                  <input 
                    type="text" 
                    value={editConfig?.openingHours} 
                    onChange={(e) => setEditConfig(prev => prev ? {...prev, openingHours: e.target.value} : null)}
                    className="w-full bg-charcoal border border-white/10 p-3 rounded-xl text-sm focus:border-gold transition-colors"
                    placeholder="e.g. 10:00 AM - 09:00 PM"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Studio Address</label>
                  <input
                    type="text"
                    value={editConfig?.address || ''}
                    onChange={(e) => setEditConfig(prev => prev ? {...prev, address: e.target.value} : null)}
                    className="w-full bg-charcoal border border-white/10 p-3 rounded-xl text-sm focus:border-gold transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Support Phone</label>
                  <input 
                    type="text" 
                    value={editConfig?.phone || ''} 
                    onChange={(e) => setEditConfig(prev => prev ? {...prev, phone: e.target.value} : null)}
                    className="w-full bg-charcoal border border-white/10 p-3 rounded-xl text-sm focus:border-gold transition-colors"
                    placeholder="e.g. +91 99999 99999"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Studio Gallery (4 Photos)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden glass-card group bg-black/20">
                        {editConfig?.gallery?.[index] ? (
                          <img src={editConfig.gallery[index]} className="w-full h-full object-cover" alt={`Gallery ${index}`} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10 italic text-[10px]">Empty</div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Camera className="w-5 h-5 text-gold" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressed = await compressImage(file, 600, 600, 0.6);
                                  setEditConfig(prev => {
                                    if (!prev) return null;
                                    const newGallery = [...(prev.gallery || ['','','',''])];
                                    newGallery[index] = compressed;
                                    return { ...prev, gallery: newGallery };
                                  });
                                  toast.success("Gallery item updated");
                                } catch (err) { toast.error("Upload failed"); }
                              }
                            }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Salon Cover Photo</label>
                  <div className="relative aspect-video rounded-2xl overflow-hidden glass-card group bg-black/20">
                    <img src={editConfig?.photoUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                        onClick={() => photoInputRef.current?.click()}
                        className="p-4 bg-gold text-charcoal rounded-full hover:scale-110 transition-transform"
                       >
                         <Camera className="w-6 h-6" />
                       </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-gold" />
                    Upload from Gallery
                  </button>
                  <input 
                    type="file" 
                    ref={photoInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                  />
                </div>

                <button 
                  onClick={handleUpdateConfig}
                  className="gold-button w-full flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="w-4 h-4" />
                  Save Studio Changes
                </button>
              </div>
           </div>
        </div>

        {/* Bookings Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold italic flex items-center gap-2">
              <Calendar className="text-gold w-5 h-5" />
              Recent Bookings
              {pendingCount > 0 && <span className="bg-gold text-charcoal text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">{pendingCount} NEW</span>}
            </h3>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Sort by: Latest First
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-20 text-center animate-pulse text-white/20">Loading Bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="glass-card p-12 text-center text-white/30 italic">No bookings found yet.</div>
            ) : (
              bookings.map((booking) => (
                <BookingRow 
                  key={booking.id} 
                  booking={booking} 
                  onAction={handleStatusChange} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking, onAction }: { booking: Booking; onAction: (id: string, s: 'accepted' | 'rejected') => void; [key: string]: any }) {
  const isPending = booking.status === 'pending';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all border-l-4 ${
        booking.status === 'accepted' ? 'border-l-green-500' : 
        booking.status === 'rejected' ? 'border-l-red-500' : 'border-l-gold'
      }`}
    >
      <div className="flex items-center gap-6 w-full md:w-auto">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPending ? 'bg-gold/10 text-gold' : 'bg-white/5 text-white/20'}`}>
           <Scissors className="w-6 h-6" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-lg">{booking.name}</h4>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
              booking.status === 'accepted' ? 'bg-green-500/20 text-green-500' : 
              booking.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-gold/20 text-gold'
            }`}>
              {booking.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
             <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-gold/60" /> {booking.phone}</div>
             <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-gold/60" /> {booking.date}</div>
             <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-gold/60" /> {booking.time}</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isPending && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 w-full md:w-auto"
          >
            <button 
              onClick={() => onAction(booking.id!, 'rejected')}
              className="flex-1 md:flex-none p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center"
              title="Reject"
            >
              <X className="w-5 h-5" />
              <span className="md:hidden ml-2 font-bold uppercase text-xs">Reject</span>
            </button>
            <button 
              onClick={() => onAction(booking.id!, 'accepted')}
              className="flex-1 md:flex-none p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center font-bold"
              title="Accept"
            >
              <Check className="w-5 h-5" />
              <span className="md:hidden ml-2 font-bold uppercase text-xs">Accept</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
