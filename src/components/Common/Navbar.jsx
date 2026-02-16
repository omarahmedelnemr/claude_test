import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  HelpCircle,
  User,
  LogOut,
  Layout,
  BookMarked,
  Home,
  Calendar,
  BarChart3,
  Mail,
  Clock
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand">
          <GraduationCap size={32} />
          <span>EduPlatform</span>
        </Link>
      </div>

      <div className="sidebar-menu">
        <Link to="/" className="nav-link">
          <Home size={20} />
          <span>Dashboard</span>
        </Link>

        <Link to="/courses" className="nav-link">
          <BookOpen size={20} />
          <span>Courses</span>
        </Link>

        <Link to="/teachers" className="nav-link">
          <Users size={20} />
          <span>Teachers</span>
        </Link>

        <Link to="/community" className="nav-link">
          <MessageSquare size={20} />
          <span>Community</span>
        </Link>

        <Link to="/blog" className="nav-link">
          <FileText size={20} />
          <span>Blog</span>
        </Link>

        <Link to="/qa" className="nav-link">
          <HelpCircle size={20} />
          <span>Q&A</span>
        </Link>

        {currentUser?.role === 'teacher' && (
          <>
            <Link to="/my-courses" className="nav-link">
              <BookMarked size={20} />
              <span>My Courses</span>
            </Link>
            <Link to="/appointments" className="nav-link">
              <Calendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link to="/appointments/availability" className="nav-link">
              <Clock size={20} />
              <span>Availability</span>
            </Link>
            <Link to="/analytics" className="nav-link">
              <BarChart3 size={20} />
              <span>Analytics</span>
            </Link>
            <Link to="/messages" className="nav-link">
              <Mail size={20} />
              <span>Messages</span>
            </Link>
          </>
        )}

        {currentUser?.role === 'student' && (
          <>
            <Link to="/enrolled-courses" className="nav-link">
              <BookMarked size={20} />
              <span>My Learning</span>
            </Link>
            <Link to="/appointments/book" className="nav-link">
              <Calendar size={20} />
              <span>Book Appointment</span>
            </Link>
            <Link to="/appointments" className="nav-link">
              <Calendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link to="/messages" className="nav-link">
              <Mail size={20} />
              <span>Messages</span>
            </Link>
          </>
        )}

        {currentUser?.role === 'parent' && (
          <>
            <Link to="/appointments" className="nav-link">
              <Calendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link to="/messages" className="nav-link">
              <Mail size={20} />
              <span>Messages</span>
            </Link>
          </>
        )}

        {currentUser?.role === 'admin' && (
          <Link to="/admin" className="nav-link">
            <Layout size={20} />
            <span>Admin Panel</span>
          </Link>
        )}
      </div>

      <div className="sidebar-footer">
        {currentUser ? (
          <>
            <Link to="/profile" className="user-profile">
              <img 
                src={currentUser.profileImage || currentUser.avatar || '/default-avatar.png'} 
                alt={currentUser.name || 'User'} 
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">{currentUser.role}</span>
              </div>
            </Link>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn">
            <User size={20} />
            <span>Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
