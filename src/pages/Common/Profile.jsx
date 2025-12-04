import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Edit2, Save, X } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    expertise: currentUser?.expertise?.join(', ') || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = {
      ...formData,
      expertise: currentUser?.role === 'teacher'
        ? formData.expertise.split(',').map(s => s.trim()).filter(Boolean)
        : currentUser?.expertise
    };
    updateProfile(updatedData);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      bio: currentUser?.bio || '',
      expertise: currentUser?.expertise?.join(', ') || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="container profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your personal information</p>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="card profile-avatar-section">
            <img src={currentUser?.avatar} alt={currentUser?.name} className="profile-avatar" />
            <h2>{currentUser?.name}</h2>
            <span className="role-badge">{currentUser?.role}</span>
            <p className="join-date">Member since {currentUser?.joinDate}</p>
          </div>
        </div>

        <div className="profile-main">
          <div className="card">
            <div className="card-header">
              <h3>Personal Information</h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="edit-btn">
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button onClick={handleCancel} className="secondary">
                    <X size={18} />
                    Cancel
                  </button>
                  <button onClick={handleSubmit}>
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <p className="form-value">{currentUser?.name}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <p className="form-value">{currentUser?.email}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                {isEditing ? (
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                  />
                ) : (
                  <p className="form-value">{currentUser?.bio || 'No bio provided'}</p>
                )}
              </div>

              {currentUser?.role === 'teacher' && (
                <div className="form-group">
                  <label htmlFor="expertise">Expertise (comma-separated)</label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="expertise"
                      name="expertise"
                      value={formData.expertise}
                      onChange={handleChange}
                      placeholder="JavaScript, React, Node.js"
                    />
                  ) : (
                    <div className="expertise-display">
                      {currentUser?.expertise?.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      )) || <p className="form-value">No expertise listed</p>}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {currentUser?.role === 'student' && currentUser?.enrolledCourses && (
            <div className="card">
              <h3>My Stats</h3>
              <div className="stats-row">
                <div className="stat-item">
                  <strong>{currentUser.enrolledCourses.length}</strong>
                  <span>Enrolled Courses</span>
                </div>
                <div className="stat-item">
                  <strong>0</strong>
                  <span>Certificates Earned</span>
                </div>
                <div className="stat-item">
                  <strong>0</strong>
                  <span>Hours Learned</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
