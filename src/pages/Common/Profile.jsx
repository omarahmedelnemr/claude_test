import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';
import FileUpload from '../../components/Common/FileUpload';
import { Edit2, Save, X, Loader2, BookMarked } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    title: '',
    description: '',
    expertise: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getMainInfo();
      setProfileData(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        bio: data.bio || data.description || '',
        title: data.title || '',
        description: data.description || '',
        expertise: data.tags?.map(t => t.name || t).join(', ') || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
      // Fallback to currentUser from context
      if (currentUser) {
        setProfileData(currentUser);
        setFormData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          bio: currentUser.bio || '',
          title: currentUser.title || '',
          description: currentUser.description || '',
          expertise: currentUser.expertise?.join(', ') || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data from backend
  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Update name
      if (formData.name !== profileData?.name) {
        await profileService.updateName(formData.name);
      }

      // Update teacher-specific fields
      if (currentUser?.role === 'teacher') {
        if (formData.title !== profileData?.title) {
          await profileService.updateTeacherTitle(formData.title);
        }
        if (formData.description !== profileData?.description) {
          await profileService.updateTeacherDescription(formData.description);
        }
      }

      // Refresh profile data
      const updatedData = await profileService.getMainInfo();
      setProfileData(updatedData);
      
      // Update context
      await updateProfile(updatedData);
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData?.name || currentUser?.name || '',
      email: profileData?.email || currentUser?.email || '',
      bio: profileData?.bio || profileData?.description || currentUser?.bio || '',
      title: profileData?.title || currentUser?.title || '',
      description: profileData?.description || currentUser?.description || '',
      expertise: profileData?.tags?.map(t => t.name || t).join(', ') || currentUser?.expertise?.join(', ') || ''
    });
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="container profile-page">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Loading profile information...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader2 size={32} className="spinner" />
        </div>
      </div>
    );
  }

  const displayUser = profileData || currentUser;

  return (
    <div className="container profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your personal information</p>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1rem 0', padding: '1rem', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="card profile-avatar-section">
            <div className="avatar-upload-container">
              <img 
                src={displayUser?.profileImage || displayUser?.avatar || '/default-avatar.png'} 
                alt={displayUser?.name} 
                className="profile-avatar" 
              />
              <div className="avatar-upload-overlay">
                <FileUpload
                  uploadType="profilePic"
                  accept="image/*"
                  maxSize={2}
                  label="Change Photo"
                  onUploadComplete={async (file) => {
                    if (file && file.url) {
                      try {
                        setSaving(true);
                        await profileService.updateProfileImage(file.url);
                        await fetchProfile();
                        await updateProfile({ profileImage: file.url });
                        alert('Profile picture updated successfully!');
                      } catch (err) {
                        setError('Failed to update profile picture');
                      } finally {
                        setSaving(false);
                      }
                    }
                  }}
                  showPreview={false}
                  className="avatar-upload-btn"
                />
              </div>
            </div>
            <h2>{displayUser?.name}</h2>
            <span className="role-badge">{displayUser?.role}</span>
            {displayUser?.title && <p className="title">{displayUser.title}</p>}
          </div>

          {/* Saved Posts Link */}
          <div className="card profile-actions">
            <Link to="/saved-posts" className="profile-action-link">
              <BookMarked size={20} />
              <span>Saved Posts</span>
            </Link>
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
                  <button onClick={handleCancel} className="secondary" disabled={saving}>
                    <X size={18} />
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 size={18} className="spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
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
                <>
                  <div className="form-group">
                    <label htmlFor="title">Professional Title</label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Professor, Instructor"
                      />
                    ) : (
                      <p className="form-value">{displayUser?.title || 'No title provided'}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Professional Description</label>
                    {isEditing ? (
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Tell us about your teaching experience"
                      />
                    ) : (
                      <p className="form-value">{displayUser?.description || 'No description provided'}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="expertise">Expertise/Tags (comma-separated)</label>
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
                        {displayUser?.tags?.map((tag, idx) => (
                          <span key={idx} className="skill-tag">{tag.name || tag}</span>
                        )) || <p className="form-value">No expertise listed</p>}
                      </div>
                    )}
                  </div>
                </>
              )}
            </form>
          </div>

          {currentUser?.role === 'student' && (
            <div className="card">
              <h3>My Stats</h3>
              <div className="stats-row">
                <div className="stat-item">
                  <strong>{displayUser?.enrolledCourses?.length || 0}</strong>
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
