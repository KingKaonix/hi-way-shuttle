import { Link } from 'react-router-dom';
import {
  Bus,
  Calendar,
  ArrowRight,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '../api/client';

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="card p-6 text-center group hover:border-gold-200/50">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center mx-auto mb-3 group-hover:from-gold-50 group-hover:to-gold-100 transition-all duration-300">
        <Icon className="w-6 h-6 text-navy-600 group-hover:text-gold-600 transition-colors" />
      </div>
      <div className="text-3xl font-bold text-navy-900">{value}</div>
      <div className="text-sm text-navy-400 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-navy-300 mt-1">{sub}</div>}
    </div>
  );
}

function RouteCard({ route }: { route: any }) {
  return (
    <div className="card p-6 card-hover group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center group-hover:from-gold-50 group-hover:to-gold-100 transition-all">
          <Bus className="w-5 h-5 text-navy-600 group-hover:text-gold-600 transition-colors" />
        </div>
        {route.fare && (
          <span className="text-lg font-bold text-gold-600">
            ${route.fare.flat_fare?.toFixed(2)}
            <span className="text-xs text-navy-300 font-normal">/ride</span>
          </span>
        )}
      </div>
      <h3 className="font-semibold text-navy-900 text-lg">{route.name}</h3>
      <p className="text-navy-400 text-sm mt-0.5 line-clamp-1">{route.description}</p>

      {/* Stops timeline */}
      {(route.stops || []).length > 0 && (
        <div className="mt-4 space-y-1.5">
          {(route.stops as any[]).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs text-navy-400">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-emerald-400' : i === route.stops.length - 1 ? 'bg-red-400' : 'bg-navy-200'}`} />
              <span>{s.name || s}</span>
              {i < route.stops.length - 1 && <ChevronRight className="w-3 h-3 text-navy-200" />}
            </div>
          ))}
        </div>
      )}

      {route.schedules && route.schedules.length > 0 && (
        <div className="mt-4 pt-3 border-t border-navy-100">
          <div className="flex items-center gap-1.5 text-xs text-navy-400 mb-2">
            <Clock className="w-3.5 h-3.5" /> Schedule
          </div>
          <div className="flex flex-wrap gap-1.5">
            {route.schedules.slice(0, 3).map((s: any, i: number) => (
              <span
                key={i}
                className="text-xs bg-navy-50 text-navy-500 px-2 py-1 rounded-lg font-medium"
              >
                {s.departure}
              </span>
            ))}
            {route.schedules.length > 3 && (
              <span className="text-xs text-navy-300 px-1">+{route.schedules.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    api.routes
      .list()
      .then(setRoutes)
      .catch(() => {});
    api.trips
      .listByDate(new Date().toISOString().split('T')[0])
      .then(setTrips)
      .catch(() => {});
  }, []);

  const totalSeats = trips.reduce((s, t) => s + (t.capacity_available || 0), 0);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-navy-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-navy-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-medium mb-6">
              <Star className="w-3.5 h-3.5" />
              Premium Transportation Service
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight">
              Your Commute,{' '}
              <span className="text-gradient bg-gradient-to-r from-gold-400 to-gold-500">
                Elevated
              </span>
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-navy-200 max-w-2xl leading-relaxed">
              Reliable, scheduled shuttle service designed for professionals who value
              punctuality, comfort, and peace of mind.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {user ? (
                <Link to="/bookings" className="btn-gold !px-6 !py-3 !rounded-xl !text-base shadow-xl shadow-gold-500/20">
                  My Bookings <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-gold !px-6 !py-3 !rounded-xl !text-base shadow-xl shadow-gold-500/20">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/routes" className="btn-secondary !px-6 !py-3 !rounded-xl !text-base !bg-navy-800 !text-navy-200 !border-navy-600 hover:!bg-navy-700">
                    View Routes
                  </Link>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-8 border-t border-navy-700/50">
              {[
                { icon: ShieldCheck, text: 'Reliable & On-Time' },
                { icon: Users, text: 'Professional Drivers' },
                { icon: Star, text: '5-Star Service' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-navy-300 text-sm">
                  <item.icon className="w-4 h-4 text-gold-400" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="relative -mt-8 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={MapPin} label="Routes" value={routes.length.toString()} sub="Scheduled daily" />
          <StatCard icon={Calendar} label="Trips Today" value={trips.length.toString()} sub="On schedule" />
          <StatCard icon={Users} label="Seats Available" value={totalSeats.toString()} sub="Across all routes" />
        </div>
      </section>

      {/* Routes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="section-title">Our Routes</h2>
            <p className="section-subtitle">
              Carefully planned routes connecting key destinations throughout the city.
            </p>
          </div>
          <Link
            to="/routes"
            className="btn-ghost text-navy-600 hidden sm:flex"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route, i) => (
            <div key={route.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <RouteCard route={route} />
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link to="/routes" className="btn-secondary">
            View All Routes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Bus className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Ready to Ride?
          </h2>
          <p className="text-navy-300 text-lg max-w-xl mx-auto mb-8">
            Join hundreds of professionals who choose Hi-Way-Shuttle for their daily commute.
          </p>
          {user ? (
            <Link to="/bookings" className="btn-gold !px-8 !py-3 !rounded-xl !text-base shadow-xl shadow-gold-500/20">
              Book Your Seat <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link to="/register" className="btn-gold !px-8 !py-3 !rounded-xl !text-base shadow-xl shadow-gold-500/20">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
