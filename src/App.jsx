import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Common/Login';
import Signup from './pages/Common/Signup';
import AdminDashboard from './pages/Admin/AdminDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import StudentDashboard from './pages/Student/StudentDashboard';
import CourseList from './pages/Common/CourseList';
import CourseDetail from './pages/Common/CourseDetail';
import CoursePlayer from './pages/Student/CoursePlayer';
import TeacherList from './pages/Common/TeacherList';
import Community from './pages/Common/Community';
import BlogList from './pages/Common/BlogList';
import BlogDetail from './pages/Common/BlogDetail';
import QASection from './pages/Common/QASection';
import Profile from './pages/Common/Profile';
import MyCourses from './pages/Teacher/MyCourses';
import EnrolledCourses from './pages/Student/EnrolledCourses';
import LectureSchedule from './pages/Teacher/LectureSchedule';
import AdvancedAnalytics from './pages/Teacher/AdvancedAnalytics';
import Messaging from './pages/Teacher/Messaging';
import Layout from './components/Common/Layout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { currentUser } = useAuth();
  const getDashboard = () => {
    if (!currentUser) return <Navigate to="/login" replace />;

    switch (currentUser.user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <Signup />} />

      <Route path="/" element={<Layout />}>
        <Route index element={getDashboard()} />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="teachers" element={<TeacherList />} />
        <Route path="community" element={<Community />} />
        <Route path="blog" element={<BlogList />} />
        <Route path="blog/:id" element={<BlogDetail />} />
        <Route path="qa" element={<QASection />} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route
          path="my-courses"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <MyCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="schedule"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <LectureSchedule />
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
            <ProtectedRoute allowedRoles={['teacher']}>
              <Messaging />
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
          path="course-player/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <CoursePlayer />
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
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
