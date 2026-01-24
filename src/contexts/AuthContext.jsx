import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user and token on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      // Handle session-based auth response format: { sessionId, user }
      const { sessionId, user } = response;

      // Store sessionId as token (used by api.js for Bearer auth)
      localStorage.setItem('token', sessionId);
      localStorage.setItem('currentUser', JSON.stringify(user));

      setCurrentUser(user);
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Invalid email or password'
      };
    }
  };

  /**
   * Signup for different user roles
   * @param {Object} userData - Signup data
   * @param {string} role - User role (teacher, student, parent)
   * @param {string} firebaseToken - Firebase authentication token (required)
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  const signup = async (userData, role, firebaseToken) => {
    try {
      // Prepare signup data with Firebase token
      const signupData = {
        token: firebaseToken,
        name: userData.name,
        birthDate: userData.birthDate,
        gender: userData.gender,
        profile_image: userData.profile_image || null,
      };

      // Add role-specific fields
      if (role === 'teacher') {
        signupData.title = userData.title;
        signupData.description = userData.description;
      }

      let response;
      switch (role) {
        case 'teacher':
          response = await authService.teacherSignup(signupData);
          break;
        case 'student':
          response = await authService.studentSignup(signupData);
          break;
        case 'parent':
          response = await authService.parentSignup(signupData);
          break;
        default:
          return { success: false, error: 'Invalid role' };
      }

      // If signup successful, user needs to verify email
      return { 
        success: true, 
        message: 'Account created. Please verify your email.',
        requiresVerification: true 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create account' 
      };
    }
  };

  /**
   * Logout user - deletes session from backend and clears local storage
   */
  const logout = async () => {
    try {
      // Call backend to delete session
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if backend call fails
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  /**
   * Update user profile
   * @param {Object} updatedData - Updated profile data
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  const updateProfile = async (updatedData) => {
    try {
      // TODO: Implement profile update API call when profile service is created
      const updatedUser = { ...currentUser, ...updatedData };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      };
    }
  };

  /**
   * Send email confirmation code
   * @param {string} email - User email
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const sendConfirmationCode = async (email) => {
    try {
      await authService.sendConfirmationCode(email);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to send confirmation code' 
      };
    }
  };

  /**
   * Verify confirmation code
   * @param {string} email - User email
   * @param {string} code - 4-digit confirmation code
   * @returns {Promise<{success: boolean, token?: string, error?: string}>}
   */
  const checkConfirmationCode = async (email, code) => {
    try {
      const response = await authService.checkConfirmationCode(email, code);
      return { success: true, token: response.token };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Invalid or expired code' 
      };
    }
  };

  /**
   * Verify account with token
   * @param {string} email - User email
   * @param {string} token - Verification token
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const verifyAccount = async (email, token) => {
    try {
      await authService.verifyAccount(email, token);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Account verification failed' 
      };
    }
  };

  /**
   * Reset password
   * @param {string} email - User email
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const resetPassword = async (email, token, newPassword) => {
    try {
      await authService.resetPassword(email, token, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Password reset failed' 
      };
    }
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    updateProfile,
    sendConfirmationCode,
    checkConfirmationCode,
    verifyAccount,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
