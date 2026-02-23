import React from 'react'
import './LoadingSpinner.css'

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'loading-spinner-small',
    medium: 'loading-spinner-medium',
    large: 'loading-spinner-large'
  }

  return (
    <div className={`loading-spinner-container ${sizeClasses[size]} ${className}`}>
      <span className="loading-spinner-dot loading-spinner-dot1" />
      <span className="loading-spinner-dot loading-spinner-dot2" />
    </div>
  )
}

export default LoadingSpinner