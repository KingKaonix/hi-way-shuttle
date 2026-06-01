import { bookingRepo } from '../repositories/bookingRepo';
import { tripRepo } from '../repositories/tripRepo';
import { routeRepo } from '../repositories/routeRepo';
import { AppError } from '../middleware/errorHandler';

export const bookingService = {
  async create(userId: number, data: { trip_id: number; seats: number }) {
    const trip = await tripRepo.findById(data.trip_id);
    if (!trip) throw new AppError(404, 'Trip not found');
    if (trip.status !== 'scheduled') throw new AppError(400, 'Trip is not available for booking');

    if (trip.capacity_available < data.seats) {
      throw new AppError(400, `Only ${trip.capacity_available} seats available`);
    }

    const route = await routeRepo.findById(trip.route_id);
    if (!route) throw new AppError(404, 'Route not found');

    const fare = 0; // TODO: calculate from fare table
    await tripRepo.updateCapacity(trip.id, data.seats);

    return bookingRepo.create({
      user_id: userId,
      trip_id: trip.id,
      route_id: trip.route_id,
      route_name: route.name,
      departure: `${trip.date} ${trip.departure_time}`,
      arrival: `${trip.date} ${trip.arrival_time}`,
      seats: data.seats,
      fare_amount: fare,
      status: 'confirmed',
    });
  },

  async cancel(userId: number, bookingId: number) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.user_id !== userId) throw new AppError(403, 'Not your booking');
    if (booking.status === 'canceled') throw new AppError(400, 'Booking already canceled');

    // Restore trip capacity
    await tripRepo.updateCapacity(booking.trip_id, -booking.seats);

    return bookingRepo.cancel(bookingId);
  },

  async listByUser(userId: number) {
    return bookingRepo.findByUser(userId);
  },

  async listAll() {
    return bookingRepo.findAll();
  },
};
