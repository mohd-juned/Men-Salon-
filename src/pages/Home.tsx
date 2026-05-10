import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, ArrowRight, Scissors } from 'lucide-react';
import { SalonConfig } from '../types';

export default function Home({ config }: { config: SalonConfig | null }) {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[60vh] rounded-3xl overflow-hidden group">
        <img 
          src={config?.photoUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop"} 
          alt="Salon Interior" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-12 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-gold font-bold uppercase tracking-[0.2em] text-xs"
          >
            <Sparkles className="w-4 h-4" />
            Premium Grooming Experience
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black max-w-2xl leading-none"
          >
            Redefining Style at <span className="text-gold">Shabnam Salon</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/booking" className="gold-button inline-flex items-center gap-2 mt-4">
              Book Appointment <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services/Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          icon={<Scissors className="text-gold" />}
          title="Master Barbering"
          desc="Precision haircuts, faded looks, and traditional shaves by experts."
        />
        <FeatureCard 
          icon={<Sparkles className="text-gold" />}
          title="AI Style Vision"
          desc="Try on new hairstyles and beard styles virtually using our AI tool."
        />
        <FeatureCard 
          icon={<Calendar className="text-gold" />}
          title="Priority Booking"
          desc="Book your slot online and get instant confirmation messages."
        />
      </section>

      {/* Style Highlight */}
      <section className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <h3 className="text-3xl font-bold italic">Not sure what suits you?</h3>
          <p className="text-white/60">Our AI Grooming Assistant analyzes your face shape and hair texture to recommend the most trendy styles that suit your personality.</p>
          <Link to="/ai-style" className="gold-outline inline-flex items-center gap-2">
            Try AI Grooming <Sparkles className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
           <img src="https://images.unsplash.com/photo-1621605815840-209824041abb?q=80&w=200&h=250&fit=crop" className="rounded-xl w-full object-cover grayscale hover:grayscale-0 transition-all" alt="Style 1" referrerPolicy="no-referrer" />
           <img src="https://images.unsplash.com/photo-1593702275677-f916c8c76045?q=80&w=200&h=250&fit=crop" className="rounded-xl w-full object-cover translate-y-4 grayscale hover:grayscale-0 transition-all" alt="Style 2" referrerPolicy="no-referrer" />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any; title: string, desc: string }) {
  return (
    <div className="glass-card p-8 border-t-4 border-t-gold/20 hover:border-t-gold transition-all group">
      <div className="mb-4 bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-xl font-bold mb-2">{title}</h4>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}
