/**
 * 🎨 Modern Page Layout Component
 * Professional, clean layout wrapper with responsive design
 */

'use client';

import React from 'react';
import Breadcrumb, { BreadcrumbItem } from '@/components/ui/Breadcrumb';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = ''
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      {(title || breadcrumbs || actions) && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb items={breadcrumbs} className="mb-3" />
          )}

          {/* Title and Actions */}
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-600">{subtitle}</p>
              )}
            </div>
            
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className={`px-6 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export { PageLayout };
export default PageLayout;