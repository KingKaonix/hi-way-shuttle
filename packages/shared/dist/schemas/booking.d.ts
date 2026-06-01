import { z } from 'zod';
export declare const createBookingSchema: z.ZodObject<{
    trip_id: z.ZodNumber;
    seats: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    trip_id: number;
    seats: number;
}, {
    trip_id: number;
    seats?: number | undefined;
}>;
export declare const cancelBookingSchema: z.ZodObject<{
    booking_id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    booking_id: number;
}, {
    booking_id: number;
}>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
