import React from 'react';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
