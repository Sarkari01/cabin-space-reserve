
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export const DashboardRedirect = () => {
  const { userRole, loading } = useAuth();

  console.log('DashboardRedirect: Redirecting based on role', { userRole, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to appropriate dashboard based on user role
  switch (userRole) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'merchant':
      return <Navigate to="/merchant" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    case 'incharge':
      return <Navigate to="/incharge" replace />;
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
};
