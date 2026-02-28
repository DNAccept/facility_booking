import api from './axios';

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
}

export interface Building {
    id: number;
    name: string;
    location: string;
    rooms_count?: number;
    rooms?: Facility[];
}

export interface Facility {
    id: number;
    name: string;          // room name
    capacity: number;
    building_id: number;
    building?: Building;
    description?: string;
    features?: string[];   // e.g. ['AC', 'Smartboard', 'Projector']
}

export interface Booking {
    id: number;
    facility_id: number;
    user_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    facility?: Facility;
}

// Auth
export const register = (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data);

export const logout = () => api.post('/auth/logout');

// Account
export const getAccount = () => api.get<User>('/account');
export const updateAccount = (data: Partial<{ name: string; email: string; password: string; password_confirmation: string }>) =>
    api.put<User>('/account', data);
export const deleteAccount = () => api.delete('/account');

// Buildings
export const getBuildings = () => api.get<Building[]>('/buildings');
export const getBuilding = (id: number) => api.get<Building>(`/buildings/${id}`);
export const createBuilding = (data: Omit<Building, 'id' | 'rooms_count' | 'rooms'>) => api.post<Building>('/buildings', data);
export const updateBuilding = (id: number, data: Partial<Omit<Building, 'id' | 'rooms_count' | 'rooms'>>) => api.put<Building>(`/buildings/${id}`, data);
export const deleteBuilding = (id: number) => api.delete(`/buildings/${id}`);

// Facilities (Rooms)
export const getFacilities = (buildingId?: number) =>
    api.get<Facility[]>('/facilities', buildingId ? { params: { building_id: buildingId } } : undefined);
export const getFacility = (id: number) => api.get<Facility>(`/facilities/${id}`);
export const createFacility = (data: Omit<Facility, 'id' | 'building'>) => api.post<Facility>('/facilities', data);
export const updateFacility = (id: number, data: Omit<Facility, 'id' | 'building'>) => api.put<Facility>(`/facilities/${id}`, data);
export const deleteFacility = (id: number) => api.delete(`/facilities/${id}`);

// Feature tags (room description tags)
export interface FeatureTag { id: number; name: string; }
export const getFeatureTags = () => api.get<FeatureTag[]>('/feature-tags');
export const createFeatureTag = (name: string) => api.post<FeatureTag>('/feature-tags', { name });
export const deleteFeatureTag = (id: number) => api.delete(`/feature-tags/${id}`);

// Available rooms search
export const getAvailableRooms = (params: { date: string; start_time: string; end_time: string }) =>
    api.get<Facility[]>('/available-rooms', { params });

// Bookings
export const getBookings = () => api.get<Booking[]>('/bookings');
export const createBooking = (data: Omit<Booking, 'id' | 'status' | 'facility'>) =>
    api.post<Booking>('/bookings', data);
export const updateBooking = (id: number, data: Partial<Omit<Booking, 'id' | 'facility'>>) =>
    api.put<Booking>(`/bookings/${id}`, data);
export const deleteBooking = (id: number) => api.delete(`/bookings/${id}`);

// Availability
export const checkAvailability = (params: { facility_id: number; date: string; start_time: string; end_time: string }) =>
    api.get<{ available: boolean }>('/availability', { params });

// Slots
export interface Slot {
    start: string;
    end: string;
    status: 'available' | 'booked';
}

export const getFacilitySlots = (id: number, date: string) =>
    api.get<Slot[]>(`/facilities/${id}/slots`, { params: { date } });

// Complaints
export interface Complaint {
    id: number;
    user_id: number;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved';
    admin_notes: string | null;
    created_at: string;
    user?: { id: number; name: string; email: string };
}

export const getComplaints = () => api.get<Complaint[]>('/complaints');
export const submitComplaint = (data: { subject: string; message: string }) =>
    api.post<Complaint>('/complaints', data);
export const getAdminComplaints = () => api.get<Complaint[]>('/admin/complaints');
export const updateComplaint = (id: number, data: { status?: string; admin_notes?: string }) =>
    api.put<Complaint>(`/admin/complaints/${id}`, data);

// Admin stats
export interface FacilityStat { id: number; name: string; building_name?: string; total: number; active: number; }
export interface AdminStats {
    total_bookings: number;
    total_facilities: number;
    open_complaints: number;
    cancelled_bookings: number;
    bookings_per_facility: FacilityStat[];
    recent_bookings: (Booking & { user?: { id: number; name: string; email: string }; facility?: Facility })[];
}

export const getAdminStats = () => api.get<AdminStats>('/admin/stats');

// Admin user management
export const getAdminUsers = () => api.get<User[]>('/admin/users');
export const updateUserRole = (id: number, role: 'user' | 'admin', password: string) =>
    api.put<{ message: string; user: User }>(`/admin/users/${id}/role`, { role, password });
