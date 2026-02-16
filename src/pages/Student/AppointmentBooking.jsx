import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Star, Clock, DollarSign, ArrowLeft, Calendar, Check, ChevronDown } from 'lucide-react';
import appointmentService from '../../services/appointmentService';
import './AppointmentBooking.css';

const AppointmentBooking = () => {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherProfile, setTeacherProfile] = useState(null);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [description, setDescription] = useState('');
    const [booking, setBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState('');
    const [expandedDays, setExpandedDays] = useState({});

    // Group availableTimes by date so multiple ranges on the same day appear together
    const groupedByDate = useMemo(() => {
        const map = {};
        for (const dayGroup of availableTimes) {
            const key = dayGroup.date || dayGroup.fullDate;
            if (!map[key]) {
                map[key] = {
                    date: dayGroup.date,
                    dayName: dayGroup.dayName,
                    fullDate: dayGroup.fullDate,
                    ranges: [],
                    totalSlots: 0,
                };
            }
            map[key].ranges.push({
                sessionDuration: dayGroup.sessionDuration,
                price: dayGroup.price,
                timeSlots: dayGroup.timeSlots,
                rangeLabel: dayGroup.timeSlots.length > 0
                    ? `${dayGroup.timeSlots[0].startTime} ${dayGroup.timeSlots[0].ampm} – ${dayGroup.timeSlots[dayGroup.timeSlots.length - 1].endTime}`
                    : '',
            });
            map[key].totalSlots += dayGroup.timeSlots.length;
        }
        return Object.values(map);
    }, [availableTimes]);

    const toggleDay = (dateKey) => {
        setExpandedDays(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
    };

    const [searchParams] = useSearchParams();

    useEffect(() => {
        const preselectedID = searchParams.get('teacherID');
        if (preselectedID) {
            // Auto-select teacher from query param (coming from TeacherList page)
            handleSelectTeacher({ id: preselectedID, name: '' });
        } else {
            loadTeachers();
        }
    }, []);

    const loadTeachers = async (search = '') => {
        setLoading(true);
        try {
            const result = await appointmentService.getTeachersList({ searchQuery: search, limit: 50 });
            setTeachers(result.data || result || []);
        } catch (err) {
            console.error("Failed to load teachers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTeacher = async (teacher) => {
        setSelectedTeacher(teacher);
        setLoadingSlots(true);
        setError('');
        try {
            const [profile, times] = await Promise.all([
                appointmentService.getTeacherProfile(teacher.id),
                appointmentService.getTeacherAvailableTimes(teacher.id, 4)
            ]);
            setTeacherProfile(profile);
            // Fill in teacher data from profile if we only had an ID (e.g. from URL param)
            if (!teacher.name && profile) {
                setSelectedTeacher({ ...teacher, name: profile.name, profileImage: profile.profileImage, starRate: profile.starRate });
            }
            const timesArr = Array.isArray(times) ? times : [];
            setAvailableTimes(timesArr);
            // Auto-expand the first day
            if (timesArr.length > 0) {
                const firstKey = timesArr[0].date || timesArr[0].fullDate;
                setExpandedDays({ [firstKey]: true });
            }
        } catch (err) {
            console.error("Failed to load teacher details:", err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleBook = async () => {
        if (!selectedSlot || !selectedTeacher) return;
        setBooking(true);
        setError('');
        try {
            // Convert slot's 12h time to 24h for the API
            const startTime24 = convertTo24h(selectedSlot.startTime, selectedSlot.ampm);
            await appointmentService.bookAppointment(
                selectedTeacher.id,
                selectedSlot.date,
                startTime24,
                description
            );
            setBookingSuccess(true);
            setSelectedSlot(null);
            setDescription('');
        } catch (err) {
            setError(err.message || err.data || 'Failed to book appointment');
        } finally {
            setBooking(false);
        }
    };

    const convertTo24h = (time12, ampm) => {
        const [h, m] = time12.split(':').map(Number);
        let h24 = h;
        if (ampm === 'PM' && h !== 12) h24 = h + 12;
        if (ampm === 'AM' && h === 12) h24 = 0;
        return `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadTeachers(searchQuery);
    };

    const handleBack = () => {
        setSelectedTeacher(null);
        setTeacherProfile(null);
        setAvailableTimes([]);
        setSelectedSlot(null);
        setBookingSuccess(false);
        setError('');
        // If we came from URL param, load the teachers list now
        if (teachers.length === 0) loadTeachers();
    };

    // Teacher Detail + Slot Selection View
    if (selectedTeacher) {
        return (
            <div className="container booking-page">
                <button className="back-btn" onClick={handleBack}>
                    <ArrowLeft size={18} />
                    Back to Teachers
                </button>

                {bookingSuccess && (
                    <div className="success-banner card">
                        <Check size={24} />
                        <div>
                            <h4>Appointment Booked!</h4>
                            <p>Your appointment has been scheduled. View it in your appointments list.</p>
                        </div>
                    </div>
                )}

                {/* Teacher Profile Header */}
                <div className="card teacher-profile-header">
                    <img
                        src={selectedTeacher.profileImage || '/default-avatar.png'}
                        alt={selectedTeacher.name}
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                    />
                    <div className="teacher-profile-info">
                        <h2>{selectedTeacher.name}</h2>
                        {teacherProfile?.description && <p>{teacherProfile.description}</p>}
                        <div className="teacher-meta">
                            <span className="meta-item">
                                <Star size={16} color="#ff9800" />
                                {selectedTeacher.starRate?.toFixed(1) || '0.0'}
                            </span>
                            {teacherProfile?.tags?.map((tag, i) => (
                                <span key={i} className="tag-badge">{tag.tag || tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Available Time Slots */}
                <h3 className="section-title">Available Time Slots</h3>
                {loadingSlots ? (
                    <div className="card empty-state small"><p>Loading available slots...</p></div>
                ) : groupedByDate.length === 0 ? (
                    <div className="card empty-state small">
                        <Calendar size={40} color="#ccc" />
                        <p>No available time slots for this teacher</p>
                    </div>
                ) : (
                    <div className="dates-accordion">
                        {groupedByDate.map((group) => {
                            const key = group.date || group.fullDate;
                            const isOpen = !!expandedDays[key];
                            return (
                                <div key={key} className={`accordion-item card ${isOpen ? 'open' : ''}`}>
                                    <button
                                        className="accordion-header"
                                        onClick={() => toggleDay(key)}
                                    >
                                        <div className="accordion-day-info">
                                            <span className="accordion-day-name">{group.dayName}</span>
                                            <span className="accordion-date">{group.fullDate}</span>
                                        </div>
                                        <div className="accordion-right">
                                            <span className="accordion-slot-count">
                                                {group.totalSlots} slot{group.totalSlots !== 1 ? 's' : ''}
                                            </span>
                                            <ChevronDown size={18} className={`accordion-chevron ${isOpen ? 'rotated' : ''}`} />
                                        </div>
                                    </button>
                                    {isOpen && (
                                        <div className="accordion-body">
                                            {group.ranges.map((range, ri) => (
                                                <div key={ri} className="time-range-section">
                                                    <div className="range-header">
                                                        <span className="range-label">{range.rangeLabel}</span>
                                                        <div className="range-meta">
                                                            <span><Clock size={13} /> {range.sessionDuration} min</span>
                                                            <span><DollarSign size={13} /> ${Number(range.price).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="slots-grid">
                                                        {range.timeSlots.map((slot, si) => (
                                                            <button
                                                                key={si}
                                                                className={`slot-btn ${selectedSlot?.dateTime === slot.dateTime ? 'selected' : ''}`}
                                                                onClick={() => setSelectedSlot(slot)}
                                                            >
                                                                <span className="slot-time">{slot.startTime}</span>
                                                                <span className="slot-ampm">{slot.ampm}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Booking Confirmation */}
                {selectedSlot && (
                    <div className="card booking-confirm">
                        <h3>Confirm Booking</h3>
                        <div className="booking-summary">
                            <p><strong>Teacher:</strong> {selectedTeacher.name}</p>
                            <p><strong>Date:</strong> {selectedSlot.date}</p>
                            <p><strong>Time:</strong> {selectedSlot.startTime} {selectedSlot.ampm} - {selectedSlot.endTime}</p>
                            <p><strong>Duration:</strong> {selectedSlot.duration} minutes</p>
                        </div>
                        <div className="form-group">
                            <label>Description (optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What would you like to discuss?"
                                maxLength={500}
                                rows={3}
                            />
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setSelectedSlot(null)}>Cancel</button>
                            <button onClick={handleBook} disabled={booking}>
                                {booking ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Teachers List View
    return (
        <div className="container booking-page">
            <div className="page-header">
                <div>
                    <h1>Book an Appointment</h1>
                    <p>Find a teacher and schedule a session</p>
                </div>
            </div>

            <form className="search-bar card" onSubmit={handleSearch}>
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Search teachers by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>

            <div className="teachers-grid">
                {loading ? (
                    <div className="empty-state"><p>Loading teachers...</p></div>
                ) : teachers.length === 0 ? (
                    <div className="empty-state">
                        <p>No teachers found</p>
                    </div>
                ) : (
                    teachers.map(teacher => (
                        <div key={teacher.id} className="card teacher-card" onClick={() => handleSelectTeacher(teacher)}>
                            <img
                                src={teacher.profileImage || '/default-avatar.png'}
                                alt={teacher.name}
                                className="teacher-avatar"
                                onError={(e) => { e.target.src = '/default-avatar.png'; }}
                            />
                            <div className="teacher-card-info">
                                <h3>{teacher.name}</h3>
                                <div className="teacher-card-meta">
                                    <span className="rating">
                                        <Star size={14} color="#ff9800" fill="#ff9800" />
                                        {teacher.starRate?.toFixed(1) || '0.0'}
                                    </span>
                                    <span>{teacher.completedCourses || 0} courses</span>
                                </div>
                                {teacher.tags?.length > 0 && (
                                    <div className="teacher-tags">
                                        {teacher.tags.slice(0, 3).map((t, i) => (
                                            <span key={i} className="tag-badge">{t.tag || t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AppointmentBooking;
