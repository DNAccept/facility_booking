import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { updateBooking, deleteBooking, getFacilities } from '../api/endpoints';
import type { Booking, Facility } from '../api/endpoints';
import { useEffect } from 'react';

import bookingSvg from '../assets/booking.svg';

const statusColors: Record<string, string> = {
    booked: 'badge-green',
    cancelled: 'badge-red',
    pending: 'badge-yellow',
};

const BookingsPage: React.FC = () => {
    const { bookings: cachedBookings, bookingsLoading, refreshBookings } = useData();
    const [bookings, setBookings] = useState<Booking[]>(cachedBookings);
    const [facilities, setFacilities] = useState<Record<number, Facility>>({});
    const [editBooking, setEditBooking] = useState<Booking | null>(null);
    const [editData, setEditData] = useState({ date: '', start_time: '', end_time: '' });
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // Sync local state whenever cached bookings update
    useEffect(() => { setBookings(cachedBookings); }, [cachedBookings]);

    // Build facility lookup map once (avoid re-fetching — facilities already in DataContext)
    useEffect(() => {
        getFacilities().then((res) => {
            const map: Record<number, Facility> = {};
            res.data.forEach((f) => { map[f.id] = f; });
            setFacilities(map);
        });
    }, []);

    const openEdit = (b: Booking) => {
        setEditBooking(b);
        setEditData({ date: b.date, start_time: b.start_time.slice(0, 5), end_time: b.end_time.slice(0, 5) });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editBooking) return;
        try {
            await updateBooking(editBooking.id, editData);
            showToast('Booking updated!');
            setEditBooking(null);
            refreshBookings();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Update failed.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Cancel this booking? It will remain visible as cancelled.')) return;
        await deleteBooking(id);
        // Immediately reflect in UI — no waiting for re-fetch
        setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
        );
        showToast('Booking cancelled.');
    };

    return (
        <div className="page">
            {toast && <div className="toast">{toast}</div>}

            <div className="page-header">
                <div>
                    <h2>My Bookings</h2>
                    <p className="subtitle">Manage your facility reservations</p>
                </div>
            </div>

            {bookingsLoading && bookings.length === 0 ? (
                <div className="bookings-list">
                    {[1, 2, 3].map((i) => <div key={i} className="booking-card skeleton" />)}
                </div>
            ) : bookings.length === 0 ? (
                <div className="empty-state glass">
                    <img src={bookingSvg} className="stat-icon-svg" alt="no-bookings" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3>No bookings yet</h3>
                    <p>Head to Facilities to make your first booking.</p>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map((b) => {
                        const isCancelled = b.status === 'cancelled';
                        return (
                            <div key={b.id} className={`booking-card glass ${isCancelled ? 'booking-cancelled' : ''}`}>
                                <div className="booking-info">
                                    <h3 className={isCancelled ? 'text-struck' : ''}>
                                        {facilities[b.facility_id]?.name ?? `Room #${b.facility_id}`}
                                    </h3>
                                    {facilities[b.facility_id]?.building && (
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
                                            <svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            {facilities[b.facility_id]!.building!.name} · {facilities[b.facility_id]!.building!.location}
                                        </p>
                                    )}
                                    <p>
                                        <img src={bookingSvg} className="icon-inline" alt="date" /> {b.date} &nbsp;|&nbsp;
                                        <svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                        {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                                    </p>
                                    {isCancelled && <p className="cancelled-note">This booking was cancelled and the slot is now available again.</p>}
                                </div>
                                <div className="booking-side">
                                    <span className={`badge ${statusColors[b.status] ?? 'badge-green'}`}>{b.status}</span>
                                    {!isCancelled && (
                                        <div className="booking-actions">
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>Cancel</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editBooking && (
                <div className="modal-overlay" onClick={() => setEditBooking(null)}>
                    <div className="modal glass" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Booking</h3>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Time</label>
                                    <input type="time" value={editData.start_time} onChange={(e) => setEditData({ ...editData, start_time: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>End Time</label>
                                    <input type="time" value={editData.end_time} onChange={(e) => setEditData({ ...editData, end_time: e.target.value })} required />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditBooking(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingsPage;
