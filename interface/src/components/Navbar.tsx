import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as apiLogout } from '../api/endpoints';

import logoSvg from '../assets/logo.svg';
import bookingSvg from '../assets/booking.svg';
import complaintSvg from '../assets/complaint.svg';
import adminSvg from '../assets/admin.svg';
import logoutSvg from '../assets/logout.svg';

const Navbar: React.FC = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await apiLogout(); } catch {/* ignore */ }
        logout();
        navigate('/auth');
    };

    const link = ({ isActive }: { isActive: boolean }) => isActive ? 'nav-link active' : 'nav-link';

    return (
        <nav className="navbar glass">
            <div className="navbar-brand">
                <img src={logoSvg} className="nav-logo-svg" alt="Converge Logo" />
                <span>Converge</span>
            </div>
            <div className="navbar-links">
                {isAdmin && (
                    <NavLink to="/admin" className={link}>
                        <img src={bookingSvg} className="icon-inline" alt="dashboard" /> Dashboard
                    </NavLink>
                )}
                <NavLink to="/facilities" className={link}>Facilities</NavLink>
                {user && !isAdmin && (
                    <NavLink to="/bookings" className={link}>My Bookings</NavLink>
                )}
                {user && !isAdmin && (
                    <NavLink to="/support" className={link}>
                        <img src={complaintSvg} className="icon-inline" alt="support" /> Support
                    </NavLink>
                )}
            </div>
            <div className="navbar-user">
                {isAdmin && (
                    <img src={adminSvg} className="nav-icon-svg" alt="admin" title="Administrator" />
                )}
                {/* User name acts as the account link */}
                <NavLink to="/account" className="user-name user-name-link" title="Account settings">
                    {user?.name}
                </NavLink>
                <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout}>
                    <img src={logoutSvg} className="nav-icon-svg" alt="logout" />
                    <span className="logout-text">Log Out</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
