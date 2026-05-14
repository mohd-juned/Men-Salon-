import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Scissors, Calendar, MapPin, Sparkles, LayoutDashboard, LogIn, LogOut, Menu, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Booking from './pages/Booking';
import AIStyle from './pages/AIStyle';
import Dashboard from './pages/Dashboard';
import Visit from './pages/Visit';
import { SalonConfig } from './types';

const ADMIN_EMAIL = 'md.junedphs@gmail.com';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [salonConfig, setSalonConfig] = useState<SalonConfig | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'salon', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SalonConfig;
        
        // Handle Auto Status logic
        if (data.autoStatus && data.openingHours) {
          try {
            const now = new Date();
            const [start, end] = data.openingHours.split(' - ').map(t => {
              const [time, modifier] = t.split(' ');
              let [hours, minutes] = time.split(':').map(Number);
              if (modifier === 'PM' && hours < 12) hours += 12;
              if (modifier === 'AM' && hours === 12) hours = 0;
              const d = new Date();
              d.setHours(hours, minutes || 0, 0, 0);
              return d;
            });
            
            const isOpen = now >= start && now <= end;
            data.status = isOpen ? 'open' : 'closed';
          } catch (e) {
            console.error("Auto status calc failed", e);
          }
        }
        
        setSalonConfig(data);
      } else {
        // Initial setup for first time
        const defaultConfig: SalonConfig = {
          status: 'open',
          openingHours: '10:00 AM - 9:00 PM',
          address: 'Main market Pahasu 203396',
          phone: '+91 00000 00000',
          photoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
          gallery: []
        };
        setDoc(doc(db, 'salon', 'config'), {
          ...defaultConfig,
          lastUpdated: serverTimestamp()
        }).catch(err => console.error("Initial config fail:", err));
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeConfig();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in successfully');
    } catch (err) {
      toast.error('Sign in failed');
    }
  };

  const logout = async () => {
    await signOut(auth);
    toast.success('Signed out');
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans">
        <Toaster position="top-center" />
        
        {/* Navigation */}
        <nav className="sticky top-0 z-50 glass-card mx-4 my-4 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gold p-2 rounded-lg">
              <Scissors className="text-charcoal w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-none">Shabnam</h1>
              <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Men's Salon</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/booking" icon={<Calendar className="w-4 h-4" />} label="Booking" />
            <NavLink to="/ai-groom" icon={<Sparkles className="w-4 h-4" />} label="AI Groom" />
            <NavLink to="/visit" icon={<MapPin className="w-4 h-4" />} label="Visit" />
            {isAdmin && <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Admin" />}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <button onClick={logout} className="p-2 text-white/60 hover:text-white">
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={login} className="p-2 text-gold hover:text-white transition-colors">
                <LogIn className="w-5 h-5" />
              </button>
            )}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden glass-card mx-4 mb-4 p-6 flex flex-col gap-4 z-40"
            >
              <MobileNavLink to="/booking" label="Book Appointment" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink to="/ai-groom" label="AI Grooming" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink to="/visit" label="Visit & Contact" onClick={() => setIsMenuOpen(false)} />
              {isAdmin && <MobileNavLink to="/dashboard" label="Admin Dashboard" onClick={() => setIsMenuOpen(false)} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Bar */}
        <div className="mx-4 mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${salonConfig?.status === 'open' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {salonConfig?.status === 'open' ? 'We are Open' : 'Closed Now'}
            </span>
          </div>
          <div className="text-[11px] text-white/50 flex items-center gap-1">
             <Clock className="w-3 h-3" />
             {salonConfig?.status === 'open' ? `Serving until ${salonConfig?.openingHours.split('-')[1]}` : 'Opens at 10 AM'}
          </div>
        </div>

        <main className="flex-1 px-4 pb-12">
          <Routes>
            <Route path="/" element={<Home config={salonConfig} />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/ai-groom" element={<AIStyle />} />
            <Route path="/visit" element={<Visit config={salonConfig} />} />
            <Route path="/dashboard" element={<Dashboard config={salonConfig} isAdmin={isAdmin} />} />
          </Routes>
        </main>

        <footer className="text-center py-12 border-t border-white/5">
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-medium">
            Website design by <span className="text-gold/60 font-bold">Juned</span>
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: any; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 text-sm font-medium transition-all ${isActive ? 'text-gold' : 'text-white/60 hover:text-white'}`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="text-lg font-serif border-b border-white/5 pb-2"
    >
      {label}
    </Link>
  );
}
