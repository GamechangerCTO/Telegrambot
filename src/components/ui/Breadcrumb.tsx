/**
 * 🧭 Breadcrumb Component
 * Reusable breadcrumb navigation to replace 4+ duplicate implementations
 * Provides consistent navigation patterns across dashboard pages
 */

import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const ChevronRightIcon: React.FC = () => (
  <svg 
    className="h-5 w-5 text-gray-400" 
    fill="currentColor" 
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path 
      fillRule="evenodd" 
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
      clipRule="evenodd" 
    />
  </svg>
);

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex mb-6 ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current || isLast;
          
          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRightIcon />
              )}
              
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={`ml-1 text-sm font-medium md:ml-2 ${
                    isCurrent 
                      ? 'text-gray-500 cursor-default' 
                      : 'text-gray-700'
                  }`}
                  {...(isCurrent && { 'aria-current': 'page' })}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export { Breadcrumb };
export default Breadcrumb;