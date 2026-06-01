export interface Vehicle {
    id: number;
    driver_id: number;
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    capacity: number;
    is_active: boolean;
    created_at: string;
}
export interface DriverAvailability {
    id: number;
    driver_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}
export interface Driver {
    id: number;
    user_id: number;
    license_number: string;
    rating: number;
    total_trips: number;
    is_online: boolean;
    current_location_lat?: number;
    current_location_lng?: number;
    created_at: string;
    updated_at: string;
}
