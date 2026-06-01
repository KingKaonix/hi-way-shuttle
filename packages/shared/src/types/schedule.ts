export interface ScheduleSlot {
  departure: string; // HH:mm
  arrival: string;   // HH:mm
}

export interface Schedule {
  id: number;
  route_id: string;
  day_of_week: number; // 0=Sun, 1=Mon... or -1 for daily
  departure: string;
  arrival: string;
  is_active: boolean;
  created_at: string;
}
