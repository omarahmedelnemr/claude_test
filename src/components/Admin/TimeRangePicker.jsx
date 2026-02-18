import { useState, useEffect } from 'react';
import './TimeRangePicker.css';

const TimeRangePicker = ({ fromDate, toDate, onChange, className = '' }) => {
  const [localFromDate, setLocalFromDate] = useState(fromDate || '');
  const [localToDate, setLocalToDate] = useState(toDate || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalFromDate(fromDate || '');
    setLocalToDate(toDate || '');
  }, [fromDate, toDate]);

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    setLocalFromDate(newFromDate);
    setError('');

    if (newFromDate && localToDate && newFromDate > localToDate) {
      setError('From date must be before To date');
      return;
    }

    if (onChange) {
      onChange(newFromDate, localToDate);
    }
  };

  const handleToDateChange = (e) => {
    const newToDate = e.target.value;
    setLocalToDate(newToDate);
    setError('');

    if (localFromDate && newToDate && localFromDate > newToDate) {
      setError('From date must be before To date');
      return;
    }

    if (onChange) {
      onChange(localFromDate, newToDate);
    }
  };

  const setPreset = (days) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    
    const fromStr = from.toISOString().split('T')[0];
    const toStr = today.toISOString().split('T')[0];
    
    setLocalFromDate(fromStr);
    setLocalToDate(toStr);
    setError('');
    
    if (onChange) {
      onChange(fromStr, toStr);
    }
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Otherwise, parse and format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={`time-range-picker ${className}`}>
      <div className="time-range-controls">
        <div className="date-input-group">
          <label htmlFor="from-date">From:</label>
          <input
            id="from-date"
            type="date"
            value={formatDateForInput(localFromDate)}
            onChange={handleFromDateChange}
            className="date-input"
          />
        </div>
        <div className="date-input-group">
          <label htmlFor="to-date">To:</label>
          <input
            id="to-date"
            type="date"
            value={formatDateForInput(localToDate)}
            onChange={handleToDateChange}
            className="date-input"
          />
        </div>
      </div>
      
      <div className="preset-buttons">
        <button type="button" onClick={() => setPreset(7)} className="preset-btn">
          Last 7 Days
        </button>
        <button type="button" onClick={() => setPreset(30)} className="preset-btn">
          Last 30 Days
        </button>
        <button type="button" onClick={() => setPreset(90)} className="preset-btn">
          Last 3 Months
        </button>
        <button type="button" onClick={() => setPreset(365)} className="preset-btn">
          Last Year
        </button>
      </div>

      {error && <div className="date-error">{error}</div>}
    </div>
  );
};

export default TimeRangePicker;

