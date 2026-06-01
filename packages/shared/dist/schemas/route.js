"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRouteSchema = exports.createRouteSchema = exports.routeStopSchema = void 0;
const zod_1 = require("zod");
exports.routeStopSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    lat: zod_1.z.number().optional(),
    lng: zod_1.z.number().optional(),
});
exports.createRouteSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^rt-[a-z]{2}-\d{2}$/, 'Must match format: rt-xx-00'),
    name: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().min(1).max(500),
    stops: zod_1.z.array(exports.routeStopSchema).min(2),
});
exports.updateRouteSchema = exports.createRouteSchema.partial().omit({ id: true });
