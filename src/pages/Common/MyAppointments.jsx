import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Video, X, User } from 'lucide-react';
import appointmentService from '../../services/appointmentService';
import VideoCall from '../../components/Common/VideoCall';
import './MyAppointments.css';

const MyAppointments = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [appointments, setAppointments] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [joiningId, setJoiningId] = useState(null);

    const role = currentUser?.role;

    useEffect(() => {
        loadAppointments();
    }, [role]);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            let active, hist;
            if (role === 'teacher') {
                active = await appointmentService.getTeacherActiveAppointments();
                hist = await appointmentService.getTeacherAppointmentHistory();
            } else if (role === 'parent') {
                active = await appointmentService.getParentActiveAppointments();
                hist = [];
            } else {
                active = await appointmentService.getActiveAppointments();
                hist = await appointmentService.getAppointmentHistory();
            }
            setAppointments(Array.isArray(active) ? active : []);
            setHistory(Array.isArray(hist) ? hist : []);
        } catch (err) {
            console.error("Failed to load appointments:", err);
        } finally {
            setLoading(false);
        }
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
                    onClick={() => setActiveTab('upcoming')}
                >
                    Upcoming ({appointments.length})
                </button>
                {role !== 'parent' && (
                    <button
                        className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History ({history.length})
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
                                        <span className={`status-badge ${appt.status}`}>
                                            {appt.status}
                                        </span>
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
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showVideoCall && videoData && (
                <VideoCall
                    channelName={videoData.channelName}
                    appId={videoData.appId}
                    token={videoData.rtcToken}
                    onEndCall={handleEndCall}
                />
            )}
        </div>
    );
};

export default MyAppointments;
