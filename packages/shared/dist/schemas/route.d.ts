import { z } from 'zod';
export declare const routeStopSchema: z.ZodObject<{
    name: z.ZodString;
    lat: z.ZodOptional<z.ZodNumber>;
    lng: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    lat?: number | undefined;
    lng?: number | undefined;
}, {
    name: string;
    lat?: number | undefined;
    lng?: number | undefined;
}>;
export declare const createRouteSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    stops: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        lat: z.ZodOptional<z.ZodNumber>;
        lng: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }, {
        name: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description: string;
    stops: {
        name: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }[];
}, {
    name: string;
    id: string;
    description: string;
    stops: {
        name: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }[];
}>;
export declare const updateRouteSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    stops: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        lat: z.ZodOptional<z.ZodNumber>;
        lng: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }, {
        name: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }>, "many">>;
}, "id">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    stops?: {
        name: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    stops?: {
        name: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }[] | undefined;
}>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
