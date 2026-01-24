# API Integration Setup Guide

## ✅ Phase 1 Complete: Authentication Integration

### What's Been Done

1. **API Service Layer Created**
   - `src/services/api.js` - Axios instance with interceptors
   - Automatic token injection
   - Global error handling
   - Network error handling

2. **Authentication Service Created**
   - `src/services/authService.js` - All auth endpoints
   - Login, Signup (teacher/student/parent)
   - Email verification flow
   - Password reset

3. **AuthContext Updated**
   - Replaced mock authentication with real API calls
   - JWT token management
   - User session persistence
   - Email verification support

4. **Login & Signup Pages Updated**
   - Login page now uses API
   - Signup page with role selection
   - Email verification flow
   - Error handling

5. **Dependencies Added**
   - `axios` added to package.json

### Setup Instructions

1. **Install Dependencies**
   ```bash
   cd claude_test
   npm install
   ```

2. **Create Environment File**
   Create a `.env` file in the `claude_test` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```
   (Copy from `.env.example` if it exists)

3. **Start Backend API**
   Make sure your backend API is running on `http://localhost:3000`

4. **Start Frontend**
   ```bash
   npm run dev
   ```

### Important Notes

⚠️ **Firebase Integration Required**
- The signup flow currently uses a placeholder Firebase token
- You need to integrate Firebase Authentication before signup will work
- The backend requires a Firebase token for user signup

### Testing

1. **Login Test**
   - Use existing user credentials from your backend
   - Should receive JWT token and be redirected to dashboard

2. **Signup Test**
   - Currently requires Firebase integration
   - Once Firebase is integrated, signup flow will work end-to-end

### Next Steps

1. **Integrate Firebase Authentication**
   - Install Firebase SDK
   - Configure Firebase in frontend
   - Replace placeholder token in signup

2. **Create Course Service**
   - `src/services/courseService.js`
   - Connect course listing, enrollment, etc.

3. **Create Other Services**
   - Lecture service
   - Homework service
   - Blog service
   - Community service
   - etc.

### API Endpoints Used

- `POST /auth/login` - User login
- `POST /auth/teacher-signup` - Teacher registration
- `POST /auth/student-signup` - Student registration
- `POST /auth/parent-signup` - Parent registration
- `POST /auth/send-confirmation-code` - Send verification code
- `POST /auth/check-confirmation-code` - Verify code
- `POST /auth/verify-account` - Complete verification
- `POST /auth/reset-password` - Password reset

### Error Handling

- Network errors are caught and displayed
- API errors show user-friendly messages
- 401 errors automatically log out user
- All errors are logged to console for debugging

---

*Last Updated: Phase 1 Complete*

