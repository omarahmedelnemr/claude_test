import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Login from './pages/Common/Login';
import Signup from './pages/Common/Signup';
import LandingPage from './pages/Common/LandingPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import SendNotification from './pages/Admin/SendNotification';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import StudentDashboard from './pages/Student/StudentDashboard';
import ParentDashboard from './pages/Parent/ParentDashboard';
import CourseList from './pages/Common/CourseList';
import CourseDetail from './pages/Common/CourseDetail';
import CoursePlayer from './pages/Student/CoursePlayer';
import TeacherList from './pages/Common/TeacherList';
import TeacherProfile from './pages/Common/TeacherProfile';
import Community from './pages/Common/Community';
import SavedPosts from './pages/Common/SavedPosts';
import BlogList from './pages/Common/BlogList';
import BlogDetail from './pages/Common/BlogDetail';
import CreateArticle from './pages/Teacher/CreateArticle';
import QASection from './pages/Common/QASection';
import Profile from './pages/Common/Profile';
import Notifications from './pages/Common/Notifications';
import MyCourses from './pages/Teacher/MyCourses';
import CourseEditor from './pages/Teacher/CourseEditor';
import CourseContentManager from './pages/Teacher/CourseContentManager';
import EnrolledCourses from './pages/Student/EnrolledCourses';
import Checkout from './pages/Student/Checkout';

import AdvancedAnalytics from './pages/Teacher/AdvancedAnalytics';
import Messaging from './pages/Common/Messaging';
import MyAppointments from './pages/Common/MyAppointments';
import AppointmentBooking from './pages/Student/AppointmentBooking';
import TeacherAvailability from './pages/Teacher/TeacherAvailability';
import ParentInvitation from './pages/Student/ParentInvitation';
import PendingInvitations from './pages/Parent/PendingInvitations';
import ConnectedStudents from './pages/Parent/ConnectedStudents';
import { AgoraChatProvider } from './contexts/AgoraChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Common/Layout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    // Normalize role for comparison (handle both 'admin' and 'supervisor' as admin)
    const userRole = currentUser.role?.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    // Check if user role matches, treating 'supervisor' as 'admin'
    const roleMatches = normalizedAllowedRoles.includes(userRole) || 
      (userRole === 'supervisor' && normalizedAllowedRoles.includes('admin')) ||
      (userRole === 'admin' && normalizedAllowedRoles.includes('supervisor'));
    
    if (!roleMatches) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();
  
  const getDashboard = () => {
    // Wait for auth to finish loading before checking user
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      );
    }
    
    if (!currentUser) return <Navigate to="/login" replace />;

    // Normalize role for comparison (handle both 'admin' and 'supervisor' as admin)
    const userRole = currentUser.role?.toLowerCase();
    
    switch (userRole) {
      case 'admin':
      case 'supervisor':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'parent':
        return <ParentDashboard />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <Routes>
      {/* Landing page - always accessible */}
      <Route 
        path="/landing" 
        element={<LandingPage />}
      />
      
      <Route 
        path="/login" 
        element={
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
              <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : currentUser ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        } 
      />
      <Route 
        path="/signup" 
        element={
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
              <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : currentUser ? (
            <Navigate to="/" replace />
          ) : (
            <Signup />
          )
        } 
      />

      {/* All routes with Layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
              <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : currentUser ? (
            getDashboard()
          ) : (
            <LandingPage />
          )
        } />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="teachers" element={<TeacherList />} />
        <Route path="teachers/:id" element={<TeacherProfile />} />
        <Route path="community" element={<Community />} />
        <Route path="saved-posts" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
        <Route path="blog" element={<BlogList />} />
        <Route path="blog/:id" element={<BlogDetail />} />
        <Route
          path="blog/create"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <CreateArticle />
            </ProtectedRoute>
          }
        />
        <Route
          path="blog/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <CreateArticle />
            </ProtectedRoute>
          }
        />
        <Route path="qa" element={<QASection />} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        <Route
          path="my-courses"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <MyCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="courses/create"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <CourseEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="courses/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <CourseEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="courses/:id/manage"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <CourseContentManager />
            </ProtectedRoute>
          }
        />


        <Route
          path="analytics"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <AdvancedAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="messages"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'student', 'parent']}>
              <Messaging />
            </ProtectedRoute>
          }
        />

        <Route
          path="appointments"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'student', 'parent']}>
              <MyAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="appointments/book"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppointmentBooking />
            </ProtectedRoute>
          }
        />

        <Route
          path="appointments/availability"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherAvailability />
            </ProtectedRoute>
          }
        />

        <Route
          path="enrolled-courses"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <EnrolledCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="checkout/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="parent-invitations"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ParentInvitation />
            </ProtectedRoute>
          }
        />

        <Route
          path="pending-invitations"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <PendingInvitations />
            </ProtectedRoute>
          }
        />

        <Route
          path="connected-students"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ConnectedStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/send-notification"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SendNotification />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Course Player route outside Layout to hide navbar */}
      <Route
        path="course-player/:id"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <CoursePlayer />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AgoraChatProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AgoraChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
