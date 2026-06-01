import { z } from 'zod';

export const createBookingSchema = z.object({
  trip_id: z.number().int().positive(),
  seats: z.number().int().min(1).max(10).default(1),
});

export const cancelBookingSchema = z.object({
  booking_id: z.number().int().positive(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
