import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { currentUser } = useAuth();
  const { refreshNotifications } = useNotifications();
  const location = useLocation();

  // Fetch notifications when layout mounts (dashboard startup)
  // This ensures the notification badge shows the correct count regardless of which page loads
  useEffect(() => {
    if (currentUser?.id) {
      // Refresh notifications on dashboard startup
      refreshNotifications();
    }
  }, []); // Only run once on mount

  // Hide navbar on landing page (when not logged in and on home route)
  const showNavbar = currentUser || location.pathname !== '/';

  return (
    <div className={`layout ${!showNavbar ? 'no-navbar' : ''}`}>
      {showNavbar && <Navbar />}
      <main className={`main-content ${!showNavbar ? 'full-width' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
