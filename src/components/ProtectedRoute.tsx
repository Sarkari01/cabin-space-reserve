import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getRoleBasedDashboard } from "@/utils/roleRedirects";
import { MerchantOnboardingGuard } from "@/components/merchant/MerchantOnboardingGuard";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'merchant' | 'student' | 'incharge' | 'telemarketing_executive' | 'pending_payments_caller' | 'customer_care_executive' | 'settlement_manager' | 'general_administrator' | 'institution';
  allowMultipleRoles?: ('admin' | 'merchant' | 'student' | 'incharge' | 'telemarketing_executive' | 'pending_payments_caller' | 'customer_care_executive' | 'settlement_manager' | 'general_administrator' | 'institution')[];
}

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  allowMultipleRoles 
}: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const { maintenanceStatus, loading: maintenanceLoading } = useMaintenanceMode();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || maintenanceLoading) return;

    // If not authenticated, redirect to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // If user is authenticated but no role is set yet, wait
    if (!userRole) {
      return;
    }

    // Check maintenance mode - only admins can access during maintenance
    if (maintenanceStatus.enabled && userRole !== 'admin') {
      navigate("/maintenance", { replace: true });
      return;
    }

    // Check role permissions
    if (requiredRole && userRole !== requiredRole) {
      // Redirect to appropriate dashboard based on user's role
      const dashboard = getRoleBasedDashboard(userRole);
      navigate(dashboard, { replace: true });
      return;
    }

    if (allowMultipleRoles && !allowMultipleRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on user's role
      const dashboard = getRoleBasedDashboard(userRole);
      navigate(dashboard, { replace: true });
      return;
    }
  }, [user, userRole, loading, maintenanceLoading, maintenanceStatus.enabled, navigate, requiredRole, allowMultipleRoles]);

  // Show loading spinner while checking authentication and maintenance status
  if (loading || maintenanceLoading || !user || !userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If role check is required and user doesn't have permission, don't render
  if (requiredRole && userRole !== requiredRole) {
    return null;
  }

  if (allowMultipleRoles && !allowMultipleRoles.includes(userRole)) {
    return null;
  }

  return (
    <MerchantOnboardingGuard>
      {children}
    </MerchantOnboardingGuard>
  );
};

export default ProtectedRoute;