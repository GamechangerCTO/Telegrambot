/**
 * 🤖 Automation Layout
 * Uses the dashboard layout for authentication and navigation
 */

import DashboardLayout from '@/app/dashboard/layout';

interface AutomationLayoutProps {
  children: React.ReactNode;
}

export default function AutomationLayout({ children }: AutomationLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}