import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../api/endpoints';
import logoSvg from '../assets/logo.svg';
import openEyeSvg from '../assets/open.svg';
import closedEyeSvg from '../assets/closed.svg';

const AuthPage: React.FC = () => {
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (tab === 'login') {
                const res = await apiLogin({ email, password });
                login(res.data.token, res.data.user);
                navigate('/facilities');
            } else {
                const res = await apiRegister({ name, email, password, password_confirmation: passwordConfirmation });
                login(res.data.token, res.data.user);
                navigate('/facilities');
            }
        } catch (err: any) {
            const errorsObj = err.response?.data?.errors as Record<string, string[]> | undefined;
            const msg = err.response?.data?.message || Object.values(errorsObj ?? {})?.[0]?.[0] || 'Something went wrong.';
            setError(msg as string);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass">
                <div className="auth-logo">
                    <img src={logoSvg} className="auth-logo-svg" alt="Converge Logo" />
                    <h1>Converge</h1>
                    <p>Book facilities with ease</p>
                </div>

                <div className="tab-bar">
                    <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
                        Sign In
                    </button>
                    <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
                        Register
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {tab === 'register' && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-input-wrap">
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                <img src={showPassword ? closedEyeSvg : openEyeSvg} className="icon-inline" alt="Toggle password visibility" style={{ margin: 0 }} />
                            </button>
                        </div>
                    </div>
                    {tab === 'register' && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="password-input-wrap">
                                <input type={showPassword ? "text" : "password"} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="••••••••" required />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    <img src={showPassword ? closedEyeSvg : openEyeSvg} className="icon-inline" alt="Toggle password visibility" style={{ margin: 0 }} />
                                </button>
                            </div>
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;
