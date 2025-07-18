
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { MerchantOnboardingGuard } from "./merchant/MerchantOnboardingGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  console.log('ProtectedRoute: Checking access', {
    user: !!user,
    userRole,
    requiredRole,
    loading
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log('ProtectedRoute: Role mismatch, redirecting to appropriate dashboard');
    
    // Redirect to appropriate dashboard based on user role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'merchant':
        return <Navigate to="/merchant/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      case 'incharge':
        return <Navigate to="/incharge/dashboard" replace />;
      case 'telemarketing_executive':
        return <Navigate to="/telemarketing_executive" replace />;
      case 'pending_payments_caller':
        return <Navigate to="/pending_payments_caller" replace />;
      case 'customer_care_executive':
        return <Navigate to="/customer_care_executive" replace />;
      case 'settlement_manager':
        return <Navigate to="/settlement_manager" replace />;
      case 'general_administrator':
        return <Navigate to="/general_administrator" replace />;
      case 'institution':
        return <Navigate to="/institution" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  console.log('ProtectedRoute: Access granted, applying merchant onboarding guard');

  // Apply merchant onboarding guard for all protected routes
  return (
    <MerchantOnboardingGuard>
      {children}
    </MerchantOnboardingGuard>
  );
};

export default ProtectedRoute;
