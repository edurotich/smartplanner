"use client";
import { ReactNode } from 'react';

interface AnimatedElementProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-in-right' | 'scale' | 'float' | 'pulse-slow';
  delay?: number; // in milliseconds
  duration?: number; // in milliseconds
  className?: string;
}

export default function AnimatedElement({ 
  children, 
  animation = 'fade-in', 
  delay = 0, 
  duration = 500,
  className = '' 
}: AnimatedElementProps) {
  
  const getAnimationClass = () => {
    switch(animation) {
      case 'fade-in': return 'animate-fade-in';
      case 'slide-up': return 'animate-slide-up';
      case 'slide-down': return 'animate-slide-down';
      case 'slide-in-right': return 'animate-slide-in-right';
      case 'scale': return 'animate-scale';
      case 'float': return 'animate-float';
      case 'pulse-slow': return 'animate-pulse-slow';
      default: return 'animate-fade-in';
    }
  };

  return (
    <div 
      className={`${getAnimationClass()} ${className}`}
      style={{ 
        animationDelay: `${delay}ms`, 
        animationDuration: `${duration}ms` 
      }}
    >
      {children}
    </div>
  );
}