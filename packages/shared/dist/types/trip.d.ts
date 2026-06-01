export type TripStatus = 'scheduled' | 'boarding' | 'en_route' | 'completed' | 'canceled';
export interface Trip {
    id: number;
    route_id: string;
    driver_id?: number;
    vehicle_id?: number;
    date: string;
    departure_time: string;
    arrival_time: string;
    capacity_total: number;
    capacity_available: number;
    status: TripStatus;
    notes?: string;
    created_at: string;
    updated_at: string;
}
