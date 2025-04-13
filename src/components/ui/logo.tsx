
import React from 'react';

export interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="4" fill="#3B82F6" />
      <path
        d="M7 12.5C7 9.73858 9.23858 7.5 12 7.5C14.7614 7.5 17 9.73858 17 12.5C17 15.2614 14.7614 17.5 12 17.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 17.5V19.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 19.5H15"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="5" r="1" fill="white" />
    </svg>
  );
};
