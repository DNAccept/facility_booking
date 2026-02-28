import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createContext, useContext } from 'react';
import { getFacilities, getBookings, getFacilitySlots } from '../api/endpoints';
import type { Facility, Booking, Slot } from '../api/endpoints';
import { useAuth } from './AuthContext';

interface DataContextType {
    facilities: Facility[];
    facilitiesLoading: boolean;
    refreshFacilities: () => Promise<void>;

    bookings: Booking[];
    bookingsLoading: boolean;
    refreshBookings: () => Promise<void>;

    // Slot cache: key = `${facilityId}_${date}`
    getSlots: (facilityId: number, date: string) => Slot[] | null;
    fetchSlots: (facilityId: number, date: string) => Promise<Slot[]>;
    invalidateSlots: (facilityId: number, date: string) => void;
}

const DataContext = createContext<DataContextType>(null!);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, user } = useAuth();

    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [facilitiesLoading, setFacilitiesLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    const slotCache = useRef<Map<string, Slot[]>>(new Map());

    // ── Facilities (public — fetch all rooms, always with building) ────
    const refreshFacilities = useCallback(async () => {
        setFacilitiesLoading(true);
        try {
            const res = await getFacilities();
            setFacilities(res.data);
        } finally {
            setFacilitiesLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshFacilities();
    }, [refreshFacilities]);

    // ── Bookings (auth required — fetch after login) ───────────────
    const refreshBookings = useCallback(async () => {
        if (!token || !user) return;
        setBookingsLoading(true);
        try {
            const res = await getBookings();
            setBookings(res.data.filter((b) => b.user_id === user.id));
        } finally {
            setBookingsLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        if (token && user) {
            refreshBookings();
        } else {
            setBookings([]);
        }
    }, [token, user?.id]);

    // ── Prefetch today's slots for all facilities after login ──────
    useEffect(() => {
        if (!token || facilities.length === 0) return;
        const today = new Date().toISOString().slice(0, 10);
        facilities.forEach((f) => {
            const key = `${f.id}_${today}`;
            if (!slotCache.current.has(key)) {
                getFacilitySlots(f.id, today)
                    .then((res) => slotCache.current.set(key, res.data))
                    .catch(() => {/* ignore prefetch errors */ });
            }
        });
    }, [token, facilities]);

    // ── Slot helpers ───────────────────────────────────────────────
    const getSlots = (facilityId: number, date: string): Slot[] | null =>
        slotCache.current.get(`${facilityId}_${date}`) ?? null;

    const fetchSlots = async (facilityId: number, date: string): Promise<Slot[]> => {
        const key = `${facilityId}_${date}`;
        const cached = slotCache.current.get(key);
        if (cached) return cached;
        const res = await getFacilitySlots(facilityId, date);
        slotCache.current.set(key, res.data);
        return res.data;
    };

    const invalidateSlots = (facilityId: number, date: string) => {
        slotCache.current.delete(`${facilityId}_${date}`);
    };

    return (
        <DataContext.Provider value={{
            facilities, facilitiesLoading, refreshFacilities,
            bookings, bookingsLoading, refreshBookings,
            getSlots, fetchSlots, invalidateSlots,
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
