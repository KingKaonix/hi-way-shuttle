import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  Shield,
  Users,
  Bus,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="card p-5 group hover:border-gold-200/50 transition-all">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center mb-3 group-hover:from-gold-50 group-hover:to-gold-100 transition-all">
        <Icon className="w-5 h-5 text-navy-600 group-hover:text-gold-600 transition-colors" />
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-xs text-navy-400 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-navy-300 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    api.routes.list().then(setRoutes).catch(() => {});
    api.trips
      .listByDate(date)
      .then(setTrips)
      .catch(() => {});
  }, [date]);

  const generateTrips = async () => {
    try {
      setMessage(null);
      await api.trips.generate(date);
      setMessage({ type: 'success', text: `Trips generated for ${date}` });
      api.trips.listByDate(date).then(setTrips);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Generation failed' });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center card p-10">
          <Shield className="w-14 h-14 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Access Restricted</h2>
          <p className="text-navy-400 text-sm">Admin privileges required to view this page.</p>
        </div>
      </div>
    );
  }

  const totalSeats = trips.reduce((s, t) => s + (t.capacity_available || 0), 0);
  const totalCapacity = trips.reduce((s, t) => s + (t.capacity_total || 0), 0);
  const utilization = totalCapacity > 0 ? Math.round(((totalCapacity - totalSeats) / totalCapacity) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center shadow-lg">
          <Shield className="w-6 h-6 text-gold-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
          <p className="text-navy-400 text-sm">Manage routes, trips, and operations</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl border text-sm flex items-center gap-2 animate-slide-down ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={Bus} label="Routes" value={routes.length} sub="Active" />
        <Stat icon={Calendar} label="Trips" value={trips.length} sub={`For ${date}`} />
        <Stat icon={Users} label="Capacity" value={`${totalSeats}`} sub="Available seats" />
        <Stat
          icon={TrendingUp}
          label="Utilization"
          value={`${utilization}%`}
          sub="Across all trips"
        />
      </div>

      {/* Generate trips */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="label">Generate Trips for Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field max-w-xs"
            />
          </div>
          <button onClick={generateTrips} className="btn-gold !py-2.5">
            <Calendar className="w-4 h-4" /> Generate Trips
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Routes list */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-navy-400" />
              <h2 className="font-semibold text-navy-900">Routes</h2>
            </div>
            <span className="text-xs text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full">
              {routes.length} total
            </span>
          </div>
          <div className="divide-y divide-navy-50">
            {routes.map((r) => (
              <div key={r.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-navy-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center">
                    <Bus className="w-4 h-4 text-navy-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-navy-900">{r.name}</span>
                    <span className="text-xs text-navy-300 ml-2">{r.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-navy-400">{r.stops?.length || 0} stops</span>
                  <span className="text-sm font-semibold text-gold-600">
                    ${r.fare?.flat_fare?.toFixed(2) || '—'}
                  </span>
                </div>
              </div>
            ))}
            {routes.length === 0 && (
              <div className="px-6 py-8 text-center text-navy-400 text-sm">No routes configured</div>
            )}
          </div>
        </div>

        {/* Today's trips */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-navy-400" />
              <h2 className="font-semibold text-navy-900">Today's Trips</h2>
            </div>
            <span className="text-xs text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full">
              {trips.length} trips
            </span>
          </div>
          <div className="divide-y divide-navy-50">
            {trips.map((t) => (
              <div key={t.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-navy-50/50 transition-colors">
                <div>
                  <span className="text-sm font-medium text-navy-900">{t.route_name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-navy-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t.departure_time}
                    </span>
                    <ChevronRight className="w-3 h-3 text-navy-200" />
                    <span className="text-xs text-navy-400">{t.arrival_time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-navy-600">
                    {t.capacity_available}/{t.capacity_total} seats
                  </span>
                  {t.capacity_available <= 3 && (
                    <div className="text-[10px] text-amber-600">Low</div>
                  )}
                </div>
              </div>
            ))}
            {trips.length === 0 && (
              <div className="px-6 py-8 text-center text-navy-400 text-sm">
                No trips for this date. Generate trips above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
