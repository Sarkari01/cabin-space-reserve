import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getRoleBasedDashboard } from "@/utils/roleRedirects";
import { MerchantOnboardingGuard } from "@/components/merchant/MerchantOnboardingGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'merchant' | 'student' | 'incharge' | 'telemarketing_executive' | 'pending_payments_caller' | 'customer_care_executive' | 'settlement_manager' | 'general_administrator';
  allowMultipleRoles?: ('admin' | 'merchant' | 'student' | 'incharge' | 'telemarketing_executive' | 'pending_payments_caller' | 'customer_care_executive' | 'settlement_manager' | 'general_administrator')[];
}

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  allowMultipleRoles 
}: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, redirect to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // If user is authenticated but no role is set yet, wait
    if (!userRole) {
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
  }, [user, userRole, loading, navigate, requiredRole, allowMultipleRoles]);

  // Show loading spinner while checking authentication
  if (loading || !user || !userRole) {
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