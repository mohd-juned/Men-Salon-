export type BookingStatus = 'pending' | 'accepted' | 'rejected';

export interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  status: BookingStatus;
  createdAt: any;
  updatedAt?: any;
}

export interface SalonConfig {
  status: 'open' | 'closed';
  openingHours: string;
  address: string;
  photoUrl: string;
  autoStatus?: boolean;
  lastUpdated?: any;
}

export interface HairstyleSuggestion {
  title: string;
  description: string;
  type: 'hair' | 'beard';
  suitabilityScore: number;
}
