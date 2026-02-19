import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { currentUser } = useAuth();
  const { refreshNotifications } = useNotifications();

  // Fetch notifications when layout mounts (dashboard startup)
  // This ensures the notification badge shows the correct count regardless of which page loads
  useEffect(() => {
    if (currentUser?.id) {
      // Refresh notifications on dashboard startup
      refreshNotifications();
    }
  }, []); // Only run once on mount

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
