export interface RouteStop {
  name: string;
  lat?: number;
  lng?: number;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  stops: RouteStop[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
