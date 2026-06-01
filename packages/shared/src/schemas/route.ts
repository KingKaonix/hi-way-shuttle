import { z } from 'zod';

export const routeStopSchema = z.object({
  name: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const createRouteSchema = z.object({
  id: z.string().regex(/^rt-[a-z]{2}-\d{2}$/, 'Must match format: rt-xx-00'),
  name: z.string().min(2).max(100),
  description: z.string().min(1).max(500),
  stops: z.array(routeStopSchema).min(2),
});

export const updateRouteSchema = createRouteSchema.partial().omit({ id: true });

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
