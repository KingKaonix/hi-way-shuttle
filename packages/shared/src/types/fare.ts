export interface Fare {
  id: number;
  route_id: string;
  flat_fare: number;
  per_stop_fare: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
