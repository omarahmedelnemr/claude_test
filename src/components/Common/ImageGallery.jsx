import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './ImageGallery.css';

/**
 * Image Gallery Modal Component
 * Displays images in a full-screen modal with navigation
 */
const ImageGallery = ({ images, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose, handlePrevious, handleNext]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageUrl = currentImage?.link || currentImage?.url || currentImage;

  return (
    <div className="image-gallery-overlay" onClick={onClose}>
      <div className="image-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <button className="image-gallery-close" onClick={onClose} aria-label="Close gallery">
          <X size={24} />
        </button>

        {images.length > 1 && (
          <>
            <button
              className="image-gallery-nav image-gallery-prev"
              onClick={handlePrevious}
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="image-gallery-nav image-gallery-next"
              onClick={handleNext}
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        <div className="image-gallery-main">
          <img src={imageUrl} alt={currentImage?.name || `Image ${currentIndex + 1}`} />
        </div>

        {images.length > 1 && (
          <div className="image-gallery-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {images.length > 1 && (
          <div className="image-gallery-thumbnails">
            {images.map((img, idx) => (
              <button
                key={idx}
                className={`image-gallery-thumbnail ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <img src={img?.link || img?.url || img} alt={`Thumbnail ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;

