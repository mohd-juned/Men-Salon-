import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Phone, User, CheckCircle, Send, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

enum OperationType {
  CREATE = 'create',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error(`Booking Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

export default function Booking() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date || !formData.time) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    const bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const path = `bookings/${bookingId}`;

    try {
      await setDoc(doc(db, 'bookings', bookingId), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
      toast.success('Booking requested successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-gold rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="text-charcoal w-12 h-12" />
        </motion.div>
        <h2 className="text-4xl font-black italic">Booking Received!</h2>
        <p className="text-white/60">
          Shukriya, {formData.name}! Your request has been sent to Shabnam Salon. 
          You will receive a confirmation message at <span className="text-gold font-bold">{formData.phone}</span> once accepted.
        </p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="gold-outline w-full"
        >
          Make Another Booking
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black italic mb-4 uppercase tracking-tight">Book a Slot</h2>
        <p className="text-white/50 text-lg">Pick a time that works for you. Our team will verify and confirm shortly.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup 
            label="Full Name" 
            id="name" 
            icon={<User className="w-4 h-4" />}
            placeholder="e.g. Rahul Kumar"
            value={formData.name}
            onChange={(v) => setFormData({...formData, name: v})}
          />
          <InputGroup 
            label="Phone Number" 
            id="phone" 
            icon={<Phone className="w-4 h-4" />}
            placeholder="e.g. 9876543210"
            type="tel"
            value={formData.phone}
            onChange={(v) => setFormData({...formData, phone: v})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup 
            label="Date" 
            id="date" 
            icon={<CalendarIcon className="w-4 h-4" />}
            type="date"
            min={format(new Date(), 'yyyy-MM-dd')}
            value={formData.date}
            onChange={(v) => setFormData({...formData, date: v})}
          />
          <InputGroup 
            label="Time Slot" 
            id="time" 
            icon={<Clock className="w-4 h-4" />}
            type="time"
            value={formData.time}
            onChange={(v) => setFormData({...formData, time: v})}
          />
        </div>

        <div className="bg-white/5 p-4 rounded-xl text-sm border border-gold/10">
          <p className="text-white/60 flex items-start gap-2">
            <Sparkles className="text-gold w-4 h-4 mt-0.5" />
            Note: Appointments are subject to seat availability. The owner will send a confirmation message to your mobile number.
          </p>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="gold-button w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending Request...' : 'Send Booking Request'}
          {!isSubmitting && <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}

function InputGroup({ label, id, icon, type = "text", placeholder = "", value, onChange, min }: any) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-widest text-gold/80 block">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </div>
        <input 
          id={id}
          type={type}
          min={min}
          className="w-full bg-charcoal border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold transition-colors text-white"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
