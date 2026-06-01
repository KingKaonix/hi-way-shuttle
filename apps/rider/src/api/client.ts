import { Platform } from 'react-native';

const API_URL = 'https://hi-way-shuttle.fly.dev';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  rider: {
    register: (data: { name: string; phone?: string; email?: string }) =>
      request<any>('/hiway/rider/register', { method: 'POST', body: JSON.stringify(data) }),
    getActive: (id: string) => request<any>(`/hiway/rider/${id}/active`),
    getHistory: (id: string) => request<any[]>(`/hiway/rider/${id}/history`),
  },
  estimate: (data: { pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number; riderId?: string }) =>
    request<any>('/hiway/estimate', { method: 'POST', body: JSON.stringify(data) }),
  ride: {
    get: (id: string) => request<any>(`/hiway/ride/${id}`),
  },
  drivers: {
    nearby: (lat: number, lng: number, radius?: number) =>
      request<any[]>(`/hiway/drivers/nearby?lat=${lat}&lng=${lng}&radius=${radius || 5}`),
  },
  subscription: {
    get: (userId: string) => request<any>(`/hiway/subscription/${userId}`),
    create: (data: { userId: string; tier: string; months?: number }) =>
      request<any>('/hiway/subscription', { method: 'POST', body: JSON.stringify(data) }),
  },
  stats: () => request<any>('/hiway/stats'),
};
