import api from './api';

export const appointmentService = {
    // Student - Browse Teachers
    getTeachersList: async (params = {}) => {
        const response = await api.get('/appointments/student/teachers-list', { params });
        return response.data;
    },

    getTeacherProfile: async (teacherID) => {
        const response = await api.get('/appointments/student/teacher-info', { params: { teacherID } });
        return response.data;
    },

    getTeacherAvailableTimes: async (teacherID, weeks = 2) => {
        const response = await api.get('/appointments/student/teacher-times', { params: { teacherID, weeks } });
        return response.data;
    },

    // Student - Booking
    bookAppointment: async (teacherID, date, startTime, description = '') => {
        const response = await api.post('/appointments/student/appointment', { teacherID, date, startTime, description });
        return response.data;
    },

    cancelAppointment: async (appointmentID) => {
        const response = await api.delete('/appointments/student/appointment', { data: { appointmentID } });
        return response.data;
    },

    // Student - Appointments List
    getActiveAppointments: async (params = {}) => {
        const response = await api.get('/appointments/student/active-appointment-list', { params });
        return response.data;
    },

    getAppointmentHistory: async (params = {}) => {
        const response = await api.get('/appointments/student/appointment-history-list', { params });
        return response.data;
    },

    // Teacher - Appointments List
    getTeacherActiveAppointments: async () => {
        const response = await api.get('/appointments/teacher/active-appointment-list');
        return response.data;
    },

    getTeacherAppointmentHistory: async () => {
        const response = await api.get('/appointments/teacher/appointment-history-list');
        return response.data;
    },

    // Teacher - Availability Management
    getMyAvailability: async (teacherID) => {
        const response = await api.get('/profile/teacher-available-time', { params: { teacherID } });
        return response.data;
    },

    addAvailability: async (data) => {
        const response = await api.post('/profile/teacher-available-time', data);
        return response.data;
    },

    editAvailability: async (data) => {
        const response = await api.post('/profile/teacher-available-time-edit', data);
        return response.data;
    },

    removeAvailability: async (dayID, teacherID) => {
        const response = await api.delete('/profile/teacher-available-time', { data: { dayID, teacherID } });
        return response.data;
    },

    // Parent - Appointments
    getParentActiveAppointments: async () => {
        const response = await api.get('/appointments/parent/active-appointment-list');
        return response.data;
    },

    // Video Call & Completion
    getVideoToken: async (appointmentID) => {
        const response = await api.post('/appointments/video-token', { appointmentID });
        return response.data;
    },

    completeAppointment: async (appointmentID) => {
        const response = await api.post('/appointments/complete', { appointmentID });
        return response.data;
    },

    // Teacher - Decline appointment
    declineAppointment: async (appointmentID) => {
        const response = await api.post('/appointments/teacher/decline', { appointmentID });
        return response.data;
    },

    // Reviews
    getTeacherReviews: async (teacherID, params = {}) => {
        const response = await api.get('/appointments/student/teacher-reviews', { params: { teacherID, ...params } });
        return response.data;
    },

    postReview: async (data) => {
        const response = await api.post('/appointments/student/teacher-review', data);
        return response.data;
    },

    // Rate appointment
    rateAppointment: async (appointmentID, rating, ratingComment = '') => {
        const response = await api.post('/appointments/student/rate', { 
            appointmentID, 
            rating, 
            ratingComment 
        });
        return response.data;
    },
};

export default appointmentService;
