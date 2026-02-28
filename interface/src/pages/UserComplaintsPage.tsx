import React, { useEffect, useState } from 'react';
import { getComplaints, submitComplaint } from '../api/endpoints';
import type { Complaint } from '../api/endpoints';

import complaintSvg from '../assets/complaint.svg';

const statusBadge: Record<string, string> = {
    open: 'badge-red',
    in_progress: 'badge-yellow',
    resolved: 'badge-green',
};
const statusLabel: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
};

const UserComplaintsPage: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const load = async () => {
        setLoading(true);
        const res = await getComplaints();
        setComplaints(res.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await submitComplaint({ subject, message });
            setComplaints((prev) => [res.data, ...prev]);
            setSubject('');
            setMessage('');
            setShowForm(false);
            showToast('<svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style="color:var(--accent)"><polyline points="20 6 9 17 4 12"/></svg> Complaint submitted! We\'ll get back to you soon.');
        } catch (err: any) {
            const msgs = err.response?.data?.errors as Record<string, string[]> | undefined;
            setError(msgs ? Object.values(msgs).flat().join(' ') : 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page">
            {toast && <div className="toast">{toast}</div>}

            <div className="page-header">
                <div>
                    <h2><img src={complaintSvg} className="icon-header" alt="support" /> Support & Complaints</h2>
                    <p className="subtitle">Submit a complaint, request, or concern — we'll respond as soon as possible</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setError(null); }}>
                    + New Request
                </button>
            </div>

            {loading ? (
                <div className="bookings-list">
                    {[1, 2].map((i) => <div key={i} className="booking-card skeleton" />)}
                </div>
            ) : complaints.length === 0 ? (
                <div className="empty-state glass">
                    <img src={complaintSvg} className="stat-icon-svg" alt="no-requests" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3>No requests yet</h3>
                    <p>Use the button above to submit a complaint or support request.</p>
                </div>
            ) : (
                <div className="complaints-list">
                    {complaints.map((c) => (
                        <div key={c.id} className={`complaint-card glass ${c.status === 'resolved' ? 'complaint-resolved' : ''}`}>
                            <div className="complaint-header">
                                <h3>{c.subject}</h3>
                                <span className={`badge ${statusBadge[c.status]}`}>{statusLabel[c.status]}</span>
                            </div>
                            <p className="complaint-message">{c.message}</p>
                            {c.admin_notes && (
                                <div className="admin-reply">
                                    <span className="admin-reply-label">
                                        <svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg> Team Response
                                    </span>
                                    <p>{c.admin_notes}</p>
                                </div>
                            )}
                            <p className="complaint-date">
                                Submitted {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* New Complaint Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal glass" onClick={(e) => e.stopPropagation()}>
                        <h3>New Support Request</h3>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Booking issue, damaged equipment…"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="form-textarea"
                                    rows={5}
                                    placeholder="Describe your issue or concern in detail…"
                                    required
                                    minLength={10}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Sending…' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserComplaintsPage;
