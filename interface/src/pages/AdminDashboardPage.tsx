import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getAdminComplaints, updateComplaint, getAdminUsers, updateUserRole } from '../api/endpoints';
import type { AdminStats, Complaint, User } from '../api/endpoints';

import facilitySvg from '../assets/facility.svg';
import bookingSvg from '../assets/booking.svg';
import complaintSvg from '../assets/complaint.svg';
import cancelledSvg from '../assets/cancelled.svg';
import roomSvg from '../assets/room.svg';

const statusBadge: Record<string, string> = {
    open: 'badge-red',
    in_progress: 'badge-yellow',
    resolved: 'badge-green',
    booked: 'badge-green',
    cancelled: 'badge-red',
};

const AdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user: currentAdmin } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
    const [editForm, setEditForm] = useState({ status: '', admin_notes: '' });
    // Role promotion modal
    const [roleTarget, setRoleTarget] = useState<User | null>(null);
    const [rolePassword, setRolePassword] = useState('');
    const [roleError, setRoleError] = useState<string | null>(null);
    const [roleSubmitting, setRoleSubmitting] = useState(false);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    useEffect(() => {
        Promise.all([getAdminStats(), getAdminComplaints(), getAdminUsers()])
            .then(([sRes, cRes, uRes]) => {
                setStats(sRes.data);
                setComplaints(cRes.data);
                setUsers(uRes.data);
            })
            .finally(() => setLoading(false));
    }, []);

    const openRoleModal = (u: User) => {
        setRoleTarget(u);
        setRolePassword('');
        setRoleError(null);
    };

    const handleRoleChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleTarget) return;
        setRoleSubmitting(true);
        setRoleError(null);
        const newRole = roleTarget.role === 'admin' ? 'user' : 'admin';
        try {
            const res = await updateUserRole(roleTarget.id, newRole, rolePassword);
            setUsers((prev) => prev.map((u) => (u.id === roleTarget.id ? { ...u, role: newRole } : u)));
            showToast(res.data.message);
            setRoleTarget(null);
        } catch (err: any) {
            setRoleError(err.response?.data?.message || 'Failed to update role.');
        } finally {
            setRoleSubmitting(false);
        }
    };

    const openEdit = (c: Complaint) => {
        setEditingComplaint(c);
        setEditForm({ status: c.status, admin_notes: c.admin_notes ?? '' });
    };

    const handleComplaintUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingComplaint) return;
        const res = await updateComplaint(editingComplaint.id, editForm);
        setComplaints((prev) => prev.map((c) => (c.id === editingComplaint.id ? res.data : c)));
        setEditingComplaint(null);
        showToast('Complaint updated.');
    };

    // Chart helpers
    const maxTotal = stats ? Math.max(...stats.bookings_per_facility.map((f) => f.total), 1) : 1;

    if (loading) {
        return (
            <div className="page">
                <div className="stats-row">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="stat-card glass skeleton" />)}
                </div>
                <div className="card glass skeleton" style={{ height: 220 }} />
            </div>
        );
    }

    return (
        <div className="page">
            {toast && <div className="toast">{toast}</div>}

            <div className="page-header">
                <div>
                    <h2><img src={facilitySvg} className="icon-header" alt="admin" /> Admin Dashboard</h2>
                    <p className="subtitle">Overview of bookings, facilities, and complaints</p>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="stats-row">
                <div className="stat-card glass">
                    <img src={bookingSvg} className="stat-icon-svg" alt="bookings" />
                    <div>
                        <p className="stat-value">{stats?.total_bookings ?? 0}</p>
                        <p className="stat-label">Total Bookings</p>
                    </div>
                </div>
                <div className="stat-card glass">
                    <img src={facilitySvg} className="stat-icon-svg" alt="facilities" />
                    <div>
                        <p className="stat-value">{stats?.total_facilities ?? 0}</p>
                        <p className="stat-label">Facilities</p>
                    </div>
                </div>
                <div className="stat-card glass">
                    <img src={complaintSvg} className="stat-icon-svg" alt="complaints" />
                    <div>
                        <p className="stat-value">{stats?.open_complaints ?? 0}</p>
                        <p className="stat-label">Open Complaints</p>
                    </div>
                </div>
                <div className="stat-card glass">
                    <img src={cancelledSvg} className="stat-icon-svg" alt="cancelled" />
                    <div>
                        <p className="stat-value">{stats?.cancelled_bookings ?? 0}</p>
                        <p className="stat-label">Cancelled</p>
                    </div>
                </div>
            </div>

            {/* ── Booking Frequency Chart ── */}
            <div className="card glass dashboard-section">
                <h3><img src={bookingSvg} className="icon-inline" alt="stats" /> Booking Frequency by Facility</h3>
                {stats && stats.bookings_per_facility.length > 0 ? (
                    <div className="bar-chart">
                        {stats.bookings_per_facility.map((f) => (
                            <div key={f.id} className="bar-group" onClick={() => navigate(`/facilities/${f.id}`)}>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill active"
                                        style={{ height: `${Math.round((f.active / maxTotal) * 100)}%` }}
                                        title={`${f.active} active`}
                                    />
                                    <div
                                        className="bar-fill cancelled"
                                        style={{ height: `${Math.round(((f.total - f.active) / maxTotal) * 100)}%` }}
                                        title={`${f.total - f.active} cancelled`}
                                    />
                                </div>
                                <p className="bar-label">{f.name}</p>
                                {f.building_name && <p className="bar-sublabel">{f.building_name}</p>}
                                <p className="bar-count">{f.total}</p>
                            </div>
                        ))}
                        <div className="chart-legend">
                            <span><span className="legend-dot active" />Active</span>
                            <span><span className="legend-dot cancelled" />Cancelled</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-muted">No booking data yet.</p>
                )}
            </div>

            {/* ── Rooms ── */}
            <div className="card glass dashboard-section">
                <h3><img src={roomSvg} className="icon-inline" alt="rooms" /> Rooms</h3>
                <div className="grid">
                    {stats?.bookings_per_facility.map((f) => (
                        <div
                            key={f.id}
                            className="mini-facility-card glass clickable-card"
                            onClick={() => navigate(`/facilities/${f.id}`)}
                        >
                            <img src={roomSvg} className="facility-icon-svg" alt="room" />
                            <div>
                                <p style={{ fontWeight: 600 }}>{f.name}</p>
                                {f.building_name && <p className="facility-meta" style={{ fontSize: '0.72rem', opacity: 0.7 }}>{f.building_name}</p>}
                                <p className="facility-meta">{f.total} booking{f.total !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Recent Bookings Table ── */}
            <div className="card glass dashboard-section">
                <h3><img src={bookingSvg} className="icon-inline" alt="recent" /> Recent Bookings</h3>
                <div className="table-wrap">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Facility</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recent_bookings.map((b) => (
                                <tr key={b.id}>
                                    <td>
                                        <p style={{ fontWeight: 500 }}>{b.user?.name ?? '—'}</p>
                                        <p className="facility-meta">{b.user?.email}</p>
                                    </td>
                                    <td>{b.facility?.name ?? `#${b.facility_id}`}</td>
                                    <td>{b.date}</td>
                                    <td>{(b.start_time ?? '').slice(0, 5)} – {(b.end_time ?? '').slice(0, 5)}</td>
                                    <td><span className={`badge ${statusBadge[b.status] ?? 'badge-green'}`}>{b.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Complaints ── */}
            <div className="card glass dashboard-section">
                <h3><img src={complaintSvg} className="icon-inline" alt="complaints" /> Complaints & Support</h3>
                {complaints.length === 0 ? (
                    <p className="text-muted">No complaints submitted yet.</p>
                ) : (
                    <div className="table-wrap">
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Subject</th>
                                    <th>Message</th>
                                    <th>Status</th>
                                    <th>Admin Notes</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map((c) => (
                                    <tr key={c.id} className={c.status === 'resolved' ? 'row-dimmed' : ''}>
                                        <td>
                                            <p style={{ fontWeight: 500 }}>{c.user?.name ?? '—'}</p>
                                            <p className="facility-meta">{c.user?.email}</p>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{c.subject}</td>
                                        <td className="msg-cell">{c.message}</td>
                                        <td><span className={`badge ${statusBadge[c.status]}`}>{c.status.replace('_', ' ')}</span></td>
                                        <td className="msg-cell">{c.admin_notes ?? <span className="text-muted">—</span>}</td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Users ── */}
            <div className="card glass dashboard-section">
                <h3><img src={facilitySvg} className="icon-inline" alt="users" style={{ filter: 'hue-rotate(180deg)' }} /> Registered Users</h3>
                <div className="table-wrap">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="text-muted">{u.id}</td>
                                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                                    <td className="text-muted">{u.email}</td>
                                    <td>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-green'}`}>
                                            {u.role === 'admin' ? '👑 Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="text-muted">
                                        {u.id}
                                    </td>
                                    <td>
                                        {u.id !== currentAdmin?.id && (
                                            <button
                                                className={`btn btn-sm ${u.role === 'admin' ? 'btn-danger' : 'btn-secondary'}`}
                                                onClick={() => openRoleModal(u)}
                                            >
                                                {u.role === 'admin' ? 'Demote' : 'Promote'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Change Confirmation Modal */}
            {roleTarget && (
                <div className="modal-overlay" onClick={() => setRoleTarget(null)}>
                    <div className="modal glass" onClick={(e) => e.stopPropagation()}>
                        <h3>{roleTarget.role === 'admin' ? '⬇️ Demote to User' : '⬆️ Promote to Admin'}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            You are about to <strong>{roleTarget.role === 'admin' ? 'demote' : 'promote'}</strong>{' '}
                            <strong>{roleTarget.name}</strong> ({roleTarget.email}).
                            Enter your admin password to confirm.
                        </p>
                        {roleError && <div className="alert alert-error">{roleError}</div>}
                        <form onSubmit={handleRoleChange}>
                            <div className="form-group">
                                <label>Your Password</label>
                                <input
                                    type="password"
                                    value={rolePassword}
                                    onChange={(e) => setRolePassword(e.target.value)}
                                    placeholder="Enter your admin password…"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setRoleTarget(null)}>Cancel</button>
                                <button
                                    type="submit"
                                    className={`btn ${roleTarget.role === 'admin' ? 'btn-danger' : 'btn-primary'}`}
                                    disabled={roleSubmitting}
                                >
                                    {roleSubmitting ? 'Confirming…' : roleTarget.role === 'admin' ? 'Demote' : 'Promote'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Complaint Modal */}
            {editingComplaint && (
                <div className="modal-overlay" onClick={() => setEditingComplaint(null)}>
                    <div className="modal glass" onClick={(e) => e.stopPropagation()}>
                        <h3>Update Complaint</h3>
                        <p className="subtitle" style={{ marginBottom: '0.5rem' }}>
                            From: <strong>{editingComplaint.user?.name}</strong> — {editingComplaint.subject}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            {editingComplaint.message}
                        </p>
                        <form onSubmit={handleComplaintUpdate}>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Admin Notes</label>
                                <textarea
                                    value={editForm.admin_notes}
                                    onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Reply or notes visible to admin only…"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingComplaint(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
