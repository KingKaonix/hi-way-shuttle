import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  Calendar,
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle,
  Bus,
  ArrowRight,
  MapPin,
  DollarSign,
  User,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const STATUS_BADGES: Record<string, { class: string; icon: any; label: string }> = {
  confirmed: { class: 'badge-confirmed', icon: CheckCircle, label: 'Confirmed' },
  canceled: { class: 'badge-canceled', icon: XCircle, label: 'Canceled' },
  completed: { class: 'badge-completed', icon: CheckCircle, label: 'Completed' },
};

export default function Bookings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [view, setView] = useState<'book' | 'my'>(
    searchParams.get('route') ? 'book' : 'my'
  );
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        api.bookings.my(),
        api.trips.listByDate(new Date().toISOString().split('T')[0]),
      ]);
      setBookings(b);
      setTrips(t);
    } catch (e: any) {
      showMessage('error', e.message || 'Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBook = async (tripId: number) => {
    try {
      await api.bookings.create({ trip_id: tripId, seats: 1 });
      showMessage('success', 'Booking confirmed! Your seat is reserved.');
      loadData();
    } catch (e: any) {
      showMessage('error', e.message || 'Booking failed');
    }
  };

  const handleCancel = async (bookingId: number) => {
    try {
      await api.bookings.cancel(bookingId);
      showMessage('info', 'Booking has been canceled.');
      loadData();
    } catch (e: any) {
      showMessage('error', e.message || 'Cancel failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-gold-500 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-navy-400 text-sm">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">
            {view === 'my' ? 'My Bookings' : 'Book a Ride'}
          </h1>
          <p className="section-subtitle !text-sm">
            {view === 'my'
              ? 'Manage your upcoming and past reservations.'
              : 'Select a trip to reserve your seat.'}
          </p>
        </div>
        <button
          onClick={() => setView(view === 'book' ? 'my' : 'book')}
          className={`${view === 'book' ? 'btn-primary' : 'btn-gold'} !py-2.5 !px-5`}
        >
          {view === 'book' ? (
            <>
              <Calendar className="w-4 h-4" /> My Bookings
            </>
          ) : (
            <>
              <Bus className="w-4 h-4" /> Book a Ride
            </>
          )}
        </button>
      </div>

      {/* Message toast */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl border text-sm flex items-center gap-2 animate-slide-down ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : message.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}

      {view === 'my' ? (
        /* My Bookings */
        bookings.length === 0 ? (
          <div className="text-center py-20 card">
            <Calendar className="w-14 h-14 text-navy-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 mb-1">No bookings yet</h3>
            <p className="text-navy-400 text-sm mb-6">
              You haven't made any reservations. Book your first ride today.
            </p>
            <button onClick={() => setView('book')} className="btn-gold">
              <Bus className="w-4 h-4" /> Book a Ride
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((b) => {
              const badge = STATUS_BADGES[b.status] || STATUS_BADGES.confirmed;
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={b.id}
                  className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-hover animate-slide-up"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-navy-900 text-lg">{b.route_name}</h3>
                      <span className={`${badge.class} flex items-center gap-1`}>
                        <BadgeIcon className="w-3 h-3" /> {badge.label}
                      </span>
                      <span className="text-xs text-navy-300">#{b.id}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-navy-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {b.departure} → {b.arrival}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> $
                        {(b.fare_amount || 0).toFixed(2)}
                      </span>
                      {b.seats && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {b.seats} seat{b.seats > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="btn-secondary !text-red-500 !border-red-200 hover:!bg-red-50 !py-2 !px-4 flex-shrink-0"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Book a Ride - available trips */
        trips.length === 0 ? (
          <div className="text-center py-20 card">
            <Calendar className="w-14 h-14 text-navy-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 mb-1">No trips available</h3>
            <p className="text-navy-400 text-sm">
              There are no scheduled trips for today. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {trips.map((trip, i) => (
              <div
                key={trip.id}
                className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-hover animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-navy-900 text-lg">{trip.route_name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-navy-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {trip.departure_time} → {trip.arrival_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {trip.stops || 'Multiple stops'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="text-sm font-semibold text-navy-700">
                      {trip.capacity_available} seat{trip.capacity_available !== 1 ? 's' : ''} available
                    </div>
                    {trip.capacity_available <= 3 && trip.capacity_available > 0 && (
                      <span className="badge-low">Low availability</span>
                    )}
                    {trip.capacity_available === 0 && (
                      <span className="badge-full">Full</span>
                    )}
                    {trip.fare_amount && (
                      <span className="text-gold-600 font-bold text-sm ml-auto sm:ml-3">
                        ${trip.fare_amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleBook(trip.id)}
                  disabled={trip.capacity_available === 0}
                  className={`${trip.capacity_available === 0 ? 'btn-secondary !text-navy-300 !cursor-not-allowed' : 'btn-gold'} !py-2.5 !px-6 flex-shrink-0`}
                >
                  {trip.capacity_available === 0 ? 'Full' : 'Book Now'}
                  {trip.capacity_available > 0 && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
