"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBookingSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
exports.createBookingSchema = zod_1.z.object({
    trip_id: zod_1.z.number().int().positive(),
    seats: zod_1.z.number().int().min(1).max(10).default(1),
});
exports.cancelBookingSchema = zod_1.z.object({
    booking_id: zod_1.z.number().int().positive(),
});
