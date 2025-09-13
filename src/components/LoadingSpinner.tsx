"use client";
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'white';
  label?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  label 
}: LoadingSpinnerProps) {
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };
  
  const colorClasses = {
    primary: 'border-amber-200 border-t-amber-600',
    accent: 'border-accent-goldLight/30 border-t-accent-gold',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`rounded-full border-4 ${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <p className="mt-3 text-amber-600 text-sm font-medium animate-pulse-slow">
          {label}
        </p>
      )}
    </div>
  );
}