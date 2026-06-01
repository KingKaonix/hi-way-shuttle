import { z } from 'zod';
export declare const vehicleSchema: z.ZodObject<{
    make: z.ZodString;
    model: z.ZodString;
    year: z.ZodNumber;
    color: z.ZodString;
    license_plate: z.ZodString;
    capacity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    capacity: number;
}, {
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    capacity: number;
}>;
export declare const availabilitySchema: z.ZodObject<{
    day_of_week: z.ZodNumber;
    start_time: z.ZodString;
    end_time: z.ZodString;
}, "strip", z.ZodTypeAny, {
    day_of_week: number;
    start_time: string;
    end_time: string;
}, {
    day_of_week: number;
    start_time: string;
    end_time: string;
}>;
export declare const updateLocationSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
}, {
    lat: number;
    lng: number;
}>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
