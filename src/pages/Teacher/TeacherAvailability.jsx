import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit3, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import appointmentService from '../../services/appointmentService';
import './TeacherAvailability.css';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TeacherAvailability = () => {
    const { currentUser } = useAuth();
    const [availableDays, setAvailableDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDay, setEditingDay] = useState(null);
    const [formData, setFormData] = useState({
        dayName: 'Monday',
        startTime: '09:00',
        endTime: '17:00',
        sessionDuration: 40,
        price: 10
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        try {
            const res = await appointmentService.getMyAvailability(currentUser.id);
            const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
            setAvailableDays(list);
        } catch (err) {
            console.error("Failed to load availability:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime12h = (time24) => {
        const [h, m] = time24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (editingDay) {
                await appointmentService.editAvailability({
                    teacherID: currentUser.id,
                    dayID: editingDay.dayID,
                    dayName: editingDay.dayName,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    sessionDuration: formData.sessionDuration,
                    price: formData.price
                });
            } else {
                await appointmentService.addAvailability({ ...formData, teacherID: currentUser.id });
            }
            setShowForm(false);
            setEditingDay(null);
            setFormData({ dayName: 'Monday', startTime: '09:00', endTime: '17:00', sessionDuration: 40, price: 10 });
            await loadAvailability();
        } catch (err) {
            const msg = typeof err.data === 'string' ? err.data : (err.message || 'Failed to save availability');
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (day) => {
        setEditingDay(day);
        setFormData({
            dayName: day.dayName,
            startTime: day.startTime,
            endTime: day.endTime,
            sessionDuration: day.sessionDuration,
            price: day.price
        });
        setShowForm(true);
    };

    const handleDelete = async (dayID) => {
        if (!confirm('Remove this availability?')) return;
        try {
            await appointmentService.removeAvailability(dayID, currentUser.id);
            await loadAvailability();
        } catch (err) {
            console.error("Failed to remove:", err);
        }
    };

    const calculateSlotCount = (start, end, duration) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
        return Math.floor(totalMinutes / duration);
    };

    return (
        <div className="container availability-page">
            <div className="page-header">
                <div>
                    <h1>Manage Availability</h1>
                    <p>Set your available days and time slots for student appointments</p>
                </div>
                <button onClick={() => { setEditingDay(null); setFormData({ dayName: 'Monday', startTime: '09:00', endTime: '17:00', sessionDuration: 40, price: 10 }); setShowForm(true); }}>
                    <Plus size={18} />
                    Add Availability
                </button>
            </div>

            {showForm && (
                <div className="card availability-form">
                    <div className="form-header">
                        <h3>{editingDay ? 'Edit Availability' : 'Add New Availability'}</h3>
                        <button className="icon-btn" onClick={() => { setShowForm(false); setEditingDay(null); setError(''); }}>
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Day</label>
                                <select
                                    value={formData.dayName}
                                    onChange={(e) => setFormData({ ...formData, dayName: e.target.value })}
                                    disabled={!!editingDay}
                                >
                                    {DAYS_OF_WEEK.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Start Time</label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Time</label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Session Duration (min)</label>
                                <input
                                    type="number"
                                    value={formData.sessionDuration}
                                    onChange={(e) => setFormData({ ...formData, sessionDuration: parseInt(e.target.value) || 30 })}
                                    min="15"
                                    max="120"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Price per Session ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingDay(null); }}>Cancel</button>
                            <button type="submit" disabled={submitting}>
                                <Check size={16} />
                                {submitting ? 'Saving...' : (editingDay ? 'Update' : 'Add')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="availability-list">
                {loading ? (
                    <div className="empty-state"><p>Loading...</p></div>
                ) : availableDays.length === 0 ? (
                    <div className="card empty-state">
                        <Clock size={48} color="#ccc" />
                        <h3>No availability set</h3>
                        <p>Add your available days and time ranges so students can book appointments with you.</p>
                    </div>
                ) : (
                    availableDays.map(day => (
                        <div key={day.dayID} className="card availability-card">
                            <div className="availability-card-header">
                                <div>
                                    <h3>{day.dayName}</h3>
                                    <p className="time-range">
                                        {formatTime12h(day.startTime)} - {formatTime12h(day.endTime)}
                                    </p>
                                </div>
                                <div className="card-actions">
                                    <button className="icon-btn" onClick={() => handleEdit(day)} title="Edit">
                                        <Edit3 size={16} />
                                    </button>
                                    <button className="icon-btn danger" onClick={() => handleDelete(day.dayID)} title="Remove">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="availability-details">
                                <div className="detail-item">
                                    <span className="detail-label">Session</span>
                                    <span className="detail-value">{day.sessionDuration} min</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Price</span>
                                    <span className="detail-value">${Number(day.price).toFixed(2)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Slots/Day</span>
                                    <span className="detail-value">{calculateSlotCount(day.startTime, day.endTime, day.sessionDuration)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TeacherAvailability;
