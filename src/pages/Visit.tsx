import { MapPin, Phone, Clock, Instagram, Facebook, Calendar, Scissors } from 'lucide-react';
import { SalonConfig } from '../types';

export default function Visit({ config }: { config: SalonConfig | null }) {
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">Visit Our Studio</h2>
        <p className="text-white/50 text-lg">Come experience the finest grooming in the city.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="glass-card p-10 space-y-8 flex flex-col justify-between h-full">
            <div className="space-y-8">
               <InfoItem 
                icon={<MapPin className="text-gold" />}
                title="Location"
                value={config?.address || "Address Loading..."}
                subtitle="Okhla, New Delhi"
              />
              <InfoItem 
                icon={<Clock className="text-gold" />}
                title="Opening Hours"
                value={config?.openingHours || "10:00 AM - 9:00 PM"}
                subtitle={config?.status === 'open' ? "Open Now" : "Closed"}
              />
              <InfoItem 
                icon={<Phone className="text-gold" />}
                title="Phone"
                value="+91 98765 43210"
                subtitle="Call for instant inquiries"
              />
            </div>

            <div className="pt-8 border-t border-white/5 flex gap-4">
               <SocialLink icon={<Instagram />} href="#" />
               <SocialLink icon={<Facebook />} href="#" />
            </div>
          </div>
        </div>

        {/* Visual / Map Interaction */}
        <div className="space-y-6">
          <div className="glass-card overflow-hidden h-[400px] group relative">
            <img 
              src={config?.photoUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop"} 
              alt="Salon Exterior" 
              className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gold/10 mix-blend-overlay group-hover:bg-transparent transition-all" />
            <div className="absolute bottom-6 left-6 right-6 p-6 glass-card bg-charcoal/80 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.3em] font-bold text-gold mb-1">Our Environment</p>
              <h3 className="text-xl font-bold">Classic Vibes, Modern Style</h3>
            </div>
          </div>

          <div className="glass-card p-8 bg-gold text-charcoal">
             <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black italic">Ready for a cut?</h4>
                  <p className="text-charcoal/70 font-medium">Walk-ins are welcome, but bookings are preferred.</p>
                </div>
                <div className="p-4 bg-charcoal rounded-full text-gold">
                  <Scissors className="w-8 h-8" />
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Featured Styles Mini-Gallery */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
           <div className="h-[1px] flex-1 bg-white/10" />
           <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">Studio Gallery</h3>
           <div className="h-[1px] flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="aspect-square glass-card overflow-hidden">
               <img 
                src={`https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=300&h=300&auto=format&fit=crop&v=${i}`} 
                alt="Style" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-grayscale duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoItem({ icon, title, value, subtitle }: any) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
        {icon}
      </div>
      <div>
        <h5 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">{title}</h5>
        <p className="text-xl font-bold text-white leading-tight mb-1">{value}</p>
        <p className="text-xs text-gold/60 font-bold uppercase tracking-wider">{subtitle}</p>
      </div>
    </div>
  );
}

function SocialLink({ icon, href }: any) {
  return (
    <a href={href} className="w-12 h-12 glass-card flex items-center justify-center hover:bg-gold hover:text-charcoal transition-all">
      {icon}
    </a>
  );
}
