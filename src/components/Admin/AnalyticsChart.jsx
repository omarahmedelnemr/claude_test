import { Loader2 } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';
import './AnalyticsChart.css';

const AnalyticsChart = ({ 
  title, 
  subtitle, 
  loading, 
  error, 
  emptyMessage = 'No data available',
  children,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`analytics-chart-card card ${className}`}>
        <div className="chart-header">
          <h3>{title}</h3>
          {subtitle && <span className="chart-subtitle">{subtitle}</span>}
        </div>
        <div className="chart-loading">
          <Loader2 size={32} className="spinner" />
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`analytics-chart-card card ${className}`}>
        <div className="chart-header">
          <h3>{title}</h3>
          {subtitle && <span className="chart-subtitle">{subtitle}</span>}
        </div>
        <div className="chart-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-chart-card card ${className}`}>
      <div className="chart-header">
        <h3>{title}</h3>
        {subtitle && <span className="chart-subtitle">{subtitle}</span>}
      </div>
      <div className="chart-content">
        {children ? (
          <ResponsiveContainer width="100%" height={300}>
            {children}
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsChart;

