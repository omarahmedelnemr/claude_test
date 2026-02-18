import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, BookOpen, Calendar, ArrowLeft, Award, Briefcase, GraduationCap, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import appointmentService from '../../services/appointmentService';
import './TeacherProfile.css';

const TeacherProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');
    const [reviewsExpanded, setReviewsExpanded] = useState(false);
    
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

    useEffect(() => {
        if (id) loadProfile();
    }, [id]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [prof, coursesRes] = await Promise.all([
                courseService.getTeacherProfile(id),
                courseService.getAvailableCourses({ teacherID: id, limit: 50 }),
            ]);
            setProfile(prof);
            const courseList = coursesRes?.data || coursesRes || [];
            setCourses(Array.isArray(courseList) ? courseList : []);
        } catch (err) {
            console.error("Failed to load teacher profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const full = Math.floor(rating);
        for (let i = 0; i < 5; i++) {
            stars.push(
                <Star key={i} size={16} color="#ff9800" fill={i < full ? "#ff9800" : "none"} />
            );
        }
        return stars;
    };

    if (loading) {
        return (
            <div className="container tp-page">
                <div className="tp-loading">Loading profile...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container tp-page">
                <div className="tp-loading">Teacher not found</div>
            </div>
        );
    }

    const reviews = profile.reviews || [];
    const visibleReviews = reviewsExpanded ? reviews : reviews.slice(0, 3);
    const tags = profile.tags || [];
    const certificates = profile.certificates || [];
    const experience = profile.experince || [];
    const education = profile.education || [];

    return (
        <div className="container tp-page">
            <button className="back-btn" onClick={() => navigate('/teachers')}>
                <ArrowLeft size={18} /> Back to Teachers
            </button>

            {/* Hero Section */}
            <div className="card tp-hero">
                <img
                    src={profile.profileImage || '/default-avatar.png'}
                    alt={profile.name}
                    className="tp-hero-avatar"
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <div className="tp-hero-info">
                    <h1>{profile.name}</h1>
                    {profile.title && <p className="tp-hero-title">{profile.title}</p>}
                    <div className="tp-hero-rating">
                        {renderStars(profile.starRate || 0)}
                        <span className="tp-rating-num">{(profile.starRate || 0).toFixed(1)}</span>
                        <span className="tp-rating-count">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                    </div>
                    {tags.length > 0 && (
                        <div className="tp-hero-tags">
                            {tags.map((t, i) => (
                                <span key={i} className="tp-tag">{t.tag || t}</span>
                            ))}
                        </div>
                    )}
                    <div className="tp-hero-stats">
                        <div className="tp-stat-pill">
                            <BookOpen size={15} />
                            {courses.length} course{courses.length !== 1 ? 's' : ''}
                        </div>
                        {profile.online && <span className="tp-online-badge">Online</span>}
                    </div>
                </div>
                <div className="tp-hero-actions">
                    {!isAdmin && (
                        <button className="tp-book-btn" onClick={() => navigate(`/appointments/book?teacherID=${id}`)}>
                            <Calendar size={16} /> Book Appointment
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tp-tabs">
                {['about', 'courses', 'reviews'].map(tab => (
                    <button
                        key={tab}
                        className={`tp-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'about' ? 'About' : tab === 'courses' ? `Courses (${courses.length})` : `Reviews (${reviews.length})`}
                    </button>
                ))}
            </div>

            {/* About Tab */}
            {activeTab === 'about' && (
                <div className="tp-tab-content">
                    {profile.bio && (
                        <div className="card tp-section">
                            <h3>Bio</h3>
                            <p className="tp-description">{profile.bio}</p>
                        </div>
                    )}
                    {profile.description && (
                        <div className="card tp-section">
                            <h3>Professional Description</h3>
                            <p className="tp-description">{profile.description}</p>
                        </div>
                    )}

                    {experience.length > 0 && (
                        <div className="card tp-section">
                            <h3><Briefcase size={18} /> Experience</h3>
                            <div className="tp-info-list">
                                {experience.map((exp, i) => (
                                    <div key={exp.id || i} className="tp-info-item">
                                        <Briefcase size={15} />
                                        <span>{exp.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {education.length > 0 && (
                        <div className="card tp-section">
                            <h3><GraduationCap size={18} /> Education</h3>
                            <div className="tp-info-list">
                                {education.map((edu, i) => (
                                    <div key={edu.id || i} className="tp-info-item">
                                        <GraduationCap size={15} />
                                        <span>{edu.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {certificates.length > 0 && (
                        <div className="card tp-section">
                            <h3><Award size={18} /> Certificates</h3>
                            <div className="tp-info-list">
                                {certificates.map((cert, i) => (
                                    <div key={cert.id || i} className="tp-info-item">
                                        <Award size={15} />
                                        <span>{cert.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
                <div className="tp-tab-content">
                    {courses.length === 0 ? (
                        <div className="card tp-section tp-empty">
                            <p>No published courses yet</p>
                        </div>
                    ) : (
                        <div className="tp-courses-grid">
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    className="card tp-course-card"
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                >
                                    {course.thumbnailUrl && (
                                        <img
                                            src={course.thumbnailUrl}
                                            alt={course.title}
                                            className="tp-course-thumb"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="tp-course-body">
                                        <h4>{course.title}</h4>
                                        {course.subject && <span className="tp-course-subject">{course.subject}</span>}
                                        {course.description && (
                                            <p className="tp-course-desc">{course.description}</p>
                                        )}
                                        <div className="tp-course-footer">
                                            <span className="tp-course-rating">
                                                <Star size={13} color="#ff9800" fill="#ff9800" />
                                                {(course.rating || 0).toFixed(1)}
                                            </span>
                                            {course.price !== undefined && (
                                                <span className="tp-course-price">
                                                    {course.price > 0 ? `$${Number(course.price).toFixed(2)}` : 'Free'}
                                                </span>
                                            )}
                                            {course.enrolledCount !== undefined && (
                                                <span className="tp-course-enrolled">{course.enrolledCount} enrolled</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="tp-tab-content">
                    {reviews.length === 0 ? (
                        <div className="card tp-section tp-empty">
                            <p>No reviews yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="tp-reviews-list">
                                {visibleReviews.map((review, i) => (
                                    <div key={i} className="card tp-review-card">
                                        <div className="tp-review-header">
                                            <div className="tp-review-author">
                                                <img
                                                    src={review.student?.profileImage || '/default-avatar.png'}
                                                    alt={review.student?.name || 'Student'}
                                                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                                />
                                                <div>
                                                    <strong>{review.student?.name || 'Student'}</strong>
                                                    {review.date && (
                                                        <span className="tp-review-date">
                                                            {new Date(review.date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="tp-review-stars">
                                                {renderStars(review.stars || 0)}
                                            </div>
                                        </div>
                                        {review.text && <p className="tp-review-text">{review.text}</p>}
                                    </div>
                                ))}
                            </div>
                            {reviews.length > 3 && (
                                <button
                                    className="tp-show-more"
                                    onClick={() => setReviewsExpanded(!reviewsExpanded)}
                                >
                                    <ChevronDown size={16} className={reviewsExpanded ? 'rotated' : ''} />
                                    {reviewsExpanded ? 'Show less' : `Show all ${reviews.length} reviews`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherProfile;
