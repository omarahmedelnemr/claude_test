import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, File } from 'lucide-react';
import uploadService from '../../services/uploadService';
import './FileUpload.css';

/**
 * Reusable File Upload Component
 * @param {Object} props
 * @param {Function} props.onUploadComplete - Callback when upload is complete (receives file URL)
 * @param {string} props.uploadType - Type of upload: 'file', 'profilePic', 'lectureRecording', 'homeworkFile', 'lectureContent'
 * @param {string} props.accept - File types to accept (e.g., 'image/*', 'video/*', '.pdf')
 * @param {number} props.maxSize - Maximum file size in MB
 * @param {boolean} props.multiple - Allow multiple file uploads
 * @param {string} props.label - Button label
 * @param {string} props.className - Additional CSS classes
 */
const FileUpload = ({
  onUploadComplete,
  uploadType = 'file',
  accept = 'image/*',
  maxSize = 10, // MB
  multiple = false,
  label = 'Upload File',
  className = '',
  showPreview = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds maximum size of ${maxSize}MB`);
        }

        // Upload based on type
        let url;
        switch (uploadType) {
          case 'profilePic':
            url = await uploadService.uploadProfilePic(file);
            break;
          case 'lectureRecording':
            const lectureData = await uploadService.uploadLectureRecording(file);
            url = lectureData.url;
            break;
          case 'homeworkFile':
            const homeworkData = await uploadService.uploadHomeworkFile(file);
            url = homeworkData.url;
            break;
          case 'lectureContent':
            const contentData = await uploadService.uploadLectureContent(file);
            url = contentData.url;
            break;
          default:
            url = await uploadService.uploadFile(file);
        }

        return {
          name: file.name,
          url: url,
          size: file.size,
          type: file.type,
        };
      });

      const uploaded = await Promise.all(uploadPromises);
      const newFiles = multiple ? [...uploadedFiles, ...uploaded] : uploaded;
      setUploadedFiles(newFiles);

      // Call callback with uploaded file(s)
      if (onUploadComplete) {
        if (multiple) {
          onUploadComplete(newFiles);
        } else {
          onUploadComplete(uploaded[0]);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (onUploadComplete) {
      if (multiple) {
        onUploadComplete(newFiles);
      } else {
        onUploadComplete(null);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-upload-container ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploading}
        className="file-upload-button"
      >
        {uploading ? (
          <>
            <Loader2 size={18} className="spinner" />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={18} />
            {label}
          </>
        )}
      </button>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {showPreview && uploadedFiles.length > 0 && (
        <div className="uploaded-files-preview">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="uploaded-file-item">
              {file.type?.startsWith('image/') ? (
                <div className="file-preview-image">
                  <img src={file.url} alt={file.name} />
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="remove-file-btn"
                    title="Remove"
                    aria-label="Remove image"
                  >
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <div className="file-preview-document">
                  <File size={24} />
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="remove-file-btn"
                    title="Remove"
                    aria-label="Remove file"
                  >
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

