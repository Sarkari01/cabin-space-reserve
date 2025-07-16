import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { useNavigate } from "react-router-dom";
import { getRoleBasedDashboard } from "@/utils/roleRedirects";
import { MaintenanceScreen } from "./MaintenanceScreen";

export const ProtectedMaintenanceRoute = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { maintenanceStatus, loading: maintenanceLoading } = useMaintenanceMode();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || maintenanceLoading) return;

    // If maintenance is not enabled, redirect away from this page
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

    // If maintenance is enabled and user is not in target roles, redirect
    if (maintenanceStatus.enabled && userRole && maintenanceStatus.targetRoles) {
      const isTargetedRole = maintenanceStatus.targetRoles.includes(userRole);
      if (!isTargetedRole) {
        const dashboard = getRoleBasedDashboard(userRole);
        navigate(dashboard, { replace: true });
        return;
      }
    }
  }, [
    authLoading, 
    maintenanceLoading, 
    maintenanceStatus.enabled, 
    maintenanceStatus.targetRoles, 
    user, 
    userRole, 
    navigate
  ]);

  // Show loading while checking conditions
  if (authLoading || maintenanceLoading) {
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
  if (maintenanceStatus.enabled) {
    return <MaintenanceScreen />;
  }

  // This shouldn't happen due to the useEffect redirect, but just in case
  return null;
};