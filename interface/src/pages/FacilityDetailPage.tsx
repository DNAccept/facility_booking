import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getFacility, createBooking } from '../api/endpoints';
import type { Facility, Slot } from '../api/endpoints';

import facilitySvg from '../assets/facility.svg';
import bookingSvg from '../assets/booking.svg';
import roomSvg from '../assets/room.svg';

const today = () => new Date().toISOString().slice(0, 10);

const FacilityDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, isAdmin } = useAuth();
    const { facilities, fetchSlots, invalidateSlots, refreshBookings } = useData();
    const navigate = useNavigate();


    const cachedFacility = facilities.find((f) => f.id === Number(id));
    const [facility, setFacility] = useState<Facility | null>(cachedFacility ?? null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [date, setDate] = useState(today());
    const [facilityLoading, setFacilityLoading] = useState(!cachedFacility);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [selected, setSelected] = useState<Slot[]>([]);
    const [toast, setToast] = useState<string | null>(null);
    const [booking, setBooking] = useState(false);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const loadSlots = useCallback(async (facilityId: number, d: string) => {
        setSlotsLoading(true);
        const data = await fetchSlots(facilityId, d);
        setSlots(data);
        setSelected([]);
        setSlotsLoading(false);
    }, [fetchSlots]);

    useEffect(() => {
        if (!id) return;
        const numId = Number(id);

        if (cachedFacility) {
            setFacility(cachedFacility);
            loadSlots(numId, date);
        } else {
            setFacilityLoading(true);
            getFacility(numId).then((res) => {
                setFacility(res.data);
                loadSlots(numId, date);
            }).finally(() => setFacilityLoading(false));
        }
    }, [id]);

    const handleDateChange = (d: string) => {
        setDate(d);
        if (facility) loadSlots(facility.id, d);
    };

    const toggleSlot = (slot: Slot) => {
        if (slot.status === 'booked') return;
        setSelected((prev) => {
            const exists = prev.find((s) => s.start === slot.start);
            if (exists) return prev.filter((s) => s.start !== slot.start);
            return [...prev, slot].sort((a, b) => a.start.localeCompare(b.start));
        });
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!facility || !user || selected.length === 0) return;
        setBooking(true);
        try {
            const startTime = selected[0].start;
            const endTime = selected[selected.length - 1].end;
            await createBooking({ facility_id: facility.id, user_id: user.id, date, start_time: startTime, end_time: endTime });
            invalidateSlots(facility.id, date);
            await Promise.all([loadSlots(facility.id, date), refreshBookings()]);
            showToast('✅ Booking confirmed!');
            setSelected([]);
        } catch (err: any) {
            showToast(err.response?.data?.message || '❌ Booking failed.');
        } finally {
            setBooking(false);
        }
    };

    if (facilityLoading) {
        return (
            <div className="page">
                <div className="slot-header skeleton" style={{ height: 80, borderRadius: 14 }} />
                <div className="slot-grid">
                    {Array.from({ length: 32 }).map((_, i) => <div key={i} className="slot skeleton" />)}
                </div>
            </div>
        );
    }

    if (!facility) return null;

    const selectedStart = selected[0]?.start;
    const selectedEnd = selected[selected.length - 1]?.end;

    return (
        <div className="page">
            {toast && <div className="toast">{toast}</div>}

            <div className="detail-header glass">
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(facility.building ? `/buildings/${facility.building.id}` : '/facilities')}
                >
                    ← {facility.building ? facility.building.name : 'Back'}
                </button>
                <div className="detail-info">
                    <h2>
                        <img src={roomSvg} className="icon-header" alt="room" />
                        {facility.name}
                    </h2>
                    {/* Clickable building name — navigates to filtered rooms list */}
                    {facility.building && (
                        <button
                            className="building-name-link building-name-link--detail"
                            onClick={() => navigate(`/facilities?building=${facility.building!.id}`)}
                            title={`See all rooms in ${facility.building.name}`}
                        >
                            <img src={facilitySvg} className="icon-inline" alt="building" />
                            {facility.building.name}
                            {facility.building.location && (
                                <span className="building-location"> · {facility.building.location}</span>
                            )}
                        </button>
                    )}
                    <span className="facility-meta">
                        <svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Capacity: {facility.capacity}
                    </span>
                    {facility.description && (
                        <p className="room-description" style={{ marginTop: '0.4rem' }}>{facility.description}</p>
                    )}
                    {(facility.features?.length ?? 0) > 0 && (
                        <div className="room-tags" style={{ marginTop: '0.4rem' }}>
                            {(facility.features ?? []).map(f => (
                                <span key={f} className="room-tag">{f}</span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="date-picker-wrap">
                    <label>Select Date</label>
                    <input type="date" value={date} min={today()} onChange={(e) => handleDateChange(e.target.value)} />
                </div>
            </div>

            <div className="slot-legend">
                <span className="legend-item available">Available</span>
                <span className="legend-item booked">Booked</span>
                {!isAdmin && <span className="legend-item selected">Selected</span>}
            </div>

            {slotsLoading ? (
                <div className="slot-grid">
                    {Array.from({ length: 32 }).map((_, i) => <div key={i} className="slot skeleton" />)}
                </div>
            ) : (
                <div className="slot-grid">
                    {slots.map((slot) => {
                        const isSelected = !!selected.find((s) => s.start === slot.start);
                        return (
                            <button
                                key={slot.start}
                                className={`slot ${slot.status} ${isSelected ? 'selected' : ''} ${!isAdmin && slot.status === 'available' ? 'clickable' : ''}`}
                                onClick={() => !isAdmin && toggleSlot(slot)}
                                disabled={slot.status === 'booked' || isAdmin}
                                title={slot.status === 'booked' ? 'Already booked' : `${slot.start} – ${slot.end}`}
                            >
                                <span className="slot-time">{slot.start}</span>
                                <span className="slot-end">{slot.end}</span>
                                <span className="slot-badge">{slot.status === 'booked' ? 'Booked' : isSelected ? '✓' : 'Free'}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {!isAdmin && selected.length > 0 && (
                <div className="booking-bar glass">
                    <div className="booking-bar-info">
                        <span><img src={bookingSvg} className="icon-inline" alt="date" /> {date}</span>
                        <span><svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> {selectedStart} – {selectedEnd}</span>
                        <span className="slot-count">{selected.length} slot{selected.length > 1 ? 's' : ''} ({selected.length * 30} min)</span>
                    </div>
                    <div className="booking-bar-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Clear</button>
                        <button className="btn btn-primary" onClick={handleBook} disabled={booking}>
                            {booking ? 'Booking…' : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacilityDetailPage;
