// frontend/src/pages/components/SkeletonLoader.js
import React from 'react';

const SkeletonLoader = ({ type = "card", count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return (
          <div className="skeleton-card">
            <div className="skeleton-header shimmer"></div>
            <div className="skeleton-line shimmer"></div>
            <div className="skeleton-line short shimmer"></div>
            <div className="skeleton-footer shimmer"></div>
          </div>
        );
      
      case "journal-entry":
        return (
          <div className="skeleton-journal-entry">
            <div className="skeleton-avatar shimmer"></div>
            <div className="skeleton-content">
              <div className="skeleton-line shimmer"></div>
              <div className="skeleton-line shimmer"></div>
              <div className="skeleton-line short shimmer"></div>
            </div>
          </div>
        );
      
      case "post":
        return (
          <div className="skeleton-post">
            <div className="skeleton-post-header">
              <div className="skeleton-avatar shimmer"></div>
              <div className="skeleton-post-info">
                <div className="skeleton-line shimmer"></div>
                <div className="skeleton-line short shimmer"></div>
              </div>
            </div>
            <div className="skeleton-post-content">
              <div className="skeleton-line shimmer"></div>
              <div className="skeleton-line shimmer"></div>
              <div className="skeleton-line short shimmer"></div>
            </div>
            <div className="skeleton-post-actions">
              <div className="skeleton-button shimmer"></div>
              <div className="skeleton-button shimmer"></div>
              <div className="skeleton-button shimmer"></div>
            </div>
          </div>
        );
      
      case "graph":
        return (
          <div className="skeleton-graph">
            <div className="skeleton-graph-header shimmer"></div>
            <div className="skeleton-chart shimmer"></div>
            <div className="skeleton-legend shimmer"></div>
          </div>
        );
      
      case "calendar-day":
        return (
          <div className="skeleton-calendar-day shimmer"></div>
        );
      
      default:
        return (
          <div className="skeleton-card">
            <div className="skeleton-line shimmer"></div>
            <div className="skeleton-line shimmer"></div>
          </div>
        );
    }
  };

  return (
    <>
      {Array(count).fill().map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default SkeletonLoader;