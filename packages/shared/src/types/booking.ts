export type BookingStatus = 'confirmed' | 'canceled' | 'completed' | 'no_show';

export interface Booking {
  id: number;
  user_id: number;
  trip_id: number;
  route_id: string;
  route_name: string;
  departure: string;
  arrival: string;
  seats: number;
  fare_amount: number;
  currency: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}
