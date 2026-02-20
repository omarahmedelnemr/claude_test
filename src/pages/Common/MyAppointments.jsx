import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Video, X, User, Star } from 'lucide-react';
import appointmentService from '../../services/appointmentService';
import VideoCall from '../../components/Common/VideoCall';
import Pagination from '../../components/Common/Pagination';
import './MyAppointments.css';

const MyAppointments = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentUser } = useAuth();
    
    // Initialize from URL params or defaults
    const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'upcoming');
    const [appointments, setAppointments] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [joiningId, setJoiningId] = useState(null);
    const [ratingAppointment, setRatingAppointment] = useState(null);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    
    // Separate pagination state for upcoming and history - initialize from URL
    const [upcomingPage, setUpcomingPage] = useState(() => 
        parseInt(searchParams.get('upcomingPage') || searchParams.get('page') || '1', 10)
    );
    const [historyPage, setHistoryPage] = useState(() => 
        parseInt(searchParams.get('historyPage') || '1', 10)
    );
    const [upcomingPagination, setUpcomingPagination] = useState({ 
        total: 0, 
        totalPages: 1, 
        hasNextPage: false, 
        hasPreviousPage: false 
    });
    const [historyPagination, setHistoryPagination] = useState({ 
        total: 0, 
        totalPages: 1, 
        hasNextPage: false, 
        hasPreviousPage: false 
    });

    const role = currentUser?.role;
    const LIMIT = 10;

    // Sync state from URL on mount
    useEffect(() => {
        const urlTab = searchParams.get('tab') || 'upcoming';
        const urlUpcomingPage = parseInt(searchParams.get('upcomingPage') || searchParams.get('page') || '1', 10);
        const urlHistoryPage = parseInt(searchParams.get('historyPage') || '1', 10);
        
        if (urlTab !== activeTab) setActiveTab(urlTab);
        if (urlUpcomingPage !== upcomingPage) setUpcomingPage(urlUpcomingPage);
        if (urlHistoryPage !== historyPage) setHistoryPage(urlHistoryPage);
    }, []); // Only run on mount

    // Update URL when tab or pages change (but not on initial mount)
    useEffect(() => {
        const currentTab = searchParams.get('tab') || 'upcoming';
        const currentUpcomingPage = searchParams.get('upcomingPage') || searchParams.get('page') || '1';
        const currentHistoryPage = searchParams.get('historyPage') || '1';
        
        if (activeTab !== currentTab || 
            upcomingPage.toString() !== currentUpcomingPage || 
            historyPage.toString() !== currentHistoryPage) {
            const params = new URLSearchParams();
            if (activeTab !== 'upcoming') params.set('tab', activeTab);
            if (upcomingPage > 1) params.set('upcomingPage', upcomingPage.toString());
            if (historyPage > 1) params.set('historyPage', historyPage.toString());
            setSearchParams(params, { replace: true });
        }
    }, [activeTab, upcomingPage, historyPage, setSearchParams, searchParams]);

    useEffect(() => {
        loadAppointments();
    }, [role, activeTab, upcomingPage, historyPage]);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            let active, hist;
            const activeParams = { limit: LIMIT, loadBlock: upcomingPage };
            const historyParams = { limit: LIMIT, loadBlock: historyPage };
            
            if (role === 'teacher') {
                active = await appointmentService.getTeacherActiveAppointments();
                hist = await appointmentService.getTeacherAppointmentHistory();
            } else if (role === 'parent') {
                active = await appointmentService.getParentActiveAppointments();
                hist = [];
            } else {
                active = await appointmentService.getActiveAppointments(activeParams);
                hist = await appointmentService.getAppointmentHistory(historyParams);
            }
            
            // Extract data and pagination for active appointments
            if (Array.isArray(active)) {
                setAppointments(active);
            } else if (active.data) {
                setAppointments(Array.isArray(active.data) ? active.data : []);
                if (active.pagination) {
                    setUpcomingPagination({
                        total: active.pagination.total || 0,
                        totalPages: active.pagination.totalPages || 1,
                        hasNextPage: active.pagination.hasNextPage || false,
                        hasPreviousPage: active.pagination.hasPreviousPage || false,
                    });
                }
            } else {
                setAppointments([]);
            }
            
            // Extract data and pagination for history
            if (Array.isArray(hist)) {
                setHistory(hist);
            } else if (hist.data) {
                setHistory(Array.isArray(hist.data) ? hist.data : []);
                if (hist.pagination) {
                    setHistoryPagination({
                        total: hist.pagination.total || 0,
                        totalPages: hist.pagination.totalPages || 1,
                        hasNextPage: hist.pagination.hasNextPage || false,
                        hasPreviousPage: hist.pagination.hasPreviousPage || false,
                    });
                }
            } else {
                setHistory([]);
            }
        } catch (err) {
            console.error("Failed to load appointments:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpcomingPageChange = (newPage) => {
        setUpcomingPage(newPage);
        // URL will be updated by useEffect
    };

    const handleHistoryPageChange = (newPage) => {
        setHistoryPage(newPage);
        // URL will be updated by useEffect
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // URL will be updated by useEffect
    };

    const handleJoinCall = async (appointment) => {
        setJoiningId(appointment.id);
        try {
            const data = await appointmentService.getVideoToken(appointment.id);
            setVideoData(data);
            setShowVideoCall(true);
        } catch (err) {
            console.error("Failed to get video token:", err);
            alert(err.message || 'Failed to join video call');
        } finally {
            setJoiningId(null);
        }
    };

    const handleEndCall = async () => {
        if (videoData?.appointment?.id) {
            await appointmentService.completeAppointment(videoData.appointment.id).catch(() => {});
        }
        setShowVideoCall(false);
        setVideoData(null);
        loadAppointments();
    };

    const handleCancel = async (appointmentID) => {
        if (!confirm('Cancel this appointment?')) return;
        try {
            await appointmentService.cancelAppointment(appointmentID);
            await loadAppointments();
        } catch (err) {
            console.error("Failed to cancel:", err);
        }
    };

    const handleDecline = async (appointmentID) => {
        if (!confirm('Decline this appointment? The student will be notified.')) return;
        try {
            await appointmentService.declineAppointment(appointmentID);
            await loadAppointments();
        } catch (err) {
            console.error("Failed to decline:", err);
            alert('Failed to decline appointment. Please try again.');
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isJoinable = (appointment) => {
        const now = new Date();
        const apptTime = new Date(appointment.date);
        const diffMs = apptTime.getTime() - now.getTime();
        const diffMin = diffMs / 60000;
        // Allow joining 15 minutes before and during the session
        return diffMin <= 15 && diffMin > -(appointment.duration || 60);
    };

    const getOtherPerson = (appointment) => {
        if (role === 'teacher') return appointment.student;
        return appointment.teacher;
    };

    const handleRateAppointment = (appointment) => {
        setRatingAppointment(appointment);
        setRating(appointment.rating || 0);
        setRatingComment(appointment.ratingComment || '');
    };

    const handleSubmitRating = async () => {
        if (!ratingAppointment || rating === 0) return;
        
        setSubmittingRating(true);
        try {
            await appointmentService.rateAppointment(ratingAppointment.id, rating, ratingComment);
            // Reload appointments to show updated rating
            loadAppointments();
            setRatingAppointment(null);
            setRating(0);
            setRatingComment('');
        } catch (err) {
            console.error('Error rating appointment:', err);
            alert('Failed to submit rating. Please try again.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const currentList = activeTab === 'upcoming' ? appointments : history;

    return (
        <div className="container appointments-page">
            <div className="page-header">
                <div>
                    <h1>My Appointments</h1>
                    <p>{role === 'teacher' ? 'Manage your scheduled sessions' : 'View your booked sessions'}</p>
                </div>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => handleTabChange('upcoming')}
                >
                    Upcoming ({upcomingPagination.total || appointments.length})
                </button>
                {role !== 'parent' && (
                    <button
                        className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => handleTabChange('history')}
                    >
                        History ({historyPagination.total || history.length})
                    </button>
                )}
            </div>

            <div className="appointments-list">
                {loading ? (
                    <div className="card empty-state small"><p>Loading appointments...</p></div>
                ) : currentList.length === 0 ? (
                    <div className="card empty-state">
                        <Calendar size={48} color="#ccc" />
                        <h3>No {activeTab === 'upcoming' ? 'upcoming' : 'past'} appointments</h3>
                        {role === 'student' && activeTab === 'upcoming' && (
                            <p>Book an appointment from the booking page.</p>
                        )}
                    </div>
                ) : (
                    currentList.map(appt => {
                        const other = getOtherPerson(appt);
                        const joinable = activeTab === 'upcoming' && isJoinable(appt);
                        return (
                            <div key={appt.id} className={`card appointment-card ${joinable ? 'joinable' : ''}`}>
                                <div className="appointment-card-left">
                                    <img
                                        src={other?.profileImage || '/default-avatar.png'}
                                        alt={other?.name || 'User'}
                                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                    />
                                    <div className="appointment-info">
                                        <h4>{other?.name || 'Unknown'}</h4>
                                        <span className="role-badge">{role === 'teacher' ? 'Student' : 'Teacher'}</span>
                                        {appt.AppointmentDescription && (
                                            <p className="appointment-desc">{appt.AppointmentDescription}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="appointment-card-center">
                                    <div className="date-time">
                                        <span className="appt-date">
                                            <Calendar size={14} />
                                            {formatDate(appt.date)}
                                        </span>
                                        <span className="appt-time">
                                            <Clock size={14} />
                                            {formatTime(appt.date)} ({appt.duration} min)
                                        </span>
                                    </div>
                                    {activeTab === 'history' && (
                                        <>
                                            <span className={`status-badge ${appt.status}`}>
                                                {appt.status}
                                            </span>
                                            {role === 'student' && appt.status === 'completed' && (
                                                <div className="appointment-rating">
                                                    {appt.rating ? (
                                                        <div className="rating-display">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={16}
                                                                    fill={i < appt.rating ? "#ff9800" : "none"}
                                                                    color="#ff9800"
                                                                />
                                                            ))}
                                                            <span>{appt.rating}/5</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="rate-btn"
                                                            onClick={() => handleRateAppointment(appt)}
                                                        >
                                                            <Star size={14} />
                                                            Rate Appointment
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="appointment-card-actions">
                                    {activeTab === 'upcoming' && (
                                        <>
                                            <button
                                                className={`join-btn ${joinable ? '' : 'disabled'}`}
                                                onClick={() => joinable && handleJoinCall(appt)}
                                                disabled={!joinable || joiningId === appt.id}
                                                title={joinable ? 'Join Video Call' : 'Available 15 min before appointment'}
                                            >
                                                <Video size={16} />
                                                {joiningId === appt.id ? 'Joining...' : 'Join Call'}
                                            </button>
                                            {role === 'student' && (
                                                <button
                                                    className="cancel-btn"
                                                    onClick={() => handleCancel(appt.id)}
                                                >
                                                    <X size={14} />
                                                    Cancel
                                                </button>
                                            )}
                                            {role === 'teacher' && (
                                                <button
                                                    className="decline-btn"
                                                    onClick={() => handleDecline(appt.id)}
                                                >
                                                    <X size={14} />
                                                    Decline
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination for each tab */}
            {!loading && currentList.length > 0 && (
                <Pagination
                    currentPage={activeTab === 'upcoming' ? upcomingPage : historyPage}
                    totalPages={activeTab === 'upcoming' ? upcomingPagination.totalPages : historyPagination.totalPages}
                    hasNextPage={activeTab === 'upcoming' ? upcomingPagination.hasNextPage : historyPagination.hasNextPage}
                    hasPreviousPage={activeTab === 'upcoming' ? upcomingPagination.hasPreviousPage : historyPagination.hasPreviousPage}
                    onPageChange={activeTab === 'upcoming' ? handleUpcomingPageChange : handleHistoryPageChange}
                />
            )}

            {showVideoCall && videoData && (
                <VideoCall
                    channelName={videoData.channelName}
                    appId={videoData.appId}
                    token={videoData.rtcToken}
                    onEndCall={handleEndCall}
                />
            )}

            {/* Rating Modal */}
            {ratingAppointment && (
                <div className="modal-overlay" onClick={() => setRatingAppointment(null)}>
                    <div className="modal-content rating-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Rate Your Appointment</h3>
                        <p>How would you rate your experience with {getOtherPerson(ratingAppointment)?.name}?</p>
                        
                        <div className="rating-stars-input">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={32}
                                    fill={star <= rating ? "#ff9800" : "none"}
                                    color="#ff9800"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>

                        <textarea
                            placeholder="Optional: Add a comment..."
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            rows={4}
                            className="rating-comment"
                        />

                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setRatingAppointment(null);
                                    setRating(0);
                                    setRatingComment('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSubmitRating}
                                disabled={rating === 0 || submittingRating}
                            >
                                {submittingRating ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAppointments;
