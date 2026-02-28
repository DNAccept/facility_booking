import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBuildings, createBuilding, updateBuilding, deleteBuilding, getAvailableRooms } from '../api/endpoints';
import type { Building, Facility } from '../api/endpoints';

import facilitySvg from '../assets/facility.svg';
import roomSvg from '../assets/room.svg';
import bookingSvg from '../assets/booking.svg';

const today = () => new Date().toISOString().slice(0, 10);

const FacilitiesPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    // Buildings state
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);

    // Admin: building CRUD modal
    const [showBuildingForm, setShowBuildingForm] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
    const [bName, setBName] = useState('');
    const [bLocation, setBLocation] = useState('');
    const [bError, setBError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    // Availability search
    const [searchDate, setSearchDate] = useState(today());
    const [searchStart, setSearchStart] = useState('');
    const [searchEnd, setSearchEnd] = useState('');
    const [searchResults, setSearchResults] = useState<Facility[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const loadBuildings = () => {
        setLoading(true);
        getBuildings().then((res) => setBuildings(res.data)).finally(() => setLoading(false));
    };

    useEffect(() => { loadBuildings(); }, []);

    // ── Admin building CRUD ─────────────────────────────────────────
    const openAddBuilding = () => {
        setEditingBuilding(null);
        setBName(''); setBLocation(''); setBError(null);
        setShowBuildingForm(true);
    };

    const openEditBuilding = (e: React.MouseEvent, b: Building) => {
        e.stopPropagation();
        setEditingBuilding(b);
        setBName(b.name); setBLocation(b.location); setBError(null);
        setShowBuildingForm(true);
    };

    const handleBuildingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBError(null);
        try {
            if (editingBuilding) {
                const res = await updateBuilding(editingBuilding.id, { name: bName, location: bLocation });
                setBuildings(prev => prev.map(b => b.id === editingBuilding.id ? res.data : b));
                showToast('Building updated!');
            } else {
                const res = await createBuilding({ name: bName, location: bLocation });
                setBuildings(prev => [...prev, res.data]);
                showToast('Building added!');
            }
            setShowBuildingForm(false);
        } catch (err: any) {
            setBError(err.response?.data?.message || 'Failed to save building.');
        }
    };

    const handleDeleteBuilding = async (e: React.MouseEvent, b: Building) => {
        e.stopPropagation();
        if (!confirm(`Delete "${b.name}" and all its rooms?`)) return;
        await deleteBuilding(b.id);
        setBuildings(prev => prev.filter(x => x.id !== b.id));
        showToast('Building deleted.');
    };

    // ── Availability search ─────────────────────────────────────────
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearchError(null);
        if (!searchStart || !searchEnd) { setSearchError('Please enter start and end time.'); return; }
        if (searchEnd <= searchStart) { setSearchError('End time must be after start time.'); return; }
        setSearching(true);
        try {
            const res = await getAvailableRooms({ date: searchDate, start_time: searchStart, end_time: searchEnd });
            setSearchResults(res.data);
        } catch {
            setSearchError('Search failed. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const clearSearch = () => { setSearchResults(null); setSearchError(null); setSearchStart(''); setSearchEnd(''); };

    return (
        <div className="page">
            {toast && <div className="toast">{toast}</div>}

            <div className="page-header">
                <div>
                    <h2><img src={facilitySvg} className="icon-header" alt="buildings" /> Buildings</h2>
                    {!isAdmin && (
                        <p className="subtitle">Select a building to browse and book rooms</p>
                    )}
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={openAddBuilding}>+ Add Building</button>
                )}
            </div>

            {/* ── Availability Quick Search ── */}
            <div className="card glass availability-search">
                <h4><img src={bookingSvg} className="icon-inline" alt="search" /> Find Available Rooms</h4>
                <form className="availability-form" onSubmit={handleSearch}>
                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={searchDate} min={today()} onChange={e => setSearchDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>From</label>
                        <input type="time" value={searchStart} onChange={e => setSearchStart(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>To</label>
                        <input type="time" value={searchEnd} onChange={e => setSearchEnd(e.target.value)} required />
                    </div>
                    <div className="form-group availability-btn-group">
                        <button type="submit" className="btn btn-primary" disabled={searching}>
                            {searching ? 'Searching…' : 'Search'}
                        </button>
                        {searchResults !== null && (
                            <button type="button" className="btn btn-secondary" onClick={clearSearch}>Clear</button>
                        )}
                    </div>
                </form>
                {searchError && <p className="alert alert-error" style={{ marginTop: '0.5rem' }}>{searchError}</p>}

                {/* Search results */}
                {searchResults !== null && (
                    <div className="search-results">
                        {searchResults.length === 0 ? (
                            <p className="text-muted" style={{ marginTop: '0.75rem' }}>No rooms available for that period.</p>
                        ) : (
                            <>
                                <p className="text-muted" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                                    {searchResults.length} room{searchResults.length !== 1 ? 's' : ''} available on {searchDate} · {searchStart}–{searchEnd}
                                </p>
                                <div className="search-room-list">
                                    {searchResults.map(room => (
                                        <div
                                            key={room.id}
                                            className="search-room-card glass clickable-card"
                                            onClick={() => navigate(`/facilities/${room.id}`)}
                                        >
                                            <img src={roomSvg} className="icon-inline" alt="room" />
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{room.name}</p>
                                                <p className="facility-meta" style={{ fontSize: '0.78rem' }}>{room.building?.name}</p>
                                            </div>
                                            <div className="room-tags">
                                                {(room.features ?? []).map(f => (
                                                    <span key={f} className="room-tag">{f}</span>
                                                ))}
                                            </div>
                                            <span className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>Book →</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Buildings Grid ── */}
            {loading ? (
                <div className="grid">
                    {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 160 }} />)}
                </div>
            ) : buildings.length === 0 ? (
                <div className="empty-state glass">
                    <img src={facilitySvg} className="stat-icon-svg" alt="no buildings" style={{ opacity: 0.4, marginBottom: '1rem' }} />
                    <h3>No buildings yet</h3>
                    {isAdmin && <p>Click "+ Add Building" to get started.</p>}
                </div>
            ) : (
                <div className="grid">
                    {buildings.map(b => (
                        <div
                            key={b.id}
                            className="card glass building-card clickable-card"
                            onClick={() => navigate(`/buildings/${b.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && navigate(`/buildings/${b.id}`)}
                        >
                            <div className="building-card-icon">
                                <img src={facilitySvg} className="stat-icon-svg" alt="building" />
                            </div>
                            <div className="building-card-info">
                                <h3>{b.name}</h3>
                                <p className="facility-meta">
                                    <svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {b.location}
                                </p>
                                <p className="facility-meta">
                                    <img src={roomSvg} className="icon-inline" alt="rooms" />
                                    {b.rooms_count ?? 0} room{b.rooms_count !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {isAdmin && (
                                <div className="card-actions" onClick={e => e.stopPropagation()}>
                                    <button className="btn btn-secondary btn-sm" onClick={e => openEditBuilding(e, b)}>Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={e => handleDeleteBuilding(e, b)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Admin: Add / Edit Building Modal */}
            {showBuildingForm && isAdmin && (
                <div className="modal-overlay" onClick={() => setShowBuildingForm(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()}>
                        <h3>{editingBuilding ? 'Edit Building' : 'Add Building'}</h3>
                        {bError && <div className="alert alert-error">{bError}</div>}
                        <form onSubmit={handleBuildingSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input value={bName} onChange={e => setBName(e.target.value)} required placeholder="e.g. Science Block" />
                            </div>
                            <div className="form-group">
                                <label>Location / Address</label>
                                <input value={bLocation} onChange={e => setBLocation(e.target.value)} required placeholder="e.g. North Campus" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowBuildingForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacilitiesPage;
