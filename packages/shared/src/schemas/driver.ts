import { z } from 'zod';

export const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(2000).max(2030),
  color: z.string().min(1),
  license_plate: z.string().min(1),
  capacity: z.number().int().min(1).max(20),
});

export const availabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
