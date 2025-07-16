import { useEffect } from "react";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getRoleBasedDashboard } from "@/utils/roleRedirects";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";

export const ProtectedMaintenanceRoute = () => {
  const { maintenanceStatus, loading } = useMaintenanceMode();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // If maintenance is not enabled, redirect users away from this page
    if (!maintenanceStatus.enabled) {
      if (user && userRole) {
        // Redirect authenticated users to their dashboard
        const dashboard = getRoleBasedDashboard(userRole);
        navigate(dashboard, { replace: true });
      } else {
        // Redirect unauthenticated users to landing page
        navigate("/", { replace: true });
      }
      return;
    }

    // If maintenance is enabled but user is admin, redirect to admin dashboard
    if (maintenanceStatus.enabled && userRole === 'admin') {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
  }, [maintenanceStatus.enabled, loading, user, userRole, navigate]);

  // Show loading while checking maintenance status
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

  // Only show maintenance screen if maintenance is actually enabled
  // and user is not an admin (admins are redirected above)
  if (maintenanceStatus.enabled) {
    return <MaintenanceScreen />;
  }

  // This should not be reached due to useEffect redirects, but fallback
  return null;
};