import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';
import courseService from '../../services/courseService';
import FileUpload from '../../components/Common/FileUpload';
import { Edit2, Save, X, Loader2, BookMarked, Plus, Trash2, GraduationCap, Briefcase, Award, Users } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  
  // Teacher-specific data
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddCertificate, setShowAddCertificate] = useState(false);
  const [newEducationTitle, setNewEducationTitle] = useState('');
  const [newExperienceTitle, setNewExperienceTitle] = useState('');
  const [newCertificateTitle, setNewCertificateTitle] = useState('');
  
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

      // Fetch student enrollments for stats
      if (currentUser?.role === 'student' && currentUser?.id) {
        try {
          const enrollmentsResponse = await courseService.getStudentEnrollments({
            studentID: currentUser.id,
            status: 'enrolled',
            limit: 1000,
            loadBlock: 1
          });
          const enrollments = Array.isArray(enrollmentsResponse) 
            ? enrollmentsResponse 
            : enrollmentsResponse?.data || enrollmentsResponse?.enrollments || [];
          setEnrolledCoursesCount(enrollments.length || 0);
        } catch (err) {
          console.error('Error fetching enrollments:', err);
          setEnrolledCoursesCount(0);
        }
      }

      // Fetch teacher education, experience, and certificates
      if (currentUser?.role === 'teacher' && currentUser?.id) {
        try {
          const [eduRes, expRes, certRes] = await Promise.all([
            profileService.getTeacherEducation(currentUser.id),
            profileService.getTeacherExperience(currentUser.id),
            profileService.getTeacherCertificates(currentUser.id)
          ]);
          setEducation(Array.isArray(eduRes) ? eduRes : eduRes?.data || []);
          setExperience(Array.isArray(expRes) ? expRes : expRes?.data || []);
          setCertificates(Array.isArray(certRes) ? certRes : certRes?.data || []);
        } catch (err) {
          console.error('Error fetching teacher records:', err);
        }
      }
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

      // Update bio (for both Student and Teacher)
      if (formData.bio !== (profileData?.bio || '')) {
        await profileService.updateBio(formData.bio);
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
    setShowAddEducation(false);
    setShowAddExperience(false);
    setShowAddCertificate(false);
    setNewEducationTitle('');
    setNewExperienceTitle('');
    setNewCertificateTitle('');
  };

  // Helper function to fetch only teacher records (without refetching entire profile)
  const fetchTeacherRecords = async () => {
    if (currentUser?.role === 'teacher' && currentUser?.id) {
      try {
        const [eduRes, expRes, certRes] = await Promise.all([
          profileService.getTeacherEducation(currentUser.id),
          profileService.getTeacherExperience(currentUser.id),
          profileService.getTeacherCertificates(currentUser.id)
        ]);
        setEducation(Array.isArray(eduRes) ? eduRes : eduRes?.data || []);
        setExperience(Array.isArray(expRes) ? expRes : expRes?.data || []);
        setCertificates(Array.isArray(certRes) ? certRes : certRes?.data || []);
      } catch (err) {
        console.error('Error fetching teacher records:', err);
      }
    }
  };

  // Teacher record management handlers
  const handleAddEducation = async () => {
    if (!newEducationTitle.trim()) {
      alert('Please enter an education title');
      return;
    }
    try {
      setSaving(true);
      await profileService.addTeacherEducation(currentUser.id, newEducationTitle);
      
      // Fetch only the education list to update
      const eduRes = await profileService.getTeacherEducation(currentUser.id);
      setEducation(Array.isArray(eduRes) ? eduRes : eduRes?.data || []);
      setNewEducationTitle('');
      setShowAddEducation(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add education record');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (recordID) => {
    if (!confirm('Are you sure you want to delete this education record?')) return;
    try {
      setSaving(true);
      await profileService.deleteTeacherEducation(currentUser.id, recordID);
      
      // Update local state immediately without refetching
      setEducation(education.filter(edu => edu.id !== recordID));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete education record');
      // If deletion fails, refetch the list
      await fetchTeacherRecords();
    } finally {
      setSaving(false);
    }
  };

  const handleAddExperience = async () => {
    if (!newExperienceTitle.trim()) {
      alert('Please enter an experience title');
      return;
    }
    try {
      setSaving(true);
      await profileService.addTeacherExperience(currentUser.id, newExperienceTitle);
      
      // Fetch only the experience list to update
      const expRes = await profileService.getTeacherExperience(currentUser.id);
      setExperience(Array.isArray(expRes) ? expRes : expRes?.data || []);
      setNewExperienceTitle('');
      setShowAddExperience(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add experience record');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExperience = async (recordID) => {
    if (!confirm('Are you sure you want to delete this experience record?')) return;
    try {
      setSaving(true);
      await profileService.deleteTeacherExperience(currentUser.id, recordID);
      
      // Update local state immediately without refetching
      setExperience(experience.filter(exp => exp.id !== recordID));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete experience record');
      // If deletion fails, refetch the list
      await fetchTeacherRecords();
    } finally {
      setSaving(false);
    }
  };

  const handleAddCertificate = async () => {
    if (!newCertificateTitle.trim()) {
      alert('Please enter a certificate title');
      return;
    }
    try {
      setSaving(true);
      await profileService.addTeacherCertificate(currentUser.id, newCertificateTitle);
      
      // Fetch only the certificates list to update
      const certRes = await profileService.getTeacherCertificates(currentUser.id);
      setCertificates(Array.isArray(certRes) ? certRes : certRes?.data || []);
      setNewCertificateTitle('');
      setShowAddCertificate(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add certificate record');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCertificate = async (recordID) => {
    if (!confirm('Are you sure you want to delete this certificate record?')) return;
    try {
      setSaving(true);
      await profileService.deleteTeacherCertificate(currentUser.id, recordID);
      
      // Update local state immediately without refetching
      setCertificates(certificates.filter(cert => cert.id !== recordID));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete certificate record');
      // If deletion fails, refetch the list
      await fetchTeacherRecords();
    } finally {
      setSaving(false);
    }
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

          {/* Profile Actions */}
          <div className="card profile-actions">
            <Link to="/saved-posts" className="profile-action-link">
              <BookMarked size={20} />
              <span>Saved Posts</span>
            </Link>
            {currentUser?.role === 'student' && (
              <Link to="/parent-invitations" className="profile-action-link">
                <Users size={20} />
                <span>Parent Connection</span>
              </Link>
            )}
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
                    maxLength={500}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="form-value">{displayUser?.bio || profileData?.bio || 'No bio provided'}</p>
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
                  <strong>{enrolledCoursesCount}</strong>
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

          {currentUser?.role === 'teacher' && (
            <>
              {/* Education Section */}
              <div className="card">
                <div className="card-header">
                  <h3><GraduationCap size={20} /> Education</h3>
                  <button 
                    onClick={() => setShowAddEducation(!showAddEducation)} 
                    className="edit-btn"
                    disabled={saving}
                  >
                    <Plus size={18} />
                    Add Education
                  </button>
                </div>
                {showAddEducation && (
                  <div className="form-group" style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                    <input
                      type="text"
                      placeholder="e.g., Bachelor's in Computer Science"
                      value={newEducationTitle}
                      onChange={(e) => setNewEducationTitle(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleAddEducation} disabled={saving} className="edit-btn">
                        Save
                      </button>
                      <button onClick={() => { setShowAddEducation(false); setNewEducationTitle(''); }} className="secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {education.length === 0 ? (
                  <p className="form-value" style={{ color: '#999' }}>No education records yet</p>
                ) : (
                  <div className="info-list">
                    {education.map((edu) => (
                      <div key={edu.id} className="info-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                        <span><GraduationCap size={16} style={{ marginRight: '0.5rem' }} />{edu.title}</span>
                        <button 
                          onClick={() => handleDeleteEducation(edu.id)} 
                          className="delete-btn"
                          disabled={saving}
                          style={{ background: 'none', border: 'none', color: '#c33', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience Section */}
              <div className="card">
                <div className="card-header">
                  <h3><Briefcase size={20} /> Experience</h3>
                  <button 
                    onClick={() => setShowAddExperience(!showAddExperience)} 
                    className="edit-btn"
                    disabled={saving}
                  >
                    <Plus size={18} />
                    Add Experience
                  </button>
                </div>
                {showAddExperience && (
                  <div className="form-group" style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                    <input
                      type="text"
                      placeholder="e.g., Senior Software Engineer at Tech Corp"
                      value={newExperienceTitle}
                      onChange={(e) => setNewExperienceTitle(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleAddExperience} disabled={saving} className="edit-btn">
                        Save
                      </button>
                      <button onClick={() => { setShowAddExperience(false); setNewExperienceTitle(''); }} className="secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {experience.length === 0 ? (
                  <p className="form-value" style={{ color: '#999' }}>No experience records yet</p>
                ) : (
                  <div className="info-list">
                    {experience.map((exp) => (
                      <div key={exp.id} className="info-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                        <span><Briefcase size={16} style={{ marginRight: '0.5rem' }} />{exp.title}</span>
                        <button 
                          onClick={() => handleDeleteExperience(exp.id)} 
                          className="delete-btn"
                          disabled={saving}
                          style={{ background: 'none', border: 'none', color: '#c33', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificates Section */}
              <div className="card">
                <div className="card-header">
                  <h3><Award size={20} /> Certificates</h3>
                  <button 
                    onClick={() => setShowAddCertificate(!showAddCertificate)} 
                    className="edit-btn"
                    disabled={saving}
                  >
                    <Plus size={18} />
                    Add Certificate
                  </button>
                </div>
                {showAddCertificate && (
                  <div className="form-group" style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                    <input
                      type="text"
                      placeholder="e.g., AWS Certified Solutions Architect"
                      value={newCertificateTitle}
                      onChange={(e) => setNewCertificateTitle(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleAddCertificate} disabled={saving} className="edit-btn">
                        Save
                      </button>
                      <button onClick={() => { setShowAddCertificate(false); setNewCertificateTitle(''); }} className="secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {certificates.length === 0 ? (
                  <p className="form-value" style={{ color: '#999' }}>No certificate records yet</p>
                ) : (
                  <div className="info-list">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="info-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                        <span><Award size={16} style={{ marginRight: '0.5rem' }} />{cert.title}</span>
                        <button 
                          onClick={() => handleDeleteCertificate(cert.id)} 
                          className="delete-btn"
                          disabled={saving}
                          style={{ background: 'none', border: 'none', color: '#c33', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
