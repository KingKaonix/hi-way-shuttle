"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLocationSchema = exports.availabilitySchema = exports.vehicleSchema = void 0;
const zod_1 = require("zod");
exports.vehicleSchema = zod_1.z.object({
    make: zod_1.z.string().min(1),
    model: zod_1.z.string().min(1),
    year: zod_1.z.number().int().min(2000).max(2030),
    color: zod_1.z.string().min(1),
    license_plate: zod_1.z.string().min(1),
    capacity: zod_1.z.number().int().min(1).max(20),
});
exports.availabilitySchema = zod_1.z.object({
    day_of_week: zod_1.z.number().int().min(0).max(6),
    start_time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    end_time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
});
exports.updateLocationSchema = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
});
