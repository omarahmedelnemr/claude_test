import { useState } from 'react';
import { Link } from 'react-router-dom';
import { courses, users } from '../../data/mockData';
import { Search, Filter } from 'lucide-react';
import './CourseList.css';

const CourseList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const categories = ['all', ...new Set(courses.map(c => c.category))];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1>Explore Courses</h1>
        <p>Discover and enroll in courses taught by expert instructors</p>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            {levels.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'All Levels' : level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-info">
        <p>Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="course-grid">
        {filteredCourses.map(course => {
          const teacher = users.find(u => u.id === course.teacherId);
          return (
            <div key={course.id} className="course-card">
              <Link to={`/courses/${course.id}`}>
                <img src={course.thumbnail} alt={course.title} />
              </Link>
              <div className="course-content">
                <div className="course-meta">
                  <span className="category-badge">{course.category}</span>
                  <span className="level-badge">{course.level}</span>
                </div>
                <Link to={`/courses/${course.id}`}>
                  <h3>{course.title}</h3>
                </Link>
                <p className="course-description">{course.description}</p>
                <div className="teacher-info">
                  <img src={teacher?.avatar} alt={teacher?.name} />
                  <span>{teacher?.name}</span>
                </div>
                <div className="course-stats">
                  <div>
                    <span className="rating">⭐ {course.rating}</span>
                    <span className="students">{course.studentsEnrolled.toLocaleString()} students</span>
                  </div>
                  <span className="price">${course.price}</span>
                </div>
                <Link to={`/courses/${course.id}`} className="enroll-btn">
                  View Course
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseList;
