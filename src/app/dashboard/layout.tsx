/**
 * 📊 Dashboard Layout
 * Authentication-aware layout with real user data
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Add Channel', href: '/dashboard/channels/add', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center px-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">TeleBots Pro</h1>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon 
                    className={`
                      ml-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  <span className="mr-3">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main>
          {children}
        </main>
      </div>
    </div>
  );
} 