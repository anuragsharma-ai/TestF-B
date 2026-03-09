import { useAuth } from '@/contexts/AuthContext';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import ThirdPartyDashboard from '@/components/dashboard/ThirdPartyDashboard';
import RoleSwitcher from '@/components/RoleSwitcher';
import { Monitor } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 md:p-6">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Monitor className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-display">Asset Vault</h1>
        </div>
        <RoleSwitcher />
      </div>

      <div className="mb-6 hidden md:block">
        <h1 className="text-2xl font-display">Dashboard</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Welcome back, {user?.name}</p>
      </div>

      {user?.role === 'employee' && <EmployeeDashboard />}
      {user?.role === 'location_admin' && <AdminDashboard />}
      {user?.role === 'super_admin' && <SuperAdminDashboard />}
      {user?.role === 'third_party' && <ThirdPartyDashboard />}
    </div>
  );
}
