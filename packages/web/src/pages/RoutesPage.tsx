import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Clock, DollarSign, MapPin, Bus, ArrowRight, ChevronRight } from 'lucide-react';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.routes
      .list()
      .then(setRoutes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-gold-500 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-navy-400 text-sm">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="section-title">All Routes</h1>
        <p className="section-subtitle">
          Explore our scheduled routes and find the one that works for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map((route, i) => (
          <div
            key={route.id}
            className="card overflow-hidden card-hover animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center">
                    <Bus className="w-6 h-6 text-navy-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-navy-900">{route.name}</h2>
                    <p className="text-navy-400 text-sm">{route.description}</p>
                  </div>
                </div>
                {route.fare && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-gold-600">
                      ${route.fare.flat_fare?.toFixed(2)}
                    </div>
                    <div className="text-xs text-navy-300">{route.fare.currency || 'USD'}</div>
                  </div>
                )}
              </div>

              {/* Stops timeline */}
              {(route.stops || []).length > 0 && (
                <div className="bg-navy-50/50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs text-navy-400 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> Stops
                  </div>
                  <div className="space-y-0">
                    {(route.stops as any[]).map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2.5 h-2.5 rounded-full border-2 ${
                              i === 0
                                ? 'bg-emerald-400 border-emerald-200'
                                : i === route.stops.length - 1
                                ? 'bg-red-400 border-red-200'
                                : 'bg-navy-200 border-navy-100'
                            }`}
                          />
                          {i < route.stops.length - 1 && (
                            <div className="w-0.5 h-4 bg-navy-200" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            i === 0
                              ? 'text-emerald-700 font-medium'
                              : i === route.stops.length - 1
                              ? 'text-red-700 font-medium'
                              : 'text-navy-500'
                          }`}
                        >
                          {s.name || s}
                        </span>
                        {i === 0 && (
                          <span className="text-[10px] text-emerald-500 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                            Departure
                          </span>
                        )}
                        {i === route.stops.length - 1 && (
                          <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                            Arrival
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule */}
              {route.schedules && route.schedules.length > 0 && (
                <div className="mt-4 pt-4 border-t border-navy-100">
                  <div className="flex items-center gap-1.5 text-xs text-navy-400 mb-2">
                    <Clock className="w-3.5 h-3.5" /> Departure Times
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {route.schedules.map((s: any, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-navy-50 text-navy-600 px-2.5 py-1 rounded-lg font-medium border border-navy-100"
                      >
                        {s.departure}
                        {s.arrival && (
                          <>
                            {' '}
                            <span className="text-navy-300">→</span> {s.arrival}
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Book CTA */}
            {user && (
              <div className="border-t border-navy-100 px-6 py-3 bg-navy-50/30">
                <button
                  onClick={() => navigate('/bookings?route=' + route.id)}
                  className="btn-gold w-full !py-2.5"
                >
                  <Bus className="w-4 h-4" /> Book This Route
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!user && (
        <div className="text-center mt-10 p-8 bg-navy-50 rounded-2xl border border-navy-100">
          <Bus className="w-10 h-10 text-navy-300 mx-auto mb-3" />
          <p className="text-navy-500 font-medium">Sign in to book a route</p>
          <p className="text-navy-400 text-sm mt-1">Create an account or log in to start booking.</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => navigate('/login')} className="btn-secondary">
              Sign In
            </button>
            <button onClick={() => navigate('/register')} className="btn-gold">
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
