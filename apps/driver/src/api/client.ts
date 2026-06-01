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
  driver: {
    register: (data: { name: string; phone?: string; email?: string; vehicle: string; licensePlate: string }) =>
      request<any>('/hiway/driver/register', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request<any>(`/hiway/driver/${id}`),
    setStatus: (id: string, data: { online: boolean; lat: number; lng: number }) =>
      request<any>(`/hiway/driver/${id}/status`, { method: 'POST', body: JSON.stringify(data) }),
    getEarnings: (id: string) => request<any>(`/hiway/driver/${id}/earnings`),
    getActive: (id: string) => request<any>(`/hiway/driver/${id}/active`),
    getHistory: (id: string) => request<any[]>(`/hiway/driver/${id}/history`),
  },
  stats: () => request<any>('/hiway/stats'),
};
