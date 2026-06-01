export interface ScheduleSlot {
    departure: string;
    arrival: string;
}
export interface Schedule {
    id: number;
    route_id: string;
    day_of_week: number;
    departure: string;
    arrival: string;
    is_active: boolean;
    created_at: string;
}
