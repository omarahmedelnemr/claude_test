import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ChevronLeft, ChevronRight, ArrowUpDown, Calendar, User } from 'lucide-react';
import appointmentService from '../../services/appointmentService';
import './TeacherList.css';

const TeacherList = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('completedCourses');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
    const LIMIT = 12;

    useEffect(() => {
        loadTeachers();
    }, [page, sortBy, sortOrder]);

    const loadTeachers = async (search = searchQuery) => {
        setLoading(true);
        try {
            const result = await appointmentService.getTeachersList({
                searchQuery: search,
                sortBy,
                sortOrder,
                limit: LIMIT,
                loadBlock: page,
            });
            // Backend may return { data: [...], total, ... } or just an array
            if (result && result.data) {
                setTeachers(Array.isArray(result.data) ? result.data : []);
                setPagination({
                    total: result.total || 0,
                    totalPages: result.totalPages || 1,
                    hasNextPage: result.hasNextPage || false,
                    hasPreviousPage: result.hasPreviousPage || false,
                });
            } else {
                setTeachers(Array.isArray(result) ? result : []);
                setPagination({ total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
            }
        } catch (err) {
            console.error("Failed to load teachers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadTeachers(searchQuery);
    };

    const handleSortToggle = () => {
        if (sortBy === 'starRate') {
            setSortBy('completedCourses');
        } else {
            setSortBy('starRate');
        }
        setPage(1);
    };

    const handleBookTeacher = (teacherId) => {
        navigate(`/appointments/book?teacherID=${teacherId}`);
    };

    const renderStars = (rating) => {
        const stars = [];
        const full = Math.floor(rating);
        for (let i = 0; i < 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={14}
                    color="#ff9800"
                    fill={i < full ? "#ff9800" : "none"}
                />
            );
        }
        return stars;
    };

    return (
        <div className="container teacher-list-page">
            <div className="page-header">
                <div>
                    <h1>Our Expert Instructors</h1>
                    <p>Find a teacher and book a session</p>
                </div>
            </div>

            <div className="tl-controls">
                <form className="tl-search card" onSubmit={handleSearch}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search teachers by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>
                <button className="tl-sort-btn" onClick={handleSortToggle} title="Toggle sort">
                    <ArrowUpDown size={16} />
                    {sortBy === 'starRate' ? 'Rating' : 'Experience'}
                </button>
            </div>

            {loading ? (
                <div className="tl-loading">
                    <p>Loading teachers...</p>
                </div>
            ) : teachers.length === 0 ? (
                <div className="tl-empty">
                    <p>No teachers found</p>
                </div>
            ) : (
                <>
                    <div className="tl-grid">
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="card tl-card">
                                <div className="tl-card-top">
                                    <img
                                        src={teacher.profileImage || '/default-avatar.png'}
                                        alt={teacher.name}
                                        className="tl-avatar"
                                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                    />
                                    <div className="tl-card-info">
                                        <h3>{teacher.name}</h3>
                                        {teacher.title && <p className="tl-title">{teacher.title}</p>}
                                        <div className="tl-rating">
                                            {renderStars(teacher.starRate || 0)}
                                            <span className="tl-rating-num">{(teacher.starRate || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>

                                {teacher.description && (
                                    <p className="tl-desc">{teacher.description}</p>
                                )}

                                {teacher.tags?.length > 0 && (
                                    <div className="tl-tags">
                                        {teacher.tags.slice(0, 4).map((t, i) => (
                                            <span key={i} className="tl-tag">{t.tag || t}</span>
                                        ))}
                                        {teacher.tags.length > 4 && (
                                            <span className="tl-tag tl-tag-more">+{teacher.tags.length - 4}</span>
                                        )}
                                    </div>
                                )}

                                <div className="tl-card-actions">
                                    <button className="tl-profile-btn" onClick={() => navigate(`/teachers/${teacher.id}`)}>
                                        <User size={15} />
                                        View Profile
                                    </button>
                                    <button className="tl-book-btn" onClick={() => handleBookTeacher(teacher.id)}>
                                        <Calendar size={15} />
                                        Book
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="tl-pagination">
                            <button
                                disabled={!pagination.hasPreviousPage}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <span className="tl-page-info">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <button
                                disabled={!pagination.hasNextPage}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TeacherList;
