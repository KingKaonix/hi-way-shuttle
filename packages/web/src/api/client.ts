const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { email: string; name: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<any>('/auth/me'),
  },
  routes: {
    list: () => request<any[]>('/routes'),
    get: (id: string) => request<any>(`/routes/${id}`),
    create: (data: any) =>
      request<any>('/admin/routes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/admin/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/admin/routes/${id}`, { method: 'DELETE' }),
  },
  fares: {
    get: () => request<any>('/fares'),
    update: (routeId: string, data: any) =>
      request<any>(`/admin/fares/${routeId}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  schedules: {
    get: (routeId: string) => request<any[]>(`/schedules/${routeId}`),
    update: (routeId: string, data: any[]) =>
      request<any[]>(`/admin/schedules/${routeId}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  trips: {
    listByDate: (date: string) => request<any[]>(`/trips?date=${date}`),
    generate: (date: string) =>
      request<any[]>('/trips/generate', { method: 'POST', body: JSON.stringify({ date }) }),
  },
  bookings: {
    my: () => request<any[]>('/bookings'),
    create: (data: { trip_id: number; seats: number }) =>
      request<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: number) =>
      request<any>(`/bookings/${id}/cancel`, { method: 'POST' }),
  },
};
