import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap } from 'lucide-react';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    birthDate: '',
    gender: 'male',
    title: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationToken, setVerificationToken] = useState(null);
  const { signup, sendConfirmationCode, checkConfirmationCode, verifyAccount } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.birthDate) {
      setError('Please enter your birth date');
      return;
    }

    if (formData.role === 'teacher' && !formData.title) {
      setError('Please enter your professional title');
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword from userData before sending to backend
      const { confirmPassword, ...userData } = formData;
      const result = await signup(userData, formData.role);

      if (result.success) {
        if (result.requiresVerification) {
          // Send confirmation code
          const codeResult = await sendConfirmationCode(formData.email);
          if (codeResult.success) {
            setShowVerification(true);
          } else {
            setError(codeResult.error || 'Failed to send verification code');
          }
        } else {
          navigate('/');
        }
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await checkConfirmationCode(formData.email, verificationCode);
      if (result.success) {
        setVerificationToken(result.token);
        // Verify account
        const verifyResult = await verifyAccount(formData.email, result.token);
        if (verifyResult.success) {
          navigate('/login', { 
            state: { message: 'Account verified successfully! Please login.' } 
          });
        } else {
          setError(verifyResult.error || 'Account verification failed');
        }
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <GraduationCap size={48} color="var(--primary-color)" />
          <h1>Join EduPlatform</h1>
          <p>Create your account and start learning today!</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="birthDate">Birth Date</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {formData.role === 'teacher' && (
            <>
              <div className="form-group">
                <label htmlFor="title">Professional Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Professor, Instructor"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Professional Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your teaching experience"
                  rows="3"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {showVerification && (
          <div className="verification-section">
            <h3>Verify Your Email</h3>
            <p>We've sent a verification code to {formData.email}</p>
            <form onSubmit={handleVerification} className="auth-form">
              <div className="form-group">
                <label htmlFor="verificationCode">Verification Code</label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 4-digit code"
                  maxLength="4"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="auth-button">
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          </div>
        )}

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
