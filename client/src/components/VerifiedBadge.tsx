import React from 'react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'green' | 'purple' | 'blue' | 'yellow';
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4', 
  lg: 'w-5 h-5',
  xl: 'w-8 h-8'
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary', 
  green: 'text-green-600',
  purple: 'text-purple-600',
  blue: 'text-blue-600',
  yellow: 'text-yellow-600'
};

export function VerifiedBadge({ 
  className = '', 
  size = 'md',
  color = 'primary'
}: VerifiedBadgeProps) {
  return (
    <svg 
      className={cn(sizeClasses[size], colorClasses[color], className)}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Store Building */}
      <path 
        d="M3 21H21V9L12 2L3 9V21Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinejoin="round"
      />
      <path 
        d="M9 21V12H15V21" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinejoin="round"
      />
      {/* Verification Badge */}
      <circle cx="18" cy="6" r="3" fill="currentColor" />
      <path 
        d="M16.5 6L17.3 6.8L19.5 4.6" 
        stroke="white" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default VerifiedBadge;