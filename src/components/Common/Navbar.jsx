import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  GraduationCap,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  HelpCircle,
  User,
  LogOut,
  BookMarked,
  Home,
  Calendar,
  BarChart3,
  Mail,
  Clock,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { unreadCount, isConnected } = useNotifications();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside or on a link
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
      )}

      <nav className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={closeMobileMenu}>
            <img src="/Logo Vertical.png" alt="Ruwaq Logo" className="logo logo-vertical" />
            <img src="/Logo.png" alt="Ruwaq Logo" className="logo logo-horizontal" />
          </Link>
        </div>

      <div className="sidebar-menu">
        {currentUser && (
          <Link to="/" className="nav-link" onClick={closeMobileMenu}>
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
        )}

        <Link to="/courses" className="nav-link" onClick={closeMobileMenu}>
          <BookOpen size={20} />
          <span>Courses</span>
        </Link>

        <Link to="/teachers" className="nav-link" onClick={closeMobileMenu}>
          <Users size={20} />
          <span>Teachers</span>
        </Link>

        <Link to="/community" className="nav-link" onClick={closeMobileMenu}>
          <MessageSquare size={20} />
          <span>Community</span>
        </Link>

        <Link to="/blog" className="nav-link" onClick={closeMobileMenu}>
          <FileText size={20} />
          <span>Blog</span>
        </Link>

        <Link to="/qa" className="nav-link" onClick={closeMobileMenu}>
          <HelpCircle size={20} />
          <span>Q&A</span>
        </Link>

        {currentUser?.role === 'teacher' && (
          <>
            <Link to="/my-courses" className="nav-link" onClick={closeMobileMenu}>
              <BookMarked size={20} />
              <span>My Courses</span>
            </Link>
            <Link to="/appointments" className="nav-link" onClick={closeMobileMenu}>
              <Calendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link to="/appointments/availability" className="nav-link" onClick={closeMobileMenu}>
              <Clock size={20} />
              <span>Availability</span>
            </Link>
            <Link to="/analytics" className="nav-link" onClick={closeMobileMenu}>
              <BarChart3 size={20} />
              <span>Analytics</span>
            </Link>
            <Link to="/messages" className="nav-link" onClick={closeMobileMenu}>
              <Mail size={20} />
              <span>Messages</span>
            </Link>
          </>
        )}

        {currentUser?.role === 'student' && (
          <>
            <Link to="/enrolled-courses" className="nav-link" onClick={closeMobileMenu}>
              <BookMarked size={20} />
              <span>My Learning</span>
            </Link>
            <Link to="/appointments" className="nav-link" onClick={closeMobileMenu}>
              <Calendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link to="/messages" className="nav-link" onClick={closeMobileMenu}>
              <Mail size={20} />
              <span>Messages</span>
            </Link>
          </>
        )}

        {currentUser?.role === 'parent' && (
          <>
            <Link to="/connected-students" className="nav-link" onClick={closeMobileMenu}>
              <Users size={20} />
              <span>My Students</span>
            </Link>
            <Link to="/pending-invitations" className="nav-link" onClick={closeMobileMenu}>
              <Mail size={20} />
              <span>Invitations</span>
            </Link>
            <Link to="/appointments" className="nav-link" onClick={closeMobileMenu}>
              <Calendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link to="/messages" className="nav-link" onClick={closeMobileMenu}>
              <MessageSquare size={20} />
              <span>Messages</span>
            </Link>
          </>
        )}

        {/* Notifications for all users */}
        {currentUser && (
          <Link to="/notifications" className="nav-link" style={{ position: 'relative' }} onClick={closeMobileMenu}>
            <Bell size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7em',
                fontWeight: 'bold'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {!isConnected && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: unreadCount > 0 ? '30px' : '8px',
                width: '8px',
                height: '8px',
                background: '#9ca3af',
                borderRadius: '50%'
              }} title="Disconnected" />
            )}
          </Link>
        )}

        {(currentUser?.role === 'admin' || currentUser?.role === 'supervisor') && (
          <>
            <Link to="/admin/send-notification" className="nav-link" onClick={closeMobileMenu}>
              <Bell size={20} />
              <span>Send Notification</span>
            </Link>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        {currentUser ? (
          <>
            <Link to="/profile" className="user-profile" onClick={closeMobileMenu}>
              <img
                src={currentUser.profileImage || currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'U')}&background=6366f1&color=fff&size=80`}
                alt={currentUser.name || 'User'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%236366f1'/%3E%3Ccircle cx='20' cy='15' r='7' fill='white'/%3E%3Cellipse cx='20' cy='33' rx='12' ry='9' fill='white'/%3E%3C/svg%3E`;
                }}
              />
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">
                  {currentUser.role === 'supervisor' ? 'admin' : currentUser.role}
                </span>
              </div>
            </Link>
            <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="logout-btn">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn" onClick={closeMobileMenu}>
            <User size={20} />
            <span>Login</span>
          </Link>
        )}
      </div>
    </nav>
    </>
  );
};

export default Navbar;
