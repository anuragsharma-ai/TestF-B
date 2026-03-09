import { useAuth } from '@/contexts/AuthContext';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import ThirdPartyDashboard from '@/components/dashboard/ThirdPartyDashboard';
import RoleSwitcher from '@/components/RoleSwitcher';
import { Shield } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 md:p-6">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-lg font-bold">AssetRecon</h1>
        </div>
        <RoleSwitcher />
      </div>

      <div className="mb-6 hidden md:block">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      {user?.role === 'employee' && <EmployeeDashboard />}
      {user?.role === 'location_admin' && <AdminDashboard />}
      {user?.role === 'super_admin' && <SuperAdminDashboard />}
      {user?.role === 'third_party' && <ThirdPartyDashboard />}
    </div>
  );
}
