import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateAccount, deleteAccount, logout as apiLogout } from '../api/endpoints';
import openEyeSvg from '../assets/open.svg';
import closedEyeSvg from '../assets/closed.svg';
import adminSvg from '../assets/admin.svg';
import userSvg from '../assets/user.svg';

const AccountPage: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const payload: Record<string, string> = { name, email };
            if (password) { payload.password = password; payload.password_confirmation = passwordConfirmation; }
            const response = await updateAccount(payload);
            updateUser(response.data);
            showToast('Profile updated!');
            setPassword('');
            setPasswordConfirmation('');
        } catch (err: any) {
            const msgs = err.response?.data?.errors;
            setError(msgs ? Object.values(msgs).flat().join(' ') : err.response?.data?.message || 'Update failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await apiLogout();
        } catch {/* ignore */ }
        await deleteAccount();
        logout();
        navigate('/auth');
    };

    return (
        <div className="page">
            {toast && <div className="toast">{toast}</div>}

            <div className="page-header">
                <div>
                    <h2>My Account</h2>
                    <p className="subtitle">Manage your profile and preferences</p>
                </div>
                <div className="role-badge">
                    <span className={`badge ${user?.role === 'admin' ? 'badge-purple' : 'badge-green'}`}>
                        {user?.role === 'admin' ? (
                            <><img src={adminSvg} className="icon-inline" alt="Admin" style={{ height: '1.2rem', width: '1.2rem', marginRight: '0.4rem', filter: 'brightness(0) invert(1) opacity(0.85)' }} /> Admin</>
                        ) : (
                            <><img src={userSvg} className="icon-inline" alt="User" style={{ height: '1.2rem', width: '1.2rem', marginRight: '0.4rem', filter: 'brightness(0) invert(1) opacity(0.85)' }} /> User</>
                        )}
                    </span>
                </div>
            </div>

            <div className="account-grid">
                <div className="card glass account-card">
                    <h3>Profile Details</h3>
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="divider">Change Password <span>(leave blank to keep current)</span></div>
                        <div className="form-group">
                            <label>New Password</label>
                            <div className="password-input-wrap">
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    <img src={showPassword ? closedEyeSvg : openEyeSvg} className="icon-inline" alt="Toggle password visibility" style={{ margin: 0 }} />
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="password-input-wrap">
                                <input type={showPassword ? "text" : "password"} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="••••••••" />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    <img src={showPassword ? closedEyeSvg : openEyeSvg} className="icon-inline" alt="Toggle password visibility" style={{ margin: 0 }} />
                                </button>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="card glass account-card danger-zone">
                    <h3>Danger Zone</h3>
                    <p>Once you delete your account, all your data and bookings will be permanently removed.</p>
                    {!deleteConfirm ? (
                        <button className="btn btn-danger btn-full" onClick={() => setDeleteConfirm(true)}>
                            Delete Account
                        </button>
                    ) : (
                        <div className="confirm-delete">
                            <p className="alert alert-error">Are you absolutely sure? This cannot be undone.</p>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDelete}>Yes, Delete</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountPage;
