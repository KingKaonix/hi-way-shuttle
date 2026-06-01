import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, Bus, Calendar, Clock, DollarSign, MapPin,
  AlertCircle, Plus, Trash2, Edit3, X, Check, Save,
  TrendingUp, Users, ChevronRight, GripVertical,
} from 'lucide-react';

type Tab = 'routes' | 'fares' | 'schedules' | 'trips';

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('routes');
  const [routes, setRoutes] = useState<any[]>([]);
  const [fares, setFares] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Record<string, any[]>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<{ routeId: string; schedule: any[] } | null>(null);
  const [editingFare, setEditingFare] = useState<{ routeId: string; fare: any } | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const loadRoutes = useCallback(async () => {
    try {
      const data = await api.routes.list();
      setRoutes(data);
      // Also load schedules for each route
      const scheds: Record<string, any[]> = {};
      for (const r of data) {
        try { scheds[r.id] = await api.schedules.get(r.id); } catch { scheds[r.id] = []; }
      }
      setSchedulesMap(scheds);
    } catch { showMessage('error', 'Failed to load routes'); }
  }, [showMessage]);

  const loadFares = useCallback(async () => {
    try { setFares(await api.fares.get()); }
    catch { showMessage('error', 'Failed to load fares'); }
  }, [showMessage]);

  const loadTrips = useCallback(async () => {
    try { setTrips(await api.trips.listByDate(date)); }
    catch { showMessage('error', 'Failed to load trips'); }
  }, [date, showMessage]);

  useEffect(() => {
    if (activeTab === 'routes' || activeTab === 'schedules') loadRoutes();
    if (activeTab === 'fares') loadFares();
    if (activeTab === 'trips') loadTrips();
  }, [activeTab, loadRoutes, loadFares, loadTrips]);

  // --- Route CRUD ---
  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Delete this route and its fares/schedules?')) return;
    try {
      await api.routes.delete(id);
      showMessage('success', 'Route deleted');
      loadRoutes();
    } catch (e: any) { showMessage('error', e.message); }
  };

  const handleSaveRoute = async (route: any, isNew: boolean) => {
    try {
      if (isNew) await api.routes.create(route);
      else await api.routes.update(route.id, route);
      showMessage('success', isNew ? 'Route created' : 'Route updated');
      setEditingRoute(null);
      loadRoutes();
    } catch (e: any) { showMessage('error', e.message); }
  };

  // --- Fare CRUD ---
  const handleSaveFare = async (routeId: string, data: any) => {
    try {
      await api.fares.update(routeId, data);
      showMessage('success', 'Fare updated');
      setEditingFare(null);
      loadFares();
    } catch (e: any) { showMessage('error', e.message); }
  };

  const handleSaveGlobalFare = async (data: any) => {
    try {
      // Update first route's fare with global changes (or use the first route)
      if (routes.length > 0) {
        await api.fares.update(routes[0].id, data);
      }
      showMessage('success', 'Global fare settings updated');
      loadFares();
    } catch (e: any) { showMessage('error', e.message); }
  };

  // --- Schedule CRUD ---
  const handleSaveSchedule = async (routeId: string, schedule: any[]) => {
    try {
      await api.schedules.update(routeId, schedule);
      showMessage('success', 'Schedule updated');
      setEditingSchedule(null);
      loadRoutes();
    } catch (e: any) { showMessage('error', e.message); }
  };

  // --- Trips ---
  const handleGenerateTrips = async () => {
    try {
      await api.trips.generate(date);
      showMessage('success', `Trips generated for ${date}`);
      loadTrips();
    } catch (e: any) { showMessage('error', e.message); }
  };

  // --- Helpers ---
  const addStopToRoute = (route: any) => {
    const stops = [...(route.stops || []), ''];
    setEditingRoute({ ...route, stops });
  };

  const updateStop = (route: any, idx: number, val: string) => {
    const stops = [...(route.stops || [])];
    stops[idx] = val;
    setEditingRoute({ ...route, stops });
  };

  const removeStop = (route: any, idx: number) => {
    const stops = (route.stops || []).filter((_: any, i: number) => i !== idx);
    setEditingRoute({ ...route, stops });
  };

  const addSchedule = () => {
    if (!editingSchedule) return;
    setEditingSchedule({
      ...editingSchedule,
      schedule: [...editingSchedule.schedule, { departure: '08:00', arrival: '08:45' }],
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center card p-10">
          <Shield className="w-14 h-14 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Access Restricted</h2>
          <p className="text-navy-400 text-sm">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  const totalSeats = trips.reduce((s, t) => s + (t.capacity_available || 0), 0);
  const totalCapacity = trips.reduce((s, t) => s + (t.capacity_total || 0), 0);
  const utilization = totalCapacity > 0 ? Math.round(((totalCapacity - totalSeats) / totalCapacity) * 100) : 0;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'routes', label: 'Routes', icon: Bus },
    { id: 'fares', label: 'Fares', icon: DollarSign },
    { id: 'schedules', label: 'Schedules', icon: Clock },
    { id: 'trips', label: 'Trips', icon: Calendar },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
            <p className="text-navy-400 text-sm">Manage routes, fares, schedules & operations</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl border text-sm flex items-center gap-2 animate-slide-down ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-navy-50/50 p-1 rounded-xl border border-navy-100 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-navy-900 shadow-sm border border-navy-100'
                : 'text-navy-400 hover:text-navy-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== ROUTES TAB ===== */}
      {activeTab === 'routes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">All Routes</h2>
            <button onClick={() => setEditingRoute({ id: '', name: '', description: '', stops: [''] })}
              className="btn-gold !py-2 !px-4 !text-xs">
              <Plus className="w-3.5 h-3.5" /> New Route
            </button>
          </div>

          {/* Edit/Create modal */}
          {editingRoute && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setEditingRoute(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-navy-100 w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg text-navy-900">
                    {editingRoute.id && routes.find(r => r.id === editingRoute.id) ? 'Edit Route' : 'New Route'}
                  </h3>
                  <button onClick={() => setEditingRoute(null)} className="text-navy-300 hover:text-navy-500"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Route ID</label>
                    <input className="input-field" value={editingRoute.id} onChange={e => setEditingRoute({...editingRoute, id: e.target.value})}
                      placeholder="rt-xx-01" disabled={!!routes.find(r => r.id === editingRoute.id)} />
                  </div>
                  <div>
                    <label className="label">Name</label>
                    <input className="input-field" value={editingRoute.name} onChange={e => setEditingRoute({...editingRoute, name: e.target.value})}
                      placeholder="Downtown Express" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input className="input-field" value={editingRoute.description} onChange={e => setEditingRoute({...editingRoute, description: e.target.value})}
                      placeholder="Direct service to..." />
                  </div>
                  <div>
                    <label className="label flex items-center justify-between">
                      <span>Stops</span>
                      <button onClick={() => addStopToRoute(editingRoute)}
                        className="text-xs text-gold-600 hover:text-gold-700 font-medium">+ Add stop</button>
                    </label>
                    <div className="space-y-2">
                      {(editingRoute.stops || []).map((stop: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-400' : i === editingRoute.stops.length - 1 ? 'bg-red-400' : 'bg-navy-200'}`} />
                            {i < editingRoute.stops.length - 1 && <div className="w-0.5 h-5 bg-navy-100" />}
                          </div>
                          <input className="input-field flex-1" value={stop} onChange={e => updateStop(editingRoute, i, e.target.value)}
                            placeholder={i === 0 ? 'Departure stop' : i === editingRoute.stops.length - 1 ? 'Arrival stop' : 'Intermediate stop'} />
                          <button onClick={() => removeStop(editingRoute, i)}
                            className="text-red-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-navy-100">
                  <button onClick={() => setEditingRoute(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={() => handleSaveRoute(editingRoute, !routes.find(r => r.id === editingRoute.id))}
                    className="btn-gold flex-1"><Save className="w-4 h-4" /> Save Route</button>
                </div>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="divide-y divide-navy-50">
              {routes.map(r => (
                <div key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-navy-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bus className="w-5 h-5 text-navy-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-navy-900">{r.name}</span>
                        <span className="text-[10px] text-navy-300 bg-navy-50 px-1.5 py-0.5 rounded">{r.id}</span>
                      </div>
                      <p className="text-xs text-navy-400 mt-0.5">{r.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(r.stops || []).map((s: any, i: number) => (
                          <span key={i} className="text-[10px] text-navy-400 bg-navy-50 px-1.5 py-0.5 rounded-full">{s.name || s || '?'}</span>
                        ))}
                      </div>
                      {schedulesMap[r.id] && schedulesMap[r.id].length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-navy-300">
                          <Clock className="w-3 h-3" />
                          {schedulesMap[r.id].slice(0, 3).map((s: any, i: number) => (
                            <span key={i}>{s.departure}{i < Math.min(schedulesMap[r.id].length, 3) - 1 ? ',' : ''} </span>
                          ))}
                          {schedulesMap[r.id].length > 3 && <span>+{schedulesMap[r.id].length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => handleDeleteRoute(r.id)}
                      className="text-red-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingRoute({...r, stops: [...(r.stops || [])]})}
                      className="text-navy-300 hover:text-gold-600 p-2 rounded-lg hover:bg-gold-50 transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {routes.length === 0 && (
                <div className="p-10 text-center text-navy-300 text-sm">No routes. Create your first one above.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== FARES TAB ===== */}
      {activeTab === 'fares' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global fare settings */}
            <div className="card p-6">
              <h3 className="font-semibold text-navy-900 mb-4">Global Fare Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Base Fare ($)</label>
                  <input className="input-field" type="number" step="0.1"
                    value={fares?.base_fare ?? 3.5}
                    onChange={e => setFares((f: any) => ({ ...f, base_fare: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="label">Per Stop Fare ($)</label>
                  <input className="input-field" type="number" step="0.1"
                    value={fares?.per_stop ?? 1.5}
                    onChange={e => setFares((f: any) => ({ ...f, per_stop: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <input className="input-field" value={fares?.currency ?? 'USD'}
                    onChange={e => setFares((f: any) => ({ ...f, currency: e.target.value }))} />
                </div>
                <button onClick={() => handleSaveGlobalFare({ base_fare: fares?.base_fare, per_stop: fares?.per_stop, currency: fares?.currency })}
                  className="btn-gold w-full !py-2.5"><Save className="w-4 h-4" /> Save Global Settings</button>
              </div>
            </div>

            {/* Per-route fares */}
            <div className="card p-6">
              <h3 className="font-semibold text-navy-900 mb-4">Per-Route Flat Fares</h3>
              <div className="space-y-3">
                {routes.map(r => {
                  const isEditing = editingFare?.routeId === r.id;
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-navy-50/50 border border-navy-100">
                      <div>
                        <span className="font-medium text-sm text-navy-900">{r.name}</span>
                        <span className="text-xs text-navy-300 ml-2">{r.id}</span>
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-navy-400">$</span>
                          <input className="w-20 input-field !py-1.5 text-sm" type="number" step="0.5"
                            value={editingFare?.fare?.flat_fare ?? 0}
                            onChange={e => setEditingFare({ ...editingFare!, fare: { flat_fare: parseFloat(e.target.value) || 0 } })} />
                          <button onClick={() => handleSaveFare(r.id, editingFare!.fare)}
                            className="text-emerald-500 hover:text-emerald-600 p-1"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingFare(null)}
                            className="text-red-300 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gold-600">
                            ${(fares?.routes?.[r.id]?.flat_fare || 0).toFixed(2)}
                          </span>
                          <button onClick={() => setEditingFare({ routeId: r.id, fare: { flat_fare: fares?.routes?.[r.id]?.flat_fare || 5 } })}
                            className="text-navy-300 hover:text-gold-600 p-1"><Edit3 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {routes.length === 0 && <div className="text-navy-300 text-sm text-center py-4">No routes to configure</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SCHEDULES TAB ===== */}
      {activeTab === 'schedules' && (
        <div>
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Route Schedules</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {routes.map(r => (
              <div key={r.id} className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-navy-400" />
                    <span className="font-semibold text-navy-900 text-sm">{r.name}</span>
                    <span className="text-[10px] text-navy-300">{r.id}</span>
                  </div>
                  <button onClick={() => setEditingSchedule({
                    routeId: r.id,
                    schedule: schedulesMap[r.id]?.length > 0 ? [...schedulesMap[r.id]] : [{ departure: '07:00', arrival: '07:45' }],
                  })} className="text-xs text-gold-600 hover:text-gold-700 font-medium">Edit</button>
                </div>
                <div className="px-6 py-3">
                  {schedulesMap[r.id] && schedulesMap[r.id].length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {schedulesMap[r.id].map((s: any, i: number) => (
                        <span key={i} className="text-xs bg-navy-50 text-navy-600 px-3 py-1.5 rounded-lg font-medium border border-navy-100">
                          {s.departure} <span className="text-navy-300">→</span> {s.arrival}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-navy-300">No schedule defined</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Schedule editor modal */}
          {editingSchedule && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setEditingSchedule(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-navy-100 w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg text-navy-900">
                    Schedule — {routes.find(r => r.id === editingSchedule.routeId)?.name || editingSchedule.routeId}
                  </h3>
                  <button onClick={() => setEditingSchedule(null)} className="text-navy-300 hover:text-navy-500"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-3">
                  {editingSchedule.schedule.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-navy-50/50 border border-navy-100">
                      <div className="flex-1">
                        <label className="text-[10px] text-navy-400 font-medium">Departure</label>
                        <input className="input-field !py-1.5 text-sm mt-0.5" type="time"
                          value={s.departure}
                          onChange={e => {
                            const sched = [...editingSchedule.schedule];
                            sched[i] = { ...sched[i], departure: e.target.value };
                            setEditingSchedule({ ...editingSchedule, schedule: sched });
                          }} />
                      </div>
                      <div className="flex items-center justify-center mt-5">
                        <ChevronRight className="w-4 h-4 text-navy-300" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-navy-400 font-medium">Arrival</label>
                        <input className="input-field !py-1.5 text-sm mt-0.5" type="time"
                          value={s.arrival}
                          onChange={e => {
                            const sched = [...editingSchedule.schedule];
                            sched[i] = { ...sched[i], arrival: e.target.value };
                            setEditingSchedule({ ...editingSchedule, schedule: sched });
                          }} />
                      </div>
                      <button onClick={() => {
                        const sched = editingSchedule.schedule.filter((_: any, j: number) => j !== i);
                        setEditingSchedule({ ...editingSchedule, schedule: sched });
                      }} className="text-red-300 hover:text-red-500 p-1 mt-5"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>

                <button onClick={addSchedule} className="btn-secondary w-full mt-3 !py-2 !text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Time
                </button>

                <div className="flex gap-3 mt-5 pt-4 border-t border-navy-100">
                  <button onClick={() => setEditingSchedule(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={() => handleSaveSchedule(editingSchedule.routeId, editingSchedule.schedule)}
                    className="btn-gold flex-1"><Save className="w-4 h-4" /> Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TRIPS TAB ===== */}
      {activeTab === 'trips' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Bus, label: 'Routes', value: routes.length },
              { icon: Calendar, label: 'Trips', value: trips.length, sub: `For ${date}` },
              { icon: Users, label: 'Available', value: `${totalSeats} seats` },
              { icon: TrendingUp, label: 'Utilization', value: `${utilization}%` },
            ].map((s, i) => (
              <div key={i} className="card p-4">
                <s.icon className="w-5 h-5 text-navy-400 mb-2" />
                <div className="text-2xl font-bold text-navy-900">{s.value}</div>
                <div className="text-xs text-navy-400">{s.label}</div>
                {s.sub && <div className="text-[10px] text-navy-300 mt-0.5">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Generate trips */}
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-navy-900 mb-3">Generate Trips</h3>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="label">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field max-w-xs" />
              </div>
              <button onClick={handleGenerateTrips} className="btn-gold !py-2.5">
                <Calendar className="w-4 h-4" /> Generate
              </button>
            </div>
          </div>

          {/* Trips list */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
              <span className="font-semibold text-navy-900 text-sm">Trips for {date}</span>
              <span className="text-xs text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full">{trips.length} trips</span>
            </div>
            <div className="divide-y divide-navy-50">
              {trips.map(t => (
                <div key={t.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-navy-50/30">
                  <div>
                    <span className="font-medium text-sm text-navy-900">{t.route_name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-navy-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t.departure_time}</span>
                      <ChevronRight className="w-3 h-3 text-navy-200" />
                      <span className="text-xs text-navy-400">{t.arrival_time}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-navy-600">{t.capacity_available}/{t.capacity_total}</span>
                    {t.capacity_available <= 3 && <div className="text-[10px] text-amber-600">Low</div>}
                  </div>
                </div>
              ))}
              {trips.length === 0 && (
                <div className="px-6 py-8 text-center text-navy-300 text-sm">No trips. Generate above.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
