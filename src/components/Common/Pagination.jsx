import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    hasNextPage, 
    hasPreviousPage, 
    onPageChange,
    className = '' 
}) => {
    if (totalPages <= 1) {
        return null;
    }

    const handlePrevious = () => {
        if (hasPreviousPage && currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (hasNextPage && currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className={`pagination ${className}`}>
            <button
                className="pagination-btn"
                disabled={!hasPreviousPage}
                onClick={handlePrevious}
                aria-label="Previous page"
            >
                <ChevronLeft size={16} /> Prev
            </button>
            <span className="pagination-info">
                Page {currentPage} of {totalPages}
            </span>
            <button
                className="pagination-btn"
                disabled={!hasNextPage}
                onClick={handleNext}
                aria-label="Next page"
            >
                Next <ChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;

