import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getBuilding, createFacility, updateFacility, deleteFacility,
    getFeatureTags, createFeatureTag, deleteFeatureTag,
} from '../api/endpoints';
import type { Building, Facility, FeatureTag } from '../api/endpoints';

import facilitySvg from '../assets/facility.svg';
import roomSvg from '../assets/room.svg';

const BuildingRoomsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const [building, setBuilding] = useState<Building | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Global tag library
    const [allTags, setAllTags] = useState<FeatureTag[]>([]);
    const [showTagLibrary, setShowTagLibrary] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');
    const [tagLibraryError, setTagLibraryError] = useState<string | null>(null);

    // Room form
    const [showRoomForm, setShowRoomForm] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Facility | null>(null);
    const [rName, setRName] = useState('');
    const [rCapacity, setRCapacity] = useState(1);
    const [rDescription, setRDescription] = useState('');
    const [rFeatures, setRFeatures] = useState<string[]>([]);
    const [rTagInput, setRTagInput] = useState('');
    const [rError, setRError] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const loadBuilding = () => {
        if (!id) return;
        setLoading(true);
        getBuilding(Number(id))
            .then(res => setBuilding(res.data))
            .catch(() => setError('Building not found.'))
            .finally(() => setLoading(false));
    };

    const loadTags = useCallback(() => {
        getFeatureTags().then(res => setAllTags(res.data));
    }, []);

    useEffect(() => {
        loadBuilding();
        loadTags();
    }, [id]);

    // ── Tag library management ────────────────────────────────────
    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        setTagLibraryError(null);
        const name = newTagInput.trim();
        if (!name) return;
        try {
            const res = await createFeatureTag(name);
            setAllTags(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewTagInput('');
        } catch (err: any) {
            setTagLibraryError(err.response?.data?.errors?.name?.[0] ?? err.response?.data?.message ?? 'Could not add tag.');
        }
    };

    const handleDeleteTag = async (tag: FeatureTag) => {
        if (!confirm(`Delete tag "${tag.name}"?`)) return;
        await deleteFeatureTag(tag.id);
        setAllTags(prev => prev.filter(t => t.id !== tag.id));
        // Also deselect it if currently selected in room form
        setRFeatures(prev => prev.filter(f => f !== tag.name));
    };

    // ── Room tag helpers ──────────────────────────────────────────
    const togglePreset = (name: string) =>
        setRFeatures(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);

    const addCustomTag = (tag: string) => {
        const t = tag.trim();
        if (!t || rFeatures.includes(t)) return;
        setRFeatures(prev => [...prev, t]);
        setRTagInput('');
    };

    const removeSelectedTag = (tag: string) => setRFeatures(prev => prev.filter(t => t !== tag));

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCustomTag(rTagInput); }
        if (e.key === 'Backspace' && !rTagInput && rFeatures.length > 0) setRFeatures(prev => prev.slice(0, -1));
    };

    // ── Room CRUD ─────────────────────────────────────────────────
    const openAddRoom = () => {
        setEditingRoom(null);
        setRName(''); setRCapacity(1); setRDescription(''); setRFeatures([]); setRTagInput(''); setRError(null);
        setShowRoomForm(true);
    };

    const openEditRoom = (e: React.MouseEvent, room: Facility) => {
        e.stopPropagation();
        setEditingRoom(room);
        setRName(room.name); setRCapacity(room.capacity);
        setRDescription(room.description ?? '');
        setRFeatures(room.features ?? []);
        setRTagInput(''); setRError(null);
        setShowRoomForm(true);
    };

    const handleRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!building) return;
        setRError(null);
        try {
            const payload = {
                name: rName, building_id: building.id, capacity: rCapacity,
                description: rDescription || undefined,
                features: rFeatures.length > 0 ? rFeatures : [],
            };
            if (editingRoom) {
                await updateFacility(editingRoom.id, payload);
                showToast('Room updated!');
            } else {
                await createFacility(payload);
                showToast('Room added!');
            }
            setShowRoomForm(false);
            loadBuilding();
        } catch (err: any) {
            setRError(err.response?.data?.message || 'Failed to save room.');
        }
    };

    const handleDeleteRoom = async (e: React.MouseEvent, room: Facility) => {
        e.stopPropagation();
        if (!confirm(`Delete room "${room.name}"?`)) return;
        await deleteFacility(room.id);
        setBuilding(prev => prev ? { ...prev, rooms: (prev.rooms ?? []).filter(r => r.id !== room.id) } : prev);
        showToast('Room deleted.');
    };

    if (loading) {
        return (
            <div className="page">
                <div className="card skeleton" style={{ height: 80, marginBottom: '1rem' }} />
                <div className="grid">{[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 160 }} />)}</div>
            </div>
        );
    }

    if (error || !building) {
        return <div className="page"><div className="alert alert-error">{error ?? 'Building not found.'}</div></div>;
    }

    const rooms = building.rooms ?? [];

    return (
        <div className="page">
            {toast && <div className="toast">{toast}</div>}

            <div className="page-header">
                <div>
                    <button className="btn btn-ghost btn-sm" style={{ marginBottom: '0.35rem' }} onClick={() => navigate('/facilities')}>← Buildings</button>
                    <h2><img src={facilitySvg} className="icon-header" alt="building" />{building.name}</h2>
                    <p className="subtitle">
                        <svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {building.location}
                        &nbsp;·&nbsp;
                        <img src={roomSvg} className="icon-inline" alt="rooms" /> {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isAdmin && (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setShowTagLibrary(true); setTagLibraryError(null); setNewTagInput(''); }}>
                                🏷 Manage Tags
                            </button>
                            <button className="btn btn-primary" onClick={openAddRoom}>+ Add Room</button>
                        </>
                    )}
                </div>
            </div>

            {rooms.length === 0 ? (
                <div className="empty-state glass">
                    <img src={roomSvg} className="stat-icon-svg" alt="no rooms" style={{ opacity: 0.4, marginBottom: '1rem' }} />
                    <h3>No rooms yet</h3>
                    {isAdmin && <p>Click "+ Add Room" to get started.</p>}
                </div>
            ) : (
                <div className="grid">
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            className="card glass facility-card clickable-card"
                            onClick={() => navigate(`/facilities/${room.id}`)}
                            role="button" tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && navigate(`/facilities/${room.id}`)}
                        >
                            <div className="facility-icon">
                                <img src={roomSvg} className="stat-icon-svg" alt="room" />
                            </div>
                            <h3>{room.name}</h3>
                            <p className="facility-meta">
                                <svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                Capacity: {room.capacity}
                            </p>
                            {room.description && <p className="room-description">{room.description}</p>}
                            {(room.features?.length ?? 0) > 0 && (
                                <div className="room-tags">
                                    {(room.features ?? []).map(f => <span key={f} className="room-tag">{f}</span>)}
                                </div>
                            )}
                            {isAdmin && (
                                <div className="card-actions" onClick={e => e.stopPropagation()}>
                                    <button className="btn btn-secondary btn-sm" onClick={e => openEditRoom(e, room)}>Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={e => handleDeleteRoom(e, room)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tag Library Modal (admin) ── */}
            {showTagLibrary && isAdmin && (
                <div className="modal-overlay" onClick={() => setShowTagLibrary(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                        <h3>🏷 Tag Library</h3>
                        <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                            These tags appear as preset chips when adding or editing rooms.
                        </p>

                        {/* Add new tag */}
                        <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                className="flex-1"
                                value={newTagInput}
                                onChange={e => setNewTagInput(e.target.value)}
                                placeholder="New tag name…"
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn btn-primary btn-sm">Add</button>
                        </form>
                        {tagLibraryError && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{tagLibraryError}</div>}

                        {/* Existing tags */}
                        <div className="tag-library-list">
                            {allTags.length === 0 ? (
                                <p className="text-muted">No tags yet.</p>
                            ) : (
                                allTags.map(tag => (
                                    <div key={tag.id} className="tag-library-item">
                                        <span className="room-tag">{tag.name}</span>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteTag(tag)}
                                            title={`Delete "${tag.name}"`}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="modal-actions" style={{ marginTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowTagLibrary(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add / Edit Room Modal ── */}
            {showRoomForm && isAdmin && (
                <div className="modal-overlay" onClick={() => setShowRoomForm(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()}>
                        <h3>{editingRoom ? 'Edit Room' : 'Add Room'}</h3>
                        {rError && <div className="alert alert-error">{rError}</div>}
                        <form onSubmit={handleRoomSubmit}>
                            <div className="form-group">
                                <label>Room Name</label>
                                <input value={rName} onChange={e => setRName(e.target.value)} required placeholder="e.g. Meeting Room A" />
                            </div>
                            <div className="form-group">
                                <label>Capacity</label>
                                <input type="number" min={1} value={rCapacity} onChange={e => setRCapacity(+e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Description <span className="text-muted">(optional)</span></label>
                                <textarea className="form-textarea" rows={2} value={rDescription} onChange={e => setRDescription(e.target.value)} placeholder="Brief description…" />
                            </div>
                            <div className="form-group">
                                <label>
                                    Features / Tags
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            className="btn-link"
                                            style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}
                                            onClick={() => { setShowRoomForm(false); setShowTagLibrary(true); setTagLibraryError(null); setNewTagInput(''); }}
                                        >
                                            Manage tag library
                                        </button>
                                    )}
                                </label>
                                {/* Preset chips from DB */}
                                <div className="tag-presets">
                                    {allTags.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`tag-preset-btn ${rFeatures.includes(t.name) ? 'active' : ''}`}
                                            onClick={() => togglePreset(t.name)}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                                {/* Selected tags + custom input */}
                                <div className="tag-input-wrap">
                                    {rFeatures.map(f => (
                                        <span key={f} className="room-tag room-tag--removable">
                                            {f}
                                            <button type="button" className="tag-remove" onClick={() => removeSelectedTag(f)}>×</button>
                                        </span>
                                    ))}
                                    <input
                                        className="tag-input"
                                        value={rTagInput}
                                        onChange={e => setRTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder={rFeatures.length === 0 ? 'Custom tag + Enter…' : ''}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRoomForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuildingRoomsPage;
