import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { Loader2, ArrowLeft, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id]);

  useEffect(() => {
    // Check if user is logged in and is a student
    if (!loading && (!currentUser || currentUser.role !== 'student')) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const courseData = await courseService.getCourseDetails(id);
      setCourse(courseData);
      
      // Check if already enrolled
      if (courseData.isEnrolled === true) {
        navigate(`/courses/${id}`);
        return;
      }
      
      // Fetch teacher info if available
      if (courseData.teacherID || courseData.teacher?.id) {
        try {
          const teacherData = await courseService.getTeacherProfile(
            courseData.teacherID || courseData.teacher?.id
          );
          setTeacher(teacherData);
        } catch (err) {
          console.error('Error fetching teacher:', err);
        }
      } else if (courseData.teacher) {
        setTeacher(courseData.teacher);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/login');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      
      // For now, this will enroll the student directly
      // Later, this will be connected to payment gateway
      await courseService.enrollInCourse(id, currentUser.id);
      
      // Show success message and redirect
      alert('Successfully enrolled in the course!');
      navigate(`/course-player/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to complete enrollment. Please try again.');
      console.error('Enrollment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!course || error) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-error">
            <AlertCircle size={48} color="#ef4444" />
            <h2>{error ? 'Error loading course' : 'Course not found'}</h2>
            <p>{error || "The course you're looking for doesn't exist."}</p>
            <button onClick={() => navigate('/courses')} className="back-button">
              <ArrowLeft size={18} />
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const price = course.price || 0;
  const currency = course.currency || 'USD';
  const formattedPrice = price > 0 ? `${currency} ${price.toFixed(2)}` : 'Free';

  return (
    <div className="checkout-page">
      <div className="container">
        <button onClick={() => navigate(`/courses/${id}`)} className="back-button">
          <ArrowLeft size={18} />
          Back to Course
        </button>

        <div className="checkout-container">
          <div className="checkout-main">
            <div className="checkout-header">
              <h1>Checkout</h1>
              <p className="checkout-subtitle">Review your order and complete your enrollment</p>
            </div>

            <div className="checkout-section">
              <h2>Course Details</h2>
              <div className="course-summary">
                {course.thumbnailUrl || course.thumbnail ? (
                  <img 
                    src={course.thumbnailUrl || course.thumbnail} 
                    alt={course.title}
                    className="course-thumbnail-small"
                  />
                ) : (
                  <div className="course-thumbnail-placeholder">
                    <span>No Image</span>
                  </div>
                )}
                <div className="course-summary-info">
                  <h3>{course.title}</h3>
                  {course.subject && (
                    <span className="course-subject">{course.subject}</span>
                  )}
                  {teacher && (
                    <p className="course-instructor">Instructor: {teacher.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="checkout-section">
              <h2>Payment Method</h2>
              <div className="payment-method-info">
                <CreditCard size={24} />
                <div>
                  <p className="payment-method-title">Payment Gateway</p>
                  <p className="payment-method-note">
                    Payment integration will be added later. For now, clicking "Pay Now" will enroll you in the course.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="checkout-sidebar">
            <div className="checkout-summary-card">
              <h2>Order Summary</h2>
              
              <div className="summary-row">
                <span>Course Price:</span>
                <span className="summary-value">{formattedPrice}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total">
                <span>Total:</span>
                <span className="summary-value">{formattedPrice}</span>
              </div>

              {error && (
                <div className="checkout-error-message">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={handlePayment} 
                className="pay-button"
                disabled={processing || price < 0}
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay Now
                  </>
                )}
              </button>

              <p className="payment-security-note">
                <CheckCircle size={16} />
                Secure enrollment process
              </p>
            </div>

            <div className="checkout-features">
              <h3>What's included:</h3>
              <ul>
                <li>Full course access</li>
                <li>Downloadable resources</li>
                <li>Quizzes and assignments</li>
                <li>Certificate of completion</li>
                <li>Lifetime access</li>
                <li>Mobile and desktop access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

